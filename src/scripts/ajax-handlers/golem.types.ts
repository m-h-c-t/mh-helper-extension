/**
 * Golem Reponse from HG, previewed by CBS
 */
 export interface GolemResponse {
    items: Record<Rarity, GolemItem[]>
    //bonus_items: [];
    // num_upgrade_items: number;
    // num_gilded_charms: number;
    // num_hailstones: number;
    // has_golden_shield: boolean;
    // aura: {
    //     num_hours: number;
    //     end_date: string;
    //     is_capped: boolean;
    //     cutoff_date: string
    // };
    // environment: {
    //     name: string;
    // }
    // golem: {
    //     level: number;
    // };
}

/**
 * An item brought back back a golem
 */
interface GolemItem {
    name: string;
    quantity: number;
}

export type Rarity = "area" | "hat" | "scarf";

/**
 * The data that will be recorded externally
 */
export interface GolemPayload {
    timestamp: number;
    location: string;
    loot: (GolemItem & {
        rarity: Rarity
    })[]
}
