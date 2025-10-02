import {ValourRiftStager} from "@scripts/modules/stages/environments/valourRift";
import {JournalMarkup, User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {QuestRiftValour} from "@scripts/types/hg/quests";
import {mock} from "vitest-mock-extended";
import {UserBuilder} from "@tests/utility/builders";

describe('Valour Rift stages', () => {
    const message = mock<IntakeMessage>();
    const postUser = mock<User>();
    const journal = mock<JournalMarkup>();

    let stager: ValourRiftStager;
    let preUser: User & { quests: { QuestRiftValour: QuestRiftValour } };

    beforeEach(() => {
        stager = new ValourRiftStager();
        preUser = new UserBuilder()
            .withQuests({
                QuestRiftValour: getDefaultQuest()
            })
            .build() as User & { quests: { QuestRiftValour: QuestRiftValour } };
    });

    it('should be for the Valour Rift environment', () => {
        expect(stager.environment).toBe('Valour Rift');
    });

    it('should throw when QuestRiftValour is undefined', () => {
        // @ts-expect-error - testing nullish input
        preUser.quests.QuestRiftValour = undefined;

        expect(() =>
            stager.addStage(message, preUser, postUser, journal)
        ).toThrow('QuestRiftValour is undefined');
    });

    it('should set stage to Outside when farming', () => {
        preUser.quests.QuestRiftValour.state = 'farming';

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Outside');
    });

    describe('Tower State', () => {
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
                    preUser.quests.QuestRiftValour = {
                        state: 'tower',
                        floor: floor,
                        is_eclipse_mode: null,
                    };
                    stager.addStage(message, preUser, postUser, journal);

                    expect(message.stage).toBe(expected);
                }
            }
        );

        it('should set stage to Eclipse for every 8th floor', () => {
            for (let floor = 8; floor < 150; floor += 8) {
                preUser.quests.QuestRiftValour = {
                    state: 'tower',
                    floor: floor,
                    is_eclipse_mode: null,
                };

                stager.addStage(message, preUser, postUser, journal);

                expect(message.stage).toBe('Eclipse');
            }
        });

        it('should prepend UU to stage when in ultimate umbra run', () => {
            preUser.quests.QuestRiftValour = {
                state: 'tower',
                floor: 100,
                is_eclipse_mode: true,
            };

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('UU Floors 25-31+');
        });
    });

    it('should throw when state is unknown', () => {
        preUser.quests.QuestRiftValour.state = 'foo' as 'tower' | 'farming';

        expect(() =>
            stager.addStage(message, preUser, postUser, journal)
        ).toThrow('Skipping hunt due to unknown Valour Rift state');
    });

    function getDefaultQuest(): QuestRiftValour {
        return {
            state: 'farming',
        };
    }
});
