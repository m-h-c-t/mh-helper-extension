import type {HgUser} from "../hg";

export type FloatingIslandsUser = HgUser & FloatingIslandAtts

export interface FloatingIslandAtts {
    environment_name: 'Floating Islands',
    quests: {
        QuestFloatingIslands: unknown,
    },
    enviroment_atts: FloatingIslandEnvironmentAtts,
}

export interface FloatingIslandEnvironmentAtts {
    hunting_site_atts: FloatingIslandHuntingSiteAtts,
}

export interface FloatingIslandHuntingSiteAtts {
    island_name: string;
    is_enemy_encounter: boolean | null;
    is_low_tier_island: boolean | null;
    is_high_tier_island: boolean | null;
    is_vault_island: boolean | null;
    activated_island_mod_types: IslandModType[];
    island_mod_panels: IslandModPanel[];
}

interface IslandModPanel {
    type: IslandModType;
    name: string;
}

const IslandModTypes = [
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
type IslandModType = typeof IslandModTypes[number];
