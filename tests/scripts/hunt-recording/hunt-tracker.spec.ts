// @vitest-environment happy-dom
import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { ApiService } from '@scripts/services/api.service';
import type { HgGlobalsService } from '@scripts/services/hg-globals.service';
import type { InterceptorEventMap, InterceptorService, RequestEventParams, ResponseEventParams } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { MouseRipApiService, MouseRipItem } from '@scripts/services/mouserip-api.service';
import type { UserSettings } from '@scripts/services/settings/settings.service';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

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

const cherryPotion: MouseRipItem = {id: 1234, type: 'cherry_potion', name: 'Cherry Potion'};
const boilingCauldronTrap = {id: 3304, name: 'Boiling Cauldron Trap', quantity: 1};

/** A Boiling Cauldron Trap proc, as it appears in journal_markup ahead of the hunt it came with. */
const cauldronBonusEntry = (entry_id: number, entry_timestamp: number): JournalMarkup => ({
    render_data: {
        entry_id,
        css_class: 'entry short misc custom boiling_cauldron_potion_bonus boon_potion_bonus minimalJournalImage',
        entry_timestamp,
        text: 'My Boiling Cauldron Trap summoned additional arcane energy from my Alchemist\'s Cookbook Base and brewed 2 '
            + '<a class="" title="" href="https://www.mousehuntgame.com/item.php?item_type=cherry_potion" onclick="hg.views.ItemView.show(\'cherry_potion\'); return false;">Cherry Potions</a>!',
        environment: '',
        entry_date: '',
        mouse_type: '',
    },
});

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

    afterEach(() => {
        vi.useRealTimers();
    });

    /** Lets async work queued by the tracker (the item cache wait, submission) run. */
    const settle = () => vi.isFakeTimers()
        ? vi.advanceTimersByTimeAsync(0)
        : new Promise(resolve => setTimeout(resolve, 0));

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

        it('records an active hunt without modifying the intercepted journal entry', async () => {
            apiService.send.mockResolvedValue(pagePre());
            const post = activeTurnPost();
            Object.freeze(post.journal_markup![0]);

            await soundHorn('r1', post);

            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            expect(post.journal_markup![0]).not.toHaveProperty('more_details');
        });

        describe('with a bonus journal entry', () => {
            const activeTurnPostWithCauldron = (inventory: Parameters<HgResponseBuilder['withInventory']>[0]) => {
                const post = activeTurnPost();
                post.journal_markup = [cauldronBonusEntry(1, 418), {
                    ...post.journal_markup![0],
                    render_data: {...post.journal_markup![0].render_data, entry_id: 2},
                }];
                post.inventory = inventory;
                return post;
            };

            it('adds the bonus detail to the hunt and submits the convertible from the activeturn inventory', async () => {
                apiService.send.mockResolvedValue(pagePre());

                await soundHorn('r1', activeTurnPostWithCauldron({
                    cherry_potion: {item_id: 1234, name: 'Cherry Potion', type: 'cherry_potion', quantity: 2},
                }));

                expect(submissionService.submitHunt).toHaveBeenCalledOnce();
                expect(submissionService.submitHunt.mock.calls[0][0].hunt_details).toEqual(expect.objectContaining({
                    boiling_cauldron_trap_bonus: true,
                }));
                expect(submissionService.submitItemConvertible).toHaveBeenCalledExactlyOnceWith(boilingCauldronTrap, [
                    {id: 1234, name: 'Cherry Potion', quantity: 1},
                ]);
            });

            it('falls back to the item cache when the activeturn inventory lacks the convertible item', async () => {
                apiService.send.mockResolvedValue(pagePre());
                await interceptor.emit('response', {
                    url: new URL('https://www.mousehuntgame.com/managers/ajax/users/userInventory.php'),
                    requestId: 'inventory',
                    request: {},
                    response: new HgResponseBuilder()
                        .withInventory({cherry_potion: {item_id: 1234, name: 'Cherry Potion', type: 'cherry_potion', quantity: 2}})
                        .build(),
                });

                await soundHorn('r1', activeTurnPostWithCauldron({}));

                expect(submissionService.submitItemConvertible).toHaveBeenCalledExactlyOnceWith(boilingCauldronTrap, [
                    {id: 1234, name: 'Cherry Potion', quantity: 1},
                ]);
            });
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

        /**
         * Seeds a before-snapshot through an active hunt, then sounds the horn into a friend hunt
         * that qualifies unless `ageSeconds` puts it outside the allowed window.
         * Bonus entries take the ids after the snapshot, and the linked entry comes after them.
         */
        const huntWithFriend = async (text = 'MouseHunt Community Tools Mouse', {ageSeconds = 20, withCauldron = false} = {}) => {
            const linkedTimestamp = nowSeconds() - ageSeconds;
            const bonusEntries = withCauldron ? [cauldronBonusEntry(101, linkedTimestamp - 3)] : [];
            const linkedEntryId = 101 + bonusEntries.length;

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
                    `<div class='entry short linked catchsuccess' data-entry-id='${linkedEntryId}'></div>` +
                    bonusEntries.map(e => `<div class='${e.render_data.css_class}' data-entry-id='${e.render_data.entry_id}'></div>`).join('') +
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
                        entry_id: linkedEntryId, css_class: 'entry short linked catchsuccess', entry_timestamp: linkedTimestamp,
                        text, environment: 'Test Environment', entry_date: '', mouse_type: 'mhct',
                    },
                }, ...bonusEntries])
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

        it('does not wait for the mouse.rip item list when the friend hunt has no loot', async () => {
            mouseRipApi.getAllItems.mockReturnValue(new Promise(() => undefined));
            startTracker();

            await huntWithFriend();

            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
        });

        it('records with the cached items once the wait for a stalled mouse.rip item list expires', async () => {
            vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
            mouseRipApi.getAllItems.mockReturnValue(new Promise(() => undefined));
            startTracker();

            await huntWithFriend(lootText);
            expect(submissionService.submitHunt).not.toHaveBeenCalled();

            // An inventory seen while waiting teaches the cache the loot item.
            await interceptor.emit('response', {
                url: new URL('https://www.mousehuntgame.com/managers/ajax/users/userInventory.php'),
                requestId: 'inventory',
                request: {},
                response: new HgResponseBuilder()
                    .withInventory({[lootType]: {item_id: 4242, name: 'Tool Token', type: lootType, quantity: 3}})
                    .build(),
            });
            await vi.advanceTimersByTimeAsync(10_000);

            expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            expect(submissionService.submitHunt.mock.calls[0][0].loot).toEqual([
                expect.objectContaining({id: 4242, name: 'Tool Token', amount: 3}),
            ]);
        });

        it('drops a friend hunt whose loot mouse.rip does not know', async () => {
            startTracker();

            await huntWithFriend(lootText);

            expect(submissionService.submitHunt).not.toHaveBeenCalled();
        });

        describe('with a bonus journal entry', () => {
            it('adds the bonus detail to the hunt and submits the convertible from the mouse.rip item list', async () => {
                mouseRipApi.getAllItems.mockResolvedValue([cherryPotion]);
                startTracker();

                await huntWithFriend(undefined, {withCauldron: true});

                expect(submissionService.submitHunt).toHaveBeenCalledOnce();
                const message = submissionService.submitHunt.mock.calls[0][0];
                expect(message.entry_id).toBe(102);
                expect(message.hunt_details).toEqual(expect.objectContaining({boiling_cauldron_trap_bonus: true}));
                expect(submissionService.submitItemConvertible).toHaveBeenCalledExactlyOnceWith(boilingCauldronTrap, [
                    {id: 1234, name: 'Cherry Potion', quantity: 1},
                ]);
            });

            it('waits for the mouse.rip item list to resolve the convertible item', async () => {
                let finishLoading!: (items: MouseRipItem[]) => void;
                mouseRipApi.getAllItems.mockReturnValue(new Promise((resolve) => { finishLoading = resolve; }));
                startTracker();

                await huntWithFriend(undefined, {withCauldron: true});
                expect(submissionService.submitItemConvertible).not.toHaveBeenCalled();

                finishLoading([cherryPotion]);
                await settle();

                expect(submissionService.submitItemConvertible).toHaveBeenCalledExactlyOnceWith(boilingCauldronTrap, [
                    {id: 1234, name: 'Cherry Potion', quantity: 1},
                ]);
                expect(submissionService.submitHunt).toHaveBeenCalledOnce();
            });

            it('does not submit the convertible when the friend hunt fails the linked checks', async () => {
                mouseRipApi.getAllItems.mockResolvedValue([cherryPotion]);
                startTracker();

                await huntWithFriend(undefined, {withCauldron: true, ageSeconds: 4000});

                expect(submissionService.submitHunt).not.toHaveBeenCalled();
                expect(submissionService.submitItemConvertible).not.toHaveBeenCalled();
            });
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
