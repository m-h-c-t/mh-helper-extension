import {addGardenStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Living/Twisted Garden stages', () => {
    describe('Living', () => {
        it('should set stage to "Pouring" if bucket dumped', () => {
            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: true,
                minigame: {
                    bucket_state: 'dumped',
                },
            }}} as User;
            const postUser = {} as User;
            const journal = {};

            addGardenStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Pouring');
        });

        it('should set stage to "Not Pouring" if bucket not dumped', () => {
            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: true,
                minigame: {
                    bucket_state: 'filling',
                },
            }}} as User;            const postUser = {} as User;
            const journal = {};

            addGardenStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Not Pouring');
        });
    });

    describe('Twisted', () => {
        it('should set stage to "Pouring" if bucket dumped', () => {
            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: false,
                minigame: {
                    vials_state: 'dumped',
                },
            }}} as User;
            const postUser = {} as User;
            const journal = {};

            addGardenStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Pouring');
        });

        it('should set stage to "Not Pouring" if bucket not dumped', () => {
            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: false,
                minigame: {
                    vials_state: 'filling',
                },
            }}} as User;            const postUser = {} as User;
            const journal = {};

            addGardenStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Not Pouring');
        });
    });
});
