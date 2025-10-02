import {GWHGolemAjaxHandler} from '@scripts/modules/ajax-handlers/golem';
import type {GolemPayload, GolemResponse} from '@scripts/modules/ajax-handlers/golem.types';
import {HgResponse} from '@scripts/types/hg';
import {LoggerService} from '@scripts/services/logging';
import {HgResponseBuilder} from '@tests/utility/builders';
import {mock} from 'vitest-mock-extended';

const logger = mock<LoggerService>();
const showFlashMessage = vi.fn();
const handler = new GWHGolemAjaxHandler(logger, showFlashMessage);

const gwhURL = 'mousehuntgame.com/managers/ajax/events/winter_hunt_region.php';

describe('GWHGolemAjaxHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('match', () => {
        it('is false when url is ignored', () => {
            expect(handler.match('mousehuntgame.com/managers/ajax/events/kings_giveaway.php')).toBe(false);
        });

        it('is true when url is gwh', () => {
            expect(handler.match(gwhURL)).toBe(true);
        });
    });

    describe('execute', () => {
        it('does not call submitGolems with unhandled json', async () => {
            handler.submitGolems = vi.fn();

            await handler.execute({} as unknown as HgResponse);

            expect(logger.debug).toHaveBeenCalledWith('Skipped GWH golem submission since there are no golem rewards.', expect.anything());
            expect(handler.submitGolems).not.toHaveBeenCalled();
        });

        it('calls submitGolems with expected data', async () => {

            const builder = new HgResponseBuilder()
                .withJournalMarkup(testResponses.prologuePondResponse.journal_markup);

            const response: GolemResponse = {
                ...builder.build(),
                golem_rewards: testResponses.prologuePondResponse.golem_rewards,
            };
            Date.now = vi.fn(() => 12345);
            handler.submitGolems = vi.fn();

            await handler.execute(response);

            const expectedPayload: GolemPayload[] = [
                {
                    uid: '2',
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
                    entry_id: 1,
                    mouse_type: false,
                    css_class: '',
                    entry_date: '1:23 pm',
                    environment: 'Town of Gnawnia',
                    entry_timestamp: 1234567890,
                    text: 'My golem returned from the Prologue Pond with 1',
                },
            },
        ],
    },
};
