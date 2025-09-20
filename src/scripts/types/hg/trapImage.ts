import {z} from "zod";

export const trapImageSchema = z.object({
    auras: z.record(z.string(), z.object({
        status: z.literal('active').or(z.literal('hidden')),
    }))
});

export type TrapImage = z.infer<typeof trapImageSchema>;
