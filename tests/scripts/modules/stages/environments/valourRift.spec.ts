import {ValourRiftStager} from "@scripts/modules/stages/environments/valourRift";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {QuestRiftValour} from "@scripts/types/hg/quests";

describe('Valour Rift stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new ValourRiftStager();
        message = {} as IntakeMessage;
        preUser = {
            quests: {QuestRiftValour: getDefaultQuest()},
            enviroment_atts: getDefaultAttributes(),
        } as User;
        postUser = {} as User;
    });

    it('should be for the Valour Rift environment', () => {
        expect(stager.environment).toBe('Valour Rift');
    });

    it('should throw when QuestRiftValour is undefined', () => {
        preUser.quests.QuestRiftValour = undefined;

        expect(() =>
            stager.addStage(message, preUser, postUser, journal)
        ).toThrow('QuestRiftValour is undefined');
    });

    it('should set stage to Outside when farming', () => {
        preUser.quests.QuestRiftValour!.state = 'farming';

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Outside');
    });

    describe('Tower State', () => {
        beforeEach(() => {
            preUser.enviroment_atts = {
                phase: 'tower',
                active_augmentations: {
                    tu: false,
                },
            },
            preUser.quests.QuestRiftValour!.state = 'tower';
        });

        it.each`
            floorMin | floorMax | expected
            ${1}     | ${7}     | ${'Floors 1-7'}
            ${9}     | ${15}    | ${'Floors 9-15'}
            ${17}    | ${23}    | ${'Floors 17-23'}
            ${25}    | ${31}    | ${'Floors 25-31+'}
        `(
            'should set stage to $expected for floors $floorMin to $floorMax',
            ({floorMin, floorMax, expected}) => {
                for (let floor = floorMin; floor <= floorMax; floor++) {
                    preUser.quests.QuestRiftValour!.floor = floor;
                    message.stage = null;

                    stager.addStage(message, preUser, postUser, journal);

                    expect(message.stage).toBe(expected);
                }
            }
        );

        it('should set stage to Eclipse for every 8th floor', () => {
            for (let floor = 8; floor < 150; floor += 8) {
                preUser.quests.QuestRiftValour!.floor = floor;
                message.stage = null;

                stager.addStage(message, preUser, postUser, journal);

                expect(message.stage).toBe('Eclipse');
            }
        });

        it('should prepend UU to stage when in ultimate umbra run', () => {
            preUser.enviroment_atts = {
                phase: 'tower',
                active_augmentations: {tu: true},
            };
            preUser.quests.QuestRiftValour!.floor = 100;

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('UU Floors 25-31+');
        });
    });

    it('should throw when state is unknown', () => {
        message.location = {id: 0, name: ''};
        // @ts-expect-error - testing invalid input
        preUser.enviroment_atts!.phase = 'foo' as 'tower' | 'farming';

        expect(() =>
            stager.addStage(message, preUser, postUser, journal)
        ).toThrow('Skipping hunt due to unknown Valour Rift state');
    });

    it('should throw if known valour rift environment attributes are missing', () => {
        preUser = {
            quests: {QuestRiftValour: getDefaultQuest()},
        } as User;

        expect(() =>
            stager.addStage(message, preUser, postUser, journal)
        ).toThrow('Valour Rift environment attributes not found');
    });

    function getDefaultAttributes(): unknown {
        return {
            phase: '',
        };
    }

    function getDefaultQuest(): QuestRiftValour {
        return {
            state: '',
            floor: 0,
        };
    }
});
