import {QuesoGeyserStager} from "@scripts/modules/stages/environments/quesoGeyser";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Queso Geyser stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new QuesoGeyserStager();
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestQuesoGeyser: getDefaultQuest(),
        }} as User;
        postUser = {} as User;
    });

    it('should be for the Queso Geyser environment', () => {
        expect(stager.environment).toBe('Queso Geyser');
    });

    it('should throw when QuestQuesoGeyser is undefined', () => {
        preUser.quests.QuestQuesoGeyser = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestQuesoGeyser is undefined');
    });

    it.each`
        state           | expected
        ${'collecting'} | ${'Cork Collecting'}
        ${'claim'}      | ${'Cork Collecting'}
        ${'corked'}     | ${'Pressure Building'}
    `('should set stage to $expected when in $state state', ({state, expected}) => {
        preUser.quests.QuestQuesoGeyser!.state = state;

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it.each(
        ['Tiny', 'Small', 'Medium', 'Large', 'Epic']
    )('should set stage to state name %p when in a %p Eruption ', (name) => {
        preUser.quests.QuestQuesoGeyser!.state = 'eruption';
        preUser.quests.QuestQuesoGeyser!.state_name = `${name} Eruption`;

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`${name} Eruption`);
    });

    it('should throw when state is unknown', () => {
        // @ts-expect-error - testing invalid input
        preUser.quests.QuestQuesoGeyser!.state = 'guaranteed_rib_mode';

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to unknown Queso Geyser state');
    });

    function getDefaultQuest() {
        return {
            state: '',
            state_name: '',
        };
    }
});
