import {z, ZodEnum, ZodTypeAny} from "zod";

/**
 * Zod's `record` when used with an `enum` key type unfortunately makes every key & value optional,
 * with no ability to override that or e.g. set `default` values:
 * https://github.com/colinhacks/zod/issues/2623
 *
 * So this helper generates an `object` schema instead, with every key required by default and
 * mapped to the given value schema. You can then call `partial()` to behave like Zod's `record`,
 * but you can also set `default()` on the value schema to have a default value per omitted key.
 * This also achieves an exhaustive key check similar to TypeScript's `Record` type.
 */
export function zodRecordWithEnum<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EnumSchema extends ZodEnum<any>,
    EnumType extends z.infer<EnumSchema>,
    ValueSchema extends ZodTypeAny
>(enumSchema: EnumSchema, valueSchema: ValueSchema) {
    return z.object(
        // TODO: Why is this explicit generic parameter needed / `enumSchema.options` typed as `any`?
        _zodShapeWithKeysAndValue<EnumType, ValueSchema>(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            enumSchema.options,
            valueSchema
        )
    );
}

function _zodShapeWithKeysAndValue<
    KeyType extends string | number | symbol,
    ValueSchema extends ZodTypeAny
>(keys: KeyType[], valueSchema: ValueSchema) {
    return Object.fromEntries(
        keys.map((key) => [key, valueSchema])
        // HACK: This explicit cast is needed bc `Object.fromEntries()` loses precise typing of keys
        // (even with `as [keyof PropsType, ValueType][]` on the `Object.keys(...).map(...)` above).
        // Wish Zod had a helper for mapped types similar to TypeScript.
    ) as Record<KeyType, ValueSchema>;
}

/**
 * A Zod schema that accepts either a number or a string containing commas.
 * If a string is provided, it removes the commas and converts it to a number.
 * Throws a validation error if the resulting value is not a valid number.
 */
export const zodStrumber = z.union([
    z.number(),
    z.string().transform((val, ctx) => {
        const numericValue = parseInt(val.replace(/,/g, ""));
        if (isNaN(numericValue)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid number format",
            });
            return z.NEVER;
        }
        return numericValue;
    }),
]);
