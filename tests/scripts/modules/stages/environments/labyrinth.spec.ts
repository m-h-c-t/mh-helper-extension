import {addLabyrinthStage} from "@scripts/modules/stages/legacy";
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

    it('show set location to null for non hallway', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestLabyrinth:{
            status: 'intersection',
        }}} as User;
        const postUser = {} as User;
        const journal = {};
        addLabyrinthStage(message, preUser, postUser, journal);

        expect(message.location).toBe(null);
    });

    describe.each(hallwayCombinations)('should set hallway stage for each combination', (hallwayType) => {
        it.each(HallwayLengths)('hallway length: %p', (length) => {

            const message = {} as IntakeMessage;
            const preUser = {quests: {QuestLabyrinth:{
                hallway_name: `${length} ${hallwayType} Hallway`,
                status: 'hallway',
            }}} as User;
            const postUser = {} as User;
            const journal = {};
            addLabyrinthStage(message, preUser, postUser, journal);

            expect(message.stage).toBe(hallwayType);
        });
    });
});
