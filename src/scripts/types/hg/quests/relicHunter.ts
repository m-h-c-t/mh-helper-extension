import z from "zod";

const mapSchema = z.object({
    name: z.string(),
    is_complete: z.literal(true).or(z.null())
});

export const questRelicHunterSchema = z.object({
    maps: z.array(mapSchema),
});

export type QuestRelicHunter = z.infer<typeof questRelicHunterSchema>;
