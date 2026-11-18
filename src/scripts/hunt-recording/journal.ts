import type { HgResponse } from '@scripts/types/hg';

export interface JournalEntryRef {
    id: number;
    cssClass: string;
}

export function getEntryIds(entriesString: string): number[] {
    return [...entriesString.matchAll(/data-entry-id='(\d+)'/g)].map(m => Number(m[1]));
}

export function parseJournalEntriesString(entriesString: string): JournalEntryRef[] {
    return [...entriesString.matchAll(/<[^>]*data-entry-id='(\d+)'[^>]*>/g)].map(m => ({
        id: Number(m[1]),
        cssClass: /\sclass='([^']*)'/.exec(m[0])?.[1] ?? '',
    }));
}

export function getMaxEntryId(response: HgResponse): number {
    const ids: number[] = [];

    for (const markup of response.journal_markup ?? []) {
        ids.push(markup.render_data.entry_id);
    }

    const entriesString = (response.page as {journal?: {entries_string?: unknown}} | null | undefined)
        ?.journal?.entries_string;
    if (typeof entriesString === 'string') {
        ids.push(...getEntryIds(entriesString));
    }

    const lastRead = (response as Record<string, unknown>).last_read_journal_entry_id;
    if (typeof lastRead === 'number') {
        ids.push(lastRead);
    }

    return ids.length > 0 ? Math.max(...ids) : 0;
}

export function isTurnEntry(cssClass: string): boolean {
    return /\b(active|linked|passive)\b/.test(cssClass);
}

export function isLinkedEntry(cssClass: string): boolean {
    return /\blinked\b/.test(cssClass);
}
