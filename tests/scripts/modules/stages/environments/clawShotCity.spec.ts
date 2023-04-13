import {addClawShotCityStage} from '@scripts/modules/stages/legacy';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';

describe('ClawShotCityStager', () => {
    it('Sets stage to "No poster" if user has no map or poster', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: {
            map_active: false, has_wanted_poster: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        addClawShotCityStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('No poster');
    });

    it('Sets stage to "Has poster" if user has no map but has poster', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: {
            map_active: false, has_wanted_poster: true,
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        addClawShotCityStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Has poster');
    });

    it('Sets stage to "Using poster" if user has an active map', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestClawShotCity: {
            map_active: true, has_wanted_poster: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        addClawShotCityStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Using poster');
    });
});
