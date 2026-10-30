import type { InterceptorService } from '@scripts/services/interceptor.service';
import type { HgResponse } from '@scripts/types/hg';

import { getMaxEntryId } from './journal';

export interface Snapshot {
    response: HgResponse;
    maxEntryId: number;
}

/**
 * Remembers the latest response containing both `user` and `trap_image`,
 * used as the "before" state when verifying a friend hunt.
 */
export class SnapshotStore {
    private snapshot: Snapshot | null = null;

    constructor(private readonly interceptorService: InterceptorService) {}

    init(): void {
        this.interceptorService.on('response', ({response}) => this.record(response));
    }

    record(response: HgResponse): void {
        if (!response.user || !response.trap_image) {
            return;
        }

        // Responses without journal data report 0; never move the high-water mark backwards.
        const maxEntryId = Math.max(getMaxEntryId(response), this.snapshot?.maxEntryId ?? 0);
        this.snapshot = {response, maxEntryId};
    }

    latest(): Snapshot | null {
        return this.snapshot;
    }
}
