import { z } from 'zod';

export const questAncientCitySchema = z.object({
    district_name: z.string(),
    boss: z.string(), // css: contains 'hiddenDistrict' for mino, 'napping' | 'awake' | 'enraged' | 'reckless' classes for boss state
    countdown: z.coerce.number(),
    width: z.coerce.number(),
    district_tier: z.coerce.number(),
});

export type QuestAncientCity = z.infer<typeof questAncientCitySchema>;
