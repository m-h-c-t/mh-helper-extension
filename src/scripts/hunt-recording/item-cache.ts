import type { InterceptorService } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { MouseRipApiService } from '@scripts/services/mouserip-api.service';
import type { HgResponse } from '@scripts/types/hg';

export interface CachedItem {
    item_id: number;
    name: string;
}

/**
 * Maps `item_type -> {item_id, name}`, loaded once from mouse.rip and refined by every observed response inventory.
 * Used to resolve loot for linked hunts, whose page.php "after" response has no inventory.
 */
export class ItemCache {
    private readonly items = new Map<string, CachedItem>();
    private loading: Promise<void> = Promise.resolve();

    constructor(
        private readonly logger: LoggerService,
        private readonly interceptorService: InterceptorService,
        private readonly mouseRipApiService: MouseRipApiService,
    ) {}

    /** Resolves once the mouse.rip item list has loaded, or failed to load. */
    get ready(): Promise<void> {
        return this.loading;
    }

    init(): void {
        this.interceptorService.on('response', ({response}) => this.record(response));
        this.loading = this.load();
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

    private async load(): Promise<void> {
        try {
            const items = await this.mouseRipApiService.getAllItems();
            for (const item of items) {
                // Inventories come straight from HitGrab, so keep anything already learned from them.
                if (!this.items.has(item.type)) {
                    this.items.set(item.type, {item_id: item.id, name: item.name});
                }
            }
        } catch (error) {
            this.logger.warn('Failed to load items from mouse.rip', error);
        }
    }
}
