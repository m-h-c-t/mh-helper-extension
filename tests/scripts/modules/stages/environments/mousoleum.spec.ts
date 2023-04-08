import {addMousoleumStage} from '@scripts/modules/stages/legacy';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';

describe('MousoleumStager', () => {
    it('sets stage to "Has Wall" if user has Mousoleum wall', () => {
        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestMousoleum: {has_wall: true}}} as User;
        const userPost: User = {} as User;
        const journal = {};
        addMousoleumStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('Has Wall');
    });

    it('sets stage to "No Wall" if user does not have Mousoleum wall', () => {
        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestMousoleum: {has_wall: false}}} as User;
        const userPost = {} as User;
        const journal = {};
        addMousoleumStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('No Wall');
    });
});
