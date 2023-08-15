import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {addIcebergStage} from '@scripts/modules/stages/legacy';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage, getDefaultUser} from '@tests/scripts/hunt-filter/common';

describe('Iceberg exemptions', () => {
    let logger: LoggerService;
    let stager: (message: IntakeMessage, pre: User, post: User, journal: unknown) => void;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        stager = addIcebergStage;
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = {...getDefaultUser(), ...getIcebergUser()};
            postUser = {...getDefaultUser(), ...getIcebergUser()};
            preMessage = {...getDefaultIntakeMessage()};
            postMessage = {...getDefaultIntakeMessage()};
        });

        describe('generals', () => {
            it('should reject transition to generals stage', () => {
                preUser.quests.QuestIceberg = {current_phase: 'Treacherous Tunnels'};
                postUser.quests.QuestIceberg = {current_phase: 'General'};
                preMessage.mouse = postMessage.mouse = 'Polar Bear';
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it('should reject after general catch', () => {
                preUser.quests.QuestIceberg = {current_phase: 'General'};
                postUser.quests.QuestIceberg = {current_phase: 'Brutal Bulwark'};
                preMessage.mouse = postMessage.mouse = 'General Drheller';
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });
        });

        describe('icewing', () => {
            it('should reject transition to generals stage', () => {
                preUser.quests.QuestIceberg = {current_phase: 'General'};
                postUser.quests.QuestIceberg = {current_phase: 'Icewing\'s Lair'};
                preMessage.mouse = postMessage.mouse = 'Princess Fist';
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it('should reject after Icewing catch', () => {
                preUser.quests.QuestIceberg = {current_phase: 'Icewing\'s Lair'};
                postUser.quests.QuestIceberg = {current_phase: 'Hidden Depths'};
                preMessage.mouse = postMessage.mouse = 'Icewing';
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });
        });

        describe('deep', () => {
            it('should reject transition on deep catch', () => {
                preMessage.location = {name: 'Iceberg', id: 0};
                postMessage.location = {name: 'Slushy Shoreline', id: 0};
                preMessage.mouse = postMessage.mouse = 'Deep';

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });
        });

        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager(preMessage, preUser, {} as User, {});
            stager(postMessage, postUser, {} as User, {});
        }
    });

    function getIcebergUser(): User {
        return {
            environment_name: 'Iceberg',
            quests: {
                QuestIceberg: {
                    current_phase: 'Treacherous Tunnels',
                },
            },
        } as User;
    }
});
