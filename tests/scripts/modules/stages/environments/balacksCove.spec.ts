import {addBalacksCoveStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Balack\'s Cove stages', () => {

    it.each`
        tide | expected
        ${'low'}  | ${'Low'}
        ${'med'}  | ${'Medium'}
        ${'high'} | ${'High'}
    `('should set stage to High, Medium, or Low', ({tide, expected}) => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestBalacksCove: {tide: {
            level: tide,
            direction: 'in',
            percent: 50,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        addBalacksCoveStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`${expected} Tide`);
    });

    it('should reject imminent tide changes', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestBalacksCove: {tide: {
            level: 'high',
            direction: 'in',
            percent: 99,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        addBalacksCoveStage(message, preUser, postUser, journal);

        expect(message.location).toBe(null);
    });
});
