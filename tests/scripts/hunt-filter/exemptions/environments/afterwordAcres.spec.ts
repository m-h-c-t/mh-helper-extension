import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {AfterwordAcresStager} from '@scripts/modules/stages/environments/afterwordAcres';
import {IStager} from '@scripts/modules/stages/stages.types';
import {User} from '@scripts/types/hg';
import {BlightTier} from '@scripts/types/hg/quests/afterwordAcres';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage} from '@tests/scripts/hunt-filter/common';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('Afterword Acres exemptions', () => {
    const logger: LoggerService = mock<LoggerService>();
    let stager: IStager;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        stager = new AfterwordAcresStager();
        target = new IntakeRejectionEngine(logger);
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = new UserBuilder()
                .withEnvironment({
                    environment_id: 0,
                    environment_name: 'Afterword Acres',
                })
                .withQuests({
                    QuestAfterwordAcres: {
                        blight_tier: 'tier_1',
                    },
                })
                .build();

            postUser = new UserBuilder()
                .withEnvironment({
                    environment_id: 0,
                    environment_name: 'Afterword Acres',
                })
                .withQuests({
                    QuestAfterwordAcres: {
                        blight_tier: 'tier_1',
                    },
                })
                .build();

            preMessage = {...getDefaultIntakeMessage(), ...getAfterwordAcresLocation()};
            postMessage = {...getDefaultIntakeMessage(), ...getAfterwordAcresLocation()};
        });

        describe('blight tier transitions', () => {
            describe('forward progression (blight decreasing)', () => {
                it.each<[BlightTier, BlightTier, string, string]>([
                    ['tier_1', 'tier_2', '1x', '2x'],
                    ['tier_2', 'tier_3', '2x', '4x'],
                    ['tier_3', 'tier_4', '4x', '8x'],
                ])('should accept transition from %s (%s) to %s (%s)', (preTier, postTier, preStage, postStage) => {
                    preUser.quests.QuestAfterwordAcres!.blight_tier = preTier;
                    postUser.quests.QuestAfterwordAcres!.blight_tier = postTier;
                    calculateStage();

                    expect(preMessage.stage).toBe(preStage);
                    expect(postMessage.stage).toBe(postStage);

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(true);
                });
            });

            describe('backward progression (blight increasing)', () => {
                it.each<[BlightTier, BlightTier, string, string]>([
                    ['tier_2', 'tier_1', '2x', '1x'],
                    ['tier_3', 'tier_2', '4x', '2x'],
                    ['tier_4', 'tier_3', '8x', '4x'],
                ])('should accept transition from %s (%s) to %s (%s)', (preTier, postTier, preStage, postStage) => {
                    preUser.quests.QuestAfterwordAcres!.blight_tier = preTier;
                    postUser.quests.QuestAfterwordAcres!.blight_tier = postTier;
                    calculateStage();

                    expect(preMessage.stage).toBe(preStage);
                    expect(postMessage.stage).toBe(postStage);

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(true);
                });
            });

            describe('invalid transitions', () => {
                it.each<[BlightTier, BlightTier, string, string]>([
                    ['tier_1', 'tier_3', '1x', '4x'], // skipping tier_2
                    ['tier_1', 'tier_4', '1x', '8x'], // skipping multiple tiers
                    ['tier_2', 'tier_4', '2x', '8x'], // skipping tier_3
                    ['tier_3', 'tier_1', '4x', '1x'], // skipping tier_2 backwards
                    ['tier_4', 'tier_2', '8x', '2x'], // skipping tier_3 backwards
                    ['tier_4', 'tier_1', '8x', '1x'], // skipping multiple tiers backwards
                ])('should reject invalid transition from %s (%s) to %s (%s)', (preTier, postTier, preStage, postStage) => {
                    preUser.quests.QuestAfterwordAcres!.blight_tier = preTier;
                    postUser.quests.QuestAfterwordAcres!.blight_tier = postTier;
                    calculateStage();

                    expect(preMessage.stage).toBe(preStage);
                    expect(postMessage.stage).toBe(postStage);

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(false);
                });

                it('should reject transition to invalid stage', () => {
                    preUser.quests.QuestAfterwordAcres!.blight_tier = 'tier_1';
                    postUser.quests.QuestAfterwordAcres!.blight_tier = 'tier_1';
                    preMessage.stage = '1x';
                    postMessage.stage = 'Invalid Stage';

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(false);
                });

                it('should reject transition from invalid stage', () => {
                    preUser.quests.QuestAfterwordAcres!.blight_tier = 'tier_1';
                    postUser.quests.QuestAfterwordAcres!.blight_tier = 'tier_2';
                    preMessage.stage = 'Invalid Stage';
                    postMessage.stage = '2x';

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(false);
                });
            });

            describe('same stage transitions', () => {
                it.each<[BlightTier, string]>([
                    ['tier_1', '1x'],
                    ['tier_2', '2x'],
                    ['tier_3', '4x'],
                    ['tier_4', '8x'],
                ])('should accept same stage for %s (%s) as no exemption needed', (tier, stage) => {
                    preUser.quests.QuestAfterwordAcres!.blight_tier = tier;
                    postUser.quests.QuestAfterwordAcres!.blight_tier = tier;
                    calculateStage();

                    expect(preMessage.stage).toBe(stage);
                    expect(postMessage.stage).toBe(stage);

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(true); // Same stage should be valid by default
                });
            });
        });

        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager.addStage(preMessage, preUser, {} as User, {});
            stager.addStage(postMessage, postUser, {} as User, {});
        }
    });

    function getAfterwordAcresLocation() {
        return {
            location: {
                id: 0, // Could use real ID if needed
                name: 'Afterword Acres',
            },
        };
    }
});
