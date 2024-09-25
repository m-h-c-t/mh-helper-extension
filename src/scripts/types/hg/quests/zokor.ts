import {z} from "zod";

export const questAncientCitySchema = z.object({
    district_name: z.string(),
});

export type QuestAncientCity = z.infer<typeof questAncientCitySchema>;
