import { GWHGolemAjaxHandler } from '@scripts/modules/ajax-handlers/golem';
import type { GolemPayload } from '@scripts/modules/ajax-handlers/golem.types';

jest.mock('@scripts/util/logger');
import { ConsoleLogger } from '@scripts/util/logger';

const logger = new ConsoleLogger();
const showFlashMessage = jest.fn();
const handler = new GWHGolemAjaxHandler(logger, showFlashMessage);

const gwhURL = 'mousehuntgame.com/managers/ajax/events/winter_hunt_region.php';

describe('GWHGolemAjaxHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('match', () => {
        it('is false when url is ignored', () => {
            expect(handler.match('mousehuntgame.com/managers/ajax/events/kings_giveaway.php')).toBe(false);
        });

        it('is false when GWH is done', () => {
            // return the day after our filter
            Date.now = jest.fn(() => new Date('2023-01-22T05:00:00Z').getTime());

            expect(handler.match(gwhURL)).toBe(false);
        });

        it('is true on match during event', () => {
            Date.now = jest.fn(() => new Date('2022-12-07T05:00:00Z').getTime());
            expect(handler.match(gwhURL)).toBe(true);
        });
    });

    describe('execute', () => {
        it('does not call submitGolems with unhandled json', () => {
            handler.submitGolems = jest.fn();

            handler.execute({});

            expect(logger.debug).toHaveBeenCalledWith('Skipped GWH golem submission since there are no golem rewards.', {});
            expect(handler.submitGolems).not.toHaveBeenCalled();
        });

        it('calls submitGolems with expected data', () => {
            Date.now = jest.fn(() => 12345);
            handler.submitGolems = jest.fn();

            handler.execute(testResponses.prologuePondResponse);

            const expectedPayload: GolemPayload[] = [
                {
                    uid: '987654321',
                    location: 'Prologue Pond',
                    timestamp: 12345,
                    loot: [
                        {
                            name: 'Super Spore Charm',
                            quantity: 4,
                            rarity: 'area',
                        },
                        {
                            name: 'Inspiration Ink',
                            quantity: 1000,
                            rarity: 'hat',
                        },
                        {
                            name: 'Inspiration Ink',
                            quantity: 1000,
                            rarity: 'hat',
                        },
                        {
                            name: 'Condensed Creativity',
                            quantity: 10,
                            rarity: 'hat',
                        },
                    ],
                },
            ];
            expect(handler.submitGolems).toHaveBeenCalledWith(expectedPayload);
        });
    });
});

const testResponses = {
    // responses are the minimum that are required for the test to pass
    prologuePondResponse: {
        user: {
            user_id: 'not this',
            sn_user_id: 987654321,
        },
        golem_rewards: {
            items: {
                area: [
                    {
                        name: 'Super Spore Charm',
                        quantity: 4,
                    },
                ],
                hat: [
                    {
                        name: 'Inspiration Ink',
                        quantity: 1000,
                    },
                    {
                        name: 'Inspiration Ink',
                        quantity: 1000,
                    },
                    {
                        name: 'Condensed Creativity',
                        quantity: 10,
                    },
                ],
                scarf: [],
            },
        },
        journal_markup: [
            {
                render_data: {
                    text: 'My golem returned from the Prologue Pond with 1',
                },
            },
        ],
    },
};
