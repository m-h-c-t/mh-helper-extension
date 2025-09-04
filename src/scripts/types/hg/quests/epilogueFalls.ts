import {z} from "zod";

export const questEpilogueFallsSchema = z.object({
    on_rapids: z.boolean().nullable(),
    rapids: z.object({
        zone_data: z.object({
            type: z.string(), // e.g., "low_morsel_zone"
            name: z.string(), // e.g., "Sparse Morsel Zone"
        }),
    })
});

export type QuestEpilogueFalls = z.infer<typeof questEpilogueFallsSchema>;
