import type { User } from '@scripts/types/hg';
import type { BlightTier } from '@scripts/types/hg/quests/afterwordAcres';
import type { IntakeMessage } from '@scripts/types/mhct';

import { AfterwordAcresStager } from '@scripts/modules/stages/environments/afterwordAcres';
import { UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('AfterwordAcresStager', () => {
    let stager: AfterwordAcresStager;
    let message: IntakeMessage;
    let userPost: User;
    let journal: unknown;
    let user: User;

    beforeEach(() => {
        stager = new AfterwordAcresStager();
        message = mock<IntakeMessage>();
        userPost = mock<User>();
        journal = mock<unknown>();

        user = new UserBuilder()
            .withQuests({
                QuestAfterwordAcres: {
                    blight_tier: 'tier_1'
                }
            })
            .build();
    });

    it('should have correct environment name', () => {
        expect(stager.environment).toBe('Afterword Acres');
    });

    describe('blight tier stages', () => {
        it.each<[BlightTier, string]>([
            ['tier_1', '1x'],
            ['tier_2', '2x'],
            ['tier_3', '4x'],
            ['tier_4', '8x']
        ])('should set stage to %s for %s', (blightTier, expectedStage) => {
            user.quests.QuestAfterwordAcres!.blight_tier = blightTier;

            stager.addStage(message, user, userPost, journal);

            expect(message.stage).toBe(expectedStage);
        });
    });

    describe('error handling', () => {
        it('should throw error when QuestAfterwordAcres is not found', () => {
            user = new UserBuilder().build();

            expect(() => {
                stager.addStage(message, user, userPost, journal);
            }).toThrow('QuestAfterwordAcres not found');
        });

        it('should throw error for unknown blight tier', () => {
            // @ts-expect-error Force unknown blight tier
            user.quests.QuestAfterwordAcres!.blight_tier = 'tier_69';

            expect(() => {
                stager.addStage(message, user, userPost, journal);
            }).toThrow('Unknown blight tier: tier_69');
        });
    });
});
