import {z} from "zod";

export const questSandDunesSchema = z.object({
    // this is for Sand Dunes only. Not currently needed for Sand Crypts. See QuestLivingGarden for example of both
    minigame: z.object({
        has_stampede: z.boolean(),
    }),
});

export type QuestSandDunes = z.infer<typeof questSandDunesSchema>;
