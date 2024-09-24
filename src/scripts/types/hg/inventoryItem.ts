

export interface InventoryItem {
    /** HitGrab's internal number id of item */
    item_id: number;
    /** Friendly display name of item */
    name: string;
    /** Unique snake_case identifying name of item */
    type: string;
    /** Item category: bait, crafting, stat, etc... */
    // classification: Classification;
    /** Total amount of item in user inventory */
    quantity: number;
}
