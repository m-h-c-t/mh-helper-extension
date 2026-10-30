import { getEntryIds, getMaxEntryId, isLinkedEntry, isTurnEntry, parseJournalEntriesString } from '@scripts/hunt-recording/journal';
import { hgResponseSchema } from '@scripts/types/hg';
import { HgResponseBuilder } from '@tests/utility/builders';

const journalEntry = (id: number) => ({
    render_data: {
        entry_id: id,
        mouse_type: '',
        css_class: '',
        entry_date: '',
        environment: '',
        entry_timestamp: 0,
        text: '',
    },
});

describe('getEntryIds', () => {
    it('returns every entry id', () => {
        expect(getEntryIds(`<div data-entry-id='3'></div><div data-entry-id='9'></div>`)).toEqual([3, 9]);
    });
});

describe('parseJournalEntriesString', () => {
    it('returns id and css class for each entry', () => {
        expect(parseJournalEntriesString(
            `<div id="journallatestentry" class='entry short linked catchsuccessloot' data-entry-id='344018' data-mouse-type='x'><div class='journalbody'></div></div>` +
            `<div class='entry short misc custom larryGift' data-entry-id='344017'></div>`
        )).toEqual([
            {id: 344018, cssClass: 'entry short linked catchsuccessloot'},
            {id: 344017, cssClass: 'entry short misc custom larryGift'},
        ]);
    });

    it('returns empty cssClass when class missing', () => {
        expect(parseJournalEntriesString(`<div data-entry-id='5'></div>`)).toEqual([{id: 5, cssClass: ''}]);
    });

    it('finds class after the entry id', () => {
        expect(parseJournalEntriesString(`<div data-entry-id='5' class='entry active'></div>`))
            .toEqual([{id: 5, cssClass: 'entry active'}]);
    });
});

describe('getMaxEntryId', () => {
    it('uses the max of journal_markup, page entries and last_read_journal_entry_id', () => {
        const page = {journal: {entries_string: `<div data-entry-id='20'></div><div data-entry-id='15'></div>`}};
        const base = new HgResponseBuilder().withJournalMarkup([journalEntry(10)]).withPage(page);

        expect(getMaxEntryId({...base.build(), last_read_journal_entry_id: 5})).toBe(20);
        expect(getMaxEntryId({...base.build(), last_read_journal_entry_id: 30})).toBe(30);
        expect(getMaxEntryId(new HgResponseBuilder().withJournalMarkup([journalEntry(40)]).withPage(page).build())).toBe(40);
    });

    it('returns 0 when the response has no journal data', () => {
        expect(getMaxEntryId(new HgResponseBuilder().withJournalMarkup([]).build())).toBe(0);
    });
});

describe('isTurnEntry / isLinkedEntry', () => {
    it.each([
        ['entry short active catchsuccessloot', true, false],
        ['entry short linked catchsuccessloot', true, true],
        ['entry short passive catchsuccessloot', true, false],
        ['entry short misc custom socialGift socialGift-send', false, false],
        ['entry short itemtransaction shop_purchase', false, false],
        ['entry short inactive', false, false],
    ])('%s', (css, turn, linked) => {
        expect(isTurnEntry(css)).toBe(turn);
        expect(isLinkedEntry(css)).toBe(linked);
    });
});

describe('hgResponseSchema', () => {
    it('parses hunters_horn_message', () => {
        const parsed = hgResponseSchema.parse({...new HgResponseBuilder().build(), success: 0,
            hunters_horn_message: {type: 'recent_linked_turn', title: 't'}});
        expect(parsed.hunters_horn_message?.type).toBe('recent_linked_turn');
    });
});
