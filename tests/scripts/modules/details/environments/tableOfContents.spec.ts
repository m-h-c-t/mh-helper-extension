import {TableOfContentsDetailer} from '@scripts/modules/details/environments/tableOfContents';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'vitest-mock-extended';

describe('TableOfContentsDetailer', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;
    let detailer: TableOfContentsDetailer;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestTableOfContents: {
                    is_writing: false,
                    current_book: {
                        volume: 0,
                    }
                }
            })
            .build();
        detailer = new TableOfContentsDetailer();
    });

    it('should return undefined when quest is not available', () => {
        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when volume is 0', () => {
        user.quests.QuestTableOfContents!.current_book.volume = 0;

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return volume when greater than 0', () => {
        user.quests.QuestTableOfContents!.current_book.volume = 3;

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            volume: 3,
        });
    });

    it('should handle different volume numbers', () => {
        user.quests.QuestTableOfContents!.current_book.volume = 15;

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            volume: 15,
        });
    });

    it('should return volume 1', () => {
        user.quests.QuestTableOfContents!.current_book.volume = 1;

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            volume: 1,
        });
    });
});
