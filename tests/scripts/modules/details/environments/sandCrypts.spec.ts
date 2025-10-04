import type { User, JournalMarkup } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { SandCryptsDetailer } from '@scripts/modules/details/environments/sandCrypts';
import { UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('SandCryptsDetailer', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;
    let detailer: SandCryptsDetailer;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestSandDunes: {
                    is_normal: false,
                    minigame: {
                        type: 'grubling',
                        salt_charms_used: 0,
                    }
                }
            })
            .build();
        detailer = new SandCryptsDetailer();
    });

    it('should return undefined when quest is not available', () => {
        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when in normal mode', () => {
        user.quests.QuestSandDunes = {
            is_normal: true,
            minigame: {
                has_stampede: false,
            },
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when minigame is not available', () => {
        user.quests.QuestSandDunes = {
            is_normal: false,
            // @ts-expect-error Missing minigame property
            minigame: undefined,
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when minigame type is not grubling', () => {
        user.quests.QuestSandDunes = {
            is_normal: false,
            // @ts-expect-error Incorrect minigame type
            minigame: {type: 'other'},
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when mouse is not King Grub or King Scarab', () => {
        user.quests.QuestSandDunes = {
            is_normal: false,
            minigame: {
                type: 'grubling',
                salt_charms_used: 5,
            },
        };
        message.mouse = 'Some Other Mouse';

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return salt charms used for King Grub', () => {
        user.quests.QuestSandDunes = {
            is_normal: false,
            minigame: {
                type: 'grubling',
                salt_charms_used: 7,
            },
        };
        message.mouse = 'King Grub';

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            salt: 7,
        });
    });

    it('should return salt charms used for King Scarab', () => {
        user.quests.QuestSandDunes = {
            is_normal: false,
            minigame: {
                type: 'grubling',
                salt_charms_used: 12,
            },
        };
        message.mouse = 'King Scarab';

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            salt: 12,
        });
    });

    it('should handle zero salt charms used', () => {
        user.quests.QuestSandDunes = {
            is_normal: false,
            minigame: {
                type: 'grubling',
                salt_charms_used: 0,
            },
        };
        message.mouse = 'King Grub';

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            salt: 0,
        });
    });
});
