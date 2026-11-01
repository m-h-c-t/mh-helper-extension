import type { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import type { LoggerService } from '@scripts/services/logging';
import type { HgResponse } from '@scripts/types/hg';

import { hgResponseSchema } from '@scripts/types/hg';
import { pageCampSchema } from '@scripts/types/hg/page';
import { diffObject } from '@scripts/util/diffObject';
import { z } from 'zod';

import type { BonusJournalEntries } from './bonus-journal-entries';
import type { HuntEvidence } from './hunt-evidence';

import { getEntryIds } from './journal';

export class ActiveHuntEvidence {
    constructor(
        private readonly logger: LoggerService,
        private readonly rejectionEngine: IntakeRejectionEngine,
        private readonly bonusEntries: BonusJournalEntries,
    ) { }

    /**
     * @param rawPageResponse Response from calling page.php
     * @param turnResponse Response from calling activeturn.php
     */
    build(rawPageResponse: unknown, turnResponse: HgResponse): HuntEvidence | null {
        const parsedResponse = hgResponseSchema.safeParse(rawPageResponse);

        if (!parsedResponse.success) {
            this.logger.warn('Unexpected pre hunt response type received', z.prettifyError(parsedResponse.error));

            return null;
        }

        const pageResponse = parsedResponse.data;

        if (!this.rejectionEngine.validateResponse(pageResponse, turnResponse)
            || !this.rejectionEngine.validateUser(pageResponse.user, turnResponse.user)) {
            return null;
        }

        const page = pageCampSchema.safeParse(pageResponse.page);
        if (!page.success) {
            this.logger.warn('Unexpected pre hunt page received', z.prettifyError(page.error));
            return null;
        }

        this.logger.debug('User object diff', diffObject({}, pageResponse.user, turnResponse.user));
        const maxEntryId = Math.max(...getEntryIds(page.data.journal.entries_string), 0);
        this.logger.debug(`Pre (old) maximum entry id: ${maxEntryId}`);

        const hunt = this.parseJournalEntries(turnResponse, maxEntryId);
        if (!hunt) {
            this.logger.info('Missing Info (trap check or friend hunt)(2)');
            return null;
        }

        return {type: 'active', before: pageResponse, after: turnResponse, entry: hunt};
    }

    /** Find the active entry and handle supported bonus journals. */
    private parseJournalEntries(turnResponse: HgResponse, maxEntryId: number): HuntEvidence['entry'] | null {
        let journalEntries = turnResponse.journal_markup;
        if (!journalEntries) { return null; }

        // Filter out stale entries
        this.logger.debug(`Before filtering there's ${journalEntries.length} journal entries.`, {journalEntries, maxEntryId});
        journalEntries = journalEntries.filter(x => x.render_data.entry_id > maxEntryId);
        this.logger.debug(`After filtering there's ${journalEntries.length} journal entries left.`, {journalEntries, maxEntryId});

        // Reject the hunt if a new trap check appears in the same journal window.
        if (journalEntries.some(x => x.render_data.css_class.includes('passive'))) {
            this.logger.info('Found trap check too close to hunt. Aborting.');
            return null;
        }

        const bonus = this.bonusEntries.read(journalEntries, turnResponse);
        this.bonusEntries.submitConvertibles(bonus, turnResponse.inventory);

        // Ignore any friend hunts, trap checks, or custom loot journal entries.
        const journal = bonus.others.filter((markup) => {
            const cssClass = markup.render_data.css_class;
            return /(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/.test(cssClass)
                && cssClass.includes('active');
        }).pop();

        if (journal) {
            this.logger.debug('Found the active hunt', {journal});
        }

        return journal ? {...journal, more_details: bonus.moreDetails} : null;
    }
}
