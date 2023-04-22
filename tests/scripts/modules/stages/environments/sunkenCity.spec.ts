import {addSunkenCityStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Sunken City stages', () => {
    it('should set stage to "Docked" if user is not diving', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSunkenCity: {
            is_diving: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addSunkenCityStage(message, preUser, postUser, journal);

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
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestSunkenCity: {
            is_diving: true,
            distance: distance,
            zone_name: 'Test Zone',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addSunkenCityStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`Test Zone ${expected}`);
    });
});
