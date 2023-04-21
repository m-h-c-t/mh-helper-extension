import {addLostCityStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Lost/Cursed City stages', () => {
    it('should set stage to "Cursed" when user is cursed', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: {minigame: {
            is_cursed: true,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        addLostCityStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Cursed');
    });

    it('should set stage to "Cursed" when user is not cursed', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: {minigame: {
            is_cursed: false,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        addLostCityStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Cursed');
    });
});
