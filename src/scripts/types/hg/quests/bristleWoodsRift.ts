import {zodStrumber} from "@scripts/util/zod";
import {z} from "zod";

export const questRiftBristleWoodsSchema = z.object({
    chamber_name: z.string(),
    items: z.object({
        rift_hourglass_stat_item: z.object({
            quantity: zodStrumber,
        }),
    }).passthrough(),
    chamber_status: z.string(),
    cleaver_status: z.string(),
    status_effects: z.record(z.string(), z.string()),
    obelisk_percent: z.coerce.number(),
    acolyte_sand: z.coerce.number(),
});

export type QuestRiftBristleWoods = z.infer<typeof questRiftBristleWoodsSchema>;
