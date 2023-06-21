import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {addClawShotCityStage} from '@scripts/modules/stages/legacy';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage, getDefaultUser} from '@tests/scripts/hunt-filter/common';

describe('Claw Shot City exemptions', () => {
    let logger: LoggerService;
    let stager: (message: IntakeMessage, pre: User, post: User, journal: unknown) => void;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        stager = addClawShotCityStage;
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = {...getDefaultUser(), ...getClawShotCityUser()};
            postUser = {...getDefaultUser(), ...getClawShotCityUser()};
            preMessage = {...getDefaultIntakeMessage()};
            postMessage = {...getDefaultIntakeMessage()};
        });

        it('should accept transtion on bounty hunter catch', () => {
            preUser.quests.QuestClawShotCity = {map_active: false, has_wanted_poster: false};
            postUser.quests.QuestClawShotCity = {map_active: false, has_wanted_poster: true};
            preMessage.mouse = postMessage.mouse = 'Bounty Hunter';
            calculateStage();

            const valid = target.validateMessage(preMessage, postMessage);

            expect(valid).toBe(true);
        });

        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager(preMessage, preUser, {} as User, {});
            stager(postMessage, postUser, {} as User, {});
        }
    });

    function getClawShotCityUser(): User {
        return {
            environment_name: 'Claw Shot City',
            quests: {
                QuestClawShotCity: {
                    map_active: false,
                    has_wanted_poster: false,
                },
            },
        } as User;
    }
});
