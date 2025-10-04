import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { BalacksCoveStager } from '@scripts/modules/stages/environments/balacksCove';

describe('Balack\'s Cove stages', () => {
    it('should be for the "Balack\'s Cove" environment', () => {
        const stager = new BalacksCoveStager();
        expect(stager.environment).toBe('Balack\'s Cove');
    });

    it.each`
        tide | expected
        ${'low'}  | ${'Low'}
        ${'med'}  | ${'Medium'}
        ${'high'} | ${'High'}
    `('should set stage to High, Medium, or Low', ({tide, expected}) => {
        const stager = new BalacksCoveStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestBalacksCove: {tide: {
            level: tide,
            direction: 'in',
            percent: 50,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`${expected} Tide`);
    });

    it('should reject imminent tide changes', () => {
        const stager = new BalacksCoveStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestBalacksCove: {tide: {
            level: 'high',
            direction: 'in',
            percent: 99,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to imminent tide change');
    });

    it.each([undefined, null])('should throw when quest is %p', (quest) => {
        const stager = new BalacksCoveStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestBalacksCove: quest}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestBalacksCove is undefined');
    });
});
