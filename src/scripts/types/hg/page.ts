import {z} from "zod";

export const pageCampSchema = z.object({
    journal: z.object({
        entries_string: z.string()
    })
});
