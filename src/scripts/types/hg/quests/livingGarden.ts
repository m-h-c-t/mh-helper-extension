import {z} from "zod";

const pourStatusSchema = z.enum(['filling', 'dumped']);

const livingGardenStateSchema = z.object({
    is_normal: z.literal(true),
    minigame: z.object({
        bucket_state: pourStatusSchema,
    }),
});

const twistedGardenStateSchema = z.object({
    is_normal: z.literal(false),
    minigame: z.object({
        vials_state: pourStatusSchema,
    }),
});

export const questLivingGardenSchema = z.union([livingGardenStateSchema, twistedGardenStateSchema]);

export type QuestLivingGarden = z.infer<typeof questLivingGardenSchema>;
