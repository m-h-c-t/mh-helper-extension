import {SuperBrieFactoryStager} from "@scripts/modules/stages/environments/superBrieFactory";
import type {User} from "@scripts/types/hg";
import type {IntakeMessage} from "@scripts/types/mhct";
import type {QuestSuperBrieFactory} from "@scripts/types/hg/quests";

describe("SuperBrieFactoryStager", () => {
    const defaultJournal = {};
    const defaultQuest: QuestSuperBrieFactory = {
        factory_atts: {
            current_room: "pumping_room",
            boss_warning: null,
        },
    };
    const defaultUser = {
        quests: {
            QuestSuperBrieFactory: defaultQuest,
        },
    } as User;

    it("is for the SUPER|brie+ Factory environment", () => {
        const stager = new SuperBrieFactoryStager();

        expect(stager.environment).toBe("SUPER|brie+ Factory");
    });

    it("throws when the quest is undefined", () => {
        const stager = new SuperBrieFactoryStager();
        const user = changeFactoryQuest(defaultUser, undefined!);

        expect(() => {
            stager.addStage({} as IntakeMessage, user, user, defaultJournal);
        }).toThrowError("User is in SB+ factory but quest wasn't found.");
    });

    describe("boss", () => {
        it("is Boss stage when there is boss_warning", () => {
            const stager = new SuperBrieFactoryStager();
            const message = {} as IntakeMessage;
            const preUser = {
                ...defaultUser,
                quests: {
                    QuestSuperBrieFactory: {
                        factory_atts: {boss_warning: true},
                    },
                },
            } as User;

            stager.addStage(message, preUser, defaultUser, defaultJournal);

            expect(message.stage).toBe("Boss");
        });
    });

    describe('rooms', () => {
        it.each([
            {room: "pumping_room",           expected: "Pump Room"},
            {room: "mixing_room",            expected: "Mixing Room"},
            {room: "break_room",             expected: "Break Room"},
            {room: "quality_assurance_room", expected: "QA Room"},
        ])('sets room with Coggy Colby', ({room, expected}) => {

            const stager = new SuperBrieFactoryStager();
            const message = {} as IntakeMessage;
            const preUser = {
                ...defaultUser,
                bait_name: 'Coggy Colby Cheese',
                quests: {
                    QuestSuperBrieFactory: {
                        factory_atts: {current_room: room},
                    },
                },
            } as User;

            stager.addStage(message, preUser, defaultUser, defaultJournal);
            expect(message.stage).toBe(expected);
        });

        it('is any room with non-coggy colby', () => {
            const stager = new SuperBrieFactoryStager();
            const message = {} as IntakeMessage;
            const preUser = {
                ...defaultUser,
                bait_name: 'Gouda Cheese',
                quests: {
                    QuestSuperBrieFactory: {
                        factory_atts: {current_room: 'pumping_room'},
                    },
                },
            } as User;

            stager.addStage(message, preUser, defaultUser, defaultJournal);
            expect(message.stage).toBe('Any Room');
        });
    });

    describe('other rooms', () => {
        it('defaults to Any Room for unsupported room type', () => {
            const stager = new SuperBrieFactoryStager();
            const message = {} as IntakeMessage;
            const user = {
                ...defaultUser,
                quests: {
                    QuestSuperBrieFactory: {
                        factory_atts: {current_room: 'secret_room'},
                    },
                },
            } as unknown as User;

            stager.addStage(message, user, defaultUser, defaultJournal);

            expect(message.stage).toBe('Any Room');
        });
    });

    function changeFactoryQuest(user: User, quest: QuestSuperBrieFactory): User {
        user.quests.QuestSuperBrieFactory = quest;
        return user;
    }
});
