import { z } from 'zod';

import { convertibleOpenSchema } from './convertibleOpen';
import { inventoryItemSchema, inventorySchema } from './inventory';
import { journalMarkupSchema } from './journalMarkup';
import { trapImageSchema } from './trapImage';
import { userSchema } from './user';

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

export const hgConvertibleResponseSchema = hgResponseSchema.extend({
    treasure_map: z.string().optional(),
    convertible_open: convertibleOpenSchema.optional(),
    items: z.record(z.string(), inventoryItemSchema),
});

export type HgConvertibleResponse = z.infer<typeof hgConvertibleResponseSchema>;
