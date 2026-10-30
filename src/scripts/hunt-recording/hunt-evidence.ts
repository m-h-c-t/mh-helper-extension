import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

export interface HuntEvidence {
    type: 'active' | 'linked';
    before: HgResponse;
    after: HgResponse;
    entry: JournalMarkup;
}
