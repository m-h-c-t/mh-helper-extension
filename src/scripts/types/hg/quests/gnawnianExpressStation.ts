import {z} from "zod";

const baseQuestTrainStationSchema = z.object({
    on_train: z.boolean(),
});

export const offTrainSchema = baseQuestTrainStationSchema.extend({
    on_train: z.literal(false),
});

export const trainPhaseTypeSchema = z.union([
    z.literal("supplies"),
    z.literal("boarding"),
    z.literal("bridge_jump"),
]);

export const baseTrainPhaseSchema = baseQuestTrainStationSchema.extend({
    on_train: z.literal(true),
    current_phase: trainPhaseTypeSchema,
});

export const troubleAreaSchema = z.union([
    z.literal("roof"),
    z.literal("door"),
    z.literal("rails"),
]);

export const jumpPhaseSchema = baseTrainPhaseSchema.extend({
    current_phase: z.literal("bridge_jump"),
});

export const supplyPhaseSchema = baseTrainPhaseSchema.extend({
    current_phase: z.literal("supplies"),
    minigame: z.object({
        supply_hoarder_turns: z.coerce.number(),
    }),
});

export const boardingPhaseSchema = baseTrainPhaseSchema.extend({
    current_phase: z.literal("boarding"),
    minigame: z.object({
        trouble_area: troubleAreaSchema,
    }),
});

export const questTrainStationSchema = z.union([
    offTrainSchema,
    supplyPhaseSchema,
    boardingPhaseSchema,
    jumpPhaseSchema,
]);

export type TroubleArea = z.infer<typeof troubleAreaSchema>;
export type TrainPhaseType = z.infer<typeof trainPhaseTypeSchema>;
export type OffTrain = z.infer<typeof offTrainSchema>;
export type SupplyPhase = z.infer<typeof supplyPhaseSchema>;
export type BoardingPhase = z.infer<typeof boardingPhaseSchema>;
export type JumpPhase = z.infer<typeof jumpPhaseSchema>;
export type QuestTrainStation = z.infer<typeof questTrainStationSchema>;
