import {z} from "zod";
import {userSchema} from "./user";
import {journalMarkupSchema} from "./journalMarkup";
import {inventorySchema} from "./inventory";
import {trapImageSchema} from "./trapImage";

export const hgResponseSchema = z.object({
    user: userSchema,
    page: z.unknown().optional(),
    success: z.union([z.literal(0), z.literal(1)]),
    active_turn: z.boolean().optional(),
    journal_markup: z.array(journalMarkupSchema).optional(),
    inventory: inventorySchema.optional(),
    trap_image: trapImageSchema.optional(),
}).loose(); // Allow other unknown keys since many responses have extra data used elsewhere (e.g. ajax success handlers)

export type HgResponse = z.infer<typeof hgResponseSchema>;
