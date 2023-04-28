import {addFuromaRiftStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Furoma Rift stages', () => {
    it('should set stage to Outside when view state has trainingGrounds', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestRiftFuroma: {
            view_state: 'trainingGrounds knows_all',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addFuromaRiftStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Outside');
    });

    it.each`
        charge                  | expected
        ${'charge_level_one'}   | ${'Battery 1'}
        ${'charge_level_two'}   | ${'Battery 2'}
        ${'charge_level_three'} | ${'Battery 3'}
        ${'charge_level_four'}  | ${'Battery 4'}
        ${'charge_level_five'}  | ${'Battery 5'}
        ${'charge_level_six'}   | ${'Battery 6'}
        ${'charge_level_seven'} | ${'Battery 7'}
        ${'charge_level_eight'} | ${'Battery 8'}
        ${'charge_level_nine'}  | ${'Battery 9'}
        ${'charge_level_ten'}   | ${'Battery 10'}
    `('should set stage to $expected when droid charge level is $charge', ({charge, expected}) => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestRiftFuroma: {
            view_state: 'pagoda',
            droid: {
                charge_level: charge,
            },
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addFuromaRiftStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should set location to null when droid charge level is unknown', () => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestRiftFuroma: {
            view_state: 'pagoda',
            droid: {
                charge_level: 'over 9000',
            },
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(message.location).not.toBeNull();

        addFuromaRiftStage(message, preUser, postUser, journal);

        expect(message.location).toBeNull();
    });
});
