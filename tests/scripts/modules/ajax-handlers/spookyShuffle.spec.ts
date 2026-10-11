import type { SpookyShuffleResponse, SpookyShuffleStatus, TitleRange } from '@scripts/modules/ajax-handlers/spookyShuffle.types';
import type { LoggerService } from '@scripts/services/logging';
import type { SubmissionService } from '@scripts/services/submission.service';

import { SpookyShuffleAjaxHandler } from '@scripts/modules/ajax-handlers';
import { CustomConvertibleIds } from '@scripts/util/constants';
import { getItemsByClass } from '@scripts/util/hgFunctions';
import { HgResponseBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

vi.mock('@scripts/util/hgFunctions');

const logger = mock<LoggerService>();
const submissionService = mock<SubmissionService>();
const handler = new SpookyShuffleAjaxHandler(logger, submissionService);
const mockedGetItemsByClass = vi.mocked(getItemsByClass);

const spookyShuffle_url = 'mousehuntgame.com/managers/ajax/events/spooky_shuffle.php';

describe('SpookyShuffleAjaxHandler', () => {
    const responseBuilder = new HgResponseBuilder();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    describe('match', () => {
        it('is false when url is ignored', () => {
            expect(handler.match('mousehuntgame.com/managers/ajax/events/gwh.php')).toBe(false);
        });

        it('is true when url matches', () => {
            expect(handler.match(spookyShuffle_url)).toBe(true);
        });
    });

    describe('execute', () => {
        it('warns if response is unexpected', async () => {
            // memory_game missing here,
            const response = responseBuilder.build();

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('ValidatedAjaxSuccessHandler: Invalid response for Spooky Shuffle', expect.anything(), expect.anything());
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
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
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
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
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
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

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
            );
        });

        it('submits upgraded archduke board', async () => {
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
                        name: 'Archduke Test Title and up',
                        type: 'arch_duke_plus',
                    },
                ],
                title_range: 'arch_duke_plus',
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
                id: CustomConvertibleIds.HalloweenSpookyShuffleArchdukeDusted,
                name: 'Upgraded Spooky Shuffle (Archduke Test Title and up)',
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

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
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
                        name: 'Archduke Test Title and up',
                        type: 'arch_duke_plus',
                    },
                ],
                title_range: 'arch_duke_plus',
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
            expect(submissionService.submitEventConvertible).not.toHaveBeenCalled();
        });

        it.each<{titleRange: TitleRange, isUpgraded: boolean, expectedId: number}>([
            {titleRange: 'novice_journeyman', isUpgraded: false, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleNovice},
            {titleRange: 'novice_journeyman', isUpgraded: true, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleNoviceDusted},
            {titleRange: 'master_lord', isUpgraded: false, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleMaster},
            {titleRange: 'master_lord', isUpgraded: true, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleMasterDusted},
            {titleRange: 'baron_grand_duke', isUpgraded: false, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleBaron},
            {titleRange: 'baron_grand_duke', isUpgraded: true, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleBaronDusted},
            {titleRange: 'arch_duke_plus', isUpgraded: false, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleArchduke},
            {titleRange: 'arch_duke_plus', isUpgraded: true, expectedId: CustomConvertibleIds.HalloweenSpookyShuffleArchdukeDusted},
        ])('submits $titleRange board (upgraded: $isUpgraded) with convertible id $expectedId', async ({titleRange, isUpgraded, expectedId}) => {
            mockedGetItemsByClass.mockReturnValue(Promise.resolve([
                {
                    name: 'Test Item',
                    item_id: 1234,
                },
            ]));

            const result: SpookyShuffleStatus = {
                is_complete: true,
                is_upgraded: isUpgraded,
                has_selected_testing_pair: true,
                reward_tiers: [
                    {
                        name: 'Tier Name',
                        type: titleRange,
                    },
                ],
                title_range: titleRange,
                cards: [
                    {
                        id: 1,
                        name: 'Test Item',
                        is_matched: true,
                        is_revealed: true,
                        quantity: 1,
                    },
                ],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };

            await handler.execute(response);

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                {
                    id: expectedId,
                    name: isUpgraded ? 'Upgraded Spooky Shuffle (Tier Name)' : 'Spooky Shuffle (Tier Name)',
                    quantity: 1,
                },
                [{id: 1234, name: 'Test Item', quantity: 1}]
            );
        });

        it('warns and skips when title range is missing from reward tiers', async () => {
            const result: SpookyShuffleStatus = {
                is_complete: true,
                is_upgraded: false,
                has_selected_testing_pair: true,
                reward_tiers: [
                    {
                        name: 'Some Other Tier',
                        type: 'novice_journeyman',
                    },
                ],
                title_range: 'arch_duke_plus',
                cards: [
                    {
                        id: 1,
                        name: 'Test Item',
                        is_matched: true,
                        is_revealed: true,
                        quantity: 1,
                    },
                ],
            };
            const response: SpookyShuffleResponse = {
                ...responseBuilder.build(),
                memory_game: result,
            };

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith(`Spooky Shuffle reward tier 'arch_duke_plus' wasn't found in reward_tiers`);
            expect(mockedGetItemsByClass).not.toHaveBeenCalled();
            expect(submissionService.submitEventConvertible).not.toHaveBeenCalled();
        });

        it('rejects legacy grand_duke_plus title range', async () => {
            const response = {
                ...responseBuilder.build(),
                memory_game: {
                    is_complete: true,
                    is_upgraded: false,
                    has_selected_testing_pair: true,
                    reward_tiers: [{name: 'Grand Duke and up', type: 'grand_duke_plus'}],
                    title_range: 'grand_duke_plus',
                    cards: [],
                },
            };

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('ValidatedAjaxSuccessHandler: Invalid response for Spooky Shuffle', expect.anything(), expect.anything());
            expect(submissionService.submitEventConvertible).not.toHaveBeenCalled();
        });
    });
});
