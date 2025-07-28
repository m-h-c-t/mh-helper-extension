import z from 'zod';

export const questLunarNewYearLanternSchema = z.object({
    lantern_status: z.string(),
    is_lantern_active: z.boolean(),
    lantern_height: z.coerce.number(),
});

export type QuestLunarNewYearLantern = z.infer<typeof questLunarNewYearLanternSchema>;

