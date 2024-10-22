import {FuromaRiftStager} from "@scripts/modules/stages/environments/furomaRift";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Furoma Rift stages', () => {
    let stager: IStager;

    beforeEach(() => {
        stager = new FuromaRiftStager();
    });

    it('should be for the Furoma Rift environment', () => {
        expect(stager.environment).toBe('Furoma Rift');
    });

    it('should set stage to Outside when view state has trainingGrounds', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestRiftFuroma: {
            view_state: 'trainingGrounds knows_all',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

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

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should should throw when droid charge level is unknown', () => {
        const message = {location: {}} as IntakeMessage;
        // @ts-expect-error - testing invalid input
        const preUser = {quests: {QuestRiftFuroma: {
            view_state: 'pagoda',
            droid: {
                charge_level: 'over 9000',
            },
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping unknown Furoma Rift droid state');
    });

    it.each([undefined, null])('should throw when QuestRiftFuroma is %p', (quest) => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestRiftFuroma: quest}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestRiftFuroma is undefined');
    });
});
