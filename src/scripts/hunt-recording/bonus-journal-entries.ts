import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { LoggerService } from '@scripts/services/logging';
import type { UserSettings } from '@scripts/services/settings/settings.service';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';
import type { HgItem } from '@scripts/types/mhct';

import { LogLevel } from '@scripts/services/logging';

import type { CachedItem, ItemCache } from './item-cache';

type Inventory = HgResponse['inventory'];

/** How a convertible's resulting item is found: by item type or name, or already known. */
type ItemRef = {type: string} | {name: string} | {id: number, name: string};

interface PendingConvertible {
    convertible: HgItem;
    item: ItemRef;
    quantity: number;
    markup: JournalMarkup;
}

export interface BonusEntries {
    /** Details merged into the hunt's hunt_details. */
    moreDetails: Record<string, unknown>;
    convertibles: PendingConvertible[];
    /** Entries that are not bonus entries, such as the hunt itself. */
    others: JournalMarkup[];
}

/**
 * Handles the "bonus journals" that arrive with a hunt, such as the Relic Hunter attraction or trap and charm procs.
 * Shared by active and linked hunts; convertible items resolve from the response inventory, then the item cache.
 */
export class BonusJournalEntries {
    constructor(
        private readonly logger: LoggerService,
        private readonly submissionService: SubmissionService,
        private readonly extensionLog: ExtensionLog,
        private readonly itemCache: Pick<ItemCache, 'get' | 'getByName'>,
        private readonly getSettings: () => UserSettings,
    ) { }

    /**
     * @param entries The journal entries that arrived with the hunt.
     * @param response The response whose user made the hunt.
     */
    read(entries: JournalMarkup[], response: HgResponse): BonusEntries {
        const bonus: BonusEntries = {moreDetails: {}, convertibles: [], others: []};
        for (const markup of entries) {
            if (!this.readEntry(markup, response, bonus)) {
                bonus.others.push(markup);
            }
        }

        return bonus;
    }

    /** Whether any convertible item is missing from both the inventory and the item cache. */
    hasUnresolvedItems(bonus: BonusEntries, inventory: Inventory): boolean {
        return bonus.convertibles.some(pending => !this.resolveItem(pending.item, inventory));
    }

    submitConvertibles(bonus: BonusEntries, inventory: Inventory): void {
        for (const pending of bonus.convertibles) {
            const item = this.resolveItem(pending.item, inventory);
            if (!item) {
                void this.extensionLog.log(LogLevel.Warn, `Failed to find the item for ${pending.convertible.name}`, {
                    journal: pending.markup,
                    item: pending.item,
                    inventory,
                });
                continue;
            }

            const items = [{id: item.item_id, name: item.name, quantity: pending.quantity}];
            this.logger.debug(`Submitting ${pending.convertible.name}`, {items});

            void this.submissionService.submitItemConvertible(pending.convertible, items);
        }
    }

    private resolveItem(ref: ItemRef, inventory: Inventory): CachedItem | undefined {
        if ('id' in ref) {
            return {item_id: ref.id, name: ref.name};
        }

        const items = inventory != null && !Array.isArray(inventory) ? inventory : {};
        if ('type' in ref) {
            return items[ref.type] ?? this.itemCache.get(ref.type);
        }

        return Object.values(items).find(item => item.name === ref.name) ?? this.itemCache.getByName(ref.name);
    }

    /** @returns false when the entry is not a bonus entry. */
    private readEntry(markup: JournalMarkup, response: HgResponse, bonus: BonusEntries): boolean {
        const css_class = markup.render_data.css_class;
        const data = markup.render_data.text;
        const addConvertible = (convertible: HgItem, item: ItemRef, quantity = 1) => {
            bonus.convertibles.push({convertible, item, quantity, markup});
        };
        const itemTypeIn = (text: string) => /item\.php\?item_type=(.*?)"/.exec(text)?.[1];

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
            const quantityRegex = /mouse dropped ([\d,]+) <a class/;
            const nameRegex = />(.+?)<\/a>/g; // "g" flag used for stickiness
            const quantityMatch = quantityRegex.exec(data);
            nameRegex.lastIndex = quantityMatch?.index ?? data.length; // Start searching for name where quantity was found.
            const nameMatch = nameRegex.exec(data);
            if (quantityMatch && nameMatch) {
                const strQuantity = quantityMatch[1].replace(/,/g, '').trim();
                const lootQty = parseInt(strQuantity, 10);

                if (!lootQty) {
                    void this.extensionLog.log(LogLevel.Warn, `Failed to parse Desert Heater Base loot quantity`, {
                        desert_heater_journal: markup,
                    });
                } else {
                    addConvertible({
                        id: 2952, // Desert Heater Base's item ID
                        name: 'Desert Heater Base',
                        quantity: 1,
                    }, {name: nameMatch[1]}, lootQty);
                }
            } else {
                void this.extensionLog.log(LogLevel.Warn, `Regex quantity and loot name failed for Desert Heater Base`, {
                    desert_heater_journal: markup,
                    inventory: response.inventory,
                });
            }
        } else if (css_class.search(/unstable_charm_trigger/) !== -1) {
            const resultTrinket = itemTypeIn(data);
            if (resultTrinket) {
                addConvertible({
                    id: 1478, // Unstable Charm's item ID
                    name: 'Unstable Charm',
                    quantity: 1,
                }, {type: resultTrinket});
            }
        } else if (css_class.search(/gift_wrapped_charm_trigger/) !== -1) {
            const resultTrinket = itemTypeIn(data);
            if (resultTrinket) {
                addConvertible({
                    id: 2525, // Gift Wrapped Charm's item ID
                    name: 'Gift Wrapped Charm',
                    quantity: 1,
                }, {type: resultTrinket});
            }
        } else if (css_class.search(/torch_charm_event/) !== -1) {
            const resultItem = itemTypeIn(data);
            if (resultItem) {
                addConvertible({
                    id: 2180, // Torch Charm's item ID
                    name: 'Torch Charm',
                    quantity: 1,
                }, {type: resultItem});
            }
        } else if (css_class.search(/queso_cannonstorm_base_trigger/) !== -1) {
            const qcbprocRegex = /item\.php\?item_type=(.*?)"/g;
            const matchResults = [...data.matchAll(qcbprocRegex)];
            if (matchResults.length == 4) {
                // Get third match, then first capturing group
                addConvertible({
                    id: 3526, // Queso Cannonstorm Base's item ID
                    name: 'Queso Cannonstorm Base',
                    quantity: 1,
                }, {type: matchResults[2][1]});
            }
        } else if (css_class.search(/alchemists_cookbook_base_bonus/) !== -1) {
            bonus.moreDetails.alchemists_cookbook_base_bonus = true;
            this.logger.debug('Adding Cookbook Base Bonus to details', {procs: bonus.moreDetails});
        } else if (css_class.search(/boiling_cauldron_potion_bonus/) !== -1) {
            const resultPotion = itemTypeIn(data);
            if (resultPotion) {
                addConvertible({
                    id: 3304,
                    name: 'Boiling Cauldron Trap',
                    quantity: 1,
                }, {type: resultPotion});
            }
            bonus.moreDetails.boiling_cauldron_trap_bonus = true;
            this.logger.debug('Boiling Cauldron Trap details', {procs: bonus.moreDetails});
        } else if (css_class.search(/chesla_trap_trigger/) !== -1) {
            // Handle a potential Gilded Charm proc.
            const gildedRegex = /my Gilded Charm/.exec(data);
            const quantityRegex = /([\d]+)/.exec(data);
            if (gildedRegex && quantityRegex) {
                const quantityMatch = quantityRegex[1].replace(/,/g, '').trim();
                const lootQty = parseInt(quantityMatch, 10);

                if (!lootQty) {
                    void this.extensionLog.log(LogLevel.Warn, `Failed to parse Gilded Charm proc quantity`, {
                        gilded_charm_journal: markup,
                        inventory: response.inventory,
                    });
                } else {
                    addConvertible({
                        id: 2174, // Gilded Charm's item ID
                        name: 'Gilded Charm',
                        quantity: 1,
                    }, {id: 114, name: 'SUPER|brie+'}, lootQty);
                }
            }
        } else if (css_class.search(/pirate_sleigh_trigger/) !== -1) {
            // SS Scoundrel Sleigh got 'im!
            bonus.moreDetails.pirate_sleigh_trigger = true;
            this.logger.debug('Pirate Sleigh proc', {procs: bonus.moreDetails});
        } else if (css_class.search(/rainbowQuillSpecialEffect/) !== -1) {
            const environment_name = response.user.environment_name;
            if (environment_name == 'Afterword Acres' || environment_name == 'Epilogue Falls') {
                bonus.moreDetails.rainbow_quill_trigger = true;
            }
            this.logger.debug('Rainbow Quill proc', {procs: bonus.moreDetails});
        } else {
            return false;
        }

        return true;
    }
}
