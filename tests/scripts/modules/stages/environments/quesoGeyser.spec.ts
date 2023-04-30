import {addQuesoGeyserStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Queso Geyser stages', () => {
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestQuesoGeyser: getDefaultQuest(),
        }} as User;
        postUser = {} as User;
    });

    it.each`
        state           | expected
        ${'collecting'} | ${'Cork Collecting'}
        ${'claim'}      | ${'Cork Collecting'}
        ${'corked'}     | ${'Pressure Building'}
    `('should set stage to $expected when in $state state', ({state, expected}) => {
        preUser.quests.QuestQuesoGeyser.state = state;

        addQuesoGeyserStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it.each(
        ['Tiny', 'Small', 'Medium', 'Large', 'Epic']
    )('should set stage to state name %p when in a %p Eruption ', (name) => {
        preUser.quests.QuestQuesoGeyser.state = 'eruption';
        preUser.quests.QuestQuesoGeyser.state_name = `${name} Eruption`;

        addQuesoGeyserStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`${name} Eruption`);
    });

    function getDefaultQuest() {
        return {
            state: '',
            state_name: '',
        };
    }
});
