import {IntakeMessage} from "@scripts/types/mhct";
import {User} from "@scripts/types/hg";
import {UserBuilder} from "@tests/utility/builders";
import {EpilogueFallsStager} from "@scripts/modules/stages/environments/epilogueFalls";
import {mock} from 'jest-mock-extended';
import {RapidZoneType} from "@scripts/types/hg/quests/epilogueFalls";

describe("EpilogueFallsStager", () => {
    let stager: EpilogueFallsStager;
    let message: IntakeMessage;
    let userPost: User;
    let journal: unknown;
    let user: User;

    beforeEach(() => {
        stager = new EpilogueFallsStager();
        message = mock<IntakeMessage>();
        userPost = mock<User>();
        journal = mock();
        user = new UserBuilder()
            .withQuests({
                QuestEpilogueFalls: {
                    on_rapids: false,
                    rapids: {
                        zone_data: {
                            type: "low_morsel_zone",
                            name: "Sparse Morsel Zone"
                        }
                    }
                }
            })
            .build();
    });

    it("sets stage to Shore if not on rapids", () => {
        user.quests.QuestEpilogueFalls!.on_rapids = null;

        stager.addStage(message, user, userPost, journal);

        expect(message.stage).toBe("Shore");
    });

    it.each<RapidZoneType>([
        "low_morsel_zone",
        "medium_halophyte_zone",
        "rich_shell_zone",
    ])("sets stage to Rapids for default rapids zone", (zoneType) => {
        user.quests.QuestEpilogueFalls!.on_rapids = true;
        user.quests.QuestEpilogueFalls!.rapids.zone_data.type = zoneType;

        stager.addStage(message, user, userPost, journal);

        expect(message.stage).toBe("Rapids");
    });

    it("sets stage to Waterfall for waterfall zone", () => {
        user.quests.QuestEpilogueFalls!.on_rapids = true;
        user.quests.QuestEpilogueFalls!.rapids.zone_data.type = "waterfall_zone";
        user.quests.QuestEpilogueFalls!.rapids.zone_data.name = "Within the Waterfall";

        stager.addStage(message, user, userPost, journal);

        expect(message.stage).toBe("Waterfall");
    });

    it("sets stage to Grotto for grotto zone", () => {
        user.quests.QuestEpilogueFalls!.on_rapids = true;
        user.quests.QuestEpilogueFalls!.rapids.zone_data.type = "grotto_zone";
        user.quests.QuestEpilogueFalls!.rapids.zone_data.name = "The Hidden Grotto";

        stager.addStage(message, user, userPost, journal);

        expect(message.stage).toBe("Grotto");
    });

    it("sets stage to undefined if QuestEpilogueFalls is null", () => {
        // @ts-expect-error Testing null case
        user.quests.QuestEpilogueFalls = null;

        expect(() => stager.addStage(message, user, userPost, journal)).toThrow();
    });
});
