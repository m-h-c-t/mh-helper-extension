import { HgGlobalsService } from '@scripts/services/hg-globals.service';
import { UserBuilder } from '@tests/utility/builders';

describe('HgGlobalsService', () => {
    const service = new HgGlobalsService();

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns the page user global', () => {
        const user = new UserBuilder().build();
        vi.stubGlobal('user', user);

        expect(service.getUser()).toBe(user);
    });

    it('returns the page lastReadJournalEntryId global', () => {
        vi.stubGlobal('lastReadJournalEntryId', 1337);

        expect(service.getLastReadJournalEntryId()).toBe(1337);
    });
});
