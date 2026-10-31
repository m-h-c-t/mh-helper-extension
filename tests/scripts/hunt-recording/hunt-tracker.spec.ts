// @vitest-environment happy-dom
import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { ApiService } from '@scripts/services/api.service';
import type { HgGlobalsService } from '@scripts/services/hg-globals.service';
import type { InterceptorEventMap, InterceptorService, RequestEventParams, ResponseEventParams } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { MouseRipApiService, MouseRipItem } from '@scripts/services/mouserip-api.service';
import type { UserSettings } from '@scripts/services/settings/settings.service';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse } from '@scripts/types/hg';

import { HuntTracker } from '@scripts/hunt-recording/hunt-tracker';
import { HgResponseBuilder, UserBuilder } from '@tests/utility/builders';
import $ from 'jquery';
import { mock } from 'vitest-mock-extended';

type EventName = keyof InterceptorEventMap;
type EventParams = RequestEventParams | ResponseEventParams;
type Listener = (params: EventParams) => void | Promise<void>;

/** Minimal stand-in for InterceptorService; the real one patches fetch/XHR when constructed. */
class FakeInterceptor {
    private readonly listeners: Record<EventName, Listener[]> = {request: [], response: []};

    on(eventName: EventName, listener: Listener) {
        this.listeners[eventName].push(listener);
        return this;
    }

    off(eventName: EventName, listener: Listener) {
        this.listeners[eventName] = this.listeners[eventName].filter(l => l !== listener);
        return this;
    }

    async emit(eventName: EventName, params: EventParams) {
        for (const listener of [...this.listeners[eventName]]) {
            await listener(params);
        }
    }
}

const activeTurnUrl = new URL('https://www.mousehuntgame.com/managers/ajax/turns/activeturn.php');

describe('HuntTracker', () => {
    let interceptor: FakeInterceptor;
    let apiService: ReturnType<typeof mock<ApiService>>;
    let submissionService: ReturnType<typeof mock<SubmissionService>>;
    let hgGlobals: ReturnType<typeof mock<HgGlobalsService>>;
    let mouseRipApi: ReturnType<typeof mock<MouseRipApiService>>;
    let tracker: HuntTracker;

    const soundHorn = async (requestId: string, post: HgResponse) => {
        const request: RequestEventParams = {url: activeTurnUrl, requestId, request: {}};
        await interceptor.emit('request', request);
        const response: ResponseEventParams = {...request, response: post};
        await interceptor.emit('response', response);
    };

    beforeAll(() => {
        (globalThis as unknown as {$: unknown}).$ = $;
    });

    beforeEach(() => {
        interceptor = new FakeInterceptor();
        apiService = mock<ApiService>();
        submissionService = mock<SubmissionService>();
        hgGlobals = mock<HgGlobalsService>();
        hgGlobals.getUser.mockReturnValue(new UserBuilder().build());
        hgGlobals.getLastReadJournalEntryId.mockReturnValue(1337);
        mouseRipApi = mock<MouseRipApiService>();
        mouseRipApi.getAllItems.mockResolvedValue([]);
    });

    /** Constructed per test (not in beforeEach) so tests can stub mouse.rip before init loads the item list. */
    const startTracker = () => {
        tracker = new HuntTracker(
            mock<LoggerService>(),
            interceptor as unknown as InterceptorService,
            apiService,
            submissionService,
            mock<ExtensionLog>(),
            hgGlobals,
            mouseRipApi,
            () => ({'tracking-events': false}) as UserSettings,
        );
        tracker.init();
    };

    /** Lets async work queued by the tracker (the item cache wait, submission) run. */
    const settle = () => new Promise(resolve => setTimeout(resolve, 0));

    describe('active hunts', () => {
        beforeEach(startTracker);

        const pagePre = () => new HgResponseBuilder()
            .withPage({journal: {entries_string: `data-entry-id='0'`}})
            .build();

        const activeTurnPost = () => new HgResponseBuilder()
            .withActiveTurn(true)
            .withUser(new UserBuilder()
                .withTurn({num_active_turns: 1, next_activeturn_seconds: 900, last_active_turn_timestamp: 0, activeturn_wait_seconds: 900})
                .build())
            .withJournalMarkup([{
                render_data: {
                    entry_id: 1,
                    css_class: 'active catchsuccess',
                    entry_timestamp: 419,
                    text: 'MouseHunt Community Tools Mouse',
                    environment: 'Test Environment',
                    entry_date: '12:00 am',
                    mouse_type: 'mhct',
                },
            }])
            .build();

        it('fetches page.php with the page globals and submits the hunt', async () => {
            apiService.send.mockResolvedValue(pagePre());

            await soundHorn('r1', activeTurnPost());

            expect(apiService.send).toHaveBeenCalledWith('POST', '/managers/ajax/pages/page.php', expect.objectContaining({
                page_class: 'Camp',
                last_read_journal_entry_id: 1337,
                uh: hgGlobals.getUser().unique_hash,
            }), true);
            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            expect(submissionService.submitHunt.mock.calls[0][0].entry_id).toBe(1);
        });

        it('ignores responses for other requests', async () => {
            apiService.send.mockResolvedValue(pagePre());

            await interceptor.emit('request', {url: activeTurnUrl, requestId: 'r1', request: {}});
            await interceptor.emit('response', {url: activeTurnUrl, requestId: 'other', request: {}, response: activeTurnPost()});

            expect(submissionService.submitHunt).not.toHaveBeenCalled();
        });

        it('ignores requests to other endpoints', async () => {
            await interceptor.emit('request', {url: new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php'), requestId: 'r1', request: {}});

            expect(apiService.send).not.toHaveBeenCalled();
        });
    });

    describe('linked hunts', () => {
        const nowSeconds = () => Math.floor(Date.now() / 1000);
        const lootType = 'mhct_tool_token_stat_item';
        const lootText = `I went on a hunt with a friend where I was successful in my hunt! I caught a `
            + `<a href="https://www.mousehuntgame.com/" onclick="hg.views.MouseView.show('mhct'); return false;">MouseHunt Community Tools Mouse</a>.`
            + '<br /><br /><b>The mouse also dropped the following loot:</b><br />'
            + `3 <a class="loot" title="" href="https://www.mousehuntgame.com/item.php?item_type=${lootType}" onclick="hg.views.ItemView.show('${lootType}'); return false;">Tool Tokens</a>`;
        const toolToken: MouseRipItem = {id: 4242, type: lootType, name: 'Tool Token'};

        const withTurn = (last_active_turn_timestamp: number) => new UserBuilder()
            .withTurn({num_active_turns: 1, next_activeturn_seconds: 900, last_active_turn_timestamp, activeturn_wait_seconds: 900})
            .build();

        /** Seeds a before-snapshot through an active hunt, then sounds the horn into a qualifying friend hunt. */
        const huntWithFriend = async (text = 'MouseHunt Community Tools Mouse') => {
            const linkedTimestamp = nowSeconds() - 20;

            // The previous active hunt is the before-snapshot.
            await interceptor.emit('response', {
                url: activeTurnUrl,
                requestId: 'seed',
                request: {},
                response: new HgResponseBuilder()
                    .withAuras({})
                    .withUser(withTurn(linkedTimestamp - 900))
                    .withJournalMarkup([{
                        render_data: {
                            entry_id: 100, css_class: 'entry short active catchsuccess', entry_timestamp: linkedTimestamp - 900,
                            text: '', environment: '', entry_date: '', mouse_type: '',
                        },
                    }])
                    .build(),
            });

            const pagePhp = new HgResponseBuilder()
                .withAuras({})
                .withUser(withTurn(linkedTimestamp))
                .withPage({journal: {entries_string:
                    `<div class='entry short linked catchsuccess' data-entry-id='101'></div>` +
                    `<div class='entry short active catchsuccess' data-entry-id='100'></div>`,
                }})
                .withUnknown({inventory: []})
                .build();

            // Like the real page.php call, its response passes through the interceptor before the fetch resolves.
            apiService.send.mockImplementation(async () => {
                await interceptor.emit('response', {
                    url: new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php'),
                    requestId: 'page',
                    request: {},
                    response: pagePhp,
                });
                return pagePhp;
            });

            const linkedPost = new HgResponseBuilder()
                .withUser(withTurn(linkedTimestamp))
                .withJournalMarkup([{
                    render_data: {
                        entry_id: 101, css_class: 'entry short linked catchsuccess', entry_timestamp: linkedTimestamp,
                        text, environment: 'Test Environment', entry_date: '', mouse_type: 'mhct',
                    },
                }])
                .withUnknown({success: 0, hunters_horn_message: {type: 'recent_linked_turn'}})
                .build();

            await soundHorn('r1', linkedPost);
            await settle();
        };

        it('uses the snapshot from before the page.php fetch, even though page.php replaces it', async () => {
            startTracker();

            await huntWithFriend();

            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            const message = submissionService.submitHunt.mock.calls[0][0];
            expect(message.entry_id).toBe(101);
            expect(message.hunt_details?.hunt_type).toBe('linked');
        });

        it('resolves loot from the mouse.rip item list', async () => {
            mouseRipApi.getAllItems.mockResolvedValue([toolToken]);
            startTracker();

            await huntWithFriend(lootText);

            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            expect(submissionService.submitHunt.mock.calls[0][0].loot).toEqual([
                expect.objectContaining({id: 4242, name: 'Tool Token', amount: 3}),
            ]);
        });

        it('waits for the mouse.rip item list when the horn sounds before it loads', async () => {
            let finishLoading!: (items: MouseRipItem[]) => void;
            mouseRipApi.getAllItems.mockReturnValue(new Promise((resolve) => { finishLoading = resolve; }));
            startTracker();

            await huntWithFriend(lootText);
            expect(submissionService.submitHunt).not.toHaveBeenCalled();

            finishLoading([toolToken]);
            await settle();

            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            expect(submissionService.submitHunt.mock.calls[0][0].loot).toEqual([
                expect.objectContaining({id: 4242}),
            ]);
        });

        it('drops a friend hunt whose loot mouse.rip does not know', async () => {
            startTracker();

            await huntWithFriend(lootText);

            expect(submissionService.submitHunt).not.toHaveBeenCalled();
        });

        it('ignores unsuccessful responses that are not friend hunts', async () => {
            startTracker();
            apiService.send.mockResolvedValue(new HgResponseBuilder().build());

            await soundHorn('r1', new HgResponseBuilder().withUnknown({success: 0}).build());
            await settle();

            expect(submissionService.submitHunt).not.toHaveBeenCalled();
        });
    });
});
