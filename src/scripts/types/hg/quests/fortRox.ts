import { z } from 'zod';

export const Phases = ['day', 'night', 'dawn', 'lair'] as const;
export const phaseSchema = z.enum(Phases);
export const NightStages = ['stage_one', 'stage_two', 'stage_three', 'stage_four', 'stage_five'] as const;
const nightStageSchema = z.enum(NightStages);

const fortStructureSchema = z.object({
    w: z.object({
        level: z.coerce.number(),
        status: z.string(),
    }),
    b: z.object({
        level: z.coerce.number(),
        status: z.string(),
    }),
    c: z.object({
        level: z.coerce.number(),
        status: z.string(),
    }),
    m: z.object({
        level: z.coerce.number(),
        status: z.string(),
    }),
    t: z.object({
        level: z.coerce.number(),
        status: z.string(),
    }),
});

const fortRoxBaseSchema = z.object({
    tower_status: z.string(),
    fort: fortStructureSchema,
});

export const questFortRoxSchema = z.discriminatedUnion('current_phase', [
    fortRoxBaseSchema.extend({
        current_phase: z.literal('night'),
        current_stage: nightStageSchema,
    }),
    fortRoxBaseSchema.extend({
        current_phase: phaseSchema.exclude(['night']),
    }),
]);

export type FortRoxStage = z.infer<typeof nightStageSchema>;
export type QuestFortRox = z.infer<typeof questFortRoxSchema>;
