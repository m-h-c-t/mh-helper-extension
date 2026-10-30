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
// These tests must stay in this order.
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

    function markup(id: number, cssClass: string, timestamp: number) {
        return [{
            render_data: {
                entry_id: id,
                css_class: cssClass,
                entry_timestamp: timestamp,
                text: 'MouseHunt Community Tools Mouse',
                environment: 'Test Environment',
                entry_date: '12:00 am',
                mouse_type: 'mhct',
            },
        }];
    }

    function linkedPost(postUser: User, entryId: number): HgResponse {
        return new HgResponseBuilder()
            .withUnknown({hunters_horn_message: {type: 'recent_linked_turn'}})
            .withUser(postUser)
            .withJournalMarkup(markup(entryId, 'entry short linked catchsuccess', 1212100))
            .build();
    }

    /** Seeds the snapshot through a normal active hunt and waits for its intake request. */
    async function seedActiveHunt(args: {entryId: number, preUser: User, postUser: User, preEntries: string}) {
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
                .build()
        );
        server.setActiveTurnResponse(linkedPost(linkedUser, 101));

        const intakeRequestEvent = server.on('request', intakeUrl);
        await soundHorn();

        try {
            const event = await intakeRequestEvent;
            const actual = qs.parse(await event.request.text());

            expect(actual).toEqual(expect.objectContaining({
                hunt_details: expect.objectContaining({hunt_type: 'linked'}),
                entry_id: '101',
                trap: expect.objectContaining({id: '1111'}),
            }));

            // Also proves the recorder + flush used by the negative tests sees a linked intake.
            await flush();
            expect(intakeCount()).toBe(1);
        } finally {
            LoggingAssertions.expectNoWarningsOrErrors();
        }
    });

    it('does not resubmit on a second click', async () => {
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
                .build()
        );
        server.setActiveTurnResponse(linkedPost(linkedUser, 101));

        await soundHorn();
        await flush();

        expect(intakeCount()).toBe(0);
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
