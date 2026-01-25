import type { IStager } from '@scripts/modules/stages/stages.types';
import type { LoggerService } from '@scripts/services/logging';
import type { User } from '@scripts/types/hg';
import type { GenreType, QuestConclusionCliffs } from '@scripts/types/hg/quests/conclusionCliffs';
import type { IntakeMessage } from '@scripts/types/mhct';
import type { RecursivePartial } from '@tests/utility/types';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { ConclusionCliffsStager } from '@scripts/modules/stages/environments/conclusionCliffs';
import { HgResponseBuilder, IntakeMessageBuilder, UserBuilder } from '@tests/utility/builders';
import { mergician } from 'mergician';
import { describe, it, expect, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';

describe('Conclusion Cliffs exemptions', () => {
    const logger: LoggerService = mock<LoggerService>();
    let stager: IStager;
    let target: IntakeRejectionEngine;
    let responseBuilder: HgResponseBuilder;
    let messageBuilder: IntakeMessageBuilder;

    beforeEach(() => {
        stager = new ConclusionCliffsStager();
        target = new IntakeRejectionEngine(logger);
        responseBuilder = new HgResponseBuilder();
        messageBuilder = new IntakeMessageBuilder();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            const userBuilder = new UserBuilder()
                .withEnvironment({
                    environment_id: 0,
                    environment_name: 'Conclusion Cliffs',
                })
                .withQuests({
                    QuestConclusionCliffs: {
                        story: {
                            is_writing: true,
                            is_postscript: false,
                            current_chapter: {
                                genre_type: 'adventure',
                                length_type: 'medium',
                            },
                            story_content: [],
                        },
                    },
                });

            preUser = userBuilder.build();
            postUser = userBuilder.build();

            preMessage = messageBuilder.build(
                responseBuilder.withUser(preUser).build()
            );

            postMessage = messageBuilder.build(
                responseBuilder.withUser(postUser).build()
            );
        });

        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager.addStage(preMessage, preUser, postUser, {});
            stager.addStage(postMessage, postUser, postUser, {});
        }

        describe('valid transitions', () => {
            it.each<[GenreType, GenreType]>([
                ['adventure', 'comedy'],
                ['comedy', 'romance'],
                ['romance', 'suspense'],
                ['suspense', 'tragedy'],
                ['tragedy', 'fantasy'],
                ['fantasy', 'adventure'],
            ])('should accept transition from Writing %s to Writing %s', (preGenre, postGenre) => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        current_chapter: {
                            genre_type: preGenre,
                        },
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        current_chapter: {
                            genre_type: postGenre,
                        },
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(true);
            });

            it.each<GenreType>([
                'adventure',
                'comedy',
                'romance',
                'suspense',
                'tragedy',
                'fantasy',
            ])('should accept transition from Writing %s to Postscript', (genre) => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        current_chapter: {
                            genre_type: genre,
                        },
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_postscript: true,
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(true);
            });

            it('should accept transition from Postscript to Not Writing', () => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: false,
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(true);
            });

            it('should accept transition from Fantasy Postscript to Not Writing', () => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        story_content: [{genre_type: 'fantasy'}],
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: false,
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(true);
            });

            it.each<GenreType>([
                'adventure',
                'comedy',
                'romance',
                'suspense',
                'tragedy',
                'fantasy',
            ])('should accept transition from Writing %s to Fantasy Postscript', (genre) => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        current_chapter: {
                            genre_type: genre,
                        },
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        story_content: [{genre_type: 'fantasy'}],
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(true);
            });
        });

        describe('invalid transitions', () => {
            it.each<GenreType>([
                'adventure',
                'comedy',
                'romance',
                'suspense',
                'tragedy',
                'fantasy',
            ])('should reject transition from Not Writing to Writing %s', (genre) => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: false,
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        current_chapter: {
                            genre_type: genre,
                        },
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it('should reject transition from Not Writing to Postscript', () => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: false,
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it('should reject transition from Not Writing to Fantasy Postscript', () => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: false,
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        story_content: [{genre_type: 'fantasy'}],
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it.each<GenreType>([
                'adventure',
                'comedy',
                'romance',
                'suspense',
                'tragedy',
                'fantasy',
            ])('should reject transition from Postscript to Writing %s', (genre) => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_postscript: false,
                        is_writing: true,
                        current_chapter: {
                            genre_type: genre,
                        },
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it.each<GenreType>([
                'adventure',
                'comedy',
                'romance',
                'suspense',
                'tragedy',
                'fantasy',
            ])('should reject transition from Fantasy Postscript to Writing %s', (genre) => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        story_content: [{genre_type: 'fantasy'}],
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_postscript: false,
                        is_writing: true,
                        current_chapter: {
                            genre_type: genre,
                        },
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it('should reject transition from Postscript to Fantasy Postscript', () => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        story_content: [{genre_type: 'fantasy'}],
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });

            it('should reject transition from Fantasy Postscript to Postscript', () => {
                preUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                        story_content: [{genre_type: 'fantasy'}],
                    }
                });
                postUser.quests.QuestConclusionCliffs = generateQuest({
                    story: {
                        is_writing: true,
                        is_postscript: true,
                    }
                });
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);

                expect(valid).toBe(false);
            });
        });
    });

    function generateQuest(quest: RecursivePartial<QuestConclusionCliffs>): QuestConclusionCliffs {
        // @ts-expect-error 123
        return mergician({
            story: {
                is_writing: true,
                is_postscript: false,
                current_chapter: {
                    genre_type: 'adventure',
                    length_type: 'medium',
                },
                story_content: [],
            },
        }, quest);
    }
});
