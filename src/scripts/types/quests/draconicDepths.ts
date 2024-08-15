export type QuestDraconicDepths = CrucibleEnvironment | CavernEnvironment;

const CavernTypes = [
    "flame_cavern",
    "double_flame_cavern",
    "triple_flame_cavern",
    "ice_lair",
    "double_ice_lair",
    "triple_ice_lair",
    "toxic_tunnels",
    "double_toxic_tunnels",
    "triple_toxic_tunnels",
    "elemental_dragon_den",
] as const;
export type CavernType = (typeof CavernTypes)[number];

interface CrucibleEnvironment {
    in_cavern: false;
}

interface CavernEnvironment {
    in_cavern: true;
    cavern: {
        type: CavernType;
        category: "fire" | "ice" | "poison" | "elemental";
        loot_tier: {
            current_tier: number;
            tier_data: {
                threshold: number;
            }[]
        };
    };
}
