import {z} from "zod";

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
