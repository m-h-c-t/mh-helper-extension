import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { ClawShotCityStager } from '@scripts/modules/stages/environments/clawShotCity';

describe('ClawShotCityStager', () => {
    it('Should be for the "Claw Shot City" environment', () => {
        const stager = new ClawShotCityStager();
        expect(stager.environment).toBe('Claw Shot City');
    });

    it('Sets stage to "No poster" if user has no map or poster', () => {
        const stager = new ClawShotCityStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: {
            map_active: false, has_wanted_poster: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('No poster');
    });

    it('Sets stage to "Has poster" if user has no map but has poster', () => {
        const stager = new ClawShotCityStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: {
            map_active: false, has_wanted_poster: true,
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Has poster');
    });

    it('Sets stage to "Using poster" if user has an active map', () => {
        const stager = new ClawShotCityStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: {
            map_active: true, has_wanted_poster: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Using poster');
    });

    it.each([undefined, null])('throws when quest is %p', (quest) => {
        const stager = new ClawShotCityStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: quest}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestClawShotCity');
    });
});
