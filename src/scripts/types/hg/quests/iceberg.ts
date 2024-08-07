import {z} from "zod";

export const IcebergPhases = [
    'Treacherous Tunnels',
    'Brutal Bulwark',
    'Bombing Run',
    'The Mad Depths',
    'Icewing\'s Lair',
    'Hidden Depths',
    'The Deep Lair',
    'General',
] as const;
const icebergPhaseSchema = z.enum(IcebergPhases);

export const questIcebergSchema = z.object({
    current_phase: icebergPhaseSchema,
});

export type IcebergPhase = z.infer<typeof icebergPhaseSchema>;
export type QuestIceberg = z.infer<typeof questIcebergSchema>;
