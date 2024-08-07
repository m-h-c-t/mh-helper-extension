import {z} from "zod";

export const questLabyrinthSchema = z.object({
    status: z.string(),
    hallway_name: z.string(),
});

export type QuestLabyrinth = z.infer<typeof questLabyrinthSchema>;
