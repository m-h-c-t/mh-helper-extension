import type { User, JournalMarkup } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { ConclusionCliffsDetailer } from '@scripts/modules/details/environments/conclusionCliffs';
import { UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('ConclusionCliffsDetailer', () => {
    let detailer: ConclusionCliffsDetailer;
    let userPre: User;
    let userPost: User;
    const message = mock<IntakeMessage>();
    const journal = mock<JournalMarkup>();

    beforeEach(() => {
        detailer = new ConclusionCliffsDetailer();
        userPre = new UserBuilder().build();
        userPost = new UserBuilder().build();
    });

    describe('environment property', () => {
        it('should return "Conclusion Cliffs"', () => {
            expect(detailer.environment).toBe('Conclusion Cliffs');
        });
    });

    describe('addDetails', () => {
        it('should return undefined if quest is null', () => {
            // @ts-expect-error Testing invalid quest state
            userPre.quests.QuestConclusionCliffs = null;
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it('should return undefined if quest is undefined', () => {
            userPre.quests.QuestConclusionCliffs = undefined;
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it('should return undefined if not writing', () => {
            userPre.quests.QuestConclusionCliffs = {
                story: {
                    is_writing: false,
                    is_postscript: false,
                    current_chapter: {
                        genre_type: 'adventure',
                        length_type: 'medium',
                    },
                    story_content: [],
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it.each(['short', 'medium', 'long'] as const)('should return chapter_length as "%s" when writing', (lengthType) => {
            userPre.quests.QuestConclusionCliffs = {
                story: {
                    is_writing: true,
                    is_postscript: false,
                    current_chapter: {
                        genre_type: 'adventure',
                        length_type: lengthType,
                    },
                    story_content: [],
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toEqual({chapter_length: lengthType});
        });

        it('should return chapter_length regardless of genre_type', () => {
            userPre.quests.QuestConclusionCliffs = {
                story: {
                    is_writing: true,
                    is_postscript: false,
                    current_chapter: {
                        genre_type: 'romance',
                        length_type: 'long',
                    },
                    story_content: [],
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toEqual({chapter_length: 'long'});
        });

        it('should return undefined when is_postscript is true', () => {
            userPre.quests.QuestConclusionCliffs = {
                story: {
                    is_writing: true,
                    is_postscript: true,
                    current_chapter: {
                        genre_type: 'suspense',
                        length_type: 'short',
                    },
                    story_content: [],
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it('should return chapter_length when story_content has items', () => {
            userPre.quests.QuestConclusionCliffs = {
                story: {
                    is_writing: true,
                    is_postscript: false,
                    current_chapter: {
                        genre_type: 'fantasy',
                        length_type: 'medium',
                    },
                    story_content: [
                        {genre_type: 'adventure'},
                        {genre_type: 'comedy'},
                    ],
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toEqual({chapter_length: 'medium'});
        });
    });
});
