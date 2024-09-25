import {z} from "zod";

export const questClawShotCitySchema = z.object({
    map_active: z.boolean(),
    has_wanted_poster: z.boolean(),
});

export type QuestClawShotCity = z.infer<typeof questClawShotCitySchema>;
