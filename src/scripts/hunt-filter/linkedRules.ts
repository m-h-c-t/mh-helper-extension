import type { JournalEntryRef } from '@scripts/hunt-recording/journal';
import type { Snapshot } from '@scripts/hunt-recording/snapshot-store';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

import { isLinkedEntry, isTurnEntry, parseJournalEntriesString } from '@scripts/hunt-recording/journal';
import { pageCampSchema } from '@scripts/types/hg/page';

/** The backend accepts linked hunts up to 3600s old; keep a 60s margin for submission latency. */
export const LINKED_MAX_AGE_SECONDS = 3600 - 60;
export const LINKED_CLOCK_SKEW_SECONDS = 30;

export interface LinkedHuntContext {
    snapshot: Snapshot | null;
    after: HgResponse;
    post: HgResponse;
    nowSeconds: number;
}

interface ResolvedLinkedHuntContext extends LinkedHuntContext {
    hasJournal: boolean;
    linkedEntryId: number | undefined;
    entry: JournalMarkup | undefined;
}

export interface ILinkedRule {
    readonly description: string;
    isValid(ctx: ResolvedLinkedHuntContext): boolean;
}

/**
 * Returns the id of the single new linked turn entry, or undefined if the
 * journal continuity checks (rule 3) do not hold.
 */
function getNewLinkedEntryId(snapshot: Snapshot | null, entries: JournalEntryRef[] | null): number | undefined {
    if (!snapshot) {
        return undefined;
    }

    if (!entries || entries.length === 0) {
        return undefined;
    }

    const {maxEntryId} = snapshot;
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

/** Resolve journal continuity and its matching markup once for all linked rules. */
export function resolveLinkedHuntContext(ctx: LinkedHuntContext): ResolvedLinkedHuntContext {
    const page = pageCampSchema.safeParse(ctx.after.page);
    const entries = page.success ? parseJournalEntriesString(page.data.journal.entries_string) : null;
    const linkedEntryId = getNewLinkedEntryId(ctx.snapshot, entries);
    const entry = linkedEntryId === undefined
        ? undefined
        : ctx.post.journal_markup?.find(markup => markup.render_data.entry_id === linkedEntryId);
    return {...ctx, hasJournal: page.success, linkedEntryId, entry};
}

export class LinkedPostIsRecentLinkedTurn implements ILinkedRule {
    readonly description = 'Post-response should have success 0 and a \'recent_linked_turn\' hunters_horn_message';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        return ctx.post.success === 0 && ctx.post.hunters_horn_message?.type === 'recent_linked_turn';
    }
}

export class LinkedAfterHasSnapshotAndJournal implements ILinkedRule {
    readonly description = 'A snapshot should exist and the after-response should have success 1 with a journal';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        return ctx.snapshot !== null && ctx.after.success === 1 && ctx.hasJournal;
    }
}

export class LinkedJournalContinuity implements ILinkedRule {
    readonly description = 'Journal should continue from the snapshot with exactly one new turn entry, and it is linked';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        return ctx.linkedEntryId !== undefined;
    }
}

export class LinkedEntryInPostMarkup implements ILinkedRule {
    readonly description = 'The new linked entry should exist in the post-response journal_markup';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        return ctx.entry !== undefined;
    }
}

export class LinkedEntryWithinAgeWindow implements ILinkedRule {
    readonly description = 'Linked entry timestamp should be within the allowed age window';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        const ts = ctx.entry?.render_data.entry_timestamp;
        return ts !== undefined
            && ctx.nowSeconds - LINKED_MAX_AGE_SECONDS <= ts
            && ts <= ctx.nowSeconds + LINKED_CLOCK_SKEW_SECONDS;
    }
}

export class LinkedBeforeTurnOlderThanEntry implements ILinkedRule {
    readonly description = 'Snapshot last_active_turn_timestamp should be older than the linked entry';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        const ts = ctx.entry?.render_data.entry_timestamp;
        return ctx.snapshot !== null && ts !== undefined
            && ctx.snapshot.response.user.last_active_turn_timestamp < ts;
    }
}

export class LinkedTurnTimestampsMatchEntry implements ILinkedRule {
    readonly description = 'After and post last_active_turn_timestamp should equal the linked entry timestamp';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        const ts = ctx.entry?.render_data.entry_timestamp;
        return ts !== undefined
            && ctx.after.user.last_active_turn_timestamp === ts
            && ctx.post.user.last_active_turn_timestamp === ts;
    }
}

export class LinkedNoActiveTurnsBetween implements ILinkedRule {
    readonly description = 'num_active_turns should be unchanged between snapshot and after';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
        return ctx.snapshot !== null
            && ctx.snapshot.response.user.num_active_turns === ctx.after.user.num_active_turns;
    }
}

export class LinkedSameUser implements ILinkedRule {
    readonly description = 'Snapshot and after-response should belong to the same user';
    isValid(ctx: ResolvedLinkedHuntContext): boolean {
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
