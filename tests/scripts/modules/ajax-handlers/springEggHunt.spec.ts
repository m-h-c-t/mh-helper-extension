import type { LoggerService } from '@scripts/services/logging';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse } from '@scripts/types/hg';

import { SEHAjaxHandler } from '@scripts/modules/ajax-handlers';
import { mock } from 'vitest-mock-extended';

const logger = mock<LoggerService>();
const submissionService = mock<SubmissionService>();
const handler = new SEHAjaxHandler(logger, submissionService);

const sbfactory_url = 'mousehuntgame.com/managers/ajax/events/spring_hunt.php';

describe('SEHAjaxHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('match', () => {
        it('is false when url is ignored', () => {
            expect(handler.match('mousehuntgame.com/managers/ajax/events/birthday_factory.php')).toBe(false);
        });

        it('is true when url matches', () => {
            expect(handler.match(sbfactory_url)).toBe(true);
        });
    });

    describe('execute', () => {
        it('logs if SEH response is not egg opening', async () => {
            await handler.execute({} as unknown as HgResponse);

            expect(logger.debug).toHaveBeenCalledWith('Skipping SEH egg submission as this isn\'t an egg convertible');
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });

        it('warns if response is unexpected', async () => {
            // vending_machine_reponse.type missing here,
            // but add some other data to verify that it will print out entire response
            const response = {user_id: 4, egg_contents: {}} as unknown as HgResponse;
            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('Unable to parse SEH response', {responseJSON: response});
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });

        it('submits expected response one', async () => {
            await handler.execute(testResponses.responseOne);

            const expectedConvertible = {
                id: 3407,
                name: 'The Richest Egg',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 431,
                    name: 'Gold',
                    quantity: 6103,
                },
                {
                    id: 3274,
                    name: 'Extra Rich Cloud Cheesecake',
                    quantity: 10,
                },
                {
                    id: 3077,
                    name: 'Cyclone Stone',
                    quantity: 2,
                },
            ];

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
            );
        });

        it('submits expected response two', async () => {
            await handler.execute(testResponses.responseTwo);

            const expectedConvertible = {
                id: 3214,
                name: 'Loot Cache Egg',
                quantity: 2,
            };

            const expectedItems = [
                {
                    id: 3073,
                    name: 'Sky Glass',
                    quantity: 4,
                },
                {
                    id: 3047,
                    name: 'Cloud Curd',
                    quantity: 8,
                },
                {
                    id: 3074,
                    name: 'Sky Ore',
                    quantity: 4,
                },
            ];

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
            );
        });

        it('submits expected response three', async () => {
            await handler.execute(testResponses.responseThree);

            const expectedConvertible = {
                id: 3555,
                name: 'Architeuthulhu Egg',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 3450,
                    name: 'Inspiration Ink',
                    quantity: 50,
                },
            ];

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
            );
        });
    });
});

// Data is minimum required for the execute to pass
const testResponses = {
    // The Richest Egg
    // 6103 Gold, 10 ERCC, 2 Cyclone Stone
    responseOne: {
        egg_contents: {
            type: 'richest_egg_convertible',
            quantity_opened: 1,
            items: [
                {
                    type: 'gold_stat_item',
                    name: 'Gold',
                    quantity: 6103,
                },
                {
                    type: 'extra_rich_sky_cheese',
                    name: 'Extra Rich Cloud Cheesecake',
                    quantity: 10,
                },
                {
                    type: 'sky_scrambler_stat_item',
                    name: 'Cyclone Stone',
                    quantity: 2,
                },
            ],
        },
        inventory: {
            richest_egg_convertible: {
                item_id: 3407,
                name: 'The Richest Egg',
                type: 'richest_egg_convertible',
            },
            extra_rich_sky_cheese: {
                item_id: 3274,
                name: 'Extra Rich Cloud Cheesecake',
                type: 'extra_rich_sky_cheese',
            },
            sky_scrambler_stat_item: {
                item_id: 3077,
                name: 'Cyclone Stone',
                type: 'sky_scrambler_stat_item',
            },
        },
    } as unknown as HgResponse,

    // 2 Loot Cache Eggs
    // 4 Sky Glass, 8 Cloud Curd, 4 Sky Ore
    responseTwo: {
        egg_contents: {
            type: 'loot_cache_egg_convertible',
            quantity_opened: 2,
            items: [
                {
                    type: 'floating_islands_cloud_gem_stat_item',
                    name: 'Sky Glass',
                    quantity: 4,
                },
                {
                    type: 'cloud_curd_crafting_item',
                    name: 'Cloud Curd',
                    quantity: 8,
                },
                {
                    type: 'floating_islands_sky_ore_stat_item',
                    name: 'Sky Ore',
                    quantity: 4,
                },
            ],
        },
        inventory: {
            loot_cache_egg_convertible: {
                item_id: 3214,
                name: 'Loot Cache Egg',
                type: 'loot_cache_egg_convertible',
            },
            floating_islands_cloud_gem_stat_item: {
                item_id: 3073,
                name: 'Sky Glass',
                type: 'floating_islands_cloud_gem_stat_item',
            },
            cloud_curd_crafting_item: {
                item_id: 3047,
                name: 'Cloud Curd',
                type: 'cloud_curd_crafting_item',
                classification: 'crafting_item',
            },
            floating_islands_sky_ore_stat_item: {
                item_id: 3074,
                name: 'Sky Ore',
                type: 'floating_islands_sky_ore_stat_item',
            },
        },
    } as unknown as HgResponse,
    // 1 Architeuthulhu Egg
    // 50 Inspiration Ink
    responseThree: {
        egg_contents: {
            type: 'architeuthulhu_egg_convertible',
            quantity_opened: 1,
            items: [
                {
                    type: 'inspiration_ink_stat_item',
                    name: 'Inspiration Ink',
                    quantity: 50,
                },
            ],
        },
        inventory: {
            architeuthulhu_egg_convertible: {
                item_id: 3555,
                name: 'Architeuthulhu Egg',
                type: 'architeuthulhu_egg_convertible',
            },
            inspiration_ink_stat_item: {
                item_id: 3450,
                name: 'Inspiration Ink',
                type: 'inspiration_ink_stat_item',
            },
        },
    } as unknown as HgResponse,
};
