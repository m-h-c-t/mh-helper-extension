import {addWhiskerWoodsRiftStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Whisker Woods Rift stages', () => {
    const interestingRagePoints = [0, 24, 25, 49, 50];

    it.each(interestingRagePoints)('should set rage to appropriate level', (rage) => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestRiftWhiskerWoods:{zones: {
            clearing: {level: rage},
            tree: {level: rage},
            lagoon: {level: rage},
        }}}} as User;
        const postUser = {} as User;
        const journal = {};
        addWhiskerWoodsRiftStage(message, preUser, postUser, journal);

        const range = getRageRange(rage);
        const expected = {
            clearing: `CC ${range}`,
            tree: `GGT ${range}`,
            lagoon: `DL ${range}`,
        };
        expect(message.stage).toStrictEqual(expected);
    });

    it.each([-1, 51])('should set location to "null" for invalid rage levels', (rage) => {
        const message = {location: {name: 'Whisker Woods Rift'}} as IntakeMessage;
        const preUser = {quests: {QuestRiftWhiskerWoods:{zones: {
            clearing: {level: rage},
            tree: {level: rage},
            lagoon: {level: rage},
        }}}} as User;
        const postUser = {} as User;
        const journal = {};
        addWhiskerWoodsRiftStage(message, preUser, postUser, journal);

        expect(message.location).toBe(null);
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
