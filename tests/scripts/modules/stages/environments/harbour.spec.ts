import {addHarbourStage} from "@scripts/modules/stages/legacy";
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';

describe('HarbourStager', () => {
    it('sets stage to "No Bounty" if user can begin search', () => {
        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestHarbour: {status: 'canBeginSearch'}}} as User;
        const userPost = {} as User;
        const journal = {};
        addHarbourStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('No Bounty');
    });

    it('sets stage to "On Bounty" if user is searching', () => {
        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestHarbour: {status: 'searchStarted', can_claim: false}}} as User;
        const userPost = {} as User;
        const journal = {};
        addHarbourStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('On Bounty');
    });

    it('sets stage to "No Bounty" if user is searching but can claim', () => {
        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestHarbour: {status: 'searchStarted', can_claim: true}}} as User;
        const userPost = {} as User;
        const journal = {};
        addHarbourStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('No Bounty');
    });

});
