import type { InterceptorService } from '@scripts/services/interceptor.service';
import type { HgResponse } from '@scripts/types/hg';

export interface CachedItem {
    item_id: number;
    name: string;
}

/**
 * Learns `item_type -> {item_id, name}` from every observed response inventory.
 * Used to resolve loot for linked hunts, whose page.php "after" response has no inventory.
 */
export class ItemCache {
    private readonly items = new Map<string, CachedItem>();

    constructor(private readonly interceptorService: InterceptorService) {}

    init(): void {
        this.interceptorService.on('response', ({response}) => this.record(response));
    }

    record(response: HgResponse): void {
        const inventory = response.inventory;
        if (inventory == null || Array.isArray(inventory)) {
            return;
        }

        for (const [itemType, item] of Object.entries(inventory)) {
            this.items.set(itemType, {item_id: item.item_id, name: item.name});
        }
    }

    get(itemType: string): CachedItem | undefined {
        return this.items.get(itemType);
    }
}
