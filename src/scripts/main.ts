/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { ResponseEventParams } from './services/interceptor.service';
import type { UserSettings } from './services/settings/settings.service';
import type { User } from './types/hg';

import { IntakeRejectionEngine } from './hunt-filter/engine';
import { ActiveHuntEvidence } from './hunt-recording/active-hunt-evidence';
import { HuntRecorder } from './hunt-recording/hunt-recorder';
import { ItemCache } from './hunt-recording/item-cache';
import { buildLinkedHuntEvidence } from './hunt-recording/linked-hunt-evidence';
import { SnapshotStore } from './hunt-recording/snapshot-store';
import * as successHandlers from './modules/ajax-handlers';
import { BadgeTimer } from './modules/badge-timer/badge-timer';
import { CrownTracker } from './modules/crown-tracker/crown-tracker';
import { ExtensionLog } from './modules/extension-log/extension-log';
import { ApiService } from './services/api.service';
import { EnvironmentService } from './services/environment.service';
import { InterceptorService } from './services/interceptor.service';
import { ConsoleLogger, LogLevel } from './services/logging';
import { MouseRipApiService } from './services/mouserip-api.service';
import { SubmissionService } from './services/submission.service';
import { hgResponseSchema } from './types/hg';
import { HornHud } from './util/hornHud';

declare global {
    interface Window {
        jQuery: JQueryStatic;
        $: JQueryStatic;
        lastReadJournalEntryId: number;
        tsitu_loader_offset?: number;
    }

    // Direct globals (not on window)
    var user: User;
    var lastReadJournalEntryId: number;
}

(function () {
    let mhhh_version = 0;
    let hunter_id_hash = '0';
    let userSettings: UserSettings;
    let settingsPromise: Promise<UserSettings> | null = null;

    const isDev = process.env.ENV === 'development';
    const logger = new ConsoleLogger(isDev, shouldFilter);
    const extensionLog = new ExtensionLog();
    const apiService = new ApiService(() => mhhh_version);
    const environmentService = new EnvironmentService();
    const rejectionEngine = new IntakeRejectionEngine(logger);
    const submissionService = new SubmissionService(logger, environmentService, apiService, getSettingsAsync,
        () => ({
            hunter_id_hash,
            mhhh_version,
        }),
        showFlashMessage
    );
    const activeHuntEvidence = new ActiveHuntEvidence(logger, rejectionEngine, submissionService, extensionLog, () => userSettings);
    const interceptorService = new InterceptorService(logger, extensionLog, submissionService);
    const snapshotStore = new SnapshotStore(interceptorService);
    const itemCache = new ItemCache(interceptorService);
    const huntRecorder = new HuntRecorder(logger, rejectionEngine, submissionService, itemCache);
    const mouseRipApiService = new MouseRipApiService(apiService);
    const ajaxSuccessHandlers = [
        new successHandlers.BountifulBeanstalkRoomTrackerAjaxHandler(logger, showFlashMessage),
        new successHandlers.GWHGolemAjaxHandler(logger, showFlashMessage),
        new successHandlers.KingsGiveawayAjaxHandler(logger, submissionService, mouseRipApiService),
        new successHandlers.CheesyPipePartyAjaxHandler(logger, submissionService),
        new successHandlers.SBFactoryAjaxHandler(logger, submissionService),
        new successHandlers.SEHAjaxHandler(logger, submissionService),
        new successHandlers.SpookyShuffleAjaxHandler(logger, submissionService),
        new successHandlers.TreasureMapHandler(logger, submissionService),
        new successHandlers.UseConvertibleAjaxHandler(logger, submissionService),
    ];
    const crownTracker = new CrownTracker(logger, extensionLog, interceptorService, apiService, showFlashMessage);
    const badgeTimer = new BadgeTimer(interceptorService);

    async function main() {
        try {
            if (!window.jQuery) {
                throw new Error('Can\'t find jQuery.');
            }

            userSettings = await getSettingsAsync();
            await initialLoad();
            addWindowMessageListeners();
            addAjaxHandlers();
            finalLoad();

            if (userSettings['tracking-crowns']) {
                crownTracker.init();
            }
            badgeTimer.init();
        } catch (error) {
            logger.error('Failed to initialize.', error);
        }
    }

    async function getSettingsAsync(): Promise<UserSettings> {
    // If there's already a promise in progress, return it
        if (settingsPromise) {
            return settingsPromise;
        }

        settingsPromise = new Promise<UserSettings>((resolve, reject) => {
            const getSettingsTimeout = setTimeout(() => {
                window.removeEventListener('message', listenSettings);
                reject(new Error('Timeout waiting for settings.'));
            }, 60000);

            // Set up message listener
            function listenSettings(event: MessageEvent) {
                if (event.data.mhct_settings_response !== 1) {
                    return;
                }

                // Clean up
                clearTimeout(getSettingsTimeout);
                window.removeEventListener('message', listenSettings);

                resolve(event.data.settings as UserSettings);
            }

            window.addEventListener('message', listenSettings);
            window.postMessage({mhct_settings_request: 1}, '*');
        });

        try {
            const result = await settingsPromise;
            return result;
        } catch (error) {
        // Clear the promise on error so subsequent calls can retry
            settingsPromise = null;
            throw error;
        }
    }

    function getExtensionVersion() {
        const version = $('#mhhh_version').val() as string;

        // split version and convert to padded number number format
        // 0.0.0 -> 000000
        // 1.0.1 -> 100001

        const [major, minor, patch] = version.split('.');

        return Number(
            (major?.padStart(2, '0') ?? '00') +
            (minor?.padStart(2, '0') ?? '00') +
            (patch?.padStart(2, '0') ?? '00')
        );
    }

    // Create hunter id hash using Crypto Web API
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    async function createHunterIdHash() {
        if (typeof user.user_id === 'undefined') {
            // No problem if user is not logged in yet.
            // This function will be called on logins (ajaxSuccess on session.php)
            logger.debug('User is not logged in yet.');
            return;
        }

        const user_id = user.user_id.toString().trim();
        const msgUint8 = new TextEncoder().encode(user_id);
        const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hunter_id_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        logger.debug('createHunterIdHash:', {
            hunter_id: user_id,
            hunter_id_hash,
        });
    }

    async function initialLoad() {
        if (isDev) {
            logger.debug('Debug mode activated');
            logger.info('Test version detected, turning on debug mode and pointing to server on localhost');
        }

        logger.debug('initialLoad ran with settings', {userSettings});

        mhhh_version = getExtensionVersion();
        await createHunterIdHash();
    }

    function shouldFilter(level: LogLevel) {
        let filterLevel = LogLevel.Info;
        switch (userSettings['general-log-level'] ?? '') {
            case 'debug':
                filterLevel = LogLevel.Debug;
                break;
            case 'info':
                filterLevel = LogLevel.Info;
                break;
            case 'warn':
                filterLevel = LogLevel.Warn;
                break;
            case 'error':
                filterLevel = LogLevel.Error;
                break;
        }
        return !isDev && level <= filterLevel;
    };

    // Listening for calls
    function addWindowMessageListeners() {
        window.addEventListener('message', (ev) => {
            if (ev.data.mhct_message == null) {
                return;
            }

            if (ev.data.mhct_message === 'userhistory') {
                window.open(`${environmentService.getBaseUrl()}/searchByUser.php?hunter_id=${hunter_id_hash}`);
                return;
            }

            if (ev.data.mhct_message === 'mhmh'
                || ev.data.mhct_message === 'ryonn') {
                openMapMiceSolver(ev.data.mhct_message);
                return;
            }

            // from popup
            if (ev.data.mhct_message === 'horn') {
                void HornHud.soundHorn();
                return;
            }

            if ('tsitu_loader' === ev.data.mhct_message) {
                window.tsitu_loader_offset = ev.data.tsitu_loader_offset;
                openBookmarklet(ev.data.file_link);
                return;
            }

            // Crown submission results in either the boolean `false`, or the total submitted crowns.
            if (ev.data.mhct_message === 'crownSubmissionStatus') {
                const counts = ev.data.submitted;
                if (counts) {
                    showFlashMessage('success',
                        `Submitted ${counts} crowns for ${$('span[class*="titleBar-name"]').text()}.`);
                } else if (counts != null) {
                    showFlashMessage('error', 'There was an issue submitting crowns on the backend.');
                } else {
                    logger.debug('Skipped submission (already sent).');
                }
                return;
            }
        }, false);
    }

    function openBookmarklet(menuURL: string) {
        void fetch(menuURL).then(response => response.text()).then((data) => {
            const url = new URL(menuURL);
            // FireFox will still have EXTENSION_URL in the code, so replace with origin of URL (moz-extension://<internal_uuid>/)
            data = data.replace('EXTENSION_URL', url.origin);

            const s = document.createElement('script');
            s.text = data;
            (document.head || document.documentElement).appendChild(s);
            s.onload = () => {
                s.remove();
            };
        });
    }

    // Get map mice
    function openMapMiceSolver(solver: string) {
        let url = '';
        let glue = '';
        let method = '';
        let input_name = '';
        if (solver === 'mhmh') {
            url = environmentService.getMapHelperUrl();
            glue = '\n';
            method = 'POST';
            input_name = 'mice';
        } else if (solver === 'ryonn') {
            url = 'http://dbgames.info/mousehunt/tavern';
            glue = ';';
            method = 'GET';
            input_name = 'q';
        } else {
            return;
        }

        const mapId = user.quests.QuestRelicHunter?.default_map_id;

        if (!mapId) {
            alert('You are not currently a member of a treasure map.');
            return;
        }

        const payload = {
            map_id: mapId,
            action: 'map_info',
            uh: user.unique_hash,
            last_read_journal_entry_id: lastReadJournalEntryId,
        };
        apiService.send('POST', 'https://www.mousehuntgame.com/managers/ajax/users/treasuremap_v2.php', payload, true)
            .then((data: any) => {
                if (data) {
                    if (!data.treasure_map || data.treasure_map.view_state === 'noMap') {
                        return;
                    }
                    if (!['treasure', 'event'].includes(data.treasure_map.map_class)) {
                        alert('This seems to be a new kind of map and not yet supported.');
                        return;
                    }
                    const mice = getMapMice(data, true);
                    $('<form method="' + method + '" action="' + url + '" target="_blank">' +
                        '<input type="hidden" name="' + input_name + '" value="' + mice.join(glue) +
                        '"></form>').appendTo('body').submit().remove();
                }
            })
            .catch((error) => {
                logger.error('Failed to fetch treasure map info', error);
            });
    }

    // Extract map mice from a map
    function getMapMice(data: any, uncaught_only: boolean) {
        const mice: Record<string, string> = {};
        $.each(data.treasure_map.goals.mouse, (key, mouse) => {
            mice[mouse.unique_id] = mouse.name;
        });

        if (uncaught_only) {
            $.each(data.treasure_map.hunters, (key, hunter) => {
                $.each(hunter.completed_goal_ids.mouse, (key, mouse_id) => {
                    delete mice[mouse_id];
                });
            });
        }

        return Object.values(mice);
    }

    /**
     * Wrapper for flash message pop-up, when settings need to be acquired.
     * @param {"error"|"warning"|"success"} type The type of message being displayed, which controls the color and duration.
     * @param {string} message The message content to display.
     */
    function showFlashMessage(type: string, message: string) {
        window.postMessage({
            mhct_display_message: 1,
            type,
            message,
        });
    }

    /**
     * Before allowing a hunt submission, first request an updated user object that reflects the effect
     * of any outside actions, such as setup changes from the mobile app, a different tab, or trap checks.
     */
    function setupPreHuntFetch() {
        interceptorService.on('request', async (requestEvent) => {
            if (requestEvent.url.pathname !== '/managers/ajax/turns/activeturn.php') {
                return;
            }

            // Read the snapshot before fetching page.php, whose response also passes through the interceptor.
            const snapshot = snapshotStore.latest();

            logger.debug('Fetching user object before hunting', performance.now());
            const pageResponse = await apiService.send('POST',
                '/managers/ajax/pages/page.php',
                {
                    sn: 'Hitgrab',
                    hg_is_ajax: 1,
                    page_class: 'Camp',
                    last_read_journal_entry_id: lastReadJournalEntryId,
                    uh: user.unique_hash
                },
                true
            );

            const handleResponse = (responseEvent: ResponseEventParams) => {
                if (responseEvent.requestId !== requestEvent.requestId) {
                    return;
                }

                interceptorService.off('response', handleResponse);
                const post = responseEvent.response;

                if (post.success === 1) {
                    const evidence = activeHuntEvidence.build(pageResponse, post);
                    if (evidence) huntRecorder.record(evidence);
                    return;
                }

                if (post.success === 0 && post.hunters_horn_message?.type === 'recent_linked_turn') {
                    const afterParse = hgResponseSchema.safeParse(pageResponse);
                    if (!afterParse.success) {
                        logger.debug('Linked hunt dropped: unexpected page response');
                        return;
                    }

                    const evidence = buildLinkedHuntEvidence({
                        snapshot,
                        after: afterParse.data,
                        post,
                        nowSeconds: Math.floor(Date.now() / 1000),
                    }, logger);
                    if (evidence) huntRecorder.record(evidence);
                }
            };

            interceptorService.on('response', handleResponse);
        });
    }

    // Listening routers
    function addAjaxHandlers() {
        if (userSettings['tracking-hunts']) {
            snapshotStore.init();
            itemCache.init();
            setupPreHuntFetch();
        }

        interceptorService.on('request', async (details) => {
            if (details.url.pathname === '/managers/ajax/users/session.php') {
                await createHunterIdHash();
            }
        });

        if (userSettings['tracking-events']) {
            interceptorService.on('response', async (details) => {
                for (const handler of ajaxSuccessHandlers) {
                    if (handler.match(details.url.toString())) {
                        try {
                            await handler.execute(details.response);
                        } catch (e) {
                            logger.error(`AJAX handler failed for ${handler.constructor.name}`, {
                                error: e,
                                ...details
                            });
                        }
                    }
                }
            });
        }
    }

    function escapeButtonClose() {
        if (userSettings['enhancement-escape-dismiss'] === false) {
            return;
        }

        $(document).on('keyup', (e: JQuery.KeyUpEvent) => {
            const elements = $('a[id*=jsDialogClose],input[class*=jsDialogClose],a[class*=messengerUINotificationClose],a[class*=closeButton],input[value*=Close]');
            if (elements.length === 0) {
                return;
            }

            if (e.key === 'Escape' && elements.length > 0) {
                elements.each(function () {
                    $(this).trigger('click');
                });
            }
        });
    }

    // Finish configuring the extension behavior.
    function finalLoad() {
        escapeButtonClose();

        // Tell content script we are done loading
        window.postMessage({
            mhct_finish_load: 1,
        }, window.origin);

        logger.info(`Helper Extension version ${isDev ? 'DEV' : mhhh_version} loaded! Good luck!`);
    }

    void main();
}());
