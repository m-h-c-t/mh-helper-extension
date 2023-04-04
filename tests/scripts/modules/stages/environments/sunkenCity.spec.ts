import {SunkenCityStager} from "@scripts/modules/stages/environments/sunkenCity";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Sunken City stages', () => {
    it('should be for the "Sunken City" environment', () => {
        const stager = new SunkenCityStager();
        expect(stager.environment).toBe('Sunken City');
    });

    it('should set stage to "Docked" if user is not diving', () => {
        const stager = new SunkenCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSunkenCity: {
            is_diving: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Docked');
    });

    it.each`
        distance  | expected
        ${0}      | ${'0-2km'}
        ${1990}   | ${'0-2km'}
        ${2000}   | ${'2-10km'}
        ${9990}   | ${'2-10km'}
        ${10000}  | ${'10-15km'}
        ${14990}  | ${'10-15km'}
        ${15000}  | ${'15-25km'}
        ${24990}  | ${'15-25km'}
        ${25000}  | ${'25km+'}
        ${100000} | ${'25km+'}
    `('should append "$expected" to zone name when depth is $distance', ({distance, expected}) => {
        const stager = new SunkenCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSunkenCity: {
            is_diving: true,
            distance: distance,
            zone_name: 'Test Zone',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`Test Zone ${expected}`);
    });

    it.each([undefined, null])('should throw when QuestSunken city is %p', (state) => {
        const stager = new SunkenCityStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSunkenCity: state}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestSunkenCity is undefined');
    });
});
