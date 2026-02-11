/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from 'zod';

import type { IEnvironmentDetailer } from './modules/details/details.types';
import type { IStager } from './modules/stages/stages.types';
import type { ResponseEventParams } from './services/interceptor.service';
import type { UserSettings } from './services/settings/settings.service';
import type { HgResponse, Inventory, InventoryItem, JournalMarkup, User } from './types/hg';
import type { IntakeMessage, IntakeMessageBase, Loot } from './types/mhct';

import { IntakeRejectionEngine } from './hunt-filter/engine';
import * as successHandlers from './modules/ajax-handlers';
import { BadgeTimer } from './modules/badge-timer/badge-timer';
import { CrownTracker } from './modules/crown-tracker/crown-tracker';
import * as detailers from './modules/details';
import { ExtensionLog } from './modules/extension-log/extension-log';
import * as stagers from './modules/stages';
import { ApiService } from './services/api.service';
import { EnvironmentService } from './services/environment.service';
import { InterceptorService } from './services/interceptor.service';
import { ConsoleLogger, LogLevel } from './services/logging';
import { MouseRipApiService } from './services/mouserip-api.service';
import { SubmissionService } from './services/submission.service';
import { hgResponseSchema } from './types/hg';
import { intakeMessageBaseSchema, intakeMessageSchema } from './types/mhct';
import { diffObject } from './util/diffObject';
import { HornHud } from './util/hornHud';
import { parseHgInt } from './util/number';

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
    const apiService = new ApiService();
    const environmentService = new EnvironmentService();
    const rejectionEngine = new IntakeRejectionEngine(logger);
    const submissionService = new SubmissionService(logger, environmentService, apiService, getSettingsAsync,
        () => ({
            hunter_id_hash,
            mhhh_version,
        }),
        showFlashMessage
    );
    const interceptorService = new InterceptorService(logger, extensionLog, submissionService);
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
            'map_id': mapId,
            'action': 'map_info',
            'uh': user.unique_hash,
            'last_read_journal_entry_id': lastReadJournalEntryId,
            'X-Requested-By': `MHCT/${mhhh_version}`,
        };
        $.post('https://www.mousehuntgame.com/managers/ajax/users/treasuremap_v2.php', payload, null, 'json')
            .done((data) => {
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
                recordHuntWithPrehuntUser(pageResponse, responseEvent.response);
            };

            interceptorService.on('response', handleResponse);
        });
    }

    // Listening routers
    function addAjaxHandlers() {
        if (userSettings['tracking-hunts']) {
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

    /**
     * @param {string} rawPreResponse String representation of the response from calling page.php
     * @param {string} rawPostResponse String representation of the response from calling activeturn.php
     */
    function recordHuntWithPrehuntUser(rawPreResponse: unknown, post_response: HgResponse) {
        const safeParseResultPre = hgResponseSchema.safeParse(rawPreResponse);

        if (!safeParseResultPre.success) {
            logger.warn('Unexpected pre hunt response type received', z.prettifyError(safeParseResultPre.error));

            return;
        }

        const pre_response = safeParseResultPre.data;

        // General data flow
        // - Validate API response object
        // - Validate User object
        // - Parse journal
        // - Create pre + post messages from validated responses
        // - Validate pre + post message differences (rules then allowed exemptions)

        // This will throw out any hunts where the page.php or activeturn.php calls fail to return
        // the expected objects (success, active turn, needing a page object on pre)
        let validated = rejectionEngine.validateResponse(pre_response, post_response);
        if (!validated) {
            return;
        }

        const user_pre = pre_response.user;
        const user_post = post_response.user;
        validated = rejectionEngine.validateUser(user_pre, user_post);
        if (!validated) {
            return;
        }

        logger.debug('User object diff',
            diffObject({}, user_pre, user_post)
        );

        // Find maximum entry id from pre_response
        const journalEntryIds = ((pre_response.page as any).journal.entries_string as string).matchAll(/data-entry-id='(\d+)'/g);
        const maxEntryId = Math.max(...Array.from(journalEntryIds, x => Number(x[1])), 0);
        logger.debug(`Pre (old) maximum entry id: ${maxEntryId}`);

        const hunt = parseJournalEntries(post_response, maxEntryId);
        if (!hunt || Object.keys(hunt).length === 0) {
            logger.info('Missing Info (trap check or friend hunt)(2)');
            return;
        }

        /**
         *
         * @param before The pre-hunt object
         * @param after The post-hunt object
         * @param hunt Journal entry corresponding with the hunt
         * @returns
         */
        function createIntakeMessage(
            before: HgResponse,
            after: HgResponse,
            hunt: JournalMarkup
        ): {message_pre: IntakeMessage, message_post: IntakeMessage} {
            const preMessageBase = createMessageFromHunt(hunt, before);
            const postMessageBase = createMessageFromHunt(hunt, after);

            const message_pre: IntakeMessage = preMessageBase as IntakeMessage;
            const message_post: IntakeMessage = postMessageBase as IntakeMessage;

            // Perform validations and stage corrections.
            fixLGLocations(message_pre);
            fixLGLocations(message_post);

            addStage(message_pre, before.user, after.user, hunt);
            addStage(message_post, after.user, after.user, hunt);

            addHuntDetails(message_pre, before.user, after.user, hunt);
            addHuntDetails(message_post, after.user, after.user, hunt);

            const loot = parseLoot(hunt, after.inventory);
            if (loot && loot.length > 0) {
                message_pre.loot = loot;
                message_post.loot = loot;
            }

            const checkPreResult = intakeMessageSchema.safeParse(message_pre);
            const checkPostResult = intakeMessageSchema.safeParse(message_post);
            if (!checkPreResult.success || !checkPostResult.success) {
                const issues = [];
                if (!checkPreResult.success) {
                    issues.push(z.prettifyError(checkPreResult.error));
                }
                if (!checkPostResult.success) {
                    issues.push(z.prettifyError(checkPostResult.error));
                }
                throw new Error(`Failed to create intake message. Issues:\n\n${issues.join('\n\n')}`);
            }

            return {
                message_pre: checkPreResult.data,
                message_post: checkPostResult.data,
            };
        }

        let message_pre;
        let message_post;
        try {
            // Create two intake messages. One based on pre-response. The other based on post-response.
            ({message_pre, message_post} = createIntakeMessage(pre_response, post_response, hunt));
        } catch (error) {
            logger.error('Something went wrong creating message', error);
        }

        if (message_pre == null || message_post == null) {
            logger.warn('Critical user data missing; cannot record hunt. See error log.');
            return;
        }

        // Validate the differences between the two intake messages
        validated = rejectionEngine.validateMessage(message_pre, message_post);
        if (!validated) {
            // collect limited info for stage and location rejections
            const invalidProperties = rejectionEngine.getInvalidIntakeMessageProperties(message_pre, message_post);
            if (invalidProperties.has('stage') || invalidProperties.has('location')) {
                const rejection_message = createRejectionMessage(message_pre, message_post);
                void submissionService.submitRejection(rejection_message);
            }

            return;
        }

        logger.debug('Recording hunt', {message_var: message_pre, user_pre, user_post, hunt});
        // Upload the hunt record.
        void submissionService.submitHunt(message_pre);
    }

    // Add bonus journal entry stuff to the hunt_details
    function calcMoreDetails(hunt: JournalMarkup & {more_details?: Record<string, unknown>}): Record<string, unknown> | undefined {
        let new_details: Record<string, unknown> | undefined = {};
        if ('more_details' in hunt) {
            new_details = hunt.more_details;
        }
        return new_details;
    }

    /**
     * Find the active journal entry, and handle supported "bonus journals" such as the Relic Hunter attraction.
     * @param {import("./types/hg").HgResponse} hunt_response The JSON response returned from a horn sound.
     * @param {number} max_old_entry_id
     * @returns {import("./types/hg").JournalMarkup | null} The journal entry corresponding to the active hunt.
     */
    function parseJournalEntries(hunt_response: HgResponse, max_old_entry_id: number): JournalMarkup | null {
        let journal: (JournalMarkup & {more_details?: Record<string, unknown>}) | undefined;
        const more_details: Record<string, unknown> = {};
        let journal_entries = hunt_response.journal_markup;
        if (!journal_entries) { return null; }

        // Filter out stale entries
        logger.debug(`Before filtering there's ${journal_entries.length} journal entries.`, {journal_entries, max_old_entry_id});
        journal_entries = journal_entries.filter(x => x.render_data.entry_id > max_old_entry_id);
        logger.debug(`After filtering there's ${journal_entries.length} journal entries left.`, {journal_entries, max_old_entry_id});

        // Cancel everything if there's trap check somewhere
        if (journal_entries.findIndex(x => x.render_data.css_class.search(/passive/) !== -1) !== -1) {
            logger.info('Found trap check too close to hunt. Aborting.');
            return null;
        }

        const getItemFromInventoryByType = (itemType: string): InventoryItem | undefined => {
            if (hunt_response.inventory != null && !Array.isArray(hunt_response.inventory)) {
                return hunt_response.inventory[itemType];
            }
        };

        const getItemFromInventoryByName = (itemName: string): InventoryItem | undefined => {
            if (hunt_response.inventory != null && !Array.isArray(hunt_response.inventory)) {
                return Object.values(hunt_response.inventory).find(item => item.name === itemName);
            }
        };

        journal_entries.forEach((markup) => {
            const css_class = markup.render_data.css_class;
            // Handle a Relic Hunter attraction.
            if (css_class.search(/(relicHunter_catch|relicHunter_failure)/) !== -1) {
                const rh_message = {
                    rh_environment: markup.render_data.environment,
                    entry_timestamp: markup.render_data.entry_timestamp,
                };
                // If this occurred after the daily reset, submit it. (Trap checks & friend hunts
                // may appear and have been back-calculated as occurring before reset).
                if (rh_message.entry_timestamp > Math.round(new Date().setUTCHours(0, 0, 0, 0) / 1000)) {
                    if (userSettings['tracking-events']) {
                        void submissionService.submitRelicHunterSighting(rh_message);
                        logger.debug(`Found the Relic Hunter in ${rh_message.rh_environment}`);
                    }
                }
            } else if (css_class.search(/prizemouse/) !== -1) {
                // Handle a prize mouse attraction.
                // TODO: Implement data submission
                void extensionLog.log(LogLevel.Info, {
                    prize_mouse_journal: markup,
                });
            } else if (css_class.search(/desert_heater_base_trigger/) !== -1 && css_class.search(/fail/) === -1) {
                // Handle a Desert Heater Base loot proc.
                const data = markup.render_data.text;
                const quantityRegex = /mouse dropped ([\d,]+) <a class/;
                const nameRegex = />(.+?)<\/a>/g; // "g" flag used for stickiness
                const quantityMatch = quantityRegex.exec(data);
                nameRegex.lastIndex = quantityMatch?.index ?? data.length; // Start searching for name where quantity was found.
                const nameMatch = nameRegex.exec(data);
                if (quantityMatch && nameMatch) {
                    const strQuantity = quantityMatch[1].replace(/,/g, '').trim();
                    const lootQty = parseInt(strQuantity, 10);
                    const lootName = nameMatch[1];
                    const loot = getItemFromInventoryByName(lootName);

                    if (!lootQty || !loot) {
                        void extensionLog.log(LogLevel.Warn, `Failed to find inventory loot for Desert Heater Base`, {
                            desert_heater_journal: markup,
                            inventory: hunt_response.inventory,
                            loot: lootName,
                        });
                    } else {
                        const convertible = {
                            id: 2952, // Desert Heater Base's item ID
                            name: 'Desert Heater Base',
                            quantity: 1,
                        };
                        const items = [{id: loot.item_id, name: lootName, quantity: lootQty}];
                        logger.debug('Desert Heater Base proc', {desert_heater_loot: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                } else {
                    void extensionLog.log(LogLevel.Warn, `Regex quantity and loot name failed for Desert Heater Base`, {
                        desert_heater_journal: markup,
                        inventory: hunt_response.inventory,
                    });
                }
            } else if (css_class.search(/unstable_charm_trigger/) !== -1) {
                const data = markup.render_data.text;
                const trinketRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (trinketRegex) {
                    const resultTrinket = trinketRegex[1];
                    if (hunt_response.inventory != null && !Array.isArray(hunt_response.inventory) && resultTrinket in hunt_response.inventory) {
                        const {name: trinketName, item_id: trinketId} = hunt_response.inventory[resultTrinket];
                        const convertible = {
                            id: 1478, // Unstable Charm's item ID
                            name: 'Unstable Charm',
                            quantity: 1,
                        };
                        const items = [{
                            id: trinketId,
                            name: trinketName,
                            quantity: 1,
                        }];
                        logger.debug('Submitting Unstable Charm: ', {unstable_charm_loot: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/gift_wrapped_charm_trigger/) !== -1) {
                const data = markup.render_data.text;
                const trinketRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (trinketRegex) {
                    const resultTrinket = trinketRegex[1];
                    const trinket = getItemFromInventoryByType(resultTrinket);
                    if (trinket) {
                        const convertible = {
                            id: 2525, // Gift Wrapped Charm's item ID
                            name: 'Gift Wrapped Charm',
                            quantity: 1,
                        };
                        const items = [{
                            id: trinket.item_id,
                            name: trinket.name,
                            quantity: 1,
                        }];
                        logger.debug('Submitting Gift Wrapped Charm: ', {gift_wrapped_charm_loot: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/torch_charm_event/) !== -1) {
                const data = markup.render_data.text;
                const torchprocRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (torchprocRegex) {
                    const resultItem = torchprocRegex[1];
                    const torchItemResult = getItemFromInventoryByType(resultItem);
                    if (torchItemResult) {
                        const convertible = {
                            id: 2180, // Torch Charm's item ID
                            name: 'Torch Charm',
                            quantity: 1,
                        };
                        const items = [{
                            id: torchItemResult.item_id,
                            name: torchItemResult.name,
                            quantity: 1,
                        }];
                        logger.debug('Submitting Torch Charm: ', {torch_charm_loot: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/queso_cannonstorm_base_trigger/) !== -1) {
                const data = markup.render_data.text;
                const qcbprocRegex = /item\.php\?item_type=(.*?)"/g;
                const matchResults = [...data.matchAll(qcbprocRegex)];
                if (matchResults.length == 4) {
                    // Get third match, then first capturing group
                    const resultItem = matchResults[2][1];
                    const baseResultItem = getItemFromInventoryByType(resultItem);
                    if (baseResultItem) {
                        const convertible = {
                            id: 3526, // Queso Cannonstorm Base's item ID
                            name: 'Queso Cannonstorm Base',
                            quantity: 1,
                        };
                        const items = [{
                            id: baseResultItem.item_id,
                            name: baseResultItem.name,
                            quantity: 1,
                        }];
                        logger.debug('Submitting Queso Cannonstorm Base: ', {queso_cannonstorm_base_loot: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/alchemists_cookbook_base_bonus/) !== -1) {
                more_details.alchemists_cookbook_base_bonus = true;
                logger.debug('Adding Cookbook Base Bonus to details', {procs: more_details});
            } else if (css_class.search(/boiling_cauldron_potion_bonus/) !== -1) {
                const data = markup.render_data.text;
                const potionRegex = /item\.php\?item_type=(.*?)"/.exec(data);
                if (potionRegex) {
                    const resultPotion = potionRegex[1];
                    const potionItemResult = getItemFromInventoryByType(resultPotion);
                    if (potionItemResult) {
                        const convertible = {
                            id: 3304,
                            name: 'Boiling Cauldron Trap',
                            quantity: 1,
                        };
                        const items = [{
                            id: potionItemResult.item_id,
                            name: potionItemResult.name,
                            quantity: 1,
                        }];
                        logger.debug('Boiling Cauldron Trap proc', {boiling_cauldron_trap: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                }
                more_details.boiling_cauldron_trap_bonus = true;
                logger.debug('Boiling Cauldron Trap details', {procs: more_details});
            } else if (css_class.search(/chesla_trap_trigger/) !== -1) {
                // Handle a potential Gilded Charm proc.
                const data = markup.render_data.text;
                const gildedRegex = /my Gilded Charm/.exec(data);
                const quantityRegex = /([\d]+)/.exec(data);
                if (gildedRegex && quantityRegex) {
                    const quantityMatch = quantityRegex[1].replace(/,/g, '').trim();
                    const lootQty = parseInt(quantityMatch, 10);

                    if (!lootQty) {
                        void extensionLog.log(LogLevel.Warn, `Failed to parse Gilded Charm proc quantity`, {
                            gilded_charm_journal: markup,
                            inventory: hunt_response.inventory,
                        });
                    } else {
                        const convertible = {
                            id: 2174, // Gilded Charm's item ID
                            name: 'Gilded Charm',
                            quantity: 1,
                        };
                        const items = [{id: 114, name: 'SUPER|brie+', quantity: lootQty}];
                        logger.debug('Guilded Charm proc', {gilded_charm: items});

                        void submissionService.submitItemConvertible(convertible, items);
                    }
                }
            } else if (css_class.search(/pirate_sleigh_trigger/) !== -1) {
                // SS Scoundrel Sleigh got 'im!
                more_details.pirate_sleigh_trigger = true;
                logger.debug('Pirate Sleigh proc', {procs: more_details});
            } else if (css_class.search(/rainbowQuillSpecialEffect/) !== -1) {
                if (user.environment_name == 'Afterword Acres' || user.environment_name == 'Epilogue Falls') {
                    more_details.rainbow_quill_trigger = true;
                }
                logger.debug('Rainbow Quill proc', {procs: more_details});
            } else if (css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1) {
                logger.debug('Got a hunt record ', {procs: more_details});
                if (css_class.includes('active')) {
                    journal = markup;
                    logger.debug('Found the active hunt', {journal});
                }
            } else if (css_class.search(/linked|passive|misc/) !== -1) {
                // Ignore any friend hunts, trap checks, or custom loot journal entries.
            }
        });

        if (journal && Object.keys(journal).length) {
            // Only assign if there's an active hunt
            journal.more_details = more_details;
        }

        return journal ?? null;
    }

    /**
     * Initialize the message with main hunt details.
     * @param journal The journal entry corresponding to the active hunt.
     * @param hgResponse The HG response containing user and inventory data.
     * @returns The message object, or `null` if an error occurred.
     */
    function createMessageFromHunt(journal: JournalMarkup, hgResponse: HgResponse): IntakeMessageBase {
        const user = hgResponse.user;

        const message: Partial<IntakeMessageBase> = {};

        message.entry_id = journal.render_data.entry_id;
        message.entry_timestamp = journal.render_data.entry_timestamp;

        if (!user.environment_name) {
            throw new Error('Missing user location');
        }

        message.location = {
            name: user.environment_name,
            id: user.environment_id,
        };

        message.shield = user.has_shield;
        message.total_power = user.trap_power;
        message.total_luck = user.trap_luck;
        message.attraction_bonus = Math.round(user.trap_attraction_bonus * 100);

        type PropFields = 'weapon' | 'base' | 'trinket' | 'bait';
        type ComponentFields = 'trap' | 'base' | 'cheese' | 'charm';
        const components: {
            prop: PropFields;
            message_field: ComponentFields;
            required: boolean;
            replacer: RegExp;
            [key: string]: unknown;
        }[] = [
            {prop: 'weapon', message_field: 'trap', required: true, replacer: / trap$/i},
            {prop: 'base', message_field: 'base', required: true, replacer: / base$/i},
            {prop: 'bait', message_field: 'cheese', required: true, replacer: / cheese$/i},
            {prop: 'trinket', message_field: 'charm', required: false, replacer: / charm$/i},
        ];

        for (const component of components) {
            const prop_name: keyof User = `${component.prop}_name`;
            const prop_id: keyof User = `${component.prop}_item_id`;
            const item_name = user[prop_name];
            const item_id = user[prop_id];
            if (item_name == null || item_id == null) {
                if (component.required) {
                    throw new Error(`Missing required setup component: ${component.message_field}`);
                }
            }

            message[component.message_field] = {
                id: item_id ?? 0,
                name: item_name ? item_name.replace(component.replacer, '') : '',
            };
        }

        // Caught / Attracted / FTA'd
        const journal_css = journal.render_data.css_class;
        if (journal_css.includes('attractionfailure')) {
            message.caught = 0;
            message.attracted = 0;
        } else if (journal_css.includes('catch')) {
            message.attracted = 1;
            if (journal_css.includes('catchsuccess')) {
                message.caught = 1;
            } else if (journal_css.includes('catchfailure')) {
                message.caught = 0;
            } else {
                throw new Error(`Unknown "catch" journal css: ${journal_css}`);
            }
            // Remove HTML tags and other text around the mouse name.
            message.mouse = journal.render_data.text
                .replace(/^.*?;">/, '') // Remove all text through the first sequence of `;">`
                .replace(/<\/a>.*/i, '') // Remove text after the first <a href>'s closing tag </a>
                .replace(/ mouse$/i, ''); // Remove " [Mm]ouse" if it is not a part of the name (e.g. Dread Pirate Mousert)
        }

        // Auras
        if (hgResponse.trap_image != null) {
            message.auras = Object.keys(hgResponse.trap_image.auras).filter(codename => hgResponse.trap_image!.auras[codename].status === 'active');
        }

        const baseMessageParseResult = intakeMessageBaseSchema.safeParse(message);
        if (!baseMessageParseResult.success) {
            throw new Error(`Base message failed validation:\n${z.prettifyError(baseMessageParseResult.error)}`);
        }

        return baseMessageParseResult.data;
    }

    /**
     * Creates rejection event info containing information about location, stage, and mouse
     * @param pre
     * @param post
     */
    function createRejectionMessage(pre: IntakeMessage, post: IntakeMessage) {
        return {
            pre: createEventObject(pre),
            post: createEventObject(post),
        };

        function createEventObject(message: IntakeMessage) {
            return {
                location: message.location.name,
                stage: message.stage,
                mouse: message.mouse,
            };
        }
    }

    /**
     * Fixes location IDs for Living & Twisted Garden areas.
     * @param message The message to be sent
     * @returns
     */
    function fixLGLocations(message: IntakeMessageBase) {
        const environmentMap: Record<string, number> = {
            'Cursed City': 5000,
            'Sand Crypts': 5001,
            'Twisted Garden': 5002,
        };

        if (message.location.name in environmentMap) {
            message.location.id = environmentMap[message.location.name];
        }
    }

    const location_stager_lookup: Record<string, IStager> = {};
    for (const stager of stagers.stageModules) {
        location_stager_lookup[stager.environment] = stager;
    }

    /**
     * Use `quests` or `viewing_atts` data to assign appropriate location-specific stage information.
     * @param message The message to be sent
     * @param user The user state object, when the hunt was invoked (pre-hunt).
     * @param user_post The user state object, after the hunt.
     * @param hunt The journal entry corresponding to the active hunt
     */
    function addStage(message: IntakeMessage, user: User, user_post: User, hunt: JournalMarkup) {
        // IStagers
        const stager = location_stager_lookup[user.environment_name];
        if (stager) {
            stager.addStage(message, user, user_post, hunt);
        }
    }

    const location_detailer_lookup: Record<string, IEnvironmentDetailer> = {};
    for (const detailer of detailers.environmentDetailerModules) {
        location_detailer_lookup[detailer.environment] = detailer;
    }

    /**
     * Determine additional detailed parameters that are otherwise only visible to db exports and custom views.
     * These details may eventually be migrated to help inform location-specific stages.
     * @param message The message to be sent.
     * @param user The user state object, when the hunt was invoked (pre-hunt).
     * @param user_post The user state object, after the hunt.
     * @param hunt The journal entry corresponding to the active hunt.
     */
    function addHuntDetails(message: IntakeMessage, user: User, user_post: User, hunt: JournalMarkup) {
        // First, get any location-specific details:
        let locationHuntDetails: Record<string, any> | undefined = {};
        const detailer = location_detailer_lookup[user.environment_name];
        if (detailer) {
            locationHuntDetails = detailer.addDetails(message, user, user_post, hunt);
        }

        // Then, get any global hunt details (such as from ongoing events, auras, etc).
        const globalHuntDetails = detailers.globalDetailerModules
            .map(detailer => detailer.addDetails(message, user, user_post, hunt))
            .filter(details => details);

        const otherJournalDetails = calcMoreDetails(hunt); // This is probably not needed and can use hunt.more_details below

        // Finally, merge the details objects and add it to the message.
        if (locationHuntDetails || globalHuntDetails.length >= 0) {
            message.hunt_details = Object.assign({}, locationHuntDetails, ...globalHuntDetails, otherJournalDetails);
        }
    }

    /**
     * Extract loot information from the hunt's journal entry.
     * @param hunt The journal entry corresponding to the active hunt.
     * @param inventory The inventory object in hg server response, has item info
     */
    function parseLoot(hunt: JournalMarkup, inventory: Inventory | undefined): Loot[] | undefined {
        const getItemFromInventoryByType = (itemType: string): InventoryItem | undefined => {
            if (inventory != null && !Array.isArray(inventory)) {
                return inventory[itemType];
            }
        };

        let hunt_description = hunt.render_data.text;
        if (!hunt_description.includes('following loot:')) { return; }

        hunt_description = hunt_description.substring(hunt_description.indexOf('following loot:') + 15);
        // Use a stricter regex to split on closing anchor tags like </a> with optional whitespace
        const loot_array = hunt_description.split(/<\/a\s*>/gi).filter(i => i.trim());
        const lootList = [];
        for (const item_text of loot_array) {
            const item_name = /item\.php\?item_type=(.*?)"/.exec(item_text)?.[1];
            const item_amount = parseHgInt(/\d+[\d,]*/.exec(item_text)?.[0] ?? '0');
            const plural_name = $($.parseHTML(item_text)).filter('a').text();

            const inventory_item = getItemFromInventoryByType(item_name ?? '');
            if (!inventory_item) {
                logger.debug(`Looted "${item_name}", but it is not in user inventory`);
                continue;
            }

            const loot_object = {
                amount: item_amount,
                lucky: item_text.includes('class="lucky"'),
                id: inventory_item.item_id,
                name: inventory_item.name,
                plural_name: item_amount > 1 ? plural_name : '',
            };

            logger.debug('Loot object', {loot_object});

            lootList.push(loot_object);
        }

        return lootList;
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
