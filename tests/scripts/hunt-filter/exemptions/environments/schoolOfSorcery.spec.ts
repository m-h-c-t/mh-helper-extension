import {IntakeRejectionEngine} from "@scripts/hunt-filter/engine";
import {SchoolOfSorceryStager} from "@scripts/modules/stages/environments/schoolOfSorcery";
import {User} from "@scripts/types/hg";
import {ComponentEntry, IntakeMessage} from "@scripts/types/mhct";
import {CourseType} from "@scripts/types/hg/quests/schoolOfSorcery";
import {LoggerService} from "@scripts/util/logger";
import {
    getDefaultIntakeMessage,
    getDefaultUser
} from "@tests/scripts/hunt-filter/common";
import * as stageTest from "@tests/scripts/modules/stages/environments/schoolOfSorcery.spec";

describe("School of Sorcery exemptions", () => {
    let logger: LoggerService;
    let stager: SchoolOfSorceryStager;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        stager = new SchoolOfSorceryStager();
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe("validateMessage", () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = {...getDefaultUser(), ...getSchoolOfSorceryUser()};
            postUser = {...getDefaultUser(), ...getSchoolOfSorceryUser()};
            preMessage = {...getDefaultIntakeMessage()};
            postMessage = {...getDefaultIntakeMessage()};
        });

        describe("In Course", () => {
            it("should reject on transition to boss", () => {
                preUser.quests.QuestSchoolOfSorcery = stageTest.createCourseAttributes({courseType: 'arcane_101_course', powerType: 'arcane'}, false);
                postUser.quests.QuestSchoolOfSorcery = stageTest.createCourseAttributes({courseType: 'arcane_101_course', powerType: 'arcane'}, true);
                preMessage.mouse = postMessage.mouse = "Some Random Mouse";

                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            describe.each<{courseType: CourseType, powerType: 'arcane' | 'shadow', boss: string}>([
                {courseType: 'arcane_101_course',   powerType: 'arcane', boss: 'Arcane Master Sorcerer'},
                {courseType: 'shadow_101_course',   powerType: 'shadow', boss: 'Shadow Master Sorcerer'},
                {courseType: 'exam_course',         powerType: 'arcane', boss: 'Mythical Master Sorcerer'},
                {courseType: 'exam_course',         powerType: 'shadow', boss: 'Mythical Master Sorcerer'},
            ])("Boss catching", ({courseType, powerType, boss}) => {
                it(`should accept on transition from catching ${boss} in ${courseType} to hallway`, () => {
                    preUser.quests.QuestSchoolOfSorcery = stageTest.createCourseAttributes({courseType, powerType}, true);
                    postUser.quests.QuestSchoolOfSorcery = stageTest.createHallwayAttributes();
                    preMessage.mouse = postMessage.mouse = boss;
                    // Going back changes cheese
                    preMessage.cheese = {id: 1, name: 'Some'};
                    postMessage.cheese = {id: 2, name: 'Another'};

                    calculateStage();

                    const valid = target.validateMessage(preMessage, postMessage);
                    expect(valid).toBe(true);
                });

                it(`should accept on transition from catching ${boss} in ${courseType} to hallway and cheese disarming`, () => {
                    preUser.quests.QuestSchoolOfSorcery = stageTest.createCourseAttributes({courseType, powerType}, true);
                    postUser.quests.QuestSchoolOfSorcery = stageTest.createHallwayAttributes();
                    preMessage.mouse = postMessage.mouse = boss;
                    // Going back disarms cheese (sets user.bait_item_id: 0, user.bait_name: 0). See createMessageFromHunt
                    preMessage.cheese = {id: 1, name: 'Some Cheese'};
                    postMessage.cheese = {} as ComponentEntry;

                    calculateStage();

                    const valid = target.validateMessage(preMessage, postMessage);
                    expect(valid).toBe(true);
                });

                it(`should accept on transition from catching ${boss} in ${courseType} and continuing course`, () => {
                    let postPowerType = powerType;
                    if (courseType === 'exam_course') {
                        postPowerType = postPowerType === 'arcane' ? 'shadow' : 'arcane';
                    }
                    preUser.quests.QuestSchoolOfSorcery = stageTest.createCourseAttributes({courseType, powerType}, true);
                    postUser.quests.QuestSchoolOfSorcery = stageTest.createCourseAttributes({courseType, powerType: postPowerType}, false);
                    preMessage.mouse = postMessage.mouse = boss;

                    calculateStage();

                    const valid = target.validateMessage(preMessage, postMessage);
                    expect(valid).toBe(true);
                });
            });
        });

        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager.addStage(preMessage, preUser, {} as User, {});
            stager.addStage(postMessage, postUser, {} as User, {});
        }
    });

    function getSchoolOfSorceryUser(): User {
        return {
            environment_name: "School of Sorcery",
            quests: {
                QuestSchoolOfSorcery: stageTest.getDefaultQuest(),
            },
        } as User;
    }
});
