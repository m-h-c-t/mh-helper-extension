import {HgResponse} from "@scripts/types/hg";
import {HgItem} from "@scripts/types/mhct";
import {LoggerService} from "@scripts/util/logger";
import {AjaxSuccessHandler} from "./ajaxSuccessHandler";
import {CheesyPipePartyGame, CheesyPipePartyResponse, cheesyPipePartyResponseSchema, Region} from "./sbFactory.types";
import {CustomConvertibleIds} from "@scripts/util/constants";

export class CheesyPipePartyAjaxHandler extends AjaxSuccessHandler {
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
        return url.includes("mousehuntgame.com/managers/ajax/events/cheesy_pipe_party.php");
    }

    async execute(responseJSON: HgResponse): Promise<void> {
        if (!this.isCheesyPipeParty(responseJSON)) {
            return;
        }

        if (!this.isGameComplete(responseJSON)) {
            this.logger.debug('Cheesy Pipe Party game is not complete.');
            return;
        }

        this.recordCheesyPipeParty(responseJSON);
    }

    /**
     * Submit the Cheesy Pipe Party game results to MHCT
     * @param responseJSON
     */
    recordCheesyPipeParty(responseJSON: CheesyPipePartyResponse) {
        const game = responseJSON.cheesy_pipe_party_game;

        const revealedPrizeTiles = this.getTiles(game).filter(tile => tile.has_prize && tile.is_prize_unlocked);
        const expectedPrizes = game.num_prizes;

        if (revealedPrizeTiles.length !== expectedPrizes) {
            this.logger.warn('Cheesy Pipe Part mismatched number of revealed prizes', {revealedPrizeTiles, expectedPrizes});
            return;
        }

        const regionName = game.regions.find(region => region.type == game.selected_region)?.name;
        if (regionName == null) {
            // this shouldn't be true since Zod should have validated the response but safeguarding
            this.logger.warn('Cheesy Pipe Party region not found', {game});
            return;
        }

        let convertibleName = `Cheesy Pipe Party (${regionName})`;
        let convertibleId = CheesyPipePartyAjaxHandler.CheesyPipePartyConvertibleIds[game.selected_region];
        if (game.game_upgraded) {
            convertibleName = `Upgraded ${convertibleName}`;
            convertibleId = CheesyPipePartyAjaxHandler.CheesyPipePartyUpgradedConvertibleIds[game.selected_region];
        }

        const convertible: HgItem = {
            id: convertibleId,
            name: convertibleName,
            quantity: 1,
        };

        if (responseJSON.inventory == null || Array.isArray(responseJSON.inventory)) {
            // inventory can be emtpy array [], which is unsupported
            this.logger.warn('Cheesy Pipe Party inventory response was undefined or an array', {responseJSON});
            return;
        }

        const inventory = responseJSON.inventory;
        const items: HgItem[] = [];

        try {
            revealedPrizeTiles.forEach(tile => {
                const inventoryItem = Object.values(inventory).find(i => i.name == tile.prize_name);
                if (inventoryItem == null) {
                    this.logger.debug('Cheesy Pipe Party item missing from inventory', {inventory, tile});
                    throw new Error(`Cheesy Pipe Party item ${tile.prize_name} wasn't found in inventory response.`);
                }

                items.push({
                    id: inventoryItem.item_id,
                    name: tile.prize_name,
                    quantity: tile.prize_quantity,
                });
            });

        } catch (error) {
            this.logger.warn((error as Error) .toString());
            return;
        }

        this.logger.debug('CheesyPipePartyAjaxHandler submitting game board', {convertible, items});
        this.submitConvertibleCallback(convertible, items);
    }

    /**
     * Validates that the given object is a JSON response from interacting with the Cheesy Pipe Party game
     * @param responseJSON The JSON response object
     * @returns Boolean indicating if the object is a Cheesy Pipe Party response
     */
    private isCheesyPipeParty(responseJSON: unknown): responseJSON is CheesyPipePartyResponse {
        const response = cheesyPipePartyResponseSchema.safeParse(responseJSON);

        if (!response.success) {
            const errorMessage = response.error.message;
            this.logger.warn("Unexpected Cheesy Pipe Party response object.", errorMessage);
        }

        return response.success;
    }

    /**
     * Determine if the Cheesy Pipe Party game is complete
     * @param responseJSON The JSON response object
     * @returns Boolean indicating if the game is complete
     */
    private isGameComplete(responseJSON: CheesyPipePartyResponse): boolean {
        return responseJSON.cheesy_pipe_party_game.game_active === false;
    }

    private getTiles(game: CheesyPipePartyGame) {
        return game.game_board.flatMap(row => row.row_data.map(cell => cell.tile_data));
    }

    static CheesyPipePartyConvertibleIds: Record<Region, number> = {
        gnawnia: CustomConvertibleIds.CheesyPipePartyGnawnia,
        valour: CustomConvertibleIds.CheesyPipePartyValour,
        whisker_woods: CustomConvertibleIds.CheesyPipePartyWhiskerWoods,
        burroughs: CustomConvertibleIds.CheesyPipePartyBurroughs,
        furoma: CustomConvertibleIds.CheesyPipePartyFuroma,
        bristle_woods: CustomConvertibleIds.CheesyPipePartyBristleWoods,
        tribal_isles: CustomConvertibleIds.CheesyPipePartyTribalIsles,
        varmint_valley: CustomConvertibleIds.CheesyPipePartyVarmintValley,
        desert: CustomConvertibleIds.CheesyPipePartySandtailDesert,
        rodentia: CustomConvertibleIds.CheesyPipePartyRodentia,
        queso_canyon: CustomConvertibleIds.CheesyPipePartyQuesoCanyon,
        zokor_zone: CustomConvertibleIds.CheesyPipePartyHollowHeights,
        folklore_forest: CustomConvertibleIds.CheesyPipePartyFolkloreForest,
        riftopia: CustomConvertibleIds.CheesyPipePartyRiftPlane,
    };

    static CheesyPipePartyUpgradedConvertibleIds: Record<Region, number> = {
        gnawnia: CustomConvertibleIds.CheesyPipePartyGnawniaUpgraded,
        valour: CustomConvertibleIds.CheesyPipePartyValourUpgraded,
        whisker_woods: CustomConvertibleIds.CheesyPipePartyWhiskerWoodsUpgraded,
        burroughs: CustomConvertibleIds.CheesyPipePartyBurroughsUpgraded,
        furoma: CustomConvertibleIds.CheesyPipePartyFuromaUpgraded,
        bristle_woods: CustomConvertibleIds.CheesyPipePartyBristleWoodsUpgraded,
        tribal_isles: CustomConvertibleIds.CheesyPipePartyTribalIslesUpgraded,
        varmint_valley: CustomConvertibleIds.CheesyPipePartyVarmintValleyUpgraded,
        desert: CustomConvertibleIds.CheesyPipePartySandtailDesertUpgraded,
        rodentia: CustomConvertibleIds.CheesyPipePartyRodentiaUpgraded,
        queso_canyon: CustomConvertibleIds.CheesyPipePartyQuesoCanyonUpgraded,
        zokor_zone: CustomConvertibleIds.CheesyPipePartyHollowHeightsUpgraded,
        folklore_forest: CustomConvertibleIds.CheesyPipePartyFolkloreForestUpgraded,
        riftopia: CustomConvertibleIds.CheesyPipePartyRiftPlaneUpgraded,
    };
}
