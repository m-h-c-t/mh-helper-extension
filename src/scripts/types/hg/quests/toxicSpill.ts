import {zodRecordWithEnum} from "@scripts/util/zod";
import {z} from "zod";

export const PollutionTitles = [
    'hero',
    'knight',
    'lord_lady',
    'baron_baroness',
    'count_countess',
    'duke_dutchess',
    'grand_duke',
    'archduke_archduchess',
] as const;
const pollutionTitlesSchema = z.enum(PollutionTitles);

const pollutionTitlesStatusSchema = z.object({
    active: z.boolean(),
});

export const questPollutionOutbreakSchema = z.object({
    titles: zodRecordWithEnum(pollutionTitlesSchema, pollutionTitlesStatusSchema),
});

export type PollutionTitle = z.infer<typeof pollutionTitlesSchema>;
export type PollutionTitleStatus = z.infer<typeof pollutionTitlesStatusSchema>;
export type QuestPollutionOutbreak = z.infer<typeof questPollutionOutbreakSchema>;
