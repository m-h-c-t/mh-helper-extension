import {ValidatedAjaxSuccessHandler} from "./ajaxSuccessHandler";
import {MouseRipApiService} from "@scripts/services/mouserip-api.service";
import {SubmissionService} from "@scripts/services/submission.service";
import {HgItem} from "@scripts/types/mhct";
import {LoggerService} from "@scripts/util/logger";
import {spookyShuffleResponseSchema, TitleRange} from "./spookyShuffle.types";
import {CustomConvertibleIds} from "@scripts/util/constants";
import {z} from "zod";

export class SpookyShuffleAjaxHandler extends ValidatedAjaxSuccessHandler {
    readonly schema = spookyShuffleResponseSchema;
    private itemIdByNameCache: Record<string, number> | null = null;

    /**
     * Create a new instance of SpookyShuffleAjaxHandler
     * @param logger logger to log events
     * @param submitConvertibleCallback delegate to submit convertibles to mhct
     */
    constructor(
        logger: LoggerService,
        private readonly submissionService: SubmissionService,
        private readonly mouseRipApiService: MouseRipApiService) {
        super(logger);
    }

    match(url: string): boolean {
        if (!url.includes("mousehuntgame.com/managers/ajax/events/spooky_shuffle.php")) {
            return false;
        }

        return true;
    }

    async validatedExecute(response: z.infer<typeof this.schema>): Promise<void> {
        const result = response.memory_game;

        if (!result.is_complete || !result.has_selected_testing_pair) {
            this.logger.debug('Spooky Shuffle board is not complete yet.');
            return;
        }


        const convertibleContent: HgItem[] = [];
        const processed = new Set<string>();
        try {
            // We don't know the item id's of the cards. Hit MH inventory API to get the item names and ids
            // to convert the names to ids.
            this.itemIdByNameCache ??= await this.fetchItemNameToIdMap();

            result.cards.forEach(c => {
                // All cards need to be revealed and also exist in name to id map.
                // An error here typically means:
                // 1. Didn't fetch the required item classification
                // 2. The item isn't in the users inventory (unlikely unless the user used it between start and finish of the board).
                if (!c.is_revealed || this.itemIdByNameCache![c.name] == null) {
                    throw new Error(`Item '${c.name}' wasn't found in item map. Check its classification type`);
                }

                // Two of each card means we don't want to double process the same item
                if (processed.has(c.name)) {
                    return;
                }
                processed.add(c.name);

                convertibleContent.push({
                    id: this.itemIdByNameCache![c.name],
                    name: c.name,
                    quantity: c.quantity,
                });
            });
        } catch (error) {
            if (error instanceof Error) {
                this.logger.warn(error.message);
                return;
            }
        }

        const id = result.is_upgraded
            ? SpookyShuffleAjaxHandler.UpgradedShuffleConvertibleIds[result.title_range]
            : SpookyShuffleAjaxHandler.ShuffleConvertibleIds[result.title_range];
        const tierName = result.reward_tiers.find(r => r.type == result.title_range)?.name;

        // Example convertible names:
        // Spooky Shuffle (Novice to Journyperson)
        // Upgraded Spooky Shuffle (Grand Duke and up)
        let convertibleName = `Spooky Shuffle (${tierName})`;
        if (result.is_upgraded) {
            convertibleName = `Upgraded ${convertibleName}`;
        }

        const convertible: HgItem = {
            id: id,
            name: convertibleName,
            quantity: 1,
        };

        this.logger.debug("Shuffle Board: ", {convertible, items: convertibleContent});
        await this.submissionService.submitEventConvertible(convertible, convertibleContent);
    }

    async fetchItemNameToIdMap(): Promise<Record<string, number>> {
        const itemArray = await this.mouseRipApiService.getAllItems();

        const itemMap = itemArray.reduce((map: Record<string, number>, item) => {
            map[item.name] = item.item_id;
            return map;
        }, {});

        return itemMap;
    }

    static ShuffleConvertibleIds: Record<TitleRange, number> = {
        novice_journeyman: CustomConvertibleIds.HalloweenSpookyShuffleNovice,
        master_lord: CustomConvertibleIds.HalloweenSpookyShuffleMaster,
        baron_duke: CustomConvertibleIds.HalloweenSpookyShuffleBaron,
        grand_duke_plus: CustomConvertibleIds.HalloweenSpookyShuffleGrandDuke,
    };

    static UpgradedShuffleConvertibleIds: Record<TitleRange, number> = {
        novice_journeyman: CustomConvertibleIds.HalloweenSpookyShuffleNoviceDusted,
        master_lord: CustomConvertibleIds.HalloweenSpookyShuffleMasterDusted,
        baron_duke: CustomConvertibleIds.HalloweenSpookyShuffleBaronDusted,
        grand_duke_plus: CustomConvertibleIds.HalloweenSpookyShuffleGrandDukeDusted,
    };
}
