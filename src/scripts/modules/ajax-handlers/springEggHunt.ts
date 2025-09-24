import {SubmissionService} from "@scripts/services/submission.service";
import type {HgResponse} from "@scripts/types/hg";
import type {HgItem} from "@scripts/types/mhct";
import type {LoggerService} from "@scripts/services/logging";
import {AjaxSuccessHandler} from "./ajaxSuccessHandler";

export class SEHAjaxHandler extends AjaxSuccessHandler {
    /**
     * Create a new instance of Spring Egg Hunt ajax handler
     * @param logger logger to log events
     * @param submitConvertibleCallback delegate to submit convertibles to mhct
     */
    constructor(
        private readonly logger: LoggerService,
        private readonly submissionService: SubmissionService) {
        super();
    }

    /**
     * Determine if given url applies to this handler
     * @param url The url where the ajax reponse originated
     * @returns True if this handler applies, otherwise false
     */
    match(url: string): boolean {
        return url.includes("mousehuntgame.com/managers/ajax/events/spring_hunt.php");
    }

    async execute(responseJSON: HgResponse): Promise<void> {
        await this.recordEgg(responseJSON as HgResponseWithEggContents);
    }

    /**
     * Record egg convertibles when opened from eggscavator
     * @param {import("@scripts/types/hg").HgResponse} responseJSON HitGrab ajax response.
     */
    async recordEgg(responseJSON: HgResponseWithEggContents) {
        const purchase = responseJSON.egg_contents;
        const inventory = responseJSON.inventory;

        if (!purchase) {
            this.logger.debug('Skipping SEH egg submission as this isn\'t an egg convertible');
            return;
        }

        if (purchase.type == null) {
            this.logger.debug('Skipped SEH egg submission due to unhandled XHR structure');
            this.logger.warn('Unable to parse SEH response', {responseJSON});
            return;
        }

        if (!inventory || Array.isArray(inventory)) {
            // inventory can be emtpy array [], which is unsupported
            this.logger.warn('SEH inventory response was undefined or an array');
            return;
        }

        const convertible: HgItem = {
            id: inventory[purchase.type].item_id,
            name: inventory[purchase.type].name,
            quantity: purchase.quantity_opened,
        };

        const inventoryWithExtraMap: Record<string, {name: string, item_id: number}> = {
            gold_stat_item: {name: 'Gold', item_id: 431},
            point_stat_item: {name: 'Points', item_id: 644},
        };
        // Using the extra inventory map from here due to limited info created above (ie gold_stat_item is not a full InventoryItem)
        Object.assign(inventoryWithExtraMap, inventory);

        const items: HgItem[] = [];
        try {
            purchase.items.forEach(item => {
                const inventoryItem = Object.values(inventoryWithExtraMap).find(i => i.name == item.name);
                if (inventoryItem == null) {
                    this.logger.debug('Egg content item missing from inventory', {inventoryWithExtraMap, item});
                    throw new Error(`Egg content item ${item.name} wasn't found in inventory response.`);
                }

                items.push({
                    id: inventoryItem.item_id,
                    name: item.name,
                    quantity: item.quantity,
                });
            });

        } catch (error) {
            this.logger.warn((error as Error).toString());
            return;
        }

        this.logger.debug('SEHAjaxHandler submitting egg convertible', {convertible, items});
        await this.submissionService.submitEventConvertible(convertible, items);
    }
}

interface HgResponseWithEggContents extends HgResponse {
    egg_contents?: EggContents
}

interface EggContents {
    type: string;
    quantity_opened: number;
    remaining_quantity: number;
    items: EggContent[];
}

interface EggContent {
    type: string;
    name: string;
    quantity: number;
}
