export interface IntakeMessage {
    extension_version: number;
    user_id: number;
    entry_id: number;
    location: ComponentEntry | null;
    shield: boolean;
    total_power: number;
    total_luck: number;
    attraction_bonus: number;
    stage?: any;
    trap: ComponentEntry;
    base: ComponentEntry;
    cheese: ComponentEntry;
    charm: ComponentEntry | null;
    caught: number;
    attracted: number;
    mouse: string;
    loot: Loot[];
}

/**
 * An object with an numbered id and string name.
 */
// This may need to be ComponentEntry<TId, TName> if id needs to be not a number
interface ComponentEntry {
    id: number;
    name: string;
}

interface Loot {
    id: number;
    name: string;
    amount: number;
    lucky: boolean;
    plural_name: string;
}
