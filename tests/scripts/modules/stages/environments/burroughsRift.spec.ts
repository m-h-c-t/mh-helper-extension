import {addBurroughsRiftStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Burroughs Rift stages', () => {
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        message = {} as IntakeMessage;
        preUser = {} as User;
        postUser = {} as User;
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

        addBurroughsRiftStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should set location to null when mist level is unknown', () => {
        message.location = {id: 0, name: ''};
        preUser.quests = {QuestRiftBurroughs: {
            mist_tier: 'tier_42',
        }};

        expect(message.location).not.toBeNull();

        addBurroughsRiftStage(message, preUser, postUser, journal);

        expect(message.location).toBeNull();
    });
});
