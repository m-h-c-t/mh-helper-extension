import {mock} from 'vitest-mock-extended';
import {LoggerService} from "@scripts/services/logging";
import {SubmissionService} from '@scripts/services/submission.service';
import {UseConvertibleAjaxHandler} from '@scripts/modules/ajax-handlers/useConvertible';
import {HgResponseBuilder} from '@tests/utility/builders';

const logger = mock<LoggerService>();
const submissionService = mock<SubmissionService>();

const useConvertible_url = "mousehuntgame.com/managers/ajax/users/useconvertible.php";

describe("UseConvertibleHandler", () => {
    let responseBuilder: HgResponseBuilder;
    let handler: UseConvertibleAjaxHandler;

    beforeEach(() => {
        vitest.clearAllMocks();

        handler = new UseConvertibleAjaxHandler(logger, submissionService);
        responseBuilder = new HgResponseBuilder();
    });

    describe("match", () => {
        it("should match useconvertible.php URL", () => {
            const result = handler.match(useConvertible_url);
            expect(result).toBe(true);
        });

        it("should not match other URLs", () => {
            const result = handler.match("mousehuntgame.com/managers/ajax/turns/activeturn.php");
            expect(result).toBe(false);
        });
    });

    describe("execute", () => {
        it("should submit a normal convertible with items", async () => {
            const testData = testResponses.normalConvertible;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).toHaveBeenCalledWith(
                {
                    id: 1111,
                    name: "Test Convertible",
                    quantity: 5
                },
                [
                    {
                        id: 114,
                        name: "SUPER|brie+",
                        quantity: 3
                    }
                ]
            );
        });

        it("should handle gold items correctly", async () => {
            const testData = testResponses.goldItemConvertible;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).toHaveBeenCalledWith(
                {
                    id: 1111,
                    name: "Test Convertible",
                    quantity: 5
                },
                [
                    {
                        id: 431, // mapped gold ID
                        name: "Gold",
                        quantity: 5000
                    }
                ]
            );
        });

        it("should handle point items correctly", async () => {
            const testData = testResponses.pointItemConvertible;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).toHaveBeenCalledWith(
                {
                    id: 1111,
                    name: "Test Convertible",
                    quantity: 5
                },
                [
                    {
                        id: 644, // mapped points ID
                        name: "Points",
                        quantity: 1000
                    }
                ]
            );
        });

        it("should handle multiple items from a convertible", async () => {
            const testData = testResponses.multipleItemsConvertible;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).toHaveBeenCalledWith(
                {
                    id: 1111,
                    name: "Test Convertible",
                    quantity: 5
                },
                [
                    {
                        id: 114,
                        name: "SUPER|brie+",
                        quantity: 3
                    },
                    {
                        id: 431,
                        name: "Gold",
                        quantity: 5000,
                    }
                ]
            );
        });

        it("should do nothing if convertible type not found in items", async () => {
            const testData = testResponses.missingConvertibleType;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith("Couldn't find any items from opened convertible");
        });

        it("should do nothing if inventory is not a record", async () => {
            const testData = testResponses.invalidInventory;
            const response = responseBuilder
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith("Inventory is not a record");
        });

        it("should do nothing if item type not found in inventory or map", async () => {
            const testData = testResponses.unknownItemType;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith("Item unknown_item not found in inventory or custom map");
        });

        it("should do nothing if no items were found", async () => {
            const testData = testResponses.emptyItems;
            const response = responseBuilder
                .withInventory(testData.inventory)
                .withUnknown({
                    items: testData.items,
                    convertible_open: testData.convertible_open
                }).build();
            await handler.execute(response);

            expect(submissionService.submitItemConvertible).not.toHaveBeenCalled();
        });
    });
});

// Test response data
const testResponses = {
    normalConvertible: {
        "convertible_open": {
            "type": "test_convertible",
            "items": [
                {
                    "name": "SUPER|brie+",
                    "pluralized_name": "SUPER|brie+",
                    "quantity": 3,
                    "type": "super_brie_cheese"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {
            "super_brie_cheese": {
                "item_id": 114,
                "name": "SUPER|brie+",
                "quantity": 3,
                "type": "super_brie_cheese"
            }
        }
    },

    goldItemConvertible: {
        "convertible_open": {
            "type": "test_convertible",
            "items": [
                {
                    "name": "Gold",
                    "pluralized_name": "Gold",
                    "quantity": 5000,
                    "type": "gold_stat_item"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {}
    },

    pointItemConvertible: {
        "convertible_open": {
            "type": "test_convertible",
            "items": [
                {
                    "name": "Points",
                    "pluralized_name": "Points",
                    "quantity": 1000,
                    "type": "point_stat_item"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {}
    },

    multipleItemsConvertible: {
        "convertible_open": {
            "type": "test_convertible",
            "items": [
                {
                    "name": "SUPER|brie+",
                    "pluralized_name": "SUPER|brie+",
                    "quantity": 3,
                    "type": "super_brie_cheese"
                },
                {
                    "name": "Gold",
                    "pluralized_name": "Gold",
                    "quantity": 5000,
                    "type": "gold_stat_item"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {
            "super_brie_cheese": {
                "item_id": 114,
                "name": "SUPER|brie+",
                "quantity": 3,
                "type": "super_brie_cheese"
            }
        }
    },

    missingConvertibleType: {
        "convertible_open": {
            "type": "missing_convertible",
            "items": [
                {
                    "name": "SUPER|brie+",
                    "pluralized_name": "SUPER|brie+",
                    "quantity": 3,
                    "type": "super_brie_cheese"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {
            "super_brie_cheese": {
                "item_id": 114,
                "name": "SUPER|brie+",
                "quantity": 3,
                "type": "super_brie_cheese"
            }
        }
    },

    invalidInventory: {
        "convertible_open": {
            "type": "test_convertible",
            "items": [
                {
                    "name": "SUPER|brie+",
                    "pluralized_name": "SUPER|brie+",
                    "quantity": 3,
                    "type": "super_brie_cheese"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": []
    },

    unknownItemType: {
        "convertible_open": {
            "type": "test_convertible",
            "items": [
                {
                    "name": "Unknown Item",
                    "pluralized_name": "Unknown Items",
                    "quantity": 1,
                    "type": "unknown_item"
                }
            ]
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {
            "super_brie_cheese": {
                "item_id": 114,
                "name": "SUPER|brie+",
                "quantity": 3,
                "type": "super_brie_cheese"
            }
        }
    },

    emptyItems: {
        "convertible_open": {
            "type": "test_convertible",
            "items": []
        },
        "items": {
            "test_convertible": {
                "name": "Test Convertible",
                "item_id": 1111,
                "quantity": 5,
                "type": "test_convertible"
            }
        },
        "inventory": {}
    }
};
