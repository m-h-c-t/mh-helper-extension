import { z } from 'zod';

export const convertibleOpenSchema = z.object({
    quantity: z.coerce.number(),
    name: z.string(),
    type: z.string(),
    items: z.array(z.object({
        type: z.string(),
        name: z.string(),
        quantity: z.coerce.number()
    }))
});

export type ConvertibleOpen = z.infer<typeof convertibleOpenSchema>;
