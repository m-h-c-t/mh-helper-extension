import { z } from 'zod';

export const rapidZoneTypeSchema = z.enum([
    'low_morsel_zone',
    'low_algae_zone',
    'low_halophyte_zone',
    'low_coral_zone',
    'low_shell_zone',
    'low_hook_zone',
    'medium_morsel_zone',
    'medium_algae_zone',
    'medium_halophyte_zone',
    'medium_coral_zone',
    'medium_shell_zone',
    'medium_hook_zone',
    'rich_morsel_zone',
    'rich_algae_zone',
    'rich_halophyte_zone',
    'rich_coral_zone',
    'rich_shell_zone',
    'rich_hook_zone',
    'waterfall_zone',
    'grotto_zone'
]);

export type RapidZoneType = z.infer<typeof rapidZoneTypeSchema>;

export const rapidZoneNameSchema = z.enum([
    'Sparse Morsel Zone',
    'Sparse Algae Zone',
    'Sparse Halophyte Zone',
    'Sparse Coral Zone',
    'Sparse Shell Zone',
    'Sparse Plot Hook Zone',
    'Common Morsel Zone',
    'Common Algae Zone',
    'Common Halophyte Zone',
    'Common Coral Zone',
    'Common Shell Zone',
    'Common Plot Hook Zone',
    'Abundant Morsel Zone',
    'Abundant Algae Zone',
    'Abundant Halophyte Zone',
    'Abundant Coral Zone',
    'Abundant Shell Zone',
    'Abundant Plot Hook Zone',
    'Within the Waterfall',
    'The Hidden Grotto'
]);

export type RapidZoneName = z.infer<typeof rapidZoneNameSchema>;

export const questEpilogueFallsSchema = z.object({
    on_rapids: z.boolean().nullable(),
    rapids: z.object({
        zone_data: z.object({
            type: rapidZoneTypeSchema,
            name: rapidZoneNameSchema,
        }),
    })
});

export type QuestEpilogueFalls = z.infer<typeof questEpilogueFallsSchema>;
