import {mergician} from "mergician";
import {BountifulBeanstalkRoomTrackerAjaxHandler} from "@scripts/modules/ajax-handlers";
import {HgResponse} from "@scripts/types/hg";
import {ConsoleLogger} from "@scripts/util/logger";
import type {BeanstalkRarityPayload} from "@scripts/modules/ajax-handlers/beanstalkRoomTracker.types";

jest.mock("@scripts/util/logger");
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
    })
) as jest.Mock;

const logger = new ConsoleLogger();
const showFlashMessage = jest.fn();
const handler = new BountifulBeanstalkRoomTrackerAjaxHandler(
    logger,
    showFlashMessage
);

const activeHuntUrl = "mousehuntgame.com/managers/ajax/turns/activeturn.php";
const beanstalkUrl =
    "mousehuntgame.com/managers/ajax/environment/bountiful_beanstalk.php";

describe("BountifulBeanstalkRoomTrackerAjaxHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe("match", () => {
        it("is false when url is ignored", () => {
            expect(
                handler.match(
                    "mousehuntgame.com/managers/ajax/environment/table_of_contents.php"
                )
            ).toBe(false);
        });

        it.each([activeHuntUrl, beanstalkUrl])(
            "is true when url matches",
            (url) => {
                expect(handler.match(url)).toBe(true);
            }
        );
    });

    describe("execute", () => {
        it("should ignore if not in bountiful beanstalk", async () => {
            await handler.execute(
                getDefaultResponse({
                    user: {
                        environment_name: "Server Room",
                    },
                })
            );

            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Not in BB environment"
            );
        });

        it("should log if there are too many journal entries", async () => {
            await handler.execute(
                getDefaultResponse({
                    active_turn: undefined,
                    journal_markup: [
                        {
                            render_data: {
                                css_class: "",
                            },
                        },
                        {
                            render_data: {
                                css_class: "",
                            },
                        },
                    ],
                })
            );

            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Didn't plant vine or too many journal entries (2 entries)"
            );
        });

        it("should ignore if not in castle", async () => {
            await handler.execute(
                getDefaultResponse({
                    active_turn: true,
                    user: {
                        quests: {
                            QuestBountifulBeanstalk: {
                                in_castle: false,
                            },
                        },
                    },
                })
            );

            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: User not in castle"
            );
        });

        it("should ignore if not suitable room position", async () => {
            await handler.execute(
                getDefaultResponse({
                    active_turn: true,
                })
            );

            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: User not in a submittable position"
            );
        });

        it("should submit if user just planted vine", async () => {
            await handler.execute(getDefaultResponse({
                user: {
                    quests: {
                        QuestBountifulBeanstalk: {
                            castle: {
                                room_position: 0,
                            },
                        },
                    },
                },
                journal_markup: [
                    {
                        render_data: {
                            css_class: 'bountifulBeanstalk-plantedVine',
                        },
                    },
                ],
            }));

            const expectedData: BeanstalkRarityPayload = {
                version: 1,
                floor: "dungeon_floor",
                embellishments: {
                    golden_key: true,
                    ruby_remover: false,
                },
                room: "magic_bean_ultimate_room",
            };
            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Submitting current room"
            );
            expect(showFlashMessage).toHaveBeenCalledWith(
                "success",
                "Castle room data submitted successfully"
            );
            expect(global.fetch).toHaveBeenCalledWith(
                "https://script.google.com/macros/s/AKfycbynfLfTaN6tnEYBE1Z9iPJEtO4xCCvsqHQqiu246JCKCUvwQU8WyICEJGzX45UF3HPmAA/exec",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(expectedData),
                })
            );
        });

        it("should submit if user just entered new room", async () => {
            await handler.execute(getDefaultResponse({
                active_turn: true,
                user: {
                    quests: {
                        QuestBountifulBeanstalk: {
                            in_castle: true,
                            castle: {
                                is_boss_chase: false,
                                room_position: 0,
                            },
                        },
                    },
                },
            }));

            const expectedData: BeanstalkRarityPayload = {
                version: 1,
                floor: "dungeon_floor",
                embellishments: {
                    golden_key: true,
                    ruby_remover: false,
                },
                room: "magic_bean_ultimate_room",
            };
            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Submitting current room"
            );
            expect(showFlashMessage).toHaveBeenCalledWith(
                "success",
                "Castle room data submitted successfully"
            );
            expect(global.fetch).toHaveBeenCalledWith(
                "https://script.google.com/macros/s/AKfycbynfLfTaN6tnEYBE1Z9iPJEtO4xCCvsqHQqiu246JCKCUvwQU8WyICEJGzX45UF3HPmAA/exec",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(expectedData),
                })
            );
        });

        it("should submit next room if user just triggered chase", async () => {
            await handler.execute(getDefaultResponse({
                active_turn: true,
                user: {
                    quests: {
                        QuestBountifulBeanstalk: {
                            castle: {
                                is_boss_chase: true,
                                room_position: 19,
                                current_floor: {
                                    type: "great_hall_floor",
                                },
                                next_room: {
                                    type: "egg_standard_room",
                                },
                            },
                        },
                    },
                },
            }));

            const expectedData: BeanstalkRarityPayload = {
                version: 1,
                floor: "great_hall_floor",
                embellishments: {
                    golden_key: true,
                    ruby_remover: false,
                },
                room: "egg_standard_room",
            };
            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Submitting next room"
            );
            expect(showFlashMessage).toHaveBeenCalledWith(
                "success",
                "Castle room data submitted successfully"
            );
            expect(global.fetch).toHaveBeenCalledWith(
                "https://script.google.com/macros/s/AKfycbynfLfTaN6tnEYBE1Z9iPJEtO4xCCvsqHQqiu246JCKCUvwQU8WyICEJGzX45UF3HPmAA/exec",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(expectedData),
                })
            );
        });

        it("should log an error if fetch throws", async () => {
            const err = new Error();
            global.fetch = jest.fn(() => {
                throw err;
            });
            await handler.execute(getDefaultResponse({
                active_turn: true,
                user: {
                    quests: {
                        QuestBountifulBeanstalk: {
                            castle: {
                                is_boss_chase: true,
                                room_position: 19,
                            },
                        },
                    },
                },
            }));

            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Submitting next room"
            );
            expect(showFlashMessage).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith(
                "BBRoomTracker: Castle room data network error",
                err
            );
        });

        it("should log a warning if response is not OK", async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false,
                })
            ) as jest.Mock;
            await handler.execute(getDefaultResponse({
                active_turn: true,
                user: {
                    quests: {
                        QuestBountifulBeanstalk: {
                            castle: {
                                is_boss_chase: true,
                                room_position: 19,
                            },
                        },
                    },
                },
            }));

            expect(logger.debug).toHaveBeenCalledWith(
                "BBRoomTracker: Submitting next room"
            );
            expect(showFlashMessage).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith(
                "BBRoomTracker: Error submitting castle room data"
            );
        });
    });

    /**
     * Gets an partially filled HgResponse for the purpose of these tests.
     *
     * User is not in a submittable position but everything else is fine.
     *
     * In castle. Dungeon. Current room: 8M. Next room: 2S. Embellishments: K.
     */
    function getDefaultResponse(overrides: object): HgResponse {
        return mergician(
            {
                user: {
                    environment_name: "Bountiful Beanstalk",
                    quests: {
                        QuestBountifulBeanstalk: {
                            in_castle: true,
                            castle: {
                                is_boss_chase: false,
                                room_position: 10,
                                current_floor: {
                                    type: "dungeon_floor",
                                },
                                current_room: {
                                    type: "magic_bean_ultimate_room",
                                },
                                next_room: {
                                    type: "string_super_room",
                                },
                            },
                            embellishments: [
                                {
                                    type: "golden_key",
                                    is_active: true,
                                },
                                {
                                    type: "ruby_remover",
                                    is_active: false,
                                },
                            ],
                        },
                    },
                },
            },
            overrides
        ) as HgResponse;
    }
});
