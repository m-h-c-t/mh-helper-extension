import type { LoggerService } from '@scripts/services/logging';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgItem } from '@scripts/types/mhct';

import { CustomConvertibleIds as Ids } from '@scripts/util/constants';
import * as hgFuncs from '@scripts/util/hgFunctions';
import { parseHgInt } from '@scripts/util/number';

import type { SpookyShuffleResponse, TitleRange } from './spookyShuffle.types';

import { ValidatedAjaxSuccessHandler } from './ajaxSuccessHandler';
import { spookyShuffleResponseSchema } from './spookyShuffle.types';

const ShuffleConvertibleIds = {
    novice_journeyman: {standard: Ids.HalloweenSpookyShuffleNovice, upgraded: Ids.HalloweenSpookyShuffleNoviceDusted},
    master_lord: {standard: Ids.HalloweenSpookyShuffleMaster, upgraded: Ids.HalloweenSpookyShuffleMasterDusted},
    baron_duke: {standard: Ids.HalloweenSpookyShuffleBaron, upgraded: Ids.HalloweenSpookyShuffleBaronDusted},
    grand_duke: {standard: Ids.HalloweenSpookyShuffleGrandDuke, upgraded: Ids.HalloweenSpookyShuffleGrandDukeDusted},
    archduke_plus: {standard: Ids.HalloweenSpookyShuffleArchduke, upgraded: Ids.HalloweenSpookyShuffleArchdukeDusted},
} satisfies Record<TitleRange, {standard: number, upgraded: number}>;

export class SpookyShuffleAjaxHandler extends ValidatedAjaxSuccessHandler<typeof spookyShuffleResponseSchema> {
    readonly name = 'Spooky Shuffle';
    readonly schema = spookyShuffleResponseSchema;

    /**
     * Create a new instance of SpookyShuffleAjaxHandler
     * @param logger logger to log events
     * @param submissionService service to submit convertibles to mhct
     */
    constructor(
        logger: LoggerService,
        private readonly submissionService: SubmissionService) {
        super(logger);
    }

    match(url: string): boolean {
        return url.includes('mousehuntgame.com/managers/ajax/events/spooky_shuffle.php');
    }

    protected async validatedExecute(data: SpookyShuffleResponse): Promise<void> {
        await this.recordBoard(data);
    }

    /**
     * Record complete Spooky Shuffle Board as convertible in MHCT
     * @param responseJSON
     */
    private async recordBoard(responseJSON: SpookyShuffleResponse) {
        const result = responseJSON.memory_game;

        if (!result.is_complete || !result.has_selected_testing_pair) {
            this.logger.debug('Spooky Shuffle board is not complete yet.');
            return;
        }

        const tierName = result.reward_tiers.find(r => r.type === result.title_range)?.name;
        if (!tierName) {
            this.logger.warn(`Spooky Shuffle reward tier '${result.title_range}' wasn't found in reward_tiers`);
            return;
        }

        const ids = ShuffleConvertibleIds[result.title_range];

        // Example convertible names:
        // Spooky Shuffle (Novice to Journyperson)
        // Upgraded Spooky Shuffle (Archduke and up)
        const convertible: HgItem = {
            id: result.is_upgraded ? ids.upgraded : ids.standard,
            name: result.is_upgraded ? `Upgraded Spooky Shuffle (${tierName})` : `Spooky Shuffle (${tierName})`,
            quantity: 1,
        };

        // We don't know the item id's of the cards. Hit MH inventory API to get the item names and ids
        // to convert the names to ids.
        const itemMap = await this.fetchItemNameToIdMap();

        const convertibleContent: HgItem[] = [];
        const processed = new Set<string>();
        for (const c of result.cards) {
            // All cards need to be revealed and also exist in name to id map.
            // A miss here typically means:
            // 1. Didn't fetch the required item classification
            // 2. The item isn't in the users inventory (unlikely unless the user used it between start and finish of the board).
            if (!c.is_revealed || itemMap[c.name] == null) {
                this.logger.warn(`Item '${c.name}' wasn't found in item map. Check its classification type`);
                return;
            }

            // Two of each card means we don't want to double process the same item
            if (processed.has(c.name)) {
                continue;
            }
            processed.add(c.name);

            convertibleContent.push({
                id: itemMap[c.name],
                name: c.name,
                quantity: c.quantity,
            });
        }

        this.logger.debug('Shuffle Board: ', {convertible, items: convertibleContent});
        await this.submissionService.submitEventConvertible(convertible, convertibleContent);
    }

    private async fetchItemNameToIdMap(): Promise<Record<string, number>> {
        // async fetch of all items that are of the same classification of the rewards in spooky shuffle
        const itemArray = await hgFuncs.getItemsByClass(['bait', 'stat', 'trinket', 'crafting_item', 'potion', 'convertible'], true);

        const itemMap = itemArray.reduce((map: Record<string, number>, item) => {
            map[item.name] = parseHgInt(item.item_id);
            return map;
        }, {});

        // Gold is never returned as an item so need to add manually
        itemMap.Gold = 431;

        return itemMap;
    }
}
