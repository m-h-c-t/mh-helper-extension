import {recordPrizePack} from "@scripts/modules/ajax-handlers/legacy";
import {HgResponse} from "@scripts/types/hg";
import {HgItem} from "@scripts/types/mhct";
import {CustomConvertibleIds} from "@scripts/util/constants";

jest.mock('@scripts/util/logger');
import {ConsoleLogger} from '@scripts/util/logger';

const logger = new ConsoleLogger();
const submitConvertibleCallback = jest.fn() as jest.MockedFunction<(convertible: HgItem, items: HgItem[]) => void>;
const handler = (response: unknown) => recordPrizePack(response, logger, submitConvertibleCallback);
//const handler = new KingsGiveawayAjaxHandler(logger, submitConvertibleCallback);

// const kga_url = "mousehuntgame.com/managers/ajax/events/kings_giveaway.php";

describe("KingsGiveawayAjaxHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // describe("match", () => {
    //     it('is false when url is ignored', () => {
    //         expect(handler.match('mousehuntgame.com/managers/ajax/events/sprint_hunt.php')).toBe(false);
    //     });

    //     it('is true when url matches', () => {
    //         expect(handler.match(kga_url)).toBe(true);
    //     });
    // });

    describe("execute", () => {
        it('logs if KGA response is not a mini prize pack opening', () => {
            handler({} as unknown as HgResponse);

            expect(logger.debug).toBeCalledWith('Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.');
            expect(submitConvertibleCallback).toHaveBeenCalledTimes(0);
        });

        it('submits expected response one', () => {

            handler({responseJSON: testResponses.responseOne});

            const expectedConvertible = {
                id: CustomConvertibleIds.KingsMiniPrizePack,
                name: 'King\'s Mini Prize Pack',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 1982,
                    type: 'super_regal_trinket',
                    quantity: 5,
                },
            ];

            expect(submitConvertibleCallback).toBeCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.arrayContaining(expectedItems)
            );
        });

        it('submits expected response two', () => {

            handler({responseJSON: testResponses.responseTwo});

            const expectedConvertible = {
                id: CustomConvertibleIds.KingsMiniPrizePack,
                name: 'King\'s Mini Prize Pack',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 431,
                    type: 'gold_stat_item',
                    quantity: 5000,
                },
            ];

            expect(submitConvertibleCallback).toBeCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.arrayContaining(expectedItems)
            );
        });
    });
});

// Data is minimum required for the execute to pass
const testResponses = {
    // 5 Super Regal Charms
    responseOne: {
        "kings_giveaway_result": {
            "quantity": 1,
            "slot": "bonus",
            "items": [
                {
                    "type": "super_regal_trinket",
                    "name": "Super Regal Charm",
                    "quantity": 5,
                },
            ],
        },
        "inventory": {
            "super_regal_trinket": {
                "item_id": 1982,
                "name": "Super Regal Charm",
                "type": "super_regal_trinket",
            },
        },
    } as unknown as HgResponse,

    // 5000 gold
    responseTwo: {
        "kings_giveaway_result": {
            "quantity": 1,
            "slot": "bonus",
            "items": [
                {
                    "type": "gold_stat_item",
                    "name": "Gold",
                    "quantity": "5,000",
                },
            ],
        },
        // inventory doesn't contain gold response
        "inventory": {
            "some_item": {},
        },
    } as unknown as HgResponse,
};
