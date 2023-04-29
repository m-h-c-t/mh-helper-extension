import {addBristleWoodsRiftStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Bristle Woods Rift stages', () => {
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    const ChamberNames = [
        "Acolyte",
        "Ancient Lab",
        "Frozen Alcove",
        "Furnace Room",
        "Gearworks",
        "Guard Barracks",
        "Hidden Treasury",
        "Ingress",
        "Lucky Tower",
        "Pursuer Mousoleum",
        "Runic Laboratory",
        "Rift Acolyte Tower", // Entrance
        "Security",
        "Timewarp",
    ];

    beforeEach(() => {
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestRiftBristleWoods: getDefaultQuest(),
        }} as User;
        postUser = {quests: {
            QuestRiftBristleWoods: getDefaultQuest(),
        }} as User;
    });

    it.each(ChamberNames)('should set stage name to chamber name', (chamberName) => {
        preUser.quests.QuestRiftBristleWoods.chamber_name = chamberName;

        addBristleWoodsRiftStage(message, preUser, postUser, journal);

        const expected = chamberName === "Rift Acolyte Tower" ? "Entrance" : chamberName;
        expect(message.stage).toBe(expected);
    });

    function getDefaultQuest() {
        return {
            chamber_name: null,
        };
    }
});
