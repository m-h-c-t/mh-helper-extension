import { z } from 'zod';

export const questSpringHuntSchema = z.object({
});

export type QuestSpringHunt = z.infer<typeof questSpringHuntSchema>;
