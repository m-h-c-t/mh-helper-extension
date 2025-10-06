import z from 'zod';

const mapSchema = z.object({
    name: z.string(),
    is_complete: z.literal(true).or(z.null()),
    num_found: z.coerce.number(),
    num_total: z.coerce.number(),
});

export const questRelicHunterSchema = z.object({
    default_map_id: z.coerce.number().nullable(),
    maps: z.array(mapSchema),
});

export type QuestRelicHunter = z.infer<typeof questRelicHunterSchema>;
