import {SandDunesStager} from "@scripts/modules/stages/environments/sandDunes";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Sand Dunes stages', () => {
    it('should be for the "Sand Dunes" environment', () => {
        const stager = new SandDunesStager();
        expect(stager.environment).toBe('Sand Dunes');
    });

    it('should set stage to "Stampede" when there is a stampede', () => {
        const stager = new SandDunesStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSandDunes: {minigame: {
            has_stampede: true,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Stampede');
    });

    it('should set stage to "No Stampede" when there is not a stampede', () => {
        const stager = new SandDunesStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSandDunes: {minigame: {
            has_stampede: false,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('No Stampede');
    });

    it.each([undefined, null])('should throw if quest is %p', (quest) => {
        const stager = new SandDunesStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSandDunes: quest}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestSandDunes is undefined');
    });
});
