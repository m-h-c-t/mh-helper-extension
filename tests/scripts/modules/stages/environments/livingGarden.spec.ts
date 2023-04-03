import {LivingGardenStager} from "@scripts/modules/stages/environments/livingGarden";
import {TwistedGardenStager} from "@scripts/modules/stages/environments/twistedGarden";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Living/Twisted Garden stages', () => {
    describe('Living', () => {
        it('should be for the "Living Garden" environment', () => {
            const stager = new LivingGardenStager();
            expect(stager.environment).toBe('Living Garden');
        });

        it('should set stage to "Pouring" if bucket dumped', () => {
            const stager = new LivingGardenStager();

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: true,
                minigame: {
                    bucket_state: 'dumped',
                },
            }}} as User;
            const postUser = {} as User;
            const journal = {};

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Pouring');
        });

        it('should set stage to "Not Pouring" if bucket not dumped', () => {
            const stager = new LivingGardenStager();

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: true,
                minigame: {
                    bucket_state: 'filling',
                },
            }}} as User;
            const postUser = {} as User;
            const journal = {};

            stager.addStage(message, preUser, postUser, journal);
        });

        it.each([undefined, null])('should throw if quest is %p', (quest) => {
            const stager = new LivingGardenStager();

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: quest}} as User;
            const postUser = {} as User;
            const journal = {};

            expect(() => stager.addStage(message, preUser, postUser, journal))
                .toThrow('QuestLivingGarden is undefined');
        });
    });

    describe('Twisted', () => {
        it('should be for the "Twisted Garden" environment', () => {
            const stager = new TwistedGardenStager();
            expect(stager.environment).toBe('Twisted Garden');
        });

        it('should set stage to "Pouring" if bucket dumped', () => {
            const stager = new TwistedGardenStager();

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: false,
                minigame: {
                    vials_state: 'dumped',
                },
            }}} as User;
            const postUser = {} as User;
            const journal = {};

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Pouring');
        });

        it('should set stage to "Not Pouring" if bucket not dumped', () => {
            const stager = new TwistedGardenStager();

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: {
                is_normal: false,
                minigame: {
                    vials_state: 'filling',
                },
            }}} as User;
            const postUser = {} as User;
            const journal = {};

            stager.addStage(message, preUser, postUser, journal);
        });

        it.each([undefined, null])('should throw if quest is %p', (quest) => {
            const stager = new TwistedGardenStager();

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLivingGarden: quest}} as User;
            const postUser = {} as User;
            const journal = {};

            expect(() => stager.addStage(message, preUser, postUser, journal))
                .toThrow('QuestLivingGarden is undefined');
        });
    });
});
