import type { Snapshot } from '@scripts/hunt-recording/snapshot-store';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

import { isLinkedEntry, isTurnEntry, parseJournalEntriesString } from '@scripts/hunt-recording/journal';
import { pageCampSchema } from '@scripts/types/hg/page';

export const LINKED_MAX_AGE_SECONDS = 3600;
export const LINKED_CLOCK_SKEW_SECONDS = 30;

export interface LinkedHuntContext {
    snapshot: Snapshot | null;
    after: HgResponse;
    post: HgResponse;
    nowSeconds: number;
}

export interface ILinkedRule {
    readonly description: string;
    isValid(ctx: LinkedHuntContext): boolean;
}

function getEntries(after: HgResponse) {
    const page = pageCampSchema.safeParse(after.page);
    return page.success ? parseJournalEntriesString(page.data.journal.entries_string) : null;
}

/**
 * Returns the id of the single new linked turn entry, or undefined if the
 * journal continuity checks (rule 3) do not hold.
 */
function getNewLinkedEntryId(ctx: LinkedHuntContext): number | undefined {
    if (!ctx.snapshot) {
        return undefined;
    }

    const entries = getEntries(ctx.after);
    if (!entries || entries.length === 0) {
        return undefined;
    }

    const {maxEntryId} = ctx.snapshot;
    if (Math.min(...entries.map(e => e.id)) > maxEntryId + 1) {
        return undefined;
    }

    const newEntries = entries.filter(e => e.id > maxEntryId);
    if (newEntries.some(e => e.cssClass === '')) {
        return undefined;
    }

    const newTurns = newEntries.filter(e => isTurnEntry(e.cssClass));
    if (newTurns.length !== 1 || !isLinkedEntry(newTurns[0].cssClass)) {
        return undefined;
    }

    return newTurns[0].id;
}

export function getLinkedEntry(ctx: LinkedHuntContext): JournalMarkup | undefined {
    const id = getNewLinkedEntryId(ctx);
    if (id === undefined) {
        return undefined;
    }

    return ctx.post.journal_markup?.find(m => m.render_data.entry_id === id);
}

export class LinkedPostIsRecentLinkedTurn implements ILinkedRule {
    readonly description = 'Post-response should have success 0 and a \'recent_linked_turn\' hunters_horn_message';
    isValid(ctx: LinkedHuntContext): boolean {
        return ctx.post.success === 0 && ctx.post.hunters_horn_message?.type === 'recent_linked_turn';
    }
}

export class LinkedAfterHasSnapshotAndJournal implements ILinkedRule {
    readonly description = 'A snapshot should exist and the after-response should have success 1 with a journal';
    isValid(ctx: LinkedHuntContext): boolean {
        return ctx.snapshot !== null && ctx.after.success === 1 && pageCampSchema.safeParse(ctx.after.page).success;
    }
}

export class LinkedJournalContinuity implements ILinkedRule {
    readonly description = 'Journal should continue from the snapshot with exactly one new turn entry, and it is linked';
    isValid(ctx: LinkedHuntContext): boolean {
        return getNewLinkedEntryId(ctx) !== undefined;
    }
}

export class LinkedEntryInPostMarkup implements ILinkedRule {
    readonly description = 'The new linked entry should exist in the post-response journal_markup';
    isValid(ctx: LinkedHuntContext): boolean {
        return getLinkedEntry(ctx) !== undefined;
    }
}

export class LinkedEntryWithinAgeWindow implements ILinkedRule {
    readonly description = 'Linked entry timestamp should be within the allowed age window';
    isValid(ctx: LinkedHuntContext): boolean {
        const ts = getLinkedEntry(ctx)?.render_data.entry_timestamp;
        return ts !== undefined
            && ctx.nowSeconds - LINKED_MAX_AGE_SECONDS <= ts
            && ts <= ctx.nowSeconds + LINKED_CLOCK_SKEW_SECONDS;
    }
}

export class LinkedBeforeTurnOlderThanEntry implements ILinkedRule {
    readonly description = 'Snapshot last_active_turn_timestamp should be older than the linked entry';
    isValid(ctx: LinkedHuntContext): boolean {
        const ts = getLinkedEntry(ctx)?.render_data.entry_timestamp;
        return ctx.snapshot !== null && ts !== undefined
            && ctx.snapshot.response.user.last_active_turn_timestamp < ts;
    }
}

export class LinkedTurnTimestampsMatchEntry implements ILinkedRule {
    readonly description = 'After and post last_active_turn_timestamp should equal the linked entry timestamp';
    isValid(ctx: LinkedHuntContext): boolean {
        const ts = getLinkedEntry(ctx)?.render_data.entry_timestamp;
        return ts !== undefined
            && ctx.after.user.last_active_turn_timestamp === ts
            && ctx.post.user.last_active_turn_timestamp === ts;
    }
}

export class LinkedNoActiveTurnsBetween implements ILinkedRule {
    readonly description = 'num_active_turns should be unchanged between snapshot and after';
    isValid(ctx: LinkedHuntContext): boolean {
        return ctx.snapshot !== null
            && ctx.snapshot.response.user.num_active_turns === ctx.after.user.num_active_turns;
    }
}

export class LinkedSameUser implements ILinkedRule {
    readonly description = 'Snapshot and after-response should belong to the same user';
    isValid(ctx: LinkedHuntContext): boolean {
        return ctx.snapshot !== null && ctx.snapshot.response.user.user_id === ctx.after.user.user_id;
    }
}

export const LinkedRules: ILinkedRule[] = [
    new LinkedPostIsRecentLinkedTurn(),
    new LinkedAfterHasSnapshotAndJournal(),
    new LinkedJournalContinuity(),
    new LinkedEntryInPostMarkup(),
    new LinkedEntryWithinAgeWindow(),
    new LinkedBeforeTurnOlderThanEntry(),
    new LinkedTurnTimestampsMatchEntry(),
    new LinkedNoActiveTurnsBetween(),
    new LinkedSameUser(),
];
