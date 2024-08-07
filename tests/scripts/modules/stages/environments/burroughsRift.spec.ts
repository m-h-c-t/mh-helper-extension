import {BurroughsRiftStager} from "@scripts/modules/stages/environments/burroughsRift";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Burroughs Rift stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new BurroughsRiftStager();
        message = {} as IntakeMessage;
        preUser = {} as User;
        postUser = {} as User;
    });

    it('should be for the Burroughs Rift environment', () => {
        expect(stager.environment).toBe('Burroughs Rift');
    });

    it('should throw when QuestRiftBurroughs is undefined', () => {
        preUser.quests = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestRiftBurroughs is undefined');
    });

    it.each`
        level       | expected
        ${'tier_0'} | ${'Mist 0'}
        ${'tier_1'} | ${'Mist 1-5'}
        ${'tier_2'} | ${'Mist 6-18'}
        ${'tier_3'} | ${'Mist 19-20'}
    `('should set stage to $expected when mist is at $level', ({level, expected}) => {

        preUser.quests = {QuestRiftBurroughs: {
            mist_tier: level,
        }};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should throw when mist level is unknown', () => {
        message.location = {id: 0, name: ''};
        preUser.quests = {QuestRiftBurroughs: {
            // @ts-expect-error - testing invalid input
            mist_tier: 'tier_42',
        }};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping unknown Burroughs Rift mist state');
    });
});
