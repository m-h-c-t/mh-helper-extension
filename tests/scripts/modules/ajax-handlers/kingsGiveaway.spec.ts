import {KingsGiveawayAjaxHandler} from "@scripts/modules/ajax-handlers/kingsGiveaway";
import {KingsGiveawayResponse} from "@scripts/modules/ajax-handlers/kingsGiveaway.types";
import {HgResponse} from "@scripts/types/hg";
import {HgItem} from "@scripts/types/mhct";
import {CustomConvertibleIds, EventDates} from "@scripts/util/constants";
import {addDays} from "@scripts/util/time";

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
            Date.now = jest.fn(() => addDays(EventDates.KingsGiveawayEndDate, 1).getTime());

            expect(handler.match(kga_url)).toBe(false);
        });

        it("is true when url matches", () => {
            Date.now = jest.fn(() => addDays(EventDates.KingsGiveawayEndDate, -5).getTime());

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


        it("submits expected upon opening 10th pack", async () => {

            await handler.execute(testResponses.responseOfTenthKey);

            const expectedPrizeConvertible = {
                id: CustomConvertibleIds.KingsMiniPrizePack,
                name: "King's Mini Prize Pack",
                quantity: 1,
            };

            const expectedPrizeItems = [
                {
                    id: 114,
                    name: "SUPER|brie+",
                    quantity: 5,
                },
            ];

            expect(submitConvertibleCallback).toHaveBeenNthCalledWith(1,
                expect.objectContaining(expectedPrizeConvertible),
                expect.arrayContaining(expectedPrizeItems)
            );

            const expectedVaultConvertible = {
                id: CustomConvertibleIds.KingsGiveawayVault,
                name: "King's Giveaway Vault",
                quantity: 1,
            };

            const expectedVaultItems = [
                {
                    id: 420,
                    name: "King's Credits",
                    quantity: 300,
                },
                {
                    id: 1692,
                    name: "Rainbow Charms",
                    quantity: 50,
                },
                {
                    id: 1974,
                    name: "Rainbow Scroll Case",
                    quantity: 1,
                },
            ];

            expect(submitConvertibleCallback).toHaveBeenNthCalledWith(2,
                expect.objectContaining(expectedVaultConvertible),
                expect.arrayContaining(expectedVaultItems)
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
const testResponses: Record<string, Pick<KingsGiveawayResponse, "kings_giveaway" | "kings_giveaway_result" | "inventory">> = {
    // 5 Super Regal Charms
    responseOne: {
        "kings_giveaway": {
            "remaining_openable_prize_packs": 10,
            "vault_is_open": null,
            "vault_prizes": [],
        },
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
        "kings_giveaway": {
            "remaining_openable_prize_packs": 10,
            "vault_is_open": null,
            "vault_prizes": [],
        },
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

    // 10th opening + vault prizes
    responseOfTenthKey: {
        "kings_giveaway": {
            "remaining_openable_prize_packs": null,
            "vault_is_open": true,
            "vault_prizes": [
                {
                    "quantity": 300,
                    "type": "prize_credit_stat_item",
                    "name": "King's Credits",
                },
                {
                    "quantity": 50,
                    "type": "rainbow_luck_trinket",
                    "name": "Rainbow Charms",
                },
                {
                    "quantity": 1,
                    "type": "rainbow_scroll_case_convertible",
                    "name": "Rainbow Scroll Case",
                },
            ],
        },
        "kings_giveaway_result": {
            "slot": "bonus",
            "quantity": 1,
            "items": [
                {
                    "type": "super_brie_cheese",
                    "name": "SUPER|brie+",
                    "quantity": 5,
                },
            ],
        },
        "inventory": {
            "super_brie_cheese": {
                "item_id": 114,
                "name": "SUPER|brie+",
                "quantity": 5,
                "type": "super_brie_cheese",
            },
        },
    },

    responseWithInventoryError: {
        "kings_giveaway": {
            "remaining_openable_prize_packs": 10,
            "vault_is_open": null,
            "vault_prizes": [],
        },
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
