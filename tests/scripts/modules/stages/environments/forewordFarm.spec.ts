import {ForewordFarmStager} from "@scripts/modules/stages/environments/forewardFarm";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Foreword Farm stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new ForewordFarmStager();
        message = {} as IntakeMessage;
        preUser = {} as User;
        postUser = {} as User;
    });

    it('should be for the Foreword Farm environment', () => {
        expect(stager.environment).toBe('Foreword Farm');
    });

    it('should throw when QuestForewordFarm is undefined', () => {
        preUser.quests = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestForewordFarm is undefined');
    });

    it('should throw when mice state is unknown', () => {
        preUser.quests = {QuestForewordFarm: {
            // @ts-expect-error - testing invalid input
            mice_state: 'plants?_what_plants',
        }};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to unknown mice state');
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

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });
});
