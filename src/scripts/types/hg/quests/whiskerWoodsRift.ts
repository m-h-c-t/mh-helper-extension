import { z } from 'zod';

const zoneTypeSchema = z.enum(['clearing', 'tree', 'lagoon']);

const zoneStatusSchema = z.object({
    level: z.coerce.number(),
});

export const questRiftWhiskerWoodsSchema = z.object({
    zones: z.record(zoneTypeSchema, zoneStatusSchema),
});

export type ZoneType = z.infer<typeof zoneTypeSchema>;
export type QuestRiftWhiskerWoods = z.infer<typeof questRiftWhiskerWoodsSchema>;
