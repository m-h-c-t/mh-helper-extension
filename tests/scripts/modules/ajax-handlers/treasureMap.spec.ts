import {TreasureMapHandler} from "@scripts/modules/ajax-handlers/treasureMap";
import {SubmissionService} from "@scripts/services/submission.service";
import {TreasureMap, TreasureMapInventory} from "@scripts/types/hg/treasureMap";
import {HgResponse} from "@scripts/types/hg";
import {HgResponseBuilder} from "@tests/utility/builders";
import {LoggerService} from "@scripts/services/logging";
import {mock} from "jest-mock-extended";

class TreasureMapResponseBuilder extends HgResponseBuilder {
    treasure_map_inventory?: {
        relic_hunter_hint?: string;
    };
    treasure_map?: TreasureMap;

    withRelicHunterHint(hint: string): this {
        this.treasure_map_inventory = {
            relic_hunter_hint: hint
        };

        return this;
    }

    withTreasureMap(map: {
        name: string;
        map_id: number;
        goals: {
            mouse: {
                unique_id: number;
                name: string;
            }[],
            item: {
                unique_id: number;
                name: string;
            }[],
        };
    }): this {
        this.treasure_map = map;

        return this;
    }

    build(): HgResponse & {
        treasure_map_inventory?: TreasureMapInventory;
        treasure_map?: TreasureMap;
        } {
        return {
            ...super.build(),
            treasure_map_inventory: this.treasure_map_inventory,
            treasure_map: this.treasure_map,
        };
    }
}

const logger = mock<LoggerService>();
const submissionService = mock<SubmissionService>();

describe("TreasureMapHandler", () => {
    let responseBuilder: TreasureMapResponseBuilder;
    let handler: TreasureMapHandler;

    const treasureMapUrl = "mousehuntgame.com/managers/ajax/users/treasuremap_v2.php";

    beforeEach(() => {
        jest.clearAllMocks();

        responseBuilder = new TreasureMapResponseBuilder();
        handler = new TreasureMapHandler(logger, submissionService);
    });

    describe("match", () => {
        it('returns true when URL contains treasuremap_v2.php', () => {
            expect(handler.match(treasureMapUrl)).toBe(true);
        });

        it('returns false for unrelated URLs', () => {
            expect(handler.match("mousehuntgame.com/managers/ajax/events/kings_giveaway.php")).toBe(false);
        });
    });

    describe("validatedExecute", () => {
        it('submits relic hunter hint when present', async () => {
            const response = responseBuilder
                .withRelicHunterHint("The Relic Hunter can be found in Gnawnia.")
                .build();

            await handler.execute(response);

            expect(submissionService.submitRelicHunterHint).toHaveBeenCalledWith(
                "The Relic Hunter can be found in Gnawnia."
            );
            expect(submissionService.submitTreasureMap).not.toHaveBeenCalled();
        });

        it('submits treasure map data when map has mice', async () => {
            const response = responseBuilder
                .withTreasureMap({
                    name: "Rare Test Treasure Map",
                    map_id: 12345,
                    goals: {
                        mouse: [
                            {unique_id: 101, name: "Test Mouse"},
                            {unique_id: 102, name: "Another Mouse"}
                        ],
                        item: []
                    }
                })
                .build();

            await handler.execute(response);

            expect(submissionService.submitTreasureMap).toHaveBeenCalledWith(
                expect.objectContaining({
                    mice: {
                        101: "Test Mouse",
                        102: "Another Mouse"
                    },
                    id: 12345,
                    name: "Test Map"
                })
            );
            expect(submissionService.submitRelicHunterHint).not.toHaveBeenCalled();
        });

        it('properly transforms map names', async () => {
            const response = responseBuilder.build();
            response.treasure_map = {
                name: "Rare Ardouous Treasure Map",
                map_id: 12345,
                goals: {
                    mouse: [
                        {unique_id: 101, name: "Test Mouse"}
                    ],
                    item: []
                }
            };

            await handler.execute(response);

            expect(submissionService.submitTreasureMap).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "Arduous Map"
                })
            );
        });

        it('does not submit map when no mice are present', async () => {
            const response = responseBuilder.build();
            response.treasure_map = {
                name: "Common Empty Treasure Map",
                map_id: 12345,
                goals: {
                    mouse: [],
                    item: []
                }
            };

            await handler.execute(response);

            expect(submissionService.submitTreasureMap).not.toHaveBeenCalled();
        });

        it('does not submit map when items are present', async () => {
            const response = responseBuilder.build();
            response.treasure_map = {
                name: "Common Empty Scavenger Hunt",
                map_id: 12345,
                goals: {
                    mouse: [],
                    item: [
                        {unique_id: 201, name: "Test Item"},
                        {unique_id: 202, name: "Another Item"}
                    ]
                }
            };

            await handler.execute(response);

            expect(submissionService.submitTreasureMap).not.toHaveBeenCalled();
        });

        it('handles both relic hunter hint and treasure map', async () => {
            const response = responseBuilder.build();
            response.treasure_map_inventory = {
                relic_hunter_hint: "The Relic Hunter can be found in Burroughs."
            };
            response.treasure_map = {
                name: "Rare Mighty Treasure Map",
                map_id: 67890,
                goals: {
                    mouse: [
                        {unique_id: 201, name: "Mighty Mouse"}
                    ],
                    item: []
                }
            };

            await handler.execute(response);

            expect(submissionService.submitRelicHunterHint).toHaveBeenCalledWith(
                "The Relic Hunter can be found in Burroughs."
            );
            expect(submissionService.submitTreasureMap).toHaveBeenCalledWith({
                mice: {
                    201: "Mighty Mouse"
                },
                id: 67890,
                name: "Mighty Map"
            });
        });

        it('does nothing when neither hint nor map is present', async () => {
            const response = responseBuilder.build();

            await handler.execute(response);

            expect(submissionService.submitRelicHunterHint).not.toHaveBeenCalled();
            expect(submissionService.submitTreasureMap).not.toHaveBeenCalled();
        });
    });

});
