import {addSandDunesStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Sand Dunes stages', () => {
    it('should set stage to "Stampede" when there is a stampede', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSandDunes: {minigame: {
            has_stampede: true,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        addSandDunesStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Stampede');
    });

    it('should set stage to "No Stampede" when there is not a stampede', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSandDunes: {minigame: {
            has_stampede: false,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        addSandDunesStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('No Stampede');
    });
});
