import type { User } from '@scripts/types/hg';

/**
 * Reads the globals that the MouseHunt page exposes (`user`, `lastReadJournalEntryId`).
 *
 * Values are read on every call since the page replaces them as the game state changes.
 */
export class HgGlobalsService {
    getUser(): User {
        return user;
    }

    getLastReadJournalEntryId(): number {
        return lastReadJournalEntryId;
    }
}
