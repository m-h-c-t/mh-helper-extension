import {z} from "zod";

export const questSpringHuntSchema = z.object({
    charge_quantity: z.string(),
    charge_doubler: z.union([z.literal('active'), z.unknown()]),
});

export type QuestSpringHunt = z.infer<typeof questSpringHuntSchema>;
