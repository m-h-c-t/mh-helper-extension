import {z} from "zod";

export const FortRoxStages = [ 'stage_one', 'stage_two', 'stage_three', 'stage_four', 'stage_five' ] as const;
const fortRoxStageSchema = z.enum(FortRoxStages);

export const questFortRoxSchema = z.object({
    is_day: z.literal(true).nullable(),
    is_night: z.literal(true).nullable(),
    is_dawn: z.literal(true).nullable(),
    is_lair: z.literal(true).nullable(),
    current_stage: fortRoxStageSchema.nullable(),
});

export type FortRoxStage = z.infer<typeof fortRoxStageSchema>;
export type QuestFortRox = z.infer<typeof questFortRoxSchema>;
