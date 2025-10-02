import {CheesyPipePartyAjaxHandler} from "@scripts/modules/ajax-handlers";
import {CheesyPipePartyGame, CheesyPipePartyResponse} from "@scripts/modules/ajax-handlers/sbFactory.types";
import {SubmissionService} from "@scripts/services/submission.service";
import {InventoryItem} from "@scripts/types/hg";
import {LoggerService} from "@scripts/services/logging";
import {HgResponseBuilder} from "@tests/utility/builders";
import {mock} from "vitest-mock-extended";

const logger = mock<LoggerService>();
const submissionService = mock<SubmissionService>();
const handler = new CheesyPipePartyAjaxHandler(logger, submissionService);

const sbfactory_url = "mousehuntgame.com/managers/ajax/events/cheesy_pipe_party.php";

describe("CheesyPipePartyAjaxHandler", () => {

    const responseBuilder = new HgResponseBuilder();

    const createResponse = (game: CheesyPipePartyGame, inventory: Record<string, InventoryItem>) => {
        // Deep copy to prevent mutation of the original object
        game = JSON.parse(JSON.stringify(game));
        inventory = JSON.parse(JSON.stringify(inventory));
        const hgResponse = responseBuilder.withInventory(
            inventory
        ).build();
        const response: CheesyPipePartyResponse = {
            ...hgResponse,
            cheesy_pipe_party_game: game,
        };

        return response;
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("match", () => {
        it('is false when url is ignored', () => {
            expect(handler.match('mousehuntgame.com/managers/ajax/events/kings_giveaway.php')).toBe(false);
        });

        it('is true when url matches', () => {
            expect(handler.match(sbfactory_url)).toBe(true);
        });
    });

    describe("execute", () => {
        it('logs if pipe party response is not expected', async () => {
            // cheesy_pipe_party missing here,
            const response = responseBuilder.build();

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('Unexpected Cheesy Pipe Party response object.', expect.anything());
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });

        it('logs if pipe party response is not complete', async () => {
            const response = createResponse(testResponses.responseOne.cheesy_pipe_party_game, testResponses.responseOne.inventory);
            response.cheesy_pipe_party_game.game_active = true;

            await handler.execute(response);

            expect(logger.debug).toHaveBeenCalledWith('Cheesy Pipe Party game is not complete.');
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });

        it('submits board with one prize', async () => {
            const {cheesy_pipe_party_game, inventory} = testResponses.responseOne;
            const response = createResponse(cheesy_pipe_party_game, inventory);

            await handler.execute(response);

            const expectedConvertible = {
                id: 130100,
                name: 'Cheesy Pipe Party (Test Region)',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 44,
                    name: 'Test Prize',
                    quantity: 420,
                },
            ];

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
            );
        });

        it('submits upgraded board with one prize', async () => {
            const {cheesy_pipe_party_game, inventory} = testResponses.responseOne;
            const response = createResponse(cheesy_pipe_party_game, inventory);
            response.cheesy_pipe_party_game.game_upgraded = true;

            await handler.execute(response);

            const expectedConvertible = {
                id: 130101,
                name: 'Upgraded Cheesy Pipe Party (Test Region)',
                quantity: 1,
            };

            const expectedItems = [
                {
                    id: 44,
                    name: 'Test Prize',
                    quantity: 420,
                },
            ];

            expect(submissionService.submitEventConvertible).toHaveBeenCalledWith(
                expectedConvertible,
                expectedItems
            );
        });

        it('logs with mismatched amounts of prizes', async () => {
            const {cheesy_pipe_party_game, inventory} = testResponses.responseOne;
            const response = createResponse(cheesy_pipe_party_game, inventory);
            response.cheesy_pipe_party_game.num_prizes = 2;

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('Cheesy Pipe Part mismatched number of revealed prizes', expect.objectContaining({
                revealedPrizeTiles: expect.arrayContaining([expect.anything()]),
                expectedPrizes: 2,
            }));
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });

        it('logs when region is not found', async () => {
            const {cheesy_pipe_party_game, inventory} = testResponses.responseOne;
            const response = createResponse(cheesy_pipe_party_game, inventory);
            // @ts-expect-error - selected_region is not a valid region
            response.cheesy_pipe_party_game.selected_region = 'not_found';

            await handler.execute(response);

            expect(logger.warn).toHaveBeenCalledWith('Unexpected Cheesy Pipe Party response object.', expect.anything());
            expect(submissionService.submitEventConvertible).toHaveBeenCalledTimes(0);
        });
    });
});

// Data is minimum required for the execute to pass
const testResponses: Record<string, {
    cheesy_pipe_party_game: CheesyPipePartyGame,
    inventory: Record<string, InventoryItem>,
}> = {
    responseOne: {
        cheesy_pipe_party_game: {
            game_active: false,
            game_upgraded: false,
            game_board: [
                {
                    row_data: [
                        {
                            tile_data: {
                                has_prize: true,
                                prize_name: "Test Prize",
                                prize_quantity: 420,
                                is_prize_unlocked: true,
                            },
                        },
                    ],
                },
            ],
            regions: [
                {
                    type: "gnawnia",
                    name: "Test Region",
                },
            ],
            selected_region: "gnawnia",
            num_prizes: 1,
        },
        inventory: {
            "test_prize": {
                item_id: 44,
                type: "test_prize",
                name: "Test Prize",
                quantity: 123,
            },
        },
    },
};
