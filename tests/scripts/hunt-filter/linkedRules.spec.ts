import type { LinkedHuntContext } from '@scripts/hunt-filter/linkedRules';
import type { LoggerService } from '@scripts/services/logging';

import { buildLinkedHuntEvidence } from '@scripts/hunt-recording/linked-hunt-evidence';
import { hgResponseSchema } from '@scripts/types/hg';
import { mock } from 'vitest-mock-extended';

import { HgResponseBuilder, UserBuilder } from '../../utility/builders';

const logger = mock<LoggerService>();

const turn = (last: number) => ({
    num_active_turns: 5,
    next_activeturn_seconds: 0,
    last_active_turn_timestamp: last,
    activeturn_wait_seconds: 900,
});

const tag = (id: number, css: string | null) =>
    `<div ${css === null ? '' : `class='${css}' `}data-entry-id='${id}' data-timestamp='1000'></div>`;

const entries = (...parts: [number, string | null][]) => parts.map(([id, css]) => tag(id, css)).join('');

const defaultEntries = (): [number, string | null][] => [
    [103, 'entry short linked catchsuccessloot'],
    [102, 'entry short misc custom larryGift'],
    [101, 'entry short itemtransaction shop_purchase'],
    [100, 'entry short active catchsuccessloot'],
];

function setEntries(c: LinkedHuntContext, ...parts: [number, string | null][]) {
    c.after.page = {journal: {entries_string: entries(...parts)}};
}

function replaceEntry(c: LinkedHuntContext, index: number, entry: [number, string | null]) {
    const e = defaultEntries();
    e[index] = entry;
    setEntries(c, ...e);
}

function validContext(): LinkedHuntContext {
    const before = new HgResponseBuilder()
        .withUser(new UserBuilder().withTurn(turn(100)).build())
        .build();
    const after = new HgResponseBuilder()
        .withUser(new UserBuilder().withTurn(turn(1000)).build())
        .withPage({journal: {entries_string: entries(...defaultEntries())}})
        .build();
    const post = new HgResponseBuilder()
        .withUser(new UserBuilder().withTurn(turn(1000)).build())
        .withJournalMarkup([{
            render_data: {
                entry_id: 103,
                mouse_type: 'mouse',
                css_class: 'entry short linked catchsuccessloot',
                entry_date: '',
                environment: '',
                entry_timestamp: 1000,
                text: '',
            },
        }])
        .withUnknown({success: 0, hunters_horn_message: {type: 'recent_linked_turn'}})
        .build();

    return {snapshot: {response: before, maxEntryId: 100}, after, post, nowSeconds: 1019};
}

describe('buildLinkedHuntEvidence', () => {
    it('builds linked evidence from a valid context', () => {
        const ctx = validContext();
        expect(buildLinkedHuntEvidence(ctx, logger)).toEqual({
            type: 'linked', before: ctx.snapshot!.response, after: ctx.after, entry: ctx.post.journal_markup![0],
        });
    });

    it.each<[string, (c: LinkedHuntContext) => void]>([
        ['rule 1: post success 1', (c) => { c.post.success = 1; }],
        ['rule 1: no hunters_horn_message', (c) => { delete c.post.hunters_horn_message; }],
        ['rule 1: other message type', (c) => { c.post.hunters_horn_message = {type: 'horn_not_ready'}; }],
        ['rule 2: no snapshot', (c) => { c.snapshot = null; }],
        ['rule 2: after success 0', (c) => { c.after.success = 0; }],
        ['rule 2: after has no page', (c) => { c.after.page = undefined; }],
        ['rule 3: page does not reach snapshot', (c) => { setEntries(c, [103, 'entry short linked catchsuccessloot'], [102, 'entry short misc custom larryGift']); }],
        ['rule 3: passive entry in window', (c) => {
            replaceEntry(c, 2, [101, 'entry short passive catchsuccessloot']);
        }],
        ['rule 3: two linked entries', (c) => {
            replaceEntry(c, 1, [102, 'entry short linked catchsuccessloot']);
        }],
        ['rule 3: no new turn entry (already recorded)', (c) => { c.snapshot!.maxEntryId = 103; }],
        ['rule 3: a new entry has no css class', (c) => {
            replaceEntry(c, 1, [102, null]);
        }],
        ['rule 3: new turn entry is active, not linked', (c) => {
            replaceEntry(c, 0, [103, 'entry short active catchsuccessloot']);
        }],
        ['rule 4: entry missing from post journal_markup', (c) => { c.post.journal_markup = []; }],
        ['rule 5: older than 3600s', (c) => { c.nowSeconds = 1000 + 3601; }],
        ['rule 5: more than 30s in the future', (c) => { c.nowSeconds = 1000 - 31; }],
        ['rule 6: before turn timestamp not older', (c) => { c.snapshot!.response.user.last_active_turn_timestamp = 1000; }],
        ['rule 7: after turn timestamp mismatch', (c) => { c.after.user.last_active_turn_timestamp = 999; }],
        ['rule 7: post turn timestamp mismatch', (c) => { c.post.user.last_active_turn_timestamp = 999; }],
        ['rule 8: active turn in between', (c) => { c.after.user.num_active_turns += 1; }],
        ['rule 9: different user', (c) => { c.after.user.user_id += 1; }],
    ])('rejects: %s', (_, mutate) => {
        const ctx = validContext();
        mutate(ctx);
        expect(buildLinkedHuntEvidence(ctx, logger)).toBeNull();
    });

    it.each([[null], [[]]])('rejects (rule 1) a post whose hunters_horn_message is %j', (value) => {
        const ctx = validContext();
        ctx.post = hgResponseSchema.parse({...ctx.post, hunters_horn_message: value});
        expect(buildLinkedHuntEvidence(ctx, logger)).toBeNull();
    });

    it.each([1000 + 3600, 1000 - 30])('accepts at the edges of the age window (now=%i)', (now) => {
        const ctx = validContext();
        ctx.nowSeconds = now;
        expect(buildLinkedHuntEvidence(ctx, logger)).not.toBeNull();
    });

    it('logs failures at debug only', () => {
        const l = mock<LoggerService>();
        const ctx = validContext();
        ctx.snapshot = null;
        buildLinkedHuntEvidence(ctx, l);
        expect(l.debug).toHaveBeenCalled();
        expect(l.warn).not.toHaveBeenCalled();
        expect(l.error).not.toHaveBeenCalled();
    });
});
