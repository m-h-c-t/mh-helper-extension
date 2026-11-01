import type { BonusJournalEntries } from '@scripts/hunt-recording/bonus-journal-entries';
import type { LoggerService } from '@scripts/services/logging';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { ActiveHuntEvidence } from '@scripts/hunt-recording/active-hunt-evidence';
import { HgResponseBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('ActiveHuntEvidence', () => {
    it.each([{}, {journal: {}}, {journal: {entries_string: 42}}])('rejects malformed page data %j without throwing', (page) => {
        const logger = mock<LoggerService>();
        const builder = new ActiveHuntEvidence(logger, new IntakeRejectionEngine(logger), mock<BonusJournalEntries>());
        const before = new HgResponseBuilder().withPage(page).build();
        const after = new HgResponseBuilder().withActiveTurn(true).build();
        after.user.num_active_turns = before.user.num_active_turns + 1;
        after.user.next_activeturn_seconds = before.user.next_activeturn_seconds + 900;

        expect(builder.build(before, after)).toBeNull();
    });
});
