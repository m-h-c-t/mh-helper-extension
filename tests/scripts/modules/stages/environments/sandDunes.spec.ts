import {SandDunesStager} from "@scripts/modules/stages/environments/sandDunes";
import {JournalMarkup, QuestSandDunes, User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {UserBuilder} from "@tests/utility/builders";
import {mock} from "vitest-mock-extended";

describe('Sand Dunes stages', () => {
    const message = mock<IntakeMessage>();
    const postUser = mock<User>();
    const journal = mock<JournalMarkup>();

    const preUser = new UserBuilder()
        .withEnvironment({
            environment_id: 0,
            environment_name: 'Sand Dunes',
        })
        .withQuests({
            QuestSandDunes: {
                minigame: {
                    has_stampede: false,
                },
                is_normal: true,
            }
        })
        .build() as User & { quests: { QuestSandDunes: QuestSandDunes & { is_normal: true } } };

    const stager = new SandDunesStager();

    it('should be for the "Sand Dunes" environment', () => {
        expect(stager.environment).toBe('Sand Dunes');
    });

    it('should set stage to "Stampede" when there is a stampede', () => {
        preUser.quests.QuestSandDunes.minigame.has_stampede = true;
        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Stampede');
    });

    it('should set stage to "No Stampede" when there is not a stampede', () => {
        preUser.quests.QuestSandDunes.minigame.has_stampede = false;

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('No Stampede');
    });

    it.each([undefined, null])('should throw if quest is %p', (quest) => {
        // @ts-expect-error - testing invalid input
        preUser.quests.QuestSandDunes = quest;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestSandDunes is undefined');
    });
});
