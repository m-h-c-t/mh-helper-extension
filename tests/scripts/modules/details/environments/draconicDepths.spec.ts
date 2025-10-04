import type { JournalMarkup, User } from '@scripts/types/hg';
import type { QuestDraconicDepths } from '@scripts/types/hg/quests/draconicDepths';
import type { IntakeMessage } from '@scripts/types/mhct';

import { DraconicDepthsDetailer } from '@scripts/modules/details/environments/draconicDepths';
import { UserBuilder } from '@tests/utility/builders';

describe('Draconic Depths Detailer', () => {
    let detailer: DraconicDepthsDetailer;
    let message: IntakeMessage;
    let journal: JournalMarkup;
    let userBuilder: UserBuilder;

    beforeEach(() => {
        detailer = new DraconicDepthsDetailer();
        message = {} as IntakeMessage;
        journal = {} as JournalMarkup;
        userBuilder = new UserBuilder().withQuests({
            QuestDraconicDepths: getDefaultQuest(),
        });
    });

    it('should be for the Draconic Depths environment', () => {
        expect(detailer.environment).toBe('Draconic Depths');
    });

    it('should add multiplier details when in cavern', () => {
        const userPost = userBuilder.build();
        userPost.quests.QuestDraconicDepths!.in_cavern = true;
        if (userPost.quests.QuestDraconicDepths!.in_cavern) {
            userPost.quests.QuestDraconicDepths!.cavern.type = 'double_ice_lair';
        }

        const details = detailer.addDetails(message, {} as User, userPost, journal);

        expect(details).toEqual(expect.objectContaining({rods: 2}));
    });

    it('should add multiplier details when in triple cavern', () => {
        const userPost = userBuilder.build();
        userPost.quests.QuestDraconicDepths!.in_cavern = true;
        if (userPost.quests.QuestDraconicDepths!.in_cavern) {
            userPost.quests.QuestDraconicDepths!.cavern.type = 'triple_ice_lair';
        }

        const details = detailer.addDetails(message, {} as User, userPost, journal);
        expect(details).toEqual(expect.objectContaining({rods: 3}));
    });

    it('should add multiplier details when cavern type is invalid', () => {
        const userPost = userBuilder.build();
        userPost.quests.QuestDraconicDepths!.in_cavern = true;
        if (userPost.quests.QuestDraconicDepths!.in_cavern) {
            // @ts-expect-error - testing invalid cavern type
            userPost.quests.QuestDraconicDepths!.cavern.type = 'invalid_cavern';
        }

        expect(() => detailer.addDetails(message, {} as User, userPost, journal))
            .toThrow('Unknown cavern type: invalid_cavern');
    });

    it('should not add details when quest is undefined', () => {
        const userPost = userBuilder.build();
        userPost.quests.QuestDraconicDepths = undefined;

        const details = detailer.addDetails(message, {} as User, userPost, journal);
        expect(details).toBeUndefined();
    });

    function getDefaultQuest(): QuestDraconicDepths {
        return {
            in_cavern: true,
            cavern: {
                type: 'flame_cavern',
                category: 'fire',
                loot_tier: {
                    current_tier: 1,
                    tier_data: [
                        {threshold: 0},
                        {threshold: 100},
                        {threshold: 250},
                        {threshold: 750},
                    ],
                },
            },
        };
    }
});
