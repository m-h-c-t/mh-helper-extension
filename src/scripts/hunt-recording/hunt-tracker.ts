import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { ApiService } from '@scripts/services/api.service';
import type { HgGlobalsService } from '@scripts/services/hg-globals.service';
import type { InterceptorService, RequestEventParams, ResponseEventParams } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { MouseRipApiService } from '@scripts/services/mouserip-api.service';
import type { UserSettings } from '@scripts/services/settings/settings.service';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse } from '@scripts/types/hg';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { hgResponseSchema } from '@scripts/types/hg';

import type { Snapshot } from './snapshot-store';

import { ActiveHuntEvidence } from './active-hunt-evidence';
import { HuntRecorder } from './hunt-recorder';
import { ItemCache } from './item-cache';
import { buildLinkedHuntEvidence } from './linked-hunt-evidence';
import { SnapshotStore } from './snapshot-store';

/**
 * Records hunts when the horn is sounded.
 *
 * Before allowing a hunt submission, first request an updated user object that reflects the effect
 * of any outside actions, such as setup changes from the mobile app, a different tab, or trap checks.
 * Active hunts are verified against that pre-hunt user; friend (linked) hunts are verified against
 * the last snapshot observed before the horn was sounded.
 */
export class HuntTracker {
    private readonly snapshotStore: SnapshotStore;
    private readonly itemCache: ItemCache;
    private readonly activeHuntEvidence: ActiveHuntEvidence;
    private readonly huntRecorder: HuntRecorder;

    constructor(
        private readonly logger: LoggerService,
        private readonly interceptorService: InterceptorService,
        private readonly apiService: ApiService,
        submissionService: SubmissionService,
        extensionLog: ExtensionLog,
        private readonly hgGlobals: HgGlobalsService,
        mouseRipApiService: MouseRipApiService,
        getSettings: () => UserSettings,
    ) {
        const rejectionEngine = new IntakeRejectionEngine(logger);
        this.snapshotStore = new SnapshotStore(interceptorService);
        this.itemCache = new ItemCache(logger, interceptorService, mouseRipApiService);
        this.activeHuntEvidence = new ActiveHuntEvidence(logger, rejectionEngine, submissionService, extensionLog, hgGlobals, getSettings);
        this.huntRecorder = new HuntRecorder(logger, rejectionEngine, submissionService, this.itemCache);
    }

    init(): void {
        this.snapshotStore.init();
        this.itemCache.init();
        this.interceptorService.on('request', requestEvent => this.onRequest(requestEvent));
    }

    private async onRequest(requestEvent: RequestEventParams): Promise<void> {
        if (requestEvent.url.pathname !== '/managers/ajax/turns/activeturn.php') {
            return;
        }

        // Read the snapshot before fetching page.php, whose response also passes through the interceptor.
        const snapshot = this.snapshotStore.latest();

        this.logger.debug('Fetching user object before hunting', performance.now());
        const pageResponse = await this.apiService.send('POST',
            '/managers/ajax/pages/page.php',
            {
                sn: 'Hitgrab',
                hg_is_ajax: 1,
                page_class: 'Camp',
                last_read_journal_entry_id: this.hgGlobals.getLastReadJournalEntryId(),
                uh: this.hgGlobals.getUser().unique_hash
            },
            true
        );

        const handleResponse = (responseEvent: ResponseEventParams) => {
            if (responseEvent.requestId !== requestEvent.requestId) {
                return;
            }

            this.interceptorService.off('response', handleResponse);
            void this.onActiveTurnResponse(snapshot, pageResponse, responseEvent.response);
        };

        this.interceptorService.on('response', handleResponse);
    }

    private async onActiveTurnResponse(snapshot: Snapshot | null, pageResponse: unknown, post: HgResponse): Promise<void> {
        if (post.success === 1) {
            const evidence = this.activeHuntEvidence.build(pageResponse, post);
            if (evidence) this.huntRecorder.record(evidence);
            return;
        }

        if (post.success === 0 && post.hunters_horn_message?.type === 'recent_linked_turn') {
            const afterParse = hgResponseSchema.safeParse(pageResponse);
            if (!afterParse.success) {
                this.logger.debug('Linked hunt dropped: unexpected page response');
                return;
            }

            const evidence = buildLinkedHuntEvidence({
                snapshot,
                after: afterParse.data,
                post,
                nowSeconds: Math.floor(Date.now() / 1000),
            }, this.logger);
            if (!evidence) return;

            // Linked loot resolves from the item cache, whose mouse.rip list may still be loading right after page load.
            await this.itemCache.ready;
            this.huntRecorder.record(evidence);
        }
    }
}
