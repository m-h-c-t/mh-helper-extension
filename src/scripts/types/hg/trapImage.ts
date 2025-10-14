import { z } from 'zod';

const statusEnum = z.enum(['active', 'inactive', 'hidden']);

export const trapImageSchema = z.object({
    auras: z.record(z.string(), z.object({
        status: statusEnum,
    }))
});

export type TrapImage = z.infer<typeof trapImageSchema>;
