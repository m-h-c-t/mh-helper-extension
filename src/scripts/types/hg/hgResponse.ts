import {z} from "zod";
import {userSchema} from "./user";
import {journalMarkupSchema} from "./journalMarkup";
import {inventoryItemSchema} from "./inventoryItem";

export const hgResponseSchema = z.object({
    user: userSchema,
    page: z.unknown().optional(),
    success: z.union([z.literal(0), z.literal(1)]),
    active_turn: z.boolean().optional(),
    journal_markup: z.array(journalMarkupSchema).optional(),
    inventory: z.union([
        z.record(z.string(), inventoryItemSchema),
        z.array(z.unknown()),
    ]).optional(),
});

export type HgResponse = z.infer<typeof hgResponseSchema>;
