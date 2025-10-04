import { z } from 'zod';

export const treasureMapSchema = z.object({
    map_id: z.coerce.number(),
    name: z.string(),
    goals: z.object({
        mouse: z.array(z.object({
            unique_id: z.coerce.number(),
            name: z.string(),
        })),
        item: z.array(z.object({
            unique_id: z.coerce.number(),
            name: z.string(),
        })),
    }),
});

export type TreasureMap = z.infer<typeof treasureMapSchema>;

export const treasureMapInventorySchema = z.object({
    relic_hunter_hint: z.string().optional(),
});

export type TreasureMapInventory = z.infer<typeof treasureMapInventorySchema>;
