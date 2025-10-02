import {zodStrumber} from "@scripts/util/zod";
import {z} from "zod";

const componentEntrySchema = z.object({
    id: zodStrumber,
    name: z.string(),
});

const lootSchema = z.object({
    id: zodStrumber,
    name: z.string(),
    amount: zodStrumber,
    lucky: z.boolean(),
    plural_name: z.string(),
});

// Things pulled directly from user and don't require transformation
// i.e not stage, hunt, loot
export const intakeMessageBaseSchema = z.object({
    entry_timestamp: zodStrumber.optional(),
    entry_id: zodStrumber,
    location: componentEntrySchema,
    shield: z.boolean(),
    total_power: zodStrumber,
    total_luck: zodStrumber,
    attraction_bonus: zodStrumber,
    trap: componentEntrySchema,
    base: componentEntrySchema,
    cheese: componentEntrySchema,
    charm: componentEntrySchema.nullable(),
    caught: zodStrumber,
    attracted: zodStrumber,
    mouse: z.string(),
    auras: z.array(z.string()),
});

export type IntakeMessageBase = z.infer<typeof intakeMessageBaseSchema>;

export const intakeMessageSchema = intakeMessageBaseSchema.extend({
    stage: z.unknown().optional(),
    hunt_details: z.record(z.string(), z.unknown()),
    loot: z.array(lootSchema),
});

export type IntakeMessage = z.infer<typeof intakeMessageSchema>;

/**
 * An object with an numbered id and string name.
 */
// This may need to be ComponentEntry<TId, TName> if id needs to be not a number
export type ComponentEntry = z.infer<typeof componentEntrySchema>;

/**
 * An object opened (convertible) or recieved (convertible contents)
 */
export const hgItemSchema = z.object({
    /** HitGrab's ID for the id */
    id: z.coerce.number().optional(),
    item_id: z.coerce.number().optional(),
    /** HitGrab's display name for the item */
    name: z.string(),
    /** The number of items opened or recieved */
    quantity: z.coerce.number(),
})
    .transform((val, ctx) => {
        // Make sure that either id or item_id is set
        const id = val.id ?? val.item_id;
        if (id === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Either id or item_id must be set",
            });
            return z.NEVER;
        }
        return {
            id: id,
            name: val.name,
            quantity: val.quantity,
        };
    });
export type HgItem = z.infer<typeof hgItemSchema>;

export const MhctResponseSchema = z.object({
    status: z.enum(['error', 'warning', 'success']),
    message: z.string(),
});
export type MhctResponse = z.infer<typeof MhctResponseSchema>;
