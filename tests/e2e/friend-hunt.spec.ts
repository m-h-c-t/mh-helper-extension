import type { HgResponse, User } from '@scripts/types/hg';

import { HgResponseBuilder, UserBuilder } from '@tests/utility/builders';
import { LoggingAssertions } from '@tests/utility/logging-assertions';
import nock from 'nock';
import qs from 'qs';

import MockServer from './util/mockServer';
import { soundHorn } from './util/soundHorn';

const intakeUrl = 'https://www.mhct.win/intake.php';
// Captured at collection time, before setup-env installs fake timers in beforeAll.
const realSetTimeout = globalThis.setTimeout;

// main is loaded once per spec file, so the snapshot carries over between tests.
// Tests that need a snapshot seed their own through an active hunt; the no-snapshot test must run first.
describe('MHCT Friend Hunt Submission', () => {
    let server: MockServer;
    let intakeRequests: string[];
    const recordIntake = (req: {path?: string}) => {
        intakeRequests.push(req.path ?? '');
    };

    beforeEach(() => {
        vi.resetAllMocks();
        server = new MockServer();
        intakeRequests = [];
        server.MhctServer.on('request', recordIntake);
    });

    afterEach(() => {
        server.MhctServer.off('request', recordIntake);
        nock.cleanAll();
    });

    /**
     * Flush pending async work (interceptor processing, uuid + intake submission).
     * The mocked network round trips settle on real I/O, which `vi.advanceTimersByTimeAsync`
     * alone does not wait for, so interleave short real-time waits with fake-timer flushes.
     * The `server.on` timeout cannot be used for this: it is a fake timer and never fires.
     */
    async function flush() {
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => realSetTimeout(resolve, 20));
            await vi.advanceTimersByTimeAsync(0);
        }
    }

    function intakeCount() {
        return intakeRequests.filter(p => p.startsWith('/intake.php')).length;
    }

    function user(turn: {num: number, last: number, next?: number}, weapon?: Pick<User, 'weapon_name' | 'weapon_item_id'>): User {
        const builder = new UserBuilder().withTurn({
            num_active_turns: turn.num,
            next_activeturn_seconds: turn.next ?? 900,
            last_active_turn_timestamp: turn.last,
            activeturn_wait_seconds: 900,
        });
        if (weapon) {
            builder.withWeapon(weapon);
        }
        return builder.build();
    }

    function entry(id: number, cssClass: string) {
        return `<div class='${cssClass}' data-entry-id='${id}'></div>`;
    }

    const lootItem = {item_id: 4242, name: 'Tool Token', type: 'mhct_tool_token_stat_item', quantity: 50};
    const linkedLootText = 'I went on a hunt with <a href="https://www.mousehuntgame.com/hunterprofile.php" onclick="hg.utils.User.showProfile(1); return false;">A Friend</a>'
        + ` where I was successful in my hunt! I caught a <a href="https://www.mousehuntgame.com/" onclick="hg.views.MouseView.show('mhct'); return false;">MouseHunt Community Tools Mouse</a>.`
        + '<br /><br /><b>The mouse also dropped the following loot:</b><br />'
        + `3 <a class="loot" title="" href="https://www.mousehuntgame.com/item.php?item_type=${lootItem.type}" onclick="hg.views.ItemView.show('${lootItem.type}'); return false;">Tool Tokens</a>`;

    function markup(id: number, cssClass: string, timestamp: number, text = 'MouseHunt Community Tools Mouse') {
        return [{
            render_data: {
                entry_id: id,
                css_class: cssClass,
                entry_timestamp: timestamp,
                text,
                environment: 'Test Environment',
                entry_date: '12:00 am',
                mouse_type: 'mhct',
            },
        }];
    }

    function linkedPost(postUser: User, entryId: number, text?: string): HgResponse {
        return new HgResponseBuilder()
            .withUnknown({hunters_horn_message: {type: 'recent_linked_turn'}})
            .withUser(postUser)
            .withJournalMarkup(markup(entryId, 'entry short linked catchsuccessloot', 1212100, text))
            .withSuccess(0)
            .build();
    }

    /** Seeds the snapshot through a normal active hunt and waits for its intake request. */
    async function seedActiveHunt(args: {entryId: number, preUser: User, postUser: User, preEntries: string}) {
        // Real activeturn responses carry the inventory, which teaches the item cache.
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({journal: {entries_string: args.preEntries}})
                .withUser(args.preUser)
                .withAuras({})
                .build()
        );
        server.setActiveTurnResponse(
            new HgResponseBuilder()
                .withActiveTurn(true)
                .withUser(args.postUser)
                .withJournalMarkup(markup(args.entryId, 'entry short active catchsuccess', args.postUser.last_active_turn_timestamp))
                .withInventory({[lootItem.type]: lootItem})
                .withAuras({})
                .build()
        );

        const seedIntake = server.on('request', intakeUrl);
        await soundHorn();
        await seedIntake;
        await flush();
        intakeRequests = [];
    }

    it('drops a linked hunt when there is no snapshot', async () => {
        const linkedUser = user({num: 1, last: 1212100});
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({journal: {entries_string: entry(101, 'entry short linked catchsuccess')}})
                .withUser(linkedUser)
                .build()
        );
        server.setActiveTurnResponse(linkedPost(linkedUser, 101));

        await soundHorn();
        await flush();

        expect(intakeCount()).toBe(0);
        LoggingAssertions.expectNoWarningsOrErrors();
    });

    it('ignores success 0 without recent_linked_turn', async () => {
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({journal: {entries_string: entry(101, 'entry short linked catchsuccess')}})
                .build()
        );
        server.setActiveTurnResponse(
            new HgResponseBuilder()
                .withSuccess(0)
                .build()
        );

        await soundHorn();
        await flush();

        expect(intakeCount()).toBe(0);
        LoggingAssertions.expectNoWarningsOrErrors();
    });

    it('submits a linked hunt verified against the snapshot', async () => {
        await seedActiveHunt({
            entryId: 100,
            preUser: user({num: 0, last: 0, next: 0}),
            postUser: user({num: 1, last: 1211200}),
            preEntries: entry(99, 'entry short active catchsuccess'),
        });

        const linkedUser = user({num: 1, last: 1212100});
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({
                    journal: {
                        entries_string: entry(101, 'entry short linked catchsuccess') + entry(100, 'entry short active catchsuccess'),
                    },
                })
                .withUser(linkedUser)
                .withAuras({})
                // Real page.php responses have an empty inventory; loot resolves from the item cache.
                .withUnknown({inventory: []})
                .build()
        );
        server.setActiveTurnResponse(linkedPost(linkedUser, 101, linkedLootText));

        const intakeRequestEvent = server.on('request', intakeUrl);
        await soundHorn();

        try {
            const event = await intakeRequestEvent;
            const actual = qs.parse(await event.request.text());

            expect(actual).toEqual(expect.objectContaining({
                hunt_details: expect.objectContaining({hunt_type: 'linked'}),
                entry_id: '101',
                trap: expect.objectContaining({id: '1111'}),
                mouse: 'MouseHunt Community Tools',
                loot: [expect.objectContaining({id: '4242', name: 'Tool Token', amount: '3'})],
            }));

            // Also proves the recorder + flush used by the negative tests sees a linked intake.
            await flush();
            expect(intakeCount()).toBe(1);
        } finally {
            LoggingAssertions.expectNoWarningsOrErrors();
        }
    });

    it('does not resubmit on a second click', async () => {
        await seedActiveHunt({
            entryId: 150,
            preUser: user({num: 5, last: 1211000, next: 0}),
            postUser: user({num: 6, last: 1211500}),
            preEntries: entry(149, 'entry short active catchsuccess'),
        });

        const linkedUser = user({num: 6, last: 1212100});
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({
                    journal: {
                        entries_string: entry(151, 'entry short linked catchsuccess') + entry(150, 'entry short active catchsuccess'),
                    },
                })
                .withUser(linkedUser)
                .withAuras({})
                .build()
        );
        server.setActiveTurnResponse(linkedPost(linkedUser, 151));

        await soundHorn();
        await flush();
        expect(intakeCount()).toBe(1);

        // Same responses again: the linked entry is now at or below the snapshot's maxEntryId.
        await soundHorn();
        await flush();
        expect(intakeCount()).toBe(1);

        LoggingAssertions.expectNoWarningsOrErrors();
    });

    it('drops a linked hunt when the trap changed', async () => {
        await seedActiveHunt({
            entryId: 200,
            preUser: user({num: 1, last: 1212100, next: 0}),
            postUser: user({num: 2, last: 1212000}),
            preEntries: entry(101, 'entry short linked catchsuccess') + entry(100, 'entry short active catchsuccess'),
        });

        const linkedUser = user({num: 2, last: 1212100}, {weapon_name: 'OtherWeapon Trap', weapon_item_id: 5555});
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({
                    journal: {
                        entries_string: entry(201, 'entry short linked catchsuccess') + entry(200, 'entry short active catchsuccess'),
                    },
                })
                .withUser(linkedUser)
                .withAuras({})
                .build()
        );
        server.setActiveTurnResponse(linkedPost(linkedUser, 201));

        await soundHorn();
        await flush();

        expect(intakeCount()).toBe(0);
        LoggingAssertions.expectNoWarningsOrErrors();
    });
});
