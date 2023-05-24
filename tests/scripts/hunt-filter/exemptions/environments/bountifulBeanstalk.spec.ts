import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {BountifulBeanstalkStager} from '@scripts/modules/stages/environments/bountifulBeanstalk';
import {User} from '@scripts/types/hg';
import {ComponentEntry, IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage, getDefaultUser} from '@tests/scripts/hunt-filter/common';
import * as stageTest from '@tests/scripts/modules/stages/environments/bountifulBeanstalk.spec';

describe('Bountiful Beanstalk exemptions', () => {
    let logger: LoggerService;
    let stager: BountifulBeanstalkStager;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        stager = new BountifulBeanstalkStager();
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = {...getDefaultUser(), ...getBountifulBeanstalkUser()};
            postUser = {...getDefaultUser(), ...getBountifulBeanstalkUser()};
            preMessage = {...getDefaultIntakeMessage()};
            postMessage = {...getDefaultIntakeMessage()};
        });

        describe('Beanstalk', () => {
            it('should accept on transition to boss', () => {
                // Arrange
                setBeanstalkQuestAttributes(false, true, 'Budrich Thornborn');

                // Act
                const valid = target.validateMessage(preMessage, postMessage);

                // Assert
                expect(valid).toBe(true);
            });

            it('should accept on transition from boss', () => {
                setBeanstalkQuestAttributes(true, false, 'Vinneus Stalkhome');

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(true);
            });

            function setBeanstalkQuestAttributes(preBossEncounter: boolean, postBossEncounter: boolean, mouse: string) {
                preUser.quests.QuestBountifulBeanstalk = stageTest.createBeanstalkAttributes(preBossEncounter);
                postUser.quests.QuestBountifulBeanstalk = stageTest.createBeanstalkAttributes(postBossEncounter);
                preMessage.mouse = postMessage.mouse = mouse;
                applyStage();
            }
        });

        describe('Castle', () => {
            it('should reject on transition to boss', () => {
                // Arrange
                setCastleQuestAttributes(
                    {floor: 'Dungeon Floor', room: 'Standard Mystery Room', isBossEncounter: false},
                    {floor: 'Dungeon Floor', room: 'Standard Mystery Room', isBossEncounter: true},
                    'Wrathful Warden'
                );

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            describe.each`
                floor                   | giant
                ${'Dungeon Floor'}      | ${'Dungeon Master'},
                ${'Ballroom Floor'}     | ${'Malevolent Maestro'},
                ${'Great Hall Floor'}   | ${'Mythical Giant King'},
            `('Giant catching', ({floor, giant}) => {
                it(`should accept on transition from catching ${giant} to beanstalk`, () => {
                    preUser.quests.QuestBountifulBeanstalk = stageTest.createCastleAttributes({floor: floor, room: 'Extreme Lavish Lapis Bean Room'}, true);
                    postUser.quests.QuestBountifulBeanstalk = stageTest.createBeanstalkAttributes(false);
                    preMessage.mouse = postMessage.mouse = giant;
                    // Going back changes cheese
                    preMessage.cheese = {id: 1, name: 'Some'};
                    postMessage.cheese = {id: 2, name: 'Another'};

                    applyStage();

                    const valid = target.validateMessage(preMessage, postMessage);
                    expect(valid).toBe(true);
                });

                it(`should accept on transition from catching ${giant} to beanstalk and cheese disarming`, () => {
                    preUser.quests.QuestBountifulBeanstalk = stageTest.createCastleAttributes({floor: floor, room: 'Extreme Lavish Lapis Bean Room'}, true);
                    postUser.quests.QuestBountifulBeanstalk = stageTest.createBeanstalkAttributes(false);
                    preMessage.mouse = postMessage.mouse = giant;
                    // Going back disarms cheese (sets user.bait_item_id: 0, user.bait_name: 0). See createMessageFromHunt
                    preMessage.cheese = {id: 1, name: 'Some Cheese'};
                    postMessage.cheese = {} as ComponentEntry;

                    applyStage();

                    const valid = target.validateMessage(preMessage, postMessage);
                    expect(valid).toBe(true);
                });
            });

            type HelperType = { floor: string, room: string, isBossEncounter: boolean };
            function setCastleQuestAttributes(preAttributes: HelperType, postAttributes: HelperType, mouse: string) {
                preUser.quests.QuestBountifulBeanstalk = stageTest.createCastleAttributes(preAttributes, preAttributes.isBossEncounter);
                postUser.quests.QuestBountifulBeanstalk = stageTest.createCastleAttributes(preAttributes, postAttributes.isBossEncounter);
                preMessage.mouse = postMessage.mouse = mouse;
                applyStage();
            }
        });

        /** Sets the pre and post message stage based on current pre and post user */
        function applyStage() {
            stager.addStage(preMessage, preUser, {} as User, {});
            stager.addStage(postMessage, postUser, {} as User, {});
        }
    });

    function getBountifulBeanstalkUser(): User {
        return {
            environment_name: 'Bountiful Beanstalk',
            quests: {
                QuestBountifulBeanstalk: stageTest.getDefaultQuest(),
            },
        } as User;
    }
});
