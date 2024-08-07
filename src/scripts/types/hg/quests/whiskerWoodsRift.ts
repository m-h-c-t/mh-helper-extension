import {zodRecordWithEnum} from "@scripts/util/zod";
import {z} from "zod";

const zoneTypeSchema = z.enum(['clearing', 'tree', 'lagoon']);

const zoneStatusSchema = z.object({
    percent: z.coerce.number(),
    level: z.coerce.number(),
});

export const questRiftWhiskerWoodsSchema = z.object({
    zones: zodRecordWithEnum(zoneTypeSchema, zoneStatusSchema),
});

export type ZoneType = z.infer<typeof zoneTypeSchema>;
export type QuestRiftWhiskerWoods = z.infer<typeof questRiftWhiskerWoodsSchema>;
