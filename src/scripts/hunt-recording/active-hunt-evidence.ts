import type { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { LoggerService } from '@scripts/services/logging';
import type { UserSettings } from '@scripts/services/settings/settings.service';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse, InventoryItem, JournalMarkup } from '@scripts/types/hg';

import { LogLevel } from '@scripts/services/logging';
import { hgResponseSchema } from '@scripts/types/hg';
import { diffObject } from '@scripts/util/diffObject';
import { z } from 'zod';

import type { HuntEvidence } from './hunt-evidence';

import { getEntryIds } from './journal';

export class ActiveHuntEvidence {
    constructor(
        private readonly logger: LoggerService,
        private readonly rejectionEngine: IntakeRejectionEngine,
        private readonly submissionService: SubmissionService,
        private readonly extensionLog: ExtensionLog,
        private readonly getSettings: () => UserSettings,
    ) { }

    /**
     * @param rawPreResponse Response from calling page.php
     * @param post_response Response from calling activeturn.php
     */
    build(rawPreResponse: unknown, post_response: HgResponse): HuntEvidence | null {
        const safeParseResultPre = hgResponseSchema.safeParse(rawPreResponse);

        if (!safeParseResultPre.success) {
            this.logger.warn('Unexpected pre hunt response type received', z.prettifyError(safeParseResultPre.error));

            return null;
        }

        const pre_response = safeParseResultPre.data;

        // General data flow
        // - Validate API response object
        // - Validate User object
        // - Parse journal
        // - Create pre + post messages from validated responses
        // - Validate pre + post message differences (rules then allowed exemptions)

        // This will throw out any hunts where the page.php or activeturn.php calls fail to return
        // the expected objects (success, active turn, needing a page object on pre)
        let validated = this.rejectionEngine.validateResponse(pre_response, post_response);
        if (!validated) {
            return null;
        }

        const user_pre = pre_response.user;
        const user_post = post_response.user;
        validated = this.rejectionEngine.validateUser(user_pre, user_post);
        if (!validated) {
            return null;
        }

        this.logger.debug('User object diff',
            diffObject({}, user_pre, user_post)
        );

        // Find maximum entry id from pre_response
        const journalEntryIds = getEntryIds((pre_response.page as {journal: {entries_string: string}}).journal.entries_string);
        const maxEntryId = Math.max(...journalEntryIds, 0);
        this.logger.debug(`Pre (old) maximum entry id: ${maxEntryId}`);

        const hunt = this.parseJournalEntries(post_response, maxEntryId);
        if (!hunt || Object.keys(hunt).length === 0) {
            this.logger.info('Missing Info (trap check or friend hunt)(2)');
            return null;
        }

        return {type: 'active', before: pre_response, after: post_response, entry: hunt};
    }

    /**
     * Find the active journal entry, and handle supported "bonus journals" such as the Relic Hunter attraction.
     * @param {import("./types/hg").HgResponse} hunt_response The JSON response returned from a horn sound.
     * @param {number} max_old_entry_id
     * @returns {import("./types/hg").JournalMarkup | null} The journal entry corresponding to the active hunt.
     */
    private parseJournalEntries(hunt_response: HgResponse, max_old_entry_id: number): JournalMarkup | null {
        let journal: (JournalMarkup & {more_details?: Record<string, unknown>}) | undefined;
        const more_details: Record<string, unknown> = {};
        let journal_entries = hunt_response.journal_markup;
        if (!journal_entries) { return null; }

        // Filter out stale entries
        this.logger.debug(`Before filtering there's ${journal_entries.length} journal entries.`, {journal_entries, max_old_entry_id});
        journal_entries = journal_entries.filter(x => x.render_data.entry_id > max_old_entry_id);
        this.logger.debug(`After filtering there's ${journal_entries.length} journal entries left.`, {journal_entries, max_old_entry_id});

        // Cancel everything if there's trap check somewhere
        if (journal_entries.findIndex(x => x.render_data.css_class.search(/passive/) !== -1) !== -1) {
            this.logger.info('Found trap check too close to hunt. Aborting.');
            return null;
        }

        const getItemFromInventoryByType = (itemType: string): InventoryItem | undefined => {
            if (hunt_response.inventory != null && !Array.isArray(hunt_response.inventory)) {
                return hunt_response.inventory[itemType];
            }
        };

        const getItemFromInventoryByName = (itemName: string): InventoryItem | undefined => {
            if (hunt_response.inventory != null && !Array.isArray(hunt_response.inventory)) {
                return Object.values(hunt_response.inventory).find(item => item.name === itemName);
            }
        };

        journal_entries.forEach((markup) => {
            const css_class = markup.render_data.css_class;
            // Handle a Relic Hunter attraction.
            if (css_class.search(/(relicHunter_catch|relicHunter_failure)/) !== -1) {
                const rh_message = {
                    rh_environment: markup.render_data.environment,
                    entry_timestamp: markup.render_data.entry_timestamp,
                };
                // If this occurred after the daily reset, submit it. (Trap checks & friend hunts
                // may appear and have been back-calculated as occurring before reset).
                if (rh_message.entry_timestamp > Math.round(new Date().setUTCHours(0, 0, 0, 0) / 1000)) {
                    if (this.getSettings()['tracking-events']) {
                        void this.submissionService.submitRelicHunterSighting(rh_message);
                        this.logger.debug(`Found the Relic Hunter in ${rh_message.rh_environment}`);
                    }
                }
            } else if (css_class.search(/prizemouse/) !== -1) {
                // Handle a prize mouse attraction.
                // TODO: Implement data submission
                void this.extensionLog.log(LogLevel.Info, {
                    prize_mouse_journal: markup,
                });
            } else if (css_class.search(/desert_heater_base_trigger/) !== -1 && css_class.search(/fail/) === -1) {
                // Handle a Desert Heater Base loot proc.
                const data = markup.render_data.text;
                const quantityRegex = /mouse dropped ([\d,]+) <a class/;
                const nameRegex = />(.+?)<\/a>/g; // "g" flag used for stickiness
                const quantityMatch = quantityRegex.exec(data);
                nameRegex.lastIndex = quantityMatch?.index ?? data.length; // Start searching for name where quantity was found.
                const nameMatch = nameRegex.exec(data);
                if (quantityMatch && nameMatch) {
                    const strQuantity = quantityMatch[1].replace(/,/g, '').trim();
                    const lootQty = parseInt(strQuantity, 10);
                    const lootName = nameMatch[1];
                    const loot = getItemFromInventoryByName(lootName);

                    if (!lootQty || !loot) {
                        void this.extensionLog.log(LogLevel.Warn, `Failed to find inventory loot for Desert Heater Base`, {
                            desert_heater_journal: markup,
                            inventory: hunt_response.inventory,
                            loot: lootName,
                        });
                    } else {
                        const convertible = {
                            id: 2952, // Desert Heater Base's item ID
                            name: 'Desert Heater Base',
                            quantity: 1,
                        };
                        const items = [{id: loot.item_id, name: lootName, quantity: lootQty}];
                        this.logger.debug('Desert Heater Base proc', {desert_heater_loot: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                } else {
                    void this.extensionLog.log(LogLevel.Warn, `Regex quantity and loot name failed for Desert Heater Base`, {
                        desert_heater_journal: markup,
                        inventory: hunt_response.inventory,
                    });
                }
            } else if (css_class.search(/unstable_charm_trigger/) !== -1) {
                const data = markup.render_data.text;
                const trinketRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (trinketRegex) {
                    const resultTrinket = trinketRegex[1];
                    if (hunt_response.inventory != null && !Array.isArray(hunt_response.inventory) && resultTrinket in hunt_response.inventory) {
                        const {name: trinketName, item_id: trinketId} = hunt_response.inventory[resultTrinket];
                        const convertible = {
                            id: 1478, // Unstable Charm's item ID
                            name: 'Unstable Charm',
                            quantity: 1,
                        };
                        const items = [{
                            id: trinketId,
                            name: trinketName,
                            quantity: 1,
                        }];
                        this.logger.debug('Submitting Unstable Charm: ', {unstable_charm_loot: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/gift_wrapped_charm_trigger/) !== -1) {
                const data = markup.render_data.text;
                const trinketRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (trinketRegex) {
                    const resultTrinket = trinketRegex[1];
                    const trinket = getItemFromInventoryByType(resultTrinket);
                    if (trinket) {
                        const convertible = {
                            id: 2525, // Gift Wrapped Charm's item ID
                            name: 'Gift Wrapped Charm',
                            quantity: 1,
                        };
                        const items = [{
                            id: trinket.item_id,
                            name: trinket.name,
                            quantity: 1,
                        }];
                        this.logger.debug('Submitting Gift Wrapped Charm: ', {gift_wrapped_charm_loot: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/torch_charm_event/) !== -1) {
                const data = markup.render_data.text;
                const torchprocRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (torchprocRegex) {
                    const resultItem = torchprocRegex[1];
                    const torchItemResult = getItemFromInventoryByType(resultItem);
                    if (torchItemResult) {
                        const convertible = {
                            id: 2180, // Torch Charm's item ID
                            name: 'Torch Charm',
                            quantity: 1,
                        };
                        const items = [{
                            id: torchItemResult.item_id,
                            name: torchItemResult.name,
                            quantity: 1,
                        }];
                        this.logger.debug('Submitting Torch Charm: ', {torch_charm_loot: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/queso_cannonstorm_base_trigger/) !== -1) {
                const data = markup.render_data.text;
                const qcbprocRegex = /item\.php\?item_type=(.*?)"/g;
                const matchResults = [...data.matchAll(qcbprocRegex)];
                if (matchResults.length == 4) {
                    // Get third match, then first capturing group
                    const resultItem = matchResults[2][1];
                    const baseResultItem = getItemFromInventoryByType(resultItem);
                    if (baseResultItem) {
                        const convertible = {
                            id: 3526, // Queso Cannonstorm Base's item ID
                            name: 'Queso Cannonstorm Base',
                            quantity: 1,
                        };
                        const items = [{
                            id: baseResultItem.item_id,
                            name: baseResultItem.name,
                            quantity: 1,
                        }];
                        this.logger.debug('Submitting Queso Cannonstorm Base: ', {queso_cannonstorm_base_loot: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/alchemists_cookbook_base_bonus/) !== -1) {
                more_details.alchemists_cookbook_base_bonus = true;
                this.logger.debug('Adding Cookbook Base Bonus to details', {procs: more_details});
            } else if (css_class.search(/boiling_cauldron_potion_bonus/) !== -1) {
                const data = markup.render_data.text;
                const potionRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (potionRegex) {
                    const resultPotion = potionRegex[1];
                    const potionItemResult = getItemFromInventoryByType(resultPotion);
                    if (potionItemResult) {
                        const convertible = {
                            id: 3304,
                            name: 'Boiling Cauldron Trap',
                            quantity: 1,
                        };
                        const items = [{
                            id: potionItemResult.item_id,
                            name: potionItemResult.name,
                            quantity: 1,
                        }];
                        this.logger.debug('Boiling Cauldron Trap proc', {boiling_cauldron_trap: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                }
                more_details.boiling_cauldron_trap_bonus = true;
                this.logger.debug('Boiling Cauldron Trap details', {procs: more_details});
            } else if (css_class.search(/chesla_trap_trigger/) !== -1) {
                // Handle a potential Gilded Charm proc.
                const data = markup.render_data.text;
                const gildedRegex = /my Gilded Charm/.exec(data);
                const quantityRegex = /([\d]+)/.exec(data);
                if (gildedRegex && quantityRegex) {
                    const quantityMatch = quantityRegex[1].replace(/,/g, '').trim();
                    const lootQty = parseInt(quantityMatch, 10);

                    if (!lootQty) {
                        void this.extensionLog.log(LogLevel.Warn, `Failed to parse Gilded Charm proc quantity`, {
                            gilded_charm_journal: markup,
                            inventory: hunt_response.inventory,
                        });
                    } else {
                        const convertible = {
                            id: 2174, // Gilded Charm's item ID
                            name: 'Gilded Charm',
                            quantity: 1,
                        };
                        const items = [{id: 114, name: 'SUPER|brie+', quantity: lootQty}];
                        this.logger.debug('Guilded Charm proc', {gilded_charm: items});

                        void this.submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/pirate_sleigh_trigger/) !== -1) {
                // SS Scoundrel Sleigh got 'im!
                more_details.pirate_sleigh_trigger = true;
                this.logger.debug('Pirate Sleigh proc', {procs: more_details});
            } else if (css_class.search(/rainbowQuillSpecialEffect/) !== -1) {
                if (user.environment_name == 'Afterword Acres' || user.environment_name == 'Epilogue Falls') {
                    more_details.rainbow_quill_trigger = true;
                }
                this.logger.debug('Rainbow Quill proc', {procs: more_details});
            } else if (css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1) {
                this.logger.debug('Got a hunt record ', {procs: more_details});
                if (css_class.includes('active')) {
                    journal = markup;
                    this.logger.debug('Found the active hunt', {journal});
                }
            } else if (css_class.search(/linked|passive|misc/) !== -1) {
                // Ignore any friend hunts, trap checks, or custom loot journal entries.
            }
        });

        if (journal && Object.keys(journal).length) {
            // Only assign if there's an active hunt
            journal.more_details = more_details;
        }

        return journal ?? null;
    }
}
