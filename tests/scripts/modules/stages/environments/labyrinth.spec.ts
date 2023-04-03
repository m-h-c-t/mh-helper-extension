import {LabyrinthStager} from "@scripts/modules/stages/environments/labyrinth";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Labyrinth stages', () => {
    const HallwayLengths = ['Short', 'Medium', 'Long'];
    const HallwayTypes = ['Fealty', 'Tech', 'Scholar'];
    const HallwayQualities = ['Plain', 'Superior', 'Epic'];

    const hallwayCombinations = [
        HallwayTypes,
        HallwayQualities,
    ].reduce((a, b) => a.flatMap(x => b.map(y => `${x} ${y}`)), ['']);

    it('should be for the "Labyrinth" environment', () => {
        const stager = new LabyrinthStager();
        expect(stager.environment).toBe('Labyrinth');
    });

    it('should throw for non hallway', () => {
        const stager = new LabyrinthStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLabyrinth:{
            status: 'intersection',
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Not recording labyrinth intersections');
    });

    describe.each(hallwayCombinations)('should set hallway stage for each combination', (hallwayType) => {
        it.each(HallwayLengths)('hallway length: %p', (length) => {
            const stager = new LabyrinthStager();
            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLabyrinth:{
                hallway_name: `${length} ${hallwayType} Hallway`,
                status: 'hallway',
            }}} as User;
            const postUser = {} as User;
            const journal = {};
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe(hallwayType);
        });
    });

    it.each([undefined, null])('should throw when QuestLabyrinth is %p', (quest) => {
        const stager = new LabyrinthStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLabyrinth: quest}} as User;
        const postUser = {} as User;
        const journal = {};
        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestLabyrinth is undefined');
    });
});
