import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {IceFortressStager} from '@scripts/modules/stages/environments/iceFortress';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage, getDefaultUser} from '@tests/scripts/hunt-filter/common';

describe('Ice Fortress exemptions', () => {
    let logger: LoggerService;
    let stager: IceFortressStager;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        stager = new IceFortressStager();
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = {...getDefaultUser(), ...getIceFortressUser()};
            postUser = {...getDefaultUser(), ...getIceFortressUser()};
            preMessage = {...getDefaultIntakeMessage()};
            postMessage = {...getDefaultIntakeMessage()};
        });

        it('should accept when no transitions', () => {
            if (preUser.quests.QuestIceFortress && postUser.quests.QuestIceFortress) {
                preUser.quests.QuestIceFortress.shield.is_broken = false;
                postUser.quests.QuestIceFortress.shield.is_broken = false;
            } else {
                expect(false).toBe(true);
            }
            calculateStage();

            const valid = target.validateMessage(preMessage, postMessage);

            expect(valid).toBe(true);
        });

        it('should accept transtion on breaking the shield', () => {
            if (preUser.quests.QuestIceFortress && postUser.quests.QuestIceFortress) {
                preUser.quests.QuestIceFortress.shield.is_broken = false;
                postUser.quests.QuestIceFortress.shield.is_broken = true;
            } else {
                expect(false).toBe(true);
            }
            calculateStage();

            const valid = target.validateMessage(preMessage, postMessage);

            expect(valid).toBe(true);
        });

        it('should accept transtion on catching Frost King', () => {

            if (preUser.quests.QuestIceFortress && postUser.quests.QuestIceFortress) {
                preUser.quests.QuestIceFortress.shield.is_broken = true;
                postUser.quests.QuestIceFortress.shield.is_broken = false;
            } else {
                expect(false).toBe(true);
            }
            preMessage.mouse = postMessage.mouse = 'Frost King';
            calculateStage();

            const valid = target.validateMessage(preMessage, postMessage);

            expect(valid).toBe(true);
        });
        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager.addStage(preMessage, preUser, {} as User, {});
            stager.addStage(postMessage, postUser, {} as User, {});
        }
    });

    function getIceFortressUser(): User {
        return {
            environment_name: 'Ice Fortress',
            quests: {
                QuestIceFortress: {
                    shield: {is_broken: false},
                    cannons:    {
                        charm_cannon: {is_enabled: null, is_active: null, just_fired: null, state: "disabled"},
                        cinnamon_cannon: {is_enabled: null, is_active: null, just_fired: null, state: "disabled"},
                        snow_cannon: {is_enabled: null, is_active: null, just_fired: null, state: "disabled"},
                    },
                },
            },
        } as User;
    }
});
