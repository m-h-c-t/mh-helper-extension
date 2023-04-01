import {MousoleumStager} from '@scripts/modules/stages/environments/mousoleum';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';

describe('MousoleumStager', () => {
    it('sets stage to "Has Wall" if user has Mousoleum wall', () => {
        const stager = new MousoleumStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestMousoleum: {has_wall: true}}} as User;
        const userPost = {} as User;
        const journal = {};
        stager.addStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('Has Wall');
    });

    it('sets stage to "No Wall" if user does not have Mousoleum wall', () => {
        const stager = new MousoleumStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestMousoleum: {has_wall: false}}} as User;
        const userPost = {} as User;
        const journal = {};
        stager.addStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('No Wall');
    });

    it('throws an error if QuestMousoleum is undefined', () => {
        const stager = new MousoleumStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {}} as User;
        const userPost = {} as User;
        const journal = {};
        expect(() => {
            stager.addStage(message, userPre, userPost, journal);
        }).toThrowError('QuestMousoleum is undefined');
    });
});
