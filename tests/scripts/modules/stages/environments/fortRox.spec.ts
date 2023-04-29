import {addFortRoxStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Fort Rox stages', () => {
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestFortRox: getDefaultFortRoxQuest(),
        }} as User;
        postUser = {quests: {
            QuestFortRox: getDefaultFortRoxQuest(),
        }} as User;
    });

    it.each`
        nightStage          | expected
        ${'stage_one'}      | ${'Twilight'}
        ${'stage_two'}      | ${'Midnight'}
        ${'stage_three'}    | ${'Pitch'}
        ${'stage_four'}     | ${'Utter Darkness'}
        ${'stage_five'}     | ${'First Light'}
    `('should set stage to $expected during night when in $nightStage', ({nightStage, expected}) => {
        preUser.quests.QuestFortRox.is_night = true;
        preUser.quests.QuestFortRox.current_stage = nightStage;

        addFortRoxStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should set location to null when night stage is unknown', () => {
        message.location = {id: 0, name: ''};
        preUser.quests.QuestFortRox.is_night = true;
        preUser.quests.QuestFortRox.current_stage = 'stage_foo';

        expect (message.location).not.toBeNull();

        addFortRoxStage(message, preUser, postUser, journal);

        expect(message.location).toBeNull();
    });

    it('should set stage to Day when is day', () => {
        preUser.quests.QuestFortRox.is_day = true;

        addFortRoxStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Day');
    });

    it('should set stage to Dawn when in dawn', () => {
        preUser.quests.QuestFortRox.is_dawn = true;

        addFortRoxStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Dawn');
    });

    it('should set stage to Heart of the Meteor when in lair', () => {
        preUser.quests.QuestFortRox.is_lair = true;

        addFortRoxStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Heart of the Meteor');
    });

    it('should set location to null when there is an unhandled state', () => {
        message.location = {id: 0, name: ''};

        expect (message.location).not.toBeNull();

        addFortRoxStage(message, preUser, postUser, journal);

        expect(message.location).toBeNull();
    });

    function getDefaultFortRoxQuest() {
        // is_xxx: null, when not active
        return {
            is_day: null,
            is_lair: null,
            is_night: null,
            is_dawn: null,
            current_stage: null,
        };
    }
});
