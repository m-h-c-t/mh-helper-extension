import {z} from "zod";

export const questMousoleumSchema = z.object({
    has_wall: z.boolean(),
});

export type QuestMousoleum = z.infer<typeof questMousoleumSchema>;
