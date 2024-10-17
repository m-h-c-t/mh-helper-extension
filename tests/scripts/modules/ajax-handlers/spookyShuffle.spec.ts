import {SpookyShuffleAjaxHandler} from "@scripts/modules/ajax-handlers";
import {SpookyShuffleResponse, SpookyShuffleStatus} from "@scripts/modules/ajax-handlers/spookyShuffle.types";
import {HgItem} from "@scripts/types/mhct";

jest.mock('@scripts/util/logger');
jest.mock('@scripts/util/hgFunctions');

import {ConsoleLogger} from '@scripts/util/logger';
import {getItemsByClass} from "@scripts/util/hgFunctions";
import {CustomConvertibleIds} from "@scripts/util/constants";
import {HgResponseBuilder} from "@tests/utility/builders";

const logger = new ConsoleLogger();
const submitConvertibleCallback = jest.fn() as jest.MockedFunction<(convertible: HgItem, items: HgItem[]) => void>;
const handler = new SpookyShuffleAjaxHandler(logger, submitConvertibleCallback);
const mockedGetItemsByClass = jest.mocked(getItemsByClass);

const spookyShuffle_url = "mousehuntgame.com/managers/ajax/events/spooky_shuffle.php";

describe("SpookyShuffleAjaxHandler", () => {

    const responseBuilder = new HgResponseBuilder();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("match", () => {
        it('is false when url is ignored', () => {
            expect(handler.match('mousehuntgame.com/managers/ajax/events/gwh.php')).toBe(false);
        });

        it('is true when url matches', () => {
            expect(handler.match(spookyShuffle_url)).toBe(true);
        });
    });

    describe("execute", () => {
        it('warns if response is unexpected', async () => {

            // memory_game missing here,
            const response = responseBuilder.build();

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('Unexpected spooky shuffle response object.', expect.anything());
            expect(submitConvertibleCallback).toHaveBeenCalledTimes(0);
        });

        it('debug logs if response is an incomplete game', async () => {
            const result: SpookyShuffleStatus = {
                is_complete: null,
                is_upgraded: null,
                has_selected_testing_pair: false,
                reward_tiers: [],
                title_range: 'novice_journeyman',
                cards: [],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };
            await handler.execute(response);

            expect(logger.debug).toHaveBeenCalledWith('Spooky Shuffle board is not complete yet.');
            expect(submitConvertibleCallback).toHaveBeenCalledTimes(0);
        });

        it('debug logs if response is an complete game but no testing pair', async () => {
            const result: SpookyShuffleStatus = {
                is_complete: true,
                is_upgraded: null,
                has_selected_testing_pair: false,
                reward_tiers: [],
                title_range: 'novice_journeyman',
                cards: [],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };

            await handler.execute(response);

            expect(logger.debug).toHaveBeenCalledWith('Spooky Shuffle board is not complete yet.');
            expect(submitConvertibleCallback).toHaveBeenCalledTimes(0);
        });

        it('submits regular novice board', async () => {
            mockedGetItemsByClass.mockReturnValue(Promise.resolve([
                {
                    name: 'Test Item',
                    item_id: 1234,
                },
            ]));

            const result: SpookyShuffleStatus = {
                is_complete: true,
                is_upgraded: null,
                has_selected_testing_pair: true,
                reward_tiers: [
                    {
                        name: 'Test Title Range',
                        type: 'novice_journeyman',
                    },
                ],
                title_range: 'novice_journeyman',
                cards: [
                    {
                        id: 1,
                        name: 'Test Item',
                        is_matched: true,
                        is_revealed: true,
                        quantity: 567,
                    },
                ],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };

            await handler.execute(response);

            const expectedConvertible = {
                id: CustomConvertibleIds.HalloweenSpookyShuffleNovice,
                name: 'Spooky Shuffle (Test Title Range)',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 1234,
                    name: 'Test Item',
                    quantity: 567,
                },
            ];

            expect(submitConvertibleCallback).toHaveBeenCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.objectContaining(expectedItems)
            );
        });


        it('submits upgraded duke board', async () => {
            mockedGetItemsByClass.mockReturnValue(Promise.resolve([
                {
                    name: 'Test Item',
                    item_id: 1234,
                },
            ]));

            const result: SpookyShuffleStatus = {
                is_complete: true,
                is_upgraded: true,
                has_selected_testing_pair: true,
                reward_tiers: [
                    {
                        name: 'Grand Test Title and up',
                        type: 'grand_duke_plus',
                    },
                ],
                title_range: 'grand_duke_plus',
                cards: [
                    {
                        id: 1,
                        name: 'Test Item',
                        is_matched: true,
                        is_revealed: true,
                        quantity: 567,
                    },
                    {
                        id: 1,
                        name: 'Gold',
                        is_matched: true,
                        is_revealed: true,
                        quantity: 5000,
                    },
                ],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };

            await handler.execute(response);

            const expectedConvertible = {
                id: CustomConvertibleIds.HalloweenSpookyShuffleGrandDukeDusted,
                name: 'Upgraded Spooky Shuffle (Grand Test Title and up)',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 1234,
                    name: 'Test Item',
                    quantity: 567,
                },
                {
                    id: 431,
                    name: 'Gold',
                    quantity: 5000,
                },
            ];

            expect(submitConvertibleCallback).toHaveBeenCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.objectContaining(expectedItems)
            );
        });

        it('logs error when card name is not returned in getItemsByClass', async () => {
            mockedGetItemsByClass.mockReturnValue(Promise.resolve([
                {
                    name: 'Fake Item',
                    item_id: 9876,
                },
            ]));

            const result: SpookyShuffleStatus = {
                is_complete: true,
                is_upgraded: true,
                has_selected_testing_pair: true,
                reward_tiers: [
                    {
                        name: 'Grand Test Title and up',
                        type: 'grand_duke_plus',
                    },
                ],
                title_range: 'grand_duke_plus',
                cards: [
                    {
                        id: 1,
                        name: 'Test Item',
                        is_matched: true,
                        is_revealed: true,
                        quantity: 567,
                    },
                ],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith(`Item 'Test Item' wasn't found in item map. Check its classification type`);
            expect(submitConvertibleCallback).not.toHaveBeenCalled();
        });

    });
});
