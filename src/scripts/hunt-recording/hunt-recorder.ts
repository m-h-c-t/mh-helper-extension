/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import type { IEnvironmentDetailer } from '@scripts/modules/details/details.types';
import type { IStager } from '@scripts/modules/stages/stages.types';
import type { LoggerService } from '@scripts/services/logging';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse, Inventory, InventoryItem, JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage, IntakeMessageBase, Loot } from '@scripts/types/mhct';

import * as detailers from '@scripts/modules/details';
import * as stagers from '@scripts/modules/stages';
import { intakeMessageBaseSchema, intakeMessageSchema } from '@scripts/types/mhct';
import { parseHgInt } from '@scripts/util/number';
import { z } from 'zod';

import type { HuntEvidence } from './hunt-evidence';
import type { CachedItem, ItemCache } from './item-cache';

import { isLinkedEntry } from './journal';

type ResolveItem = (itemType: string) => CachedItem | undefined;

export class HuntRecorder {
    private readonly location_stager_lookup: Record<string, IStager> = {};
    private readonly location_detailer_lookup: Record<string, IEnvironmentDetailer> = {};

    constructor(
        private readonly logger: LoggerService,
        private readonly rejectionEngine: IntakeRejectionEngine,
        private readonly submissionService: SubmissionService,
        private readonly itemCache: Pick<ItemCache, 'get'>,
    ) {
        for (const stager of stagers.stageModules) {
            this.location_stager_lookup[stager.environment] = stager;
        }

        for (const detailer of detailers.environmentDetailerModules) {
            this.location_detailer_lookup[detailer.environment] = detailer;
        }
    }

    record(evidence: HuntEvidence): void {
        const {before: pre_response, after: post_response, entry: hunt} = evidence;
        const user_pre = pre_response.user;
        const user_post = post_response.user;

        const fromInventory = getItemFromInventory(post_response.inventory);
        let loot: Loot[] | undefined;
        if (evidence.type === 'linked') {
            // page.php (the linked "after") has no inventory, so fall back to items learned from earlier responses.
            const parsed = this.parseLoot(hunt, type => fromInventory(type) ?? this.itemCache.get(type));
            if (parsed && parsed.unresolved.length > 0) {
                this.logger.debug(`Linked hunt dropped: unresolved loot ${parsed.unresolved.join(', ')}`);
                return;
            }
            loot = parsed?.loot;
        } else {
            const parsed = this.parseLoot(hunt, fromInventory);
            for (const itemType of parsed?.unresolved ?? []) {
                this.logger.debug(`Looted "${itemType}", but it is not in user inventory`);
            }
            loot = parsed?.loot;
        }

        let message_pre;
        let message_post;
        try {
            // Create two intake messages. One based on pre-response. The other based on post-response.
            ({message_pre, message_post} = this.createIntakeMessage(pre_response, post_response, hunt, loot));
            if (evidence.type === 'linked') {
                message_pre.hunt_details = {...message_pre.hunt_details, hunt_type: 'linked'};
                message_post.hunt_details = {...message_post.hunt_details, hunt_type: 'linked'};
            }
        } catch (error) {
            this.logger.error('Something went wrong creating message', error);
        }

        if (message_pre == null || message_post == null) {
            this.logger.warn('Critical user data missing; cannot record hunt. See error log.');
            return;
        }

        // Validate the differences between the two intake messages
        const validated = this.rejectionEngine.validateMessage(message_pre, message_post);
        if (!validated) {
            // collect limited info for stage and location rejections
            const invalidProperties = this.rejectionEngine.getInvalidIntakeMessageProperties(message_pre, message_post);
            // Linked hunts never report rejection telemetry.
            if (evidence.type !== 'linked' && (invalidProperties.has('stage') || invalidProperties.has('location'))) {
                const rejection_message = this.createRejectionMessage(message_pre, message_post);
                void this.submissionService.submitRejection(rejection_message);
            }

            return;
        }

        this.logger.debug('Recording hunt', {message_var: message_pre, user_pre, user_post, hunt});
        // Upload the hunt record.
        void this.submissionService.submitHunt(message_pre);
    }

    /**
     *
     * @param before The pre-hunt object
     * @param after The post-hunt object
     * @param hunt Journal entry corresponding with the hunt
     * @param loot Loot parsed from the hunt's journal entry
     * @returns
     */
    private createIntakeMessage(
        before: HgResponse,
        after: HgResponse,
        hunt: JournalMarkup,
        loot: Loot[] | undefined
    ): {message_pre: IntakeMessage, message_post: IntakeMessage} {
        const preMessageBase = this.createMessageFromHunt(hunt, before);
        const postMessageBase = this.createMessageFromHunt(hunt, after);

        const message_pre: IntakeMessage = preMessageBase as IntakeMessage;
        const message_post: IntakeMessage = postMessageBase as IntakeMessage;

        // Perform validations and stage corrections.
        this.fixLGLocations(message_pre);
        this.fixLGLocations(message_post);

        this.addStage(message_pre, before.user, after.user, hunt);
        this.addStage(message_post, after.user, after.user, hunt);

        this.addHuntDetails(message_pre, before.user, after.user, hunt);
        this.addHuntDetails(message_post, after.user, after.user, hunt);

        if (loot && loot.length > 0) {
            message_pre.loot = loot;
            message_post.loot = loot;
        }

        const checkPreResult = intakeMessageSchema.safeParse(message_pre);
        const checkPostResult = intakeMessageSchema.safeParse(message_post);
        if (!checkPreResult.success || !checkPostResult.success) {
            const issues = [];
            if (!checkPreResult.success) {
                issues.push(z.prettifyError(checkPreResult.error));
            }
            if (!checkPostResult.success) {
                issues.push(z.prettifyError(checkPostResult.error));
            }
            throw new Error(`Failed to create intake message. Issues:\n\n${issues.join('\n\n')}`);
        }

        return {
            message_pre: checkPreResult.data,
            message_post: checkPostResult.data,
        };
    }

    // Add bonus journal entry stuff to the hunt_details
    private calcMoreDetails(hunt: JournalMarkup & {more_details?: Record<string, unknown>}): Record<string, unknown> | undefined {
        let new_details: Record<string, unknown> | undefined = {};
        if ('more_details' in hunt) {
            new_details = hunt.more_details;
        }
        return new_details;
    }

    /**
     * Initialize the message with main hunt details.
     * @param journal The journal entry corresponding to the active hunt.
     * @param hgResponse The HG response containing user and inventory data.
     * @returns The message object, or `null` if an error occurred.
     */
    private createMessageFromHunt(journal: JournalMarkup, hgResponse: HgResponse): IntakeMessageBase {
        const user = hgResponse.user;

        const message: Partial<IntakeMessageBase> = {};

        message.entry_id = journal.render_data.entry_id;
        message.entry_timestamp = journal.render_data.entry_timestamp;

        if (!user.environment_name) {
            throw new Error('Missing user location');
        }

        message.location = {
            name: user.environment_name,
            id: user.environment_id,
        };

        message.shield = user.has_shield;
        message.total_power = user.trap_power;
        message.total_luck = user.trap_luck;
        message.attraction_bonus = Math.round(user.trap_attraction_bonus * 100);

        type PropFields = 'weapon' | 'base' | 'trinket' | 'bait';
        type ComponentFields = 'trap' | 'base' | 'cheese' | 'charm';
        const components: {
            prop: PropFields;
            message_field: ComponentFields;
            required: boolean;
            replacer: RegExp;
            [key: string]: unknown;
        }[] = [
            {prop: 'weapon', message_field: 'trap', required: true, replacer: / trap$/i},
            {prop: 'base', message_field: 'base', required: true, replacer: / base$/i},
            {prop: 'bait', message_field: 'cheese', required: true, replacer: / cheese$/i},
            {prop: 'trinket', message_field: 'charm', required: false, replacer: / charm$/i},
        ];

        for (const component of components) {
            const prop_name: keyof User = `${component.prop}_name`;
            const prop_id: keyof User = `${component.prop}_item_id`;
            const item_name = user[prop_name];
            const item_id = user[prop_id];
            if (item_name == null || item_id == null) {
                if (component.required) {
                    throw new Error(`Missing required setup component: ${component.message_field}`);
                }
            }

            message[component.message_field] = {
                id: item_id ?? 0,
                name: item_name ? item_name.replace(component.replacer, '') : '',
            };
        }

        // Caught / Attracted / FTA'd
        const journal_css = journal.render_data.css_class;
        if (journal_css.includes('attractionfailure')) {
            message.caught = 0;
            message.attracted = 0;
        } else if (journal_css.includes('catch')) {
            message.attracted = 1;
            if (journal_css.includes('catchsuccess')) {
                message.caught = 1;
            } else if (journal_css.includes('catchfailure')) {
                message.caught = 0;
            } else {
                throw new Error(`Unknown "catch" journal css: ${journal_css}`);
            }
            let text = journal.render_data.text;
            if (isLinkedEntry(journal_css)) {
                // Linked entries start with "went on a hunt with <a>friend</a>"; prefer the mouse link itself.
                const mouseLink = /<a\b[^>]*MouseView\.show[^>]*>.*?<\/a>/i.exec(text)?.[0];
                text = mouseLink ?? text.replace(/^.*?went on a hunt with\s*<a\b[^>]*>.*?<\/a>/i, '');
            }
            // Remove HTML tags and other text around the mouse name.
            message.mouse = text
                .replace(/^.*?;">/, '') // Remove all text through the first sequence of `;">`
                .replace(/<\/a>.*/i, '') // Remove text after the first <a href>'s closing tag </a>
                .replace(/ mouse$/i, ''); // Remove " [Mm]ouse" if it is not a part of the name (e.g. Dread Pirate Mousert)
        }

        // Auras
        if (hgResponse.trap_image != null) {
            message.auras = Object.keys(hgResponse.trap_image.auras).filter(codename => hgResponse.trap_image!.auras[codename].status === 'active');
        }

        const baseMessageParseResult = intakeMessageBaseSchema.safeParse(message);
        if (!baseMessageParseResult.success) {
            throw new Error(`Base message failed validation:\n${z.prettifyError(baseMessageParseResult.error)}`);
        }

        return baseMessageParseResult.data;
    }

    /**
     * Creates rejection event info containing information about location, stage, and mouse
     * @param pre
     * @param post
     */
    private createRejectionMessage(pre: IntakeMessage, post: IntakeMessage) {
        return {
            pre: createEventObject(pre),
            post: createEventObject(post),
        };

        function createEventObject(message: IntakeMessage) {
            return {
                location: message.location.name,
                stage: message.stage,
                mouse: message.mouse,
            };
        }
    }

    /**
     * Fixes the location id for Lost City, Sand Dunes, and Twisted Garden since
     * the HG API returns the same location id whether twisted/untwisted in each environment.
     *
     * Differentiate between the two by using the location name to assign the correct location id.
     */
    private fixLGLocations(message: IntakeMessageBase) {
        // Be careful of un-logical ids: Lost City and Sand Dunes are the normal side. TG is the twisted side.
        const environmentMap: Record<string, number> = {
            'Lost City': 5000,
            'Sand Dunes': 5001,
            'Twisted Garden': 5002,
        };

        if (message.location.name in environmentMap) {
            message.location.id = environmentMap[message.location.name];
        }
    }

    /**
     * Use `quests` or `viewing_atts` data to assign appropriate location-specific stage information.
     * @param message The message to be sent
     * @param user The user state object, when the hunt was invoked (pre-hunt).
     * @param user_post The user state object, after the hunt.
     * @param hunt The journal entry corresponding to the active hunt
     */
    private addStage(message: IntakeMessage, user: User, user_post: User, hunt: JournalMarkup) {
        // IStagers
        const stager = this.location_stager_lookup[user.environment_name];
        if (stager) {
            stager.addStage(message, user, user_post, hunt);
        }
    }

    /**
     * Determine additional detailed parameters that are otherwise only visible to db exports and custom views.
     * These details may eventually be migrated to help inform location-specific stages.
     * @param message The message to be sent.
     * @param user The user state object, when the hunt was invoked (pre-hunt).
     * @param user_post The user state object, after the hunt.
     * @param hunt The journal entry corresponding to the active hunt.
     */
    private addHuntDetails(message: IntakeMessage, user: User, user_post: User, hunt: JournalMarkup) {
        // First, get any location-specific details:
        let locationHuntDetails: Record<string, any> | undefined = {};
        const detailer = this.location_detailer_lookup[user.environment_name];
        if (detailer) {
            locationHuntDetails = detailer.addDetails(message, user, user_post, hunt);
        }

        // Then, get any global hunt details (such as from ongoing events, auras, etc).
        const globalHuntDetails = detailers.globalDetailerModules
            .map(detailer => detailer.addDetails(message, user, user_post, hunt))
            .filter(details => details);

        const otherJournalDetails = this.calcMoreDetails(hunt); // This is probably not needed and can use hunt.more_details below

        // Finally, merge the details objects and add it to the message.
        if (locationHuntDetails || globalHuntDetails.length >= 0) {
            message.hunt_details = Object.assign({}, locationHuntDetails, ...globalHuntDetails, otherJournalDetails);
        }
    }

    /**
     * Extract loot information from the hunt's journal entry.
     * @param hunt The journal entry corresponding to the active hunt.
     * @param resolveItem Looks up an item's id and name by its item_type
     * @returns The resolved loot and the item types that could not be resolved
     */
    private parseLoot(hunt: JournalMarkup, resolveItem: ResolveItem): {loot: Loot[], unresolved: string[]} | undefined {
        let hunt_description = hunt.render_data.text;
        if (!hunt_description.includes('following loot:')) { return; }

        hunt_description = hunt_description.substring(hunt_description.indexOf('following loot:') + 15);
        // Use a stricter regex to split on closing anchor tags like </a> with optional whitespace
        const loot_array = hunt_description.split(/<\/a\s*>/gi).filter(i => i.trim());
        const lootList = [];
        const unresolved: string[] = [];
        for (const item_text of loot_array) {
            const item_name = /item\.php\?item_type=(.*?)"/.exec(item_text)?.[1];
            const item_amount = parseHgInt(/\d+[\d,]*/.exec(item_text)?.[0] ?? '0');
            const plural_name = $($.parseHTML(item_text)).filter('a').text();

            const inventory_item = resolveItem(item_name ?? '');
            if (!inventory_item) {
                unresolved.push(item_name ?? '');
                continue;
            }

            const loot_object = {
                amount: item_amount,
                lucky: item_text.includes('class="lucky"'),
                id: inventory_item.item_id,
                name: inventory_item.name,
                plural_name: item_amount > 1 ? plural_name : '',
            };

            this.logger.debug('Loot object', {loot_object});

            lootList.push(loot_object);
        }

        return {loot: lootList, unresolved};
    }
}

function getItemFromInventory(inventory: Inventory | undefined): ResolveItem {
    return (itemType: string): InventoryItem | undefined => {
        if (inventory != null && !Array.isArray(inventory)) {
            return inventory[itemType];
        }
    };
}
