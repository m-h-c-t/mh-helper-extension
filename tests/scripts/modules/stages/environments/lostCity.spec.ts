import {CursedCityStager} from "@scripts/modules/stages/environments/cursedCity";
import {LostCityStager} from "@scripts/modules/stages/environments/lostCity";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Lost City stages', () => {
    it('should be for the "Lost City" environment', () => {
        const stager = new LostCityStager();
        expect(stager.environment).toBe('Lost City');
    });

    it('should set stage to "Cursed" when user is cursed', () => {
        const stager = new LostCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: {minigame: {
            is_cursed: true,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Cursed');
    });

    it('should set stage to "Cursed" when user is not cursed', () => {
        const stager = new LostCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: {minigame: {
            is_cursed: false,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Cursed');
    });

    it.each([undefined, null])('should throw when QuestLostCity is %p', (state) => {
        const stager = new LostCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: state}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestLostCity is undefined');
    });
});

describe('Cursed City stages', () => {
    it('should be for the "Cursed City" environment', () => {
        const stager = new CursedCityStager();
        expect(stager.environment).toBe('Cursed City');
    });

    it('should set stage to "Cursed" when user is cursed', () => {
        const stager = new CursedCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: {minigame: {
            is_cursed: true,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Cursed');
    });

    it('should set stage to "Cursed" when user is not cursed', () => {
        const stager = new CursedCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: {minigame: {
            is_cursed: false,
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Cursed');
    });

    it.each([undefined, null])('should throw when QuestLostCity is %p', (state) => {
        const stager = new CursedCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLostCity: state}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestLostCity is undefined');
    });
});
