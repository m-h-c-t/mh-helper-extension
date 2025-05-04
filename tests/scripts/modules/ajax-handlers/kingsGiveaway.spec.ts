import {KingsGiveawayAjaxHandler} from "@scripts/modules/ajax-handlers/kingsGiveaway";
import {ApiService} from "@scripts/services/api.service";
import {SubmissionService} from "@scripts/services/submission.service";
import {CustomConvertibleIds} from "@scripts/util/constants";
import {LoggerService} from "@scripts/util/logger";
import {HgResponseBuilder} from "@tests/utility/builders";
import {mock} from "jest-mock-extended";

const logger = mock<LoggerService>();
const submissionService = mock<SubmissionService>();
const apiService = mock<ApiService>();

const kga_url = "mousehuntgame.com/managers/ajax/events/kings_giveaway.php";

describe("KingsGiveawayAjaxHandler", () => {
    let responseBuilder: HgResponseBuilder;
    let handler: KingsGiveawayAjaxHandler;

    // Mouse RIP item mock
    const knownVaultItems = [
        //{type: 'extreme_regal_trinket', id: 2542},
        {type: 'prize_credit_stat_item', id: 420},
        {type: 'rainbow_scroll_case_convertible', id: 1974},
        {type: 'rainbow_luck_trinket', id: 1692},
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        apiService.send.mockImplementation((method, url, body) => {

            if (url === "https://api.mouse.rip/items")
            {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(knownVaultItems)
                } as unknown as Promise<Response>);
            }

            return Promise.resolve({
                ok: false
            }) as unknown as Promise<Response>;
        });

        responseBuilder = new HgResponseBuilder();
        handler = new KingsGiveawayAjaxHandler(logger, submissionService, apiService);
    });

    describe("match", () => {
        it("is false when url is ignored", () => {
            expect(handler.match("mousehuntgame.com/managers/ajax/events/sprint_hunt.php")).toBe(false);
        });

        it("is true when url matches", () => {
            expect(handler.match(kga_url)).toBe(true);
        });
    });

    describe("execute", () => {
        it('logs if KGA response is not a mini prize pack opening', async () => {
            const response = responseBuilder.build();
            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith("Couldn't validate JSON response", expect.anything());
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });

        it("submits expected response one", async () => {
            const response = responseBuilder
                .withUnknown(testResponses.responseOne)
                .build();
            await handler.execute(response);

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

            expect(logger.warn).toHaveBeenCalledTimes(0);
            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.arrayContaining(expectedItems)
            );
        });

        it("submits expected response two", async () => {
            const response = responseBuilder
                .withUnknown(testResponses.responseTwo)
                .build();
            await handler.execute(response);

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

            expect(logger.warn).toHaveBeenCalledTimes(0);
            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expect.objectContaining(expectedConvertible),
                expect.arrayContaining(expectedItems)
            );
        });

        it("submits expected upon opening 10th pack", async () => {
            const response = responseBuilder
                .withUnknown(testResponses.responseWithVaultOne)
                .build();
            await handler.execute(response);

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

            expect(submissionService.submitEventConvertible).toHaveBeenNthCalledWith(1,
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

            expect(logger.warn).toHaveBeenCalledTimes(0);
            expect(submissionService.submitEventConvertible).toHaveBeenNthCalledWith(2,
                expect.objectContaining(expectedVaultConvertible),
                expect.arrayContaining(expectedVaultItems)
            );
        });

        it("logs warning when items from mouse rip don't contain vault item", async () => {
            const response = responseBuilder
                .withUnknown(testResponses.responseWithVaultTwo)
                .build();

            await expect(handler.execute(response)).rejects.toThrow(`Unknown item type 'extreme_regal_trinket' in King's Vault`);
        });

        it("errors out on response three", async () => {
            const response = responseBuilder
                .withUnknown(testResponses.responseWithInventoryError)
                .build();
            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith("Item (unknown_item_type) not found in inventory from King's Mini Prize Pack opening");
            expect(submissionService.submitEventConvertible).not.toBeCalled();
        });
    });
});

// Data is minimum required for the execute to pass
const testResponses = {
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
            "super_brie_cheese": {
                "item_id": 114,
                "name": "SUPER|brie+",
                "quantity": 5,
                "type": "super_brie_cheese",
            },
        },
    },

    // 10th opening + vault prizes
    responseWithVaultOne: {
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

    // 10th opening + vault prizes
    responseWithVaultTwo: {
        "kings_giveaway": {
            "remaining_openable_prize_packs": null,
            "vault_is_open": true,
            "vault_prizes": [
                {
                    "quantity": 100,
                    "type": "extreme_regal_trinket",
                    "name": "Extreme Regal Charm",
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
        "inventory": {},
    },
};
