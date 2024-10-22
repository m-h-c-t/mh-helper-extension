import {z} from "zod";

export const questTableOfContentsSchema = z.object({
    is_writing: z.boolean(),
    current_book: z.object({
        volume: z.coerce.number(),
    }),
});

export type QuestTableOfContents = z.infer<typeof questTableOfContentsSchema>;
