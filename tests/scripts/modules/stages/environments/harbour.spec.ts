import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { HarbourStager } from '@scripts/modules/stages/environments/harbour';

describe('HarbourStager', () => {
    it('sets stage to "No Bounty" if user can begin search', () => {
        const stager = new HarbourStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestHarbour: {status: 'canBeginSearch'}}} as User;
        const userPost = {} as User;
        const journal = {};
        stager.addStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('No Bounty');
    });

    it('sets stage to "On Bounty" if user is searching', () => {
        const stager = new HarbourStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestHarbour: {status: 'searchStarted', can_claim: false}}} as User;
        const userPost = {} as User;
        const journal = {};
        stager.addStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('On Bounty');
    });

    it('sets stage to "No Bounty" if user is searching but can claim', () => {
        const stager = new HarbourStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {QuestHarbour: {status: 'searchStarted', can_claim: true}}} as User;
        const userPost = {} as User;
        const journal = {};
        stager.addStage(message, userPre, userPost, journal);
        expect(message.stage).toBe('No Bounty');
    });

    it('throws an error if QuestHarbour is undefined', () => {
        const stager = new HarbourStager();

        const message = {stage: null} as IntakeMessage;
        const userPre = {quests: {}} as User;
        const userPost = {} as User;
        const journal = {};
        expect(() => {
            stager.addStage(message, userPre, userPost, journal);
        }).toThrow('QuestHarbour is undefined');
    });
});
