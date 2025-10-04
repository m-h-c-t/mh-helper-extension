import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { WhiskerWoodsRiftStager } from '@scripts/modules/stages/environments/whiskerWoodsRift';

describe('Whisker Woods Rift stages', () => {
    const interestingRagePoints = [0, 24, 25, 49, 50];

    it('should be for the "Whisker Woods Rift" environment', () => {
        const stager = new WhiskerWoodsRiftStager();
        expect(stager.environment).toBe('Whisker Woods Rift');
    });

    it.each(interestingRagePoints)('should set rage to appropriate level', (rage) => {
        const stager = new WhiskerWoodsRiftStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestRiftWhiskerWoods: {zones: {
            clearing: {level: rage},
            tree: {level: rage},
            lagoon: {level: rage},
        }}}} as User;
        const postUser = {} as User;
        const journal = {};
        stager.addStage(message, preUser, postUser, journal);

        const range = getRageRange(rage);
        const expected = {
            clearing: `CC ${range}`,
            tree: `GGT ${range}`,
            lagoon: `DL ${range}`,
        };
        expect(message.stage).toStrictEqual(expected);
    });

    it.each([-1, 51])('should throw for invalid rage levels', (rage) => {
        const stager = new WhiskerWoodsRiftStager();
        const message = {location: {name: 'Whisker Woods Rift'}} as IntakeMessage;
        const preUser = {quests: {QuestRiftWhiskerWoods: {zones: {
            clearing: {level: rage},
            tree: {level: rage},
            lagoon: {level: rage},
        }}}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Unexpected WWR quest state');
    });

    it.each([undefined, null])('should throw when QuestRiftWhiskerWoods is %p', (state) => {
        const stager = new WhiskerWoodsRiftStager();
        const message = {location: {name: 'Whisker Woods Rift'}} as IntakeMessage;
        const preUser = {quests: {QuestRiftWhiskerWoods: state}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestRiftWhiskerWoods is undefined');
    });
});

function getRageRange(rage: number): '0-24' | '25-49' | '50' {
    if (rage <= 24) {
        return '0-24';
    }

    if (rage <= 49) {
        return '25-49';
    }

    return '50';
}
