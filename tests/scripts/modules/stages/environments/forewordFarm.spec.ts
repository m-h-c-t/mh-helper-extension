import {addForewordFarmStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Foreword Farm stages', () => {
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
        state   | expected
        ${'no_plants'}      | ${'No Plants'}
        ${'one_plant'}      | ${'One Plant'}
        ${'two_plants'}     | ${'Two Plants'}
        ${'three_plants'}   | ${'Three Plants'}
        ${'three_papyrus'}  | ${'Three Papyrus'}
        ${'boss'}           | ${'Boss'}
    `('should set state to $expected when mice state is $state', ({state, expected}) => {
        preUser.quests = {QuestForewordFarm: {
            mice_state: state,
        }};

        addForewordFarmStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });
});
