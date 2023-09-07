import {AjaxSuccessHandler} from "./ajaxSuccessHandler";
import {HgItem} from "@scripts/types/mhct";
import {LoggerService} from "@scripts/util/logger";
import {KingsGiveawayResponse} from "./kingsGiveaway.types";
import {CustomConvertibleIds, EventDates} from "@scripts/util/constants";
import {parseHgInt} from "@scripts/util/number";


export class KingsGiveawayAjaxHandler extends AjaxSuccessHandler {
    /**
     * Create a new instance of KingsGiveawayAjaxHandler
     * @param logger logger to log events
     * @param submitConvertibleCallback delegate to submit convertibles to mhct
     */
    constructor(
        private logger: LoggerService,
        private submitConvertibleCallback: (convertible: HgItem, items: HgItem[]) => void) {
        super();
        this.logger = logger;
        this.submitConvertibleCallback = submitConvertibleCallback;
    }

    match(url: string): boolean {
        if (!url.includes("mousehuntgame.com/managers/ajax/events/kings_giveaway.php")) {
            return false;
        }

        if (Date.now() > EventDates.KingsGiveawayEndDate.getTime()) {
            return false;
        }

        return true;
    }

    async execute(responseJSON: unknown): Promise<void> {
        if (!this.isKgaResponse(responseJSON)) {
            this.logger.debug("Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.");
            return;
        }

        await this.recordPrizePack(responseJSON);
    }

    /**
     * Record Mini Prize Pack convertible submissions as convertibles in MHCT
     * @param responseJSON
     */
    async recordPrizePack(responseJSON: KingsGiveawayResponse) {
        const result = responseJSON.kings_giveaway_result;
        const inventory = responseJSON.inventory;

        if (
            inventory == null ||
            Array.isArray(inventory) ||
            !result.quantity ||
            result.slot !== "bonus"
        ) {
            this.logger.debug('Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.');
            window.postMessage({
                "mhct_log_request": 1,
                "is_error": true,
                "kga_2021_response": responseJSON,
                "reason": "Unable to parse kga 2021 response. This is normal if a pack wasn't opened",
            }, window.origin);
            return;
        }

        const convertible = {
            name: "King's Mini Prize Pack",
            id: CustomConvertibleIds.KingsMiniPrizePack,
            quantity: parseHgInt(result.quantity),
        };

        const inventoryWithExtraMap: Record<string, {name: string, item_id?: number} | undefined> = {
            gold_stat_item: {name: 'Gold', item_id: 431},
        };
        // Using the extra inventory map from here due to limited info created above (ie gold_stat_item is not a full InventoryItem)
        Object.assign(inventoryWithExtraMap, inventory);

        const items: HgItem[] = [];

        try {
            result.items.forEach((item) => {
                const itemId = inventoryWithExtraMap[item.type]?.item_id;
                if (itemId == null) {
                    throw new Error(`Item (${item.type}) not found in inventory from King's Mini Prize Pack opening`);
                }

                const hgItem: HgItem = {
                    id: itemId,
                    quantity: parseHgInt(item.quantity),
                    name: item.name,
                };
                items.push(hgItem);
            });
        } catch (error) {
            if (error instanceof Error) {
                this.logger.warn(error.message);
                return;
            }
        }

        this.logger.debug("Prizepack: ", {convertible, items});
        this.submitConvertibleCallback(convertible, items);
    }

    private isKgaResponse(responseJSON: unknown): responseJSON is KingsGiveawayResponse {
        const keyToTestFor: keyof KingsGiveawayResponse = 'kings_giveaway_result';
        return responseJSON != null && typeof responseJSON === 'object' && keyToTestFor in responseJSON;
    }
}
