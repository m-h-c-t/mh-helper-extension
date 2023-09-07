import {KingsGiveawayAjaxHandler} from "@scripts/modules/ajax-handlers/kingsGiveaway";
import {KingsGiveawayResponse} from "@scripts/modules/ajax-handlers/kingsGiveaway.types";
import {HgResponse} from "@scripts/types/hg";
import {HgItem} from "@scripts/types/mhct";
import {CustomConvertibleIds} from "@scripts/util/constants";

jest.mock("@scripts/util/logger");
import {ConsoleLogger} from "@scripts/util/logger";

const logger = new ConsoleLogger();
const submitConvertibleCallback = jest.fn() as jest.MockedFunction<(convertible: HgItem, items: HgItem[]) => void>;
const handler = new KingsGiveawayAjaxHandler(logger, submitConvertibleCallback);

const kga_url = "mousehuntgame.com/managers/ajax/events/kings_giveaway.php";

describe("KingsGiveawayAjaxHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("match", () => {
        it("is false when url is ignored", () => {
            expect(handler.match("mousehuntgame.com/managers/ajax/events/sprint_hunt.php")).toBe(false);
        });

        it("is false when KGA has vanished", () => {
            // return the day after our filter
            Date.now = jest.fn(() => new Date("2023-10-04T05:00:00Z").getTime());

            expect(handler.match(kga_url)).toBe(false);
        });

        it("is true when url matches", () => {
            Date.now = jest.fn(() => new Date("2023-09-12T05:00:00Z").getTime());

            expect(handler.match(kga_url)).toBe(true);
        });
    });

    describe("execute", () => {
        it('logs if KGA response is not a mini prize pack opening', () => {
            handler.execute({} as unknown as HgResponse);

            expect(logger.debug).toBeCalledWith("Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.");
            expect(submitConvertibleCallback).toHaveBeenCalledTimes(0);
        });

        it("submits expected response one", async () => {

            await handler.execute(testResponses.responseOne);

            const expectedConvertible = {
                id: CustomConvertibleIds.KingsMiniPrizePack,
                name: "King's Mini Prize Pack",
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 1982,
                    name: "Super Regal Charm",
                    quantity: 5,
                },
            ];

            expect(submitConvertibleCallback).toBeCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.arrayContaining(expectedItems)
            );
        });

        it("submits expected response two", async () => {

            await handler.execute(testResponses.responseTwo);

            const expectedConvertible = {
                id: CustomConvertibleIds.KingsMiniPrizePack,
                name: "King's Mini Prize Pack",
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 431,
                    name: "Gold",
                    quantity: 5000,
                },
            ];

            expect(submitConvertibleCallback).toBeCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.arrayContaining(expectedItems)
            );
        });

        it("errors out on response three", async () => {

            await handler.execute(testResponses.responseWithInventoryError);

            expect(logger.warn).toBeCalledWith("Item (unknown_item_type) not found in inventory from King's Mini Prize Pack opening");
            expect(submitConvertibleCallback).not.toBeCalled();
        });
    });
});

// Data is minimum required for the execute to pass
const testResponses: Record<string, Pick<KingsGiveawayResponse, "kings_giveaway_result" | "inventory">> = {
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
                "quantity": 2,
            },
        },
    },

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
        // inventory doesn"t contain gold response
        "inventory": {
        },
    },

    responseWithInventoryError: {
        "kings_giveaway_result": {
            "quantity": 1,
            "slot": "bonus",
            "items": [
                {
                    "type": "unknown_item_type",
                    "name": "Unknown",
                    "quantity": "1,111",
                },
            ],
        },
        "inventory": {

        },
    },
};
