import {WhiskerWoodsRiftDetailer} from "@scripts/modules/details/environments/whiskerWoodsRift";
import {JournalMarkup, QuestRiftWhiskerWoods, User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {UserBuilder} from "@tests/utility/builders";
import {mock} from "jest-mock-extended";

describe('calcWhiskerWoodsRiftHuntDetails', () => {
    const message = mock<IntakeMessage>();
    const user_post = mock<User>();
    const hunt = mock<JournalMarkup>();
    let user: User & { quests: { QuestRiftWhiskerWoods: QuestRiftWhiskerWoods } };
    let detailer: WhiskerWoodsRiftDetailer;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestRiftWhiskerWoods: {
                    zones: {
                        clearing: {level: 0},
                        tree: {level: 0},
                        lagoon: {level: 0},
                    },
                },
            })
            .build() as User & { quests: { QuestRiftWhiskerWoods: QuestRiftWhiskerWoods } };

        detailer = new WhiskerWoodsRiftDetailer();
    });

    it('should return undefined when not using Lactrodectus cheese', () => {
        message.cheese.id = 1234; // Not Lactrodectus (1646)

        const result = detailer.addDetails(message, user, user_post, hunt);

        expect(result).toBeUndefined();
    });

    describe('when using Lactrodectus cheese (ID 1646)', () => {
        beforeEach(() => {
            message.cheese.id = 1646;
        });

        it('should return undefined when total rage < 75', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 20},
                tree: {level: 25},
                lagoon: {level: 25},
            };
            // Total: 70 < 75

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toBeUndefined();
        });

        it('should return undefined when total rage >= 150', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 50},
                tree: {level: 50},
                lagoon: {level: 50},
            };
            // Total: 150 >= 150

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toBeUndefined();
        });

        it('should return undefined when any zone <= 24', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 24}, // <= 24
                tree: {level: 30},
                lagoon: {level: 30},
            };
            // Total: 84, but clearing <= 24

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toBeUndefined();
        });

        it('should return rage data when conditions are met', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 30},
                tree: {level: 25},
                lagoon: {level: 35},
            };
            // Total: 90 (75 <= 90 < 150, all > 24)

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual({
                clearing: 30,
                tree: 25,
                lagoon: 35,
                total_rage: 90,
            });
        });

        it('should handle minimum valid values', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 25},
                tree: {level: 25},
                lagoon: {level: 25},
            };
            // Total: 75 (exactly at minimum, all > 24)

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual({
                clearing: 25,
                tree: 25,
                lagoon: 25,
                total_rage: 75,
            });
        });

        it('should handle maximum valid values', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 49},
                tree: {level: 50},
                lagoon: {level: 50},
            };
            // Total: 149 (< 150, all > 24)

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual({
                clearing: 49,
                tree: 50,
                lagoon: 50,
                total_rage: 149,
            });
        });

        it('should fail when tree level is exactly 24', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 30},
                tree: {level: 24}, // exactly 24
                lagoon: {level: 50},
            };
            // Total: 104, but tree == 24

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toBeUndefined();
        });

        it('should fail when lagoon level is exactly 24', () => {
            user.quests.QuestRiftWhiskerWoods.zones = {
                clearing: {level: 30},
                tree: {level: 50},
                lagoon: {level: 24}, // exactly 24
            };
            // Total: 104, but lagoon == 24

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toBeUndefined();
        });
    });
});
