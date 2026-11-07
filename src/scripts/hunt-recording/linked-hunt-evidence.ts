import type { LoggerService } from '@scripts/services/logging';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

import { LinkedRules, resolveLinkedHuntContext } from '@scripts/hunt-filter/linkedRules';
import { hgResponseSchema } from '@scripts/types/hg';

import type { BonusJournalEntries } from './bonus-journal-entries';
import type { HuntEvidence } from './hunt-evidence';
import type { HuntRecorder } from './hunt-recorder';
import type { ItemCache } from './item-cache';
import type { Snapshot } from './snapshot-store';

/** How long a linked hunt with unresolved items waits for the mouse.rip item list before recording with what is cached. */
const ITEM_LIST_WAIT_MS = 10_000;

export class LinkedHuntEvidence {
    constructor(
        private readonly logger: LoggerService,
        private readonly bonusEntries: BonusJournalEntries,
        private readonly itemCache: Pick<ItemCache, 'whenReady'>,
        private readonly huntRecorder: Pick<HuntRecorder, 'hasUnresolvedLoot'>,
    ) { }

    /**
     * @param snapshot The last snapshot observed before the horn was sounded
     * @param rawAfterResponse Response from calling page.php
     * @param postResponse Response from calling activeturn.php
     */
    async build(snapshot: Snapshot | null, rawAfterResponse: unknown, postResponse: HgResponse): Promise<HuntEvidence | null> {
        if (postResponse.success !== 0 || postResponse.hunters_horn_message?.type !== 'recent_linked_turn') {
            return null;
        }

        const afterResponse = hgResponseSchema.safeParse(rawAfterResponse);
        if (!afterResponse.success) {
            this.logger.debug('Linked hunt dropped: unexpected page response');
            return null;
        }

        const context = resolveLinkedHuntContext({
            snapshot,
            after: afterResponse.data,
            post: postResponse,
            nowSeconds: Math.floor(Date.now() / 1000),
        });

        for (const rule of LinkedRules) {
            if (!rule.isValid(context)) {
                this.logger.debug(`Linked hunt invalid: ${rule.description}`);
                return null;
            }
        }

        const {entry} = context;
        if (!snapshot || !entry) {
            return null;
        }

        const evidence: HuntEvidence = {type: 'linked', before: snapshot.response, after: context.after, entry};
        const bonus = this.bonusEntries.read(this.getBonusEntries(postResponse, snapshot.maxEntryId, entry), context.after);

        // Linked loot and convertible items resolve from the item cache, whose mouse.rip list may still be loading
        // right after page load. Bound the wait: the request has no timeout, and the page.php response already
        // advanced the snapshot, so a hunt held here could not be recovered by a later horn.
        const hasUnresolvedItems = this.huntRecorder.hasUnresolvedLoot(evidence)
            || this.bonusEntries.hasUnresolvedItems(bonus, context.after.inventory);
        if (hasUnresolvedItems) {
            await this.itemCache.whenReady(ITEM_LIST_WAIT_MS);
        }
        this.bonusEntries.submitConvertibles(bonus, context.after.inventory);

        return {...evidence, entry: {...entry, more_details: bonus.moreDetails}};
    }

    /**
     * The other entries newer than the snapshot, such as trap procs. The linked rules allow only one new turn,
     * so these all arrived with the linked entry.
     */
    private getBonusEntries(postResponse: HgResponse, maxEntryId: number, entry: JournalMarkup): JournalMarkup[] {
        return (postResponse.journal_markup ?? []).filter(m =>
            m.render_data.entry_id > maxEntryId && m.render_data.entry_id !== entry.render_data.entry_id);
    }
}
