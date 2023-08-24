import {ForbiddenGroveStager} from "@scripts/modules/stages/environments/forbiddenGrove";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe("ForbiddenGroveStager", () => {
    const stager = new ForbiddenGroveStager();
    let defaultPre: User;
    let defaultPost: User;
    let defaultMessage: IntakeMessage = {} as IntakeMessage;
    let defaultJournal: unknown = {};

    beforeEach(() => {
        defaultPre = getDefaultUser();
        defaultPost = getDefaultUser();
        defaultMessage = {} as IntakeMessage;
        defaultJournal = {};
    });

    it("should be for the Forbidden Grove environment", () => {
        expect(stager.environment).toBe("Forbidden Grove");
    });

    describe("addStage", () => {
        // Possible scenarios (pre -> post)
        // 1. Open -> Open
        // 2. Open -> Close (server side door change) (throws)
        // 3. Open -> moved to Acolyte Realm (server side door change, but we caught RR)
        // 4. Closed -> Closed
        // 5. Closed -> moved to AR
        // 6. Open/Closed with RR charm -> moved to AR

        // common act to run addStage
        const act = (
            message: IntakeMessage = defaultMessage,
            userPre: User = defaultPre,
            userPost: User = defaultPost,
            journal: unknown = defaultJournal
        ) => {
            stager.addStage(message, userPre, userPost, journal);
        };

        // common assert on defaultMessage.stage
        const assert = (expected: string) => {
            expect(defaultMessage.stage).toBe(expected);
        };

        it("throws when quest is undefined", () => {
            delete defaultPre.quests.QuestForbiddenGrove;

            expect(() => act()).toThrowError(
                "User is missing Forbidden Grove quest"
            );
        });

        it("is Open when both pre and post are open", () => {
            act(undefined, getDefaultUser());
            assert("Open");
        });

        it("throws on server side door change", () => {
            defaultPost.quests.QuestForbiddenGrove!.grove.is_open = false;

            expect(() => act()).toThrowError(
                "Skipping hunt during server side door change"
            );
        });

        it("is Closed when pre open but post is now in Acolyte Realm", () => {
            delete defaultPost.quests.QuestForbiddenGrove;

            act();
            assert("Closed");
        });

        it("is Closed when pre and post both closed", () => {
            defaultPre.quests.QuestForbiddenGrove!.grove.is_open = false;
            defaultPost.quests.QuestForbiddenGrove!.grove.is_open = false;

            act();
            assert("Closed");
        });

        it("is Closed when pre closed and moved to AR in post", () => {
            defaultPre.quests.QuestForbiddenGrove!.grove.is_open = false;
            delete defaultPost.quests.QuestForbiddenGrove;

            act();
            assert("Closed");
        });

        it.each([[true], [false]])(
            "is RR charm when pre open or closed with RR charm ",
            (isOpen) => {
                defaultPre.quests.QuestForbiddenGrove!.grove.is_open = isOpen;
                defaultPre.trinket_name = "Realm Ripper Charm";
                delete defaultPost.quests.QuestForbiddenGrove;

                act();
                assert("Realm Ripper Charm");
            }
        );
    });
});

function getDefaultUser(): User {
    return {
        quests: {
            QuestForbiddenGrove: {
                grove: {
                    is_open: true,
                },
            },
        },
    } as User;
}
