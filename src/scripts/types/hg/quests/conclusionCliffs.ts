import { z } from 'zod';

const lengthType = [
    'short',
    'medium',
    'long',
] as const;
const lengthTypeSchema = z.enum(lengthType);

const genreType = [
    'adventure',
    'comedy',
    'romance',
    'suspense',
    'tragedy',
    'fantasy',
] as const;
const genreTypeSchema = z.enum(genreType);

export type GenreType = z.infer<typeof genreTypeSchema>;

export const questConclusionCliffsSchema = z.object({
    story: z.object({
        is_writing: z.boolean(),
        is_postscript: z.boolean(),
        current_chapter: z.object({
            genre_type: genreTypeSchema,
            length_type: lengthTypeSchema,
        }),
        story_content: z.array(z.object({
            genre_type: genreTypeSchema,
        }))
    }),
});

export type QuestConclusionCliffs = z.infer<typeof questConclusionCliffsSchema>;
