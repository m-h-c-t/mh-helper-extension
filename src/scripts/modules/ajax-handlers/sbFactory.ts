import type {HgResponse} from "@scripts/types/hg";
import type {HgItem} from "@scripts/types/mhct";
import type {LoggerService} from "@scripts/util/logger";
import {CustomConvertibleIds as Ids} from "@scripts/util/constants";
import {AjaxSuccessHandler} from "./ajaxSuccessHandler";
import type {HgResponseWithVendingMachine, VendingMachinePurchaseType} from "./sbFactory.types";

export class SBFactoryAjaxHandler extends AjaxSuccessHandler {
    /**
     * Create a new instance of SuperBrieFactoryHandler
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

    /**
     * Determine if given url applies to this handler
     * @param url The url where the ajax reponse originated
     * @returns True if this handler applies, otherwise false
     */
    match(url: string): boolean {
        return url.includes("mousehuntgame.com/managers/ajax/events/birthday_factory.php");
    }

    async execute(responseJSON: HgResponse): Promise<void> {
        this.recordSnackPack(responseJSON as HgResponseWithVendingMachine);
    }

    /**
     * Record Birthday snack pack submissions as convertibles in MHCT
     * @param {import("@scripts/types/hg").HgResponse} responseJSON HitGrab ajax response from vending machine.
     */
    recordSnackPack(responseJSON: HgResponseWithVendingMachine) {
        const purchase = responseJSON.vending_machine_purchase;

        if (!purchase) {
            this.logger.debug('Skipped snack pack submission as this isn\'t a vending purchase');
            return;
        }

        if (purchase.type == null) {
            this.logger.debug('Skipped Bday snack pack submission due to unhandled XHR structure');
            this.logger.warn('Unable to parse bday response', {responseJSON});
            return;
        }

        // Convert pack code names to made-up internal identifiers
        const packs: Record<VendingMachinePurchaseType, number> = {
            larry_starter_mix_snack_pack:	Ids.LarryStarterMixSnackPack,
            tribal_crunch_snack_pack:	Ids.TribalCrunchSnackPack,
            wild_west_ranch_rings_snack_pack:	Ids.WildWestRanchRingsSnackPack,
            sandy_bert_bites_snack_pack:	Ids.SandyBertBitesSnackPack,
            hollow_heights_party_pack_snack_pack:	Ids.HollowHeightsPartyPackSnackPack,
            riftios_snack_pack:	Ids.RiftiosSnackPack,
            story_seeds_snack_pack: Ids.StorySeedsSnackPack,
            bountiful_beans_snack_pack: Ids.BountifulBeansSnackPack,
        };

        if (!(purchase.type in packs)) {
            this.logger.warn('Unsupported snack pack type', {vending_machine_purchase: purchase});
            return;
        }

        const convertible: HgItem = {
            id: packs[purchase.type],
            name: purchase.type,
            quantity: purchase.quantity,
        };

        if (responseJSON.inventory == null || Array.isArray(responseJSON.inventory)) {
            // inventory can be emtpy array [], which is unsupported
            this.logger.warn('Vending machine inventory response was undefined or an array', {responseJSON});
            return;
        }

        const inventory = responseJSON.inventory;
        const items: HgItem[] = [];

        try {
            purchase.items.forEach(item => {
                const inventoryItem = Object.values(inventory).find(i => i.name == item.name);
                if (inventoryItem == null) {
                    this.logger.debug('Snack pack item missing from inventory', {inventory, item});
                    throw new Error(`Snack pack item ${item.name} wasn't found in inventory response.`);
                }

                items.push({
                    id: inventoryItem.item_id,
                    name: item.name,
                    quantity: item.quantity,
                });
            });

        } catch (error) {
            this.logger.warn((error as Error) .toString());
            return;
        }

        this.logger.debug('SBFactoryAjaxHandler submitting snack pack', {convertible, items});
        this.submitConvertibleCallback(convertible, items);
    }
}
