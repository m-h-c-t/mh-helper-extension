import {z} from "zod";

export const inventoryItemSchema = z.object({
    /** HitGrab's internal number id of item */
    item_id: z.coerce.number(),
    /** Friendly display name of item */
    name: z.string(),
    /** Unique snake_case identifying name of item */
    type: z.string(),
    /** Item category: bait, crafting, stat, etc... */
    // classification: Classification;
    /** Total amount of item in user inventory */
    quantity: z.coerce.number(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const inventorySchema = z.union([
    z.record(z.string(), inventoryItemSchema),
    z.tuple([]),
]);

export type Inventory = z.infer<typeof inventorySchema>;
