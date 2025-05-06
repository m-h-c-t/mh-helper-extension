import {ValidatedAjaxSuccessHandler} from "./ajaxSuccessHandler";
import {KingsGiveawayResponse, kingsGiveawayResponseSchema} from "./kingsGiveaway.types";
import {MouseRipApiService} from "@scripts/services/mouserip-api.service";
import {SubmissionService} from "@scripts/services/submission.service";
import {HgItem} from "@scripts/types/mhct";
import {LoggerService} from "@scripts/util/logger";
import {CustomConvertibleIds} from "@scripts/util/constants";
import {z} from "zod";

export class KingsGiveawayAjaxHandler extends ValidatedAjaxSuccessHandler {
    private itemCache: Record<string, number> | null = null;
    readonly schema = kingsGiveawayResponseSchema;

    constructor(
        logger: LoggerService,
        private readonly submissionService: SubmissionService,
        private readonly mouseRipApiService: MouseRipApiService) {
        super(logger);
    }

    match(url: string): boolean {
        if (!url.includes("mousehuntgame.com/managers/ajax/events/kings_giveaway.php")) {
            return false;
        }

        return true;
    }

    protected async validatedExecute(data: z.infer<typeof this.schema>): Promise<void> {
        await this.recordPrizePack(data);
        await this.recordVault(data);
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
            quantity: result.quantity,
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
                    quantity: item.quantity,
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
        await this.submissionService.submitEventConvertible(convertible, items);
    }

    async recordVault(responseJSON: KingsGiveawayResponse) {
        const kga = responseJSON.kings_giveaway;

        // 10th opening response: remaining_openable_prize_packs turns null and vault_is_open is true
        if (kga.remaining_openable_prize_packs != null || !kga.vault_is_open || kga.vault_prizes.length == 0) {
            return;
        }

        this.itemCache ??= await this.cacheMouseRipItems();

        const convertible = {
            id: CustomConvertibleIds.KingsGiveawayVault,
            name: "King's Giveaway Vault",
            quantity: 1,
        };

        // vault_prizes don't have an id needed to submit with convertible
        // need to get them manually from the table below
        const items: HgItem[] = kga.vault_prizes.map(i => {
            const id = this.itemCache![i.type];
            if (id == null) {
                throw new Error(`Unknown item type '${i.type}' in King's Vault`);
            }

            return {
                id: id,
                name: i.name,
                quantity: i.quantity,
            };
        });

        await this.submissionService.submitEventConvertible(convertible, items);
    }

    async cacheMouseRipItems(): Promise<Record<string, number>> {
        const parsedData = await this.mouseRipApiService.getAllItems();

        // Convert the parsed data to a record with item type as keys
        const itemCache: Record<string, number> = {};
        parsedData.forEach((item) => {
            itemCache[item.type] = item.id;
        });

        return itemCache;
    }
}
