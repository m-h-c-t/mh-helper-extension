import {z} from "zod";

export const IslandModTypes = [
    'empty',
    'empty_sky',
    'gem_bonus',
    'ore_bonus',
    'sky_cheese',
    'sky_pirates',
    'loot_cache',
    'wind_shrine',
    'rain_shrine',
    'frost_shrine',
    'fog_shrine',
    'paragon_cache_a',
    'paragon_cache_d',
    'paragon_cache_c',
    'paragon_cache_b',
    'ore_gem_bonus',
    'cloudstone_bonus',
    'charm_bonus',
] as const;
const islandModTypesSchema = z.enum(IslandModTypes);

const islandModPanelSchema = z.object({
    type: z.string(),
    name: z.string(),
});

export const floatingIslandsHunterSiteAttsSchema = z.object({
    island_name: z.string(),
    is_enemy_encounter: z.boolean().nullable(),
    is_low_tier_island: z.boolean().nullable(),
    is_high_tier_island: z.boolean().nullable(),
    is_vault_island: z.boolean().nullable(),
    activated_island_mod_types: z.array(islandModTypesSchema),
    island_mod_panels: z.array(islandModPanelSchema),
});

export const questFloatingIslandsSchema = z.object({
    hunting_site_atts: floatingIslandsHunterSiteAttsSchema,
});

export type IslandModType = z.infer<typeof islandModTypesSchema>;
export type FloatingIslandHuntingSiteAtts = z.infer<typeof floatingIslandsHunterSiteAttsSchema>;
export type QuestFloatingIslands = z.infer<typeof questFloatingIslandsSchema>;
