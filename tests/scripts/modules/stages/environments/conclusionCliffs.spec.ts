import { ConclusionCliffsStager } from '@scripts/modules/stages/environments/conclusionCliffs';
import { type IStager } from '@scripts/modules/stages/stages.types';
import { type GenreType, type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';
import { UserBuilder } from '@tests/utility/builders';
import { describe, it, expect, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';

describe('Conclusion Cliffs stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let userPost: User;
    let journal: unknown;

    beforeEach(() => {
        stager = new ConclusionCliffsStager();
        message = mock<IntakeMessage>();
        userPost = mock<User>();
        journal = mock<unknown>();
    });

    it('should be for the Conclusion Cliffs environment', () => {
        expect(stager.environment).toBe('Conclusion Cliffs');
    });

    it.each([undefined, null])('should throw when QuestConclusionCliffs is %p', (quest) => {
        const preUser = {quests: {QuestConclusionCliffs: quest}} as User;

        expect(() => stager.addStage(message, preUser, userPost, journal))
            .toThrow('QuestConclusionCliffs is undefined');
    });

    it('should set stage to Not Writing when not writing and not postscript', () => {
        const preUser = new UserBuilder()
            .withQuests({
                QuestConclusionCliffs: {
                    story: {
                        is_writing: false,
                    },
                },
            })
            .build();

        stager.addStage(message, preUser, userPost, journal);

        expect(message.stage).toBe('Not Writing');
    });

    it('should set stage to Postscript when in postscript phase without fantasy chapter', () => {
        const preUser = new UserBuilder()
            .withQuests({
                QuestConclusionCliffs: {
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        current_chapter: {
                            genre_type: 'adventure',
                            length_type: 'short'
                        },
                        story_content: [],
                    },
                },
            })
            .build();

        stager.addStage(message, preUser, userPost, journal);

        expect(message.stage).toBe('Postscript');
    });

    it('should set stage to Fantasy Postscript when writing, in postscript, and has fantasy chapter', () => {
        const preUser = new UserBuilder()
            .withQuests({
                QuestConclusionCliffs: {
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        current_chapter: {
                            genre_type: 'adventure',
                            length_type: 'long'
                        },
                        story_content: [
                            {genre_type: 'adventure'},
                            {genre_type: 'fantasy'},
                        ],
                    },
                },
            })
            .build();

        stager.addStage(message, preUser, userPost, journal);

        expect(message.stage).toBe('Fantasy Postscript');
    });

    it.each<[GenreType, string]>([
        ['adventure', 'Writing Adventure'],
        ['comedy', 'Writing Comedy'],
        ['romance', 'Writing Romance'],
        ['suspense', 'Writing Suspense'],
        ['tragedy', 'Writing Tragedy'],
        ['fantasy', 'Writing Fantasy'],
    ])('should set stage to "%s" when writing %s genre', (genre, expectedStage) => {
        const preUser = new UserBuilder()
            .withQuests({
                QuestConclusionCliffs: {
                    story: {
                        is_writing: true,
                        is_postscript: false,
                        current_chapter: {
                            genre_type: genre,
                            length_type: 'medium'
                        },
                        story_content: [],
                    },
                },
            })
            .build();

        stager.addStage(message, preUser, userPost, journal);

        expect(message.stage).toBe(expectedStage);
    });

    it('should set stage to Postscript when both writing and postscript are true but no fantasy chapter', () => {
        const preUser = new UserBuilder()
            .withQuests({
                QuestConclusionCliffs: {
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        current_chapter: {
                            genre_type: 'adventure',
                            length_type: 'short'
                        },
                        story_content: [],
                    },
                },
            })
            .build();

        stager.addStage(message, preUser, userPost, journal);

        expect(message.stage).toBe('Postscript');
    });
});
