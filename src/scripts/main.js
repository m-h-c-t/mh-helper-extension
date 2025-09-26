/*jslint browser:true */
import {IntakeRejectionEngine} from "./hunt-filter/engine";
import {ConsoleLogger, LogLevel} from './services/logging';
import {EnvironmentService} from "./services/environment.service";
import {MouseRipApiService} from "./services/mouserip-api.service";
import {InterceptorService} from "./services/interceptor.service";
import {SubmissionService} from "./services/submission.service";
import {ApiService} from "./services/api.service";
import {hgResponseSchema} from "./types/hg";
import {HornHud} from './util/hornHud';
import {parseHgInt} from "./util/number";
import {Messenger} from "./content/messaging/messenger";
import {CrownTracker} from "./modules/crown-tracker/tracker";
import {z} from "zod";
import * as successHandlers from './modules/ajax-handlers';
import * as detailers from './modules/details';
import * as stagers from './modules/stages';

(function () {
    'use strict';

    let mhhh_version = 0;
    let hunter_id_hash = '0';
    let userSettings = {};

    // eslint-disable-next-line no-undef
    const isDev = process.env.ENV === 'development';
    const logger = new ConsoleLogger(isDev, logFilter);
    const messenger = Messenger.forDOMCommunication(globalThis.window);
    const apiService = new ApiService();
    const interceptorService = new InterceptorService(logger);
    const environmentService = new EnvironmentService(getExtensionVersion);
    const rejectionEngine = new IntakeRejectionEngine(logger);
    const submissionService = new SubmissionService(logger, environmentService, apiService, getSettingsAsync,
        () => ({
            hunter_id_hash,
            mhhh_version,
        }),
        showFlashMessage
    );
    const mouseRipApiService = new MouseRipApiService(logger, apiService);
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
    const crownTracker = new CrownTracker(logger, interceptorService, apiService, messenger);

    async function main() {
        try {
            if (!window.jQuery) {
                throw "Can't find jQuery.";
            }

            userSettings = await getSettingsAsync();
            await initialLoad();
            addWindowMessageListeners();
            addAjaxHandlers();
            finalLoad();

            if (userSettings['tracking-crowns']) {
                crownTracker.init();
            }
        } catch (error) {
            logger.error("Failed to initialize.", error);
        }
    }

    async function getSettingsAsync() {
        return Promise.race([
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for settings.")), 5000)),
            new Promise((resolve) => {
                window.addEventListener("message", function listenSettings(event) {
                    if (event.data.mhct_settings_response !== 1) {
                        return;
                    }

                    const settings = event.data.settings;
                    window.removeEventListener("message", listenSettings);
                    resolve(settings);
                }, false);

                window.postMessage({mhct_settings_request: 1}, "*");
            })
        ]);
    }

    function getExtensionVersion() {
        const version = $("#mhhh_version").val();

        // split version and convert to padded number number format
        // 0.0.0 -> 000000
        // 1.0.1 -> 100001

        const [major, minor, patch] = version.split('.');

        return Number(
            (major?.padStart(2, '0') || '00') +
            (minor?.padStart(2, '0') || '00') +
            (patch?.padStart(2, '0') || '00')
        );
    }

    // Create hunter id hash using Crypto Web API
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    async function createHunterIdHash() {
        if (typeof user.user_id === 'undefined') {
            // No problem if user is not logged in yet.
            // This function will be called on logins (ajaxSuccess on session.php)
            logger.debug("User is not logged in yet.");
            return;
        }

        const user_id = user.user_id.toString().trim();
        const msgUint8 = new TextEncoder().encode(user_id);
        const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hunter_id_hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        logger.debug("createHunterIdHash:", {
            hunter_id: user_id,
            hunter_id_hash,
        });
    }

    async function initialLoad() {
        if (isDev) {
            logger.debug("Debug mode activated");
            logger.info("Test version detected, turning on debug mode and pointing to server on localhost");
        }

        logger.debug("initialLoad ran with settings", {userSettings});

        mhhh_version = getExtensionVersion();
        await createHunterIdHash();
    }

    function logFilter(logLevel) {
        let userLogLevelSetting;
        switch (userSettings['general-log-level'] ?? '') {
            case 'debug':
                userLogLevelSetting = LogLevel.Debug;
                break;
            case 'info':
                userLogLevelSetting = LogLevel.Info;
                break;
            case 'warn':
                userLogLevelSetting = LogLevel.Warn;
                break;
            case 'error':
                userLogLevelSetting = LogLevel.Error;
                break;
            default:
                userLogLevelSetting = LogLevel.Info;
        }
        return isDev || userLogLevelSetting >= logLevel;
    };

    // Listening for calls
    function addWindowMessageListeners() {
        window.addEventListener('message', ev => {
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

            if (ev.data.mhct_message === 'horn') {
                sound_horn();
                return;
            }

            if ('tsitu_loader' === ev.data.mhct_message) {
                window.tsitu_loader_offset = ev.data.tsitu_loader_offset;
                openBookmarklet(ev.data.file_link);
                return;
            }

            if (ev.data.mhct_message === 'show_horn_alert') {
                // Since this is delayed by a few seconds from background script
                // Check that user didn't beat us
                if (!HornHud.canSoundHorn()) {
                    return;
                }

                const sound_the_horn = confirm("Horn is Ready! Sound it?");
                if (sound_the_horn) {
                    sound_horn();
                }
                return;
            }

            if (ev.data.mhct_message === 'makenoise') {
                // settings.debug_logging is a place to get our settings and handle them here.
                const sound_url = ev.data.sound_url;
                const myAudio = new Audio(sound_url);
                const volume = ev.data.volume;
                if (volume > 0) {
                    myAudio.volume = (volume/100).toFixed(2);
                    myAudio.play();
                }
            }

            // Crown submission results in either the boolean `false`, or the total submitted crowns.
            if (ev.data.mhct_message === 'crownSubmissionStatus') {
                const counts = ev.data.submitted;
                if (counts) {
                    showFlashMessage("success",
                        `Submitted ${counts} crowns for ${$('span[class*="titleBar-name"]').text()}.`);
                } else if (counts != null) {
                    showFlashMessage("error", "There was an issue submitting crowns on the backend.");
                } else {
                    logger.debug('Skipped submission (already sent).');
                }
                return;
            }

        }, false);
    }

    function sound_horn() {
        HornHud.soundHorn();
    }

    function openBookmarklet(menuURL) {
        fetch(menuURL).then(response => response.text()).then((data) => {
            const url = new URL(menuURL);
            // FireFox will still have EXTENSION_URL in the code, so replace with origin of URL (moz-extension://<internal_uuid>/)
            data = data.replace("EXTENSION_URL", url.origin);
            document.location.href = "javascript:void function(){" + data + "%0A}();";
        });
    }

    // Get map mice
    function openMapMiceSolver(solver) {
        let url = '';
        let glue = '';
        let method = '';
        let input_name ='';
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

        const payload = {
            map_id: user.quests.QuestRelicHunter.default_map_id,
            action: "map_info",
            uh: user.unique_hash,
            last_read_journal_entry_id: lastReadJournalEntryId,
            'X-Requested-By': `MHCT/${mhhh_version}`,
        };
        $.post('https://www.mousehuntgame.com/managers/ajax/users/treasuremap_v2.php', payload, null, 'json')
            .done(data => {
                if (data) {
                    if (!data.treasure_map || data.treasure_map.view_state === "noMap") {
                        alert('Please make sure you are logged in into MH and are currently member of a treasure map.');
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
    function getMapMice(data, uncaught_only) {
        const mice = {};
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
    function showFlashMessage(type, message) {
        window.postMessage({
            mhct_display_message: 1,
            type,
            message,
        });
    }

    /**
     * Before allowing a hunt submission, first request an updated user object that reflects the effect
     * of any outside actions, such as setup changes from the mobile app, a different tab, or trap checks.
     * @param {JQuery.TriggeredEvent<Document, undefined, Document, Document>} event The ajax event that triggered this listener
     * @param {JQuery.jqXHR<any>} jqx The jQuery-wrapped XMLHttpRequest that was intercepted
     * @param {JQuery.AjaxSettings<any>} ajaxOptions The ajax settings of the intercepted request.
     */
    function getUserBeforeHunting(event, jqx, ajaxOptions) {
        if (event.type !== "ajaxSend" || !ajaxOptions.url.includes("ajax/turns/activeturn.php"))
            return;
        const create_hunt_XHR = ajaxOptions.xhr;
        const huntRequestTimeStart = performance.now();
        // Override the XMLHttpRequest that will be used with our own.
        ajaxOptions.xhr = function () {
            // Create the original XMLHttpRequest, whose `send()` will sound the horn.
            const hunt_xhr = create_hunt_XHR();
            const hunt_send = hunt_xhr.send;
            // Override the original send to first query the user object.
            // Trigger trap check calculations by forcing non-memoized return.
            hunt_xhr.send = (...huntArgs) => {
                $.ajax({
                    method: "post",
                    url: "/managers/ajax/pages/page.php",
                    data: {
                        sn: "Hitgrab",
                        page_class: "Camp",
                        hg_is_ajax: 1,
                        last_read_journal_entry_id: lastReadJournalEntryId,
                        uh: user.unique_hash,
                        'X-Requested-By': `MHCT/${mhhh_version}`,
                    },
                    dataType: "json",
                }).done(preResponseText => {
                    logger.debug("Got user object, invoking huntSend", {userRqResponse: preResponseText});

                    hunt_xhr.addEventListener("loadend", () => {
                        logger.debug("Overall 'Hunt Requested' Timing %i (ms)", performance.now() - huntRequestTimeStart);
                        // Call record hunt with the pre-hunt and hunt (post) user objects.
                        recordHuntWithPrehuntUser(preResponseText, JSON.parse(hunt_xhr.responseText));
                    }, false);
                    hunt_send.apply(hunt_xhr, huntArgs);
                });
            };

            return hunt_xhr;
        };
    }

    // Listening routers
    function addAjaxHandlers() {
        if (userSettings['tracking-hunts']) {
            $(document).ajaxSend(getUserBeforeHunting);
        }

        $(document).ajaxSuccess(async (event, xhr, ajaxOptions) => {
            const url = ajaxOptions.url;
            if (url.includes("mousehuntgame.com/managers/ajax/users/session.php")) {
                createHunterIdHash();
            }

            const hgResponse = validateAndParseHgResponse(xhr.responseText, url);
            if (!hgResponse) {
                return;
            }

            if (userSettings['tracking-events']) {
                for (const handler of ajaxSuccessHandlers) {
                    if (handler.match(url)) {
                        await handler.execute(hgResponse);
                    }
                }
            }
        });
    }

    /**
     * Validates and parses an HG response, returning the parsed JSON if valid
     * @param {string} responseText The raw response text from the XMLHttpRequest
     * @param {string} url The request URL
     * @returns {import("./types/hg").HgResponse|null} The parsed JSON object if valid, null otherwise
     */
    function validateAndParseHgResponse(responseText, url) {
        try {
            const parsedUrl = new URL(url);
            // mobile api calls are not checked
            if (parsedUrl.hostname === "www.mousehuntgame.com" && !parsedUrl.pathname.startsWith("/api/")) {
                const json = JSON.parse(responseText);
                const parseResult = hgResponseSchema.safeParse(json);

                if (!parseResult.success) {
                    logger.warn(`Unexpected HG response received\n\n${z.prettifyError(parseResult.error)}`, {
                        url: url,
                        response: json
                    });
                    return null;
                }

                return parseResult.data;
            }
        } catch {
            // Invalid url, JSON, or response is not JSON
        }

        return null;
    }

    /**
     * @param {string} rawPreResponse String representation of the response from calling page.php
     * @param {string} rawPostResponse String representation of the response from calling activeturn.php
     */
    function recordHuntWithPrehuntUser(rawPreResponse, rawPostResponse) {
        logger.debug("In recordHuntWithPrehuntUser pre and post:", rawPreResponse, rawPostResponse);

        const safeParseResultPre = hgResponseSchema.safeParse(rawPreResponse);
        const safeParseResultPost = hgResponseSchema.safeParse(rawPostResponse);

        if (!safeParseResultPre.success || !safeParseResultPost.success) {
            if (!safeParseResultPre.success) {
                logger.warn("Unexpected response type received", z.prettifyError(safeParseResultPre.error));
            }

            if (!safeParseResultPost.success) {
                logger.warn("Unexpected response type received", z.prettifyError(safeParseResultPost.error));
            }

            return;
        }

        const pre_response = safeParseResultPre.data;
        const post_response = safeParseResultPost.data;

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

        /**
         * Store the difference between generic primitives and certain objects in `result`
         * @param {Object <string, any>} result The object to write diffs into
         * @param {Set<string>} pre Keys associated with the current `obj_pre`
         * @param {Set<string>} post Keys associated with the current `obj_post`
         * @param {Object <string, any>} obj_pre The pre-hunt user object (or associated nested object)
         * @param {Object <string, any>} obj_post The post-hunt user object (or associated nested object)
         */
        function diffUserObjects(result, pre, post, obj_pre, obj_post) {
            const simple_diffs = new Set(['string', 'number', 'boolean']);
            for (const [key, value] of Object.entries(obj_pre).filter(pair => !pair[0].endsWith("hash"))) {
                pre.add(key);
                if (!post.has(key)) {
                    result[key] = {in: "pre", val: value};
                } else if (simple_diffs.has(typeof value)) {
                    // Some HG endpoints do not cast numeric values to number due to numeric precision issues.
                    // Thus, the type-converting inequality check is performed instead of strict inequality.
                    if (value != obj_post[key]) {
                        result[key] = {"pre": value, "post": obj_post[key]};
                    }
                } else if (Array.isArray(value)) {
                    // Do not modify the element order by sorting.
                    const other = obj_post[key];
                    if (value.length > other.length) {
                        result[key] = {type: "-", "pre": value, "post": other};
                    } else if (value.length < other.length) {
                        result[key] = {type: "+", "pre": value, "post": other};
                    } else {
                        // Same number of elements. Compare them under the assumption that the elements
                        // have the same order.
                        result[key] = {};
                        diffUserObjects(result[key], new Set(), new Set(Object.keys(other)), value, other);
                        if (!Object.keys(result[key]).length) {
                            delete result[key];
                        }
                    }
                } else if (typeof value === 'object' && value instanceof Object) {
                    // Object comparison requires recursion.
                    result[key] = {};
                    diffUserObjects(result[key], new Set(), new Set(Object.keys(obj_post[key])), value, obj_post[key]);
                    // Avoid reporting same-value objects
                    if (!Object.keys(result[key]).length) {
                        delete result[key];
                    }
                }
            }
            Object.keys(obj_post).filter(key => !pre.has(key) && !key.endsWith("hash"))
                .forEach(key => {
                    result[key] = {in: "post", val: obj_post[key]};
                });

            return result;
        }

        logger.debug("User object diff",
            diffUserObjects({}, new Set(), new Set(Object.keys(user_post)), user_pre, user_post)
        );

        // Find maximum entry id from pre_response
        let max_old_entry_id = pre_response.page.journal.entries_string.match(/data-entry-id='(\d+)'/g);
        if (!max_old_entry_id.length) {
            max_old_entry_id = 0;
        } else {
            max_old_entry_id = max_old_entry_id.map(x => x.replace(/^data-entry-id='/, ''));
            max_old_entry_id = max_old_entry_id.map(x => Number(x.replace(/'/g, "")));
            max_old_entry_id = Math.max(...max_old_entry_id);
        }
        logger.debug(`Pre (old) maximum entry id: ${max_old_entry_id}`);

        const hunt = parseJournalEntries(post_response, max_old_entry_id);
        if (!hunt || Object.keys(hunt).length === 0) {
            logger.info("Missing Info (trap check or friend hunt)(2)");
            return;
        }

        /**
         *
         * @param {import("./types/hg").HgResponse} before The pre-hunt object
         * @param {import("./types/hg").HgResponse} after The post-hunt object
         * @param {import("./types/hg").JournalMarkup} hunt Journal entry corresponding with the hunt
         * @returns {import("./types/mhct").IntakeMessage | undefined}
         */
        function createIntakeMessage(before, after, hunt) {
            const user = before.user;
            const user_post = after.user;
            // Obtain the main hunt information from the journal entry and user objects.
            const message = createMessageFromHunt(hunt, before, after);
            if (!message) {
                logger.info("Missing Info (will try better next hunt)(1)");
                return;
            }

            // Perform validations and stage corrections.
            fixLGLocations(message, user, user_post, hunt);

            addStage(message, user, user_post, hunt);
            addHuntDetails(message, user, user_post, hunt);
            addLoot(message, hunt, after.inventory);

            return message;
        }

        let message_pre;
        let message_post;
        try {
            // Create two intake messages. One based on pre-response. The other based on post-response.
            message_pre = createIntakeMessage(pre_response, post_response, hunt);
            message_post = createIntakeMessage(post_response, post_response, hunt);
        } catch (error) {
            logger.error("Something went wrong creating message", error);
        }

        if (message_pre === null || message_post === null) {
            logger.warn("Missing Info (will try better next hunt)(2)");
            return;
        }

        // Validate the differences between the two intake messages
        validated = rejectionEngine.validateMessage(message_pre, message_post);
        if (!validated) {
            // collect limited info for stage and location rejections
            const invalidProperties = rejectionEngine.getInvalidIntakeMessageProperties(message_pre, message_post);
            if (invalidProperties.has('stage') || invalidProperties.has('location')) {
                const rejection_message = createRejectionMessage(message_pre, message_post);
                submissionService.submitRejection(rejection_message);
            }

            return;
        }

        logger.debug("Recording hunt", {message_var:message_pre, user_pre, user_post, hunt});
        // Upload the hunt record.
        submissionService.submitHunt(message_pre);
    }

    // Add bonus journal entry stuff to the hunt_details
    function calcMoreDetails(hunt) {
        let new_details = {};
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
    function parseJournalEntries(hunt_response, max_old_entry_id) {
        /** @type {import("./types/hg").JournalMarkup & Object<string, unknown>} */
        let journal = {};
        const more_details = {};
        let journal_entries = hunt_response.journal_markup;
        if (!journal_entries) { return null; }

        // Filter out stale entries
        logger.debug(`Before filtering there's ${journal_entries.length} journal entries.`, {journal_entries, max_old_entry_id});
        journal_entries = journal_entries.filter(x => Number(x.render_data.entry_id) > Number(max_old_entry_id));
        logger.debug(`After filtering there's ${journal_entries.length} journal entries left.`, {journal_entries, max_old_entry_id});

        // Cancel everything if there's trap check somewhere
        if (journal_entries.findIndex(x => x.render_data.css_class.search(/passive/) !== -1) !== -1) {
            logger.info("Found trap check too close to hunt. Aborting.");
            return null;
        }

        journal_entries.forEach(markup => {
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
                        submissionService.submitRelicHunterHint(rh_message);
                        logger.debug(`Found the Relic Hunter in ${rh_message.rh_environment}`);
                    }
                }
            }
            else if (css_class.search(/prizemouse/) !== -1) {
                // Handle a prize mouse attraction.
                // TODO: Implement data submission
                if (isDev) {
                    window.postMessage({
                        "mhct_log_request": 1,
                        "prize mouse journal": markup,
                    }, window.origin);
                }
            }
            else if (css_class.search(/desert_heater_base_trigger/) !== -1 && css_class.search(/fail/) === -1) {
                // Handle a Desert Heater Base loot proc.
                const data = markup.render_data.text;
                const quantityRegex = /mouse dropped ([\d,]+) <a class/;
                const nameRegex = />(.+?)<\/a>/g; // "g" flag used for stickiness
                if (quantityRegex.test(data) && nameRegex.test(data)) {
                    const quantityMatch = quantityRegex.exec(data);
                    const strQuantity = quantityMatch[1].replace(/,/g, '').trim();
                    const lootQty = parseInt(strQuantity, 10);

                    // Update the loot name search to start where the loot quantity was found.
                    nameRegex.lastIndex = quantityMatch.index;
                    const lootName = nameRegex.exec(data)[1];

                    const loot = Object.values(hunt_response.inventory)
                        .find(item => item.name === lootName);

                    if (!lootQty || !loot) {
                        window.postMessage({
                            "mhct_log_request": 1,
                            "is_error": true,
                            "desert heater journal": markup,
                            "inventory": hunt_response.inventory,
                            "reason": `Didn't find named loot "${lootName}" in inventory`,
                        }, window.origin);
                    } else {
                        const convertible = {
                            id: 2952, // Desert Heater Base's item ID
                            name: "Desert Heater Base",
                            quantity: 1,
                        };
                        const items = [{id: loot.item_id, name: lootName, quantity: lootQty}];
                        logger.debug("Desert Heater Base proc", {desert_heater_loot: items});

                        submissionService.submitItemConvertible(convertible, items);
                    }
                } else {
                    window.postMessage({
                        "mhct_log_request": 1,
                        "is_error": true,
                        "desert heater journal": markup,
                        "inventory": hunt_response.inventory,
                        "reason": "Didn't match quantity and loot name regex patterns",
                    }, window.origin);
                }
            }
            else if (css_class.search(/unstable_charm_trigger/) !== -1) {
                const data = markup.render_data.text;
                const trinketRegex = /item\.php\?item_type=(.*?)"/;
                if (trinketRegex.test(data)) {
                    const resultTrinket = data.match(trinketRegex)[1];
                    if("inventory" in hunt_response && resultTrinket in hunt_response.inventory) {
                        const {name: trinketName, item_id: trinketId} = hunt_response.inventory[resultTrinket];
                        const convertible = {
                            id: 1478, // Unstable Charm's item ID
                            name: "Unstable Charm",
                            quantity: 1,
                        };
                        const items = [{
                            id: trinketId,
                            name: trinketName,
                            quantity: 1,
                        }];
                        logger.debug("Submitting Unstable Charm: ", {unstable_charm_loot: items});

                        submissionService.submitItemConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/gift_wrapped_charm_trigger/) !== -1) {
                const data = markup.render_data.text;
                const trinketRegex = /item\.php\?item_type=(.*?)"/;
                if (trinketRegex.test(data)) {
                    const resultTrinket = data.match(trinketRegex)[1];
                    if("inventory" in hunt_response && resultTrinket in hunt_response.inventory) {
                        const {name: trinketName, item_id: trinketId} = hunt_response.inventory[resultTrinket];
                        const convertible = {
                            id: 2525, // Gift Wrapped Charm's item ID
                            name: "Gift Wrapped Charm",
                            quantity: 1,
                        };
                        const items = [{
                            id: trinketId,
                            name: trinketName,
                            quantity: 1,
                        }];
                        logger.debug("Submitting Gift Wrapped Charm: ", {gift_wrapped_charm_loot: items});

                        submissionService.submitItemConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/torch_charm_event/) !== -1) {
                const data = markup.render_data.text;
                const torchprocRegex = /item\.php\?item_type=(.*?)"/;
                if (torchprocRegex.test(data)) {
                    const resultItem = data.match(torchprocRegex)[1];
                    if("inventory" in hunt_response && resultItem in hunt_response.inventory) {
                        const {name: rItemName, item_id: rItemID} = hunt_response.inventory[resultItem];
                        const convertible = {
                            id: 2180, // Torch Charm's item ID
                            name: "Torch Charm",
                            quantity: 1,
                        };
                        const items = [{
                            id: rItemID,
                            name: rItemName,
                            quantity: 1,
                        }];
                        logger.debug("Submitting Torch Charm: ", {torch_charm_loot: items});

                        submissionService.submitItemConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/queso_cannonstorm_base_trigger/) !== -1) {
                const data = markup.render_data.text;
                const qcbprocRegex = /item\.php\?item_type=(.*?)"/g;
                const matchResults = [...data.matchAll(qcbprocRegex)];
                if (matchResults.length == 4){
                    // Get third match, then first capturing group
                    const resultItem = matchResults[2][1];
                    if("inventory" in hunt_response && resultItem in hunt_response.inventory) {
                        const {name: rItemName, item_id: rItemID} = hunt_response.inventory[resultItem];
                        const convertible = {
                            id: 3526, // Queso Cannonstorm Base's item ID
                            name: "Queso Cannonstorm Base",
                            quantity: 1,
                        };
                        const items = [{
                            id: rItemID,
                            name: rItemName,
                            quantity: 1,
                        }];
                        logger.debug("Submitting Queso Cannonstorm Base: ", {queso_cannonstorm_base_loot: items});

                        submissionService.submitItemConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/alchemists_cookbook_base_bonus/) !== -1) {

                more_details.alchemists_cookbook_base_bonus = true;
                logger.debug("Adding Cookbook Base Bonus to details", {procs: more_details});
            }
            else if (css_class.search(/boiling_cauldron_potion_bonus/) !== -1) {
                const data = markup.render_data.text;
                const potionRegex = /item\.php\?item_type=(.*?)"/;
                if (potionRegex.test(data)) {
                    const resultPotion = data.match(potionRegex)[1];
                    if ("inventory" in hunt_response && resultPotion in hunt_response.inventory) {
                        const {name: potionName, item_id: potionId} = hunt_response.inventory[resultPotion];
                        if (potionName && potionId) {
                            const convertible = {
                                id: 3304,
                                name: "Boiling Cauldron Trap",
                                quantity: 1,
                            };
                            const items = [{
                                id: potionId,
                                name: potionName,
                                quantity: 1,
                            }];
                            logger.debug("Boiling Cauldron Trap proc", {boiling_cauldron_trap: items});

                            submissionService.submitItemConvertible(convertible, items);
                        }
                    }
                }
                more_details.boiling_cauldron_trap_bonus = true;
                logger.debug("Boiling Cauldron Trap details", {procs: more_details});
            }
            else if (css_class.search(/chesla_trap_trigger/) !== -1) {
                // Handle a potential Gilded Charm proc.
                const data = markup.render_data.text;
                const gildedRegex = /my Gilded Charm/;
                const quantityRegex = /([\d]+)/;
                if (gildedRegex.test(data) && quantityRegex.test(data)) {
                    const quantityMatch = quantityRegex.exec(data);
                    const strQuantity = quantityMatch[1].replace(/,/g, '').trim();
                    const lootQty = parseInt(strQuantity, 10);

                    if (!lootQty) {
                        window.postMessage({
                            "mhct_log_request": 1,
                            "is_error": true,
                            "gilded charm journal": markup,
                            "inventory": hunt_response.inventory,
                            "reason": "Unable to parse Gilded Charm proc quantity",
                        }, window.origin);
                    } else {
                        const convertible = {
                            id: 2174, // Gilded Charm's item ID
                            name: "Gilded Charm",
                            quantity: 1,
                        };
                        const items = [{id: 114, name: "SUPER|brie+", quantity: lootQty}];
                        logger.debug("Guilded Charm proc", {gilded_charm: items});

                        submissionService.submitItemConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/pirate_sleigh_trigger/) !== -1) {
                // SS Scoundrel Sleigh got 'im!
                more_details.pirate_sleigh_trigger = true;
                logger.debug("Pirate Sleigh proc", {procs: more_details});
            }
            else if (css_class.search(/rainbowQuillSpecialEffect/) !== -1) {
                if (user.environment_name == "Afterword Acres" || user.environment_name == "Epilogue Falls") {
                    more_details.rainbow_quill_trigger = true;
                }
                logger.debug("Rainbow Quill proc", {procs: more_details});
            }
            else if (css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1) {
                logger.debug("Got a hunt record ", {procs: more_details});
                if (css_class.includes('active')) {
                    journal = markup;
                    logger.debug("Found the active hunt", {journal});
                }
            }
            else if (css_class.search(/linked|passive|misc/) !== -1) {
                // Ignore any friend hunts, trap checks, or custom loot journal entries.
            }
        });
        if (journal && Object.keys(journal).length) {
            // Only assign if there's an active hunt
            journal.more_details = more_details;
        }
        return journal;
    }

    /**
     * Initialize the message with main hunt details.
     * @param {import("./types/hg").JournalMarkup} journal The journal entry corresponding to the active hunt.
     * @param {import("./types/hg").HgResponse} before The pre-hunt object
     * @param {import("./types/hg").HgResponse} after The post-hunt object
     * @returns {import("@scripts/types/mhct").IntakeMessage | null} The message object, or `null` if an error occurred.
     */
    function createMessageFromHunt(journal, before, after) {
        const user = before.user;
        const user_post = after.user;

        /** @type {import("./types/mhct").IntakeMessage} */
        const message = {};

        message.entry_id = journal.render_data.entry_id;
        message.entry_timestamp = journal.render_data.entry_timestamp;

        // Location
        if (!user.environment_name || !user_post.environment_name) {
            logger.error('Missing Location');
            return null;
        }
        message.location = {
            name: user.environment_name,
            id: user.environment_id,
        };

        message.shield = user.has_shield;
        message.total_power = user.trap_power;
        message.total_luck = user.trap_luck;
        message.attraction_bonus = Math.round(user.trap_attraction_bonus * 100);

        const components = [
            {prop: 'weapon', message_field: 'trap', required: true, replacer: / trap$/i},
            {prop: 'base', message_field: 'base', required: true, replacer: / base$/i},
            {prop: 'bait', message_field: 'cheese', required: true, replacer: / cheese$/i},
            {prop: 'trinket', message_field: 'charm', required: false, replacer: / charm$/i},
        ];

        // Setup components
        // All pre-hunt users must have a weapon, base, and cheese.
        const missing = components.filter(component => component.required === true
            && !Object.prototype.hasOwnProperty.call(user, `${component.prop}_name`)
        );
        if (missing.length) {
            logger.error(`Missing required setup component: ${missing.map(c => c.message_field).join(', ')}`);
            return null;
        }
        // Assign component values to the message.
        components.forEach(component => {
            const prop_name = `${component.prop}_name`;
            const prop_id = `${component.prop}_item_id`;
            const item_name = user[prop_name];
            message[component.message_field] = (!item_name)
                ? {
                    id: 0,
                    name: '',
                }
                : {
                    // Make sure any strumbers are converted to actual numbers
                    id: parseHgInt(user[prop_id]),
                    name: item_name.replace(component.replacer, ''),
                };
        });

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
                window.console.error(`MHCT: Unknown "catch" journal css: ${journal_css}`);
                return null;
            }
            // Remove HTML tags and other text around the mouse name.
            message.mouse = journal.render_data.text
                .replace(/^.*?;">/, '')    // Remove all text through the first sequence of `;">`
                .replace(/<\/a>.*/i, '')    // Remove text after the first <a href>'s closing tag </a>
                .replace(/ mouse$/i, '');  // Remove " [Mm]ouse" if it is not a part of the name (e.g. Dread Pirate Mousert)
        }

        // Auras
        message.auras = Object.keys(before.trap_image.auras).filter(codename => before.trap_image.auras[codename].status === 'active');

        return message;
    }

    /**
     * Creates rejection event info containing information about location, stage, and mouse
     * @param {import('@scripts/types/mhct').IntakeMessage} pre
     * @param {import('@scripts/types/mhct').IntakeMessage} post
     */
    function createRejectionMessage(pre, post) {
        return {
            pre: createEventObject(pre),
            post: createEventObject(post),
        };

        /** @param {import('@scripts/types/mhct').IntakeMessage} message */
        function createEventObject(message) {
            return {
                location: message.location.name,
                stage: message.stage,
                mouse: message.mouse,
            };
        }
    }

    /**
     * Living & Twisted Garden areas share the same HG environment ID, so use the quest data
     * to assign the appropriate ID for our database.
     * @param {Object <string, any>} message The message to be sent
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt
     */
    function fixLGLocations(message, user, user_post, hunt) {
        const env_to_location = {
            35: {"quest": "QuestLivingGarden",
                "true": {id: 35, name: "Living Garden"},
                "false": {id: 5002, name: "Twisted Garden"}},
            41: {"quest": "QuestLostCity",
                "true": {id: 5000, name: "Lost City"},
                "false": {id: 41, name: "Cursed City"}},
            42: {"quest": "QuestSandDunes",
                "true": {id: 5001, name: "Sand Dunes"},
                "false": {id: 42, name: "Sand Crypts"}},
        };
        const env = env_to_location[message.location.id];
        if (env) {
            const is_normal = user.quests[env.quest].is_normal.toString();
            Object.assign(message.location, env[is_normal]);
        } else if ([
            "Living Garden", "Twisted Garden",
            "Lost City", "Cursed City",
            "Sand Dunes", "Sand Crypts",
        ].includes(message.location.name)) {
            console.warn("Unexpected LG-area location", {record: message, user, user_post, hunt});
            throw new Error(`Unexpected location id ${message.location.id} for LG-area location`);
        }
    }

    /** @type {Object<string, import("./modules/stages/stages.types").IStager>} */
    const location_stager_lookup = {};
    for (const stager of stagers.stageModules) {
        location_stager_lookup[stager.environment] = stager;
    }

    /**
     * Use `quests` or `viewing_atts` data to assign appropriate location-specific stage information.
     * @param {Object <string, any>} message The message to be sent
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt
     */
    function addStage(message, user, user_post, hunt) {
        // IStagers
        const stager = location_stager_lookup[user.environment_name];
        if (stager) {
            stager.addStage(message, user, user_post, hunt);
        }
    }

    /** @type { Object<string, import("./modules/details/details.types").IEnvironmentDetailer> } */
    const location_detailer_lookup = {};
    for (const detailer of detailers.environmentDetailerModules) {
        location_detailer_lookup[detailer.environment] = detailer;
    }

    /**
     * Determine additional detailed parameters that are otherwise only visible to db exports and custom views.
     * These details may eventually be migrated to help inform location-specific stages.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHuntDetails(message, user, user_post, hunt) {
        // First, get any location-specific details:
        let locationHuntDetails = {};
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
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     * @param {Object <string, any>} inventory The inventory object in hg server response, has item info
     */
    function addLoot(message, hunt, inventory) {
        let hunt_description = hunt.render_data.text;
        if (!hunt_description.includes("following loot:")) { return; }

        hunt_description = hunt_description.substring(hunt_description.indexOf("following loot:") + 15);
        const loot_array = hunt_description.split(/<\s*\/\s*a\s*>/g).filter(i => i);
        message.loot = loot_array.map(item_text => {

            let item_name = item_text.substring(item_text.indexOf("item_type=") + 10);
            item_name = item_name.substring(0, item_name.indexOf('"'));
            const item_amount = parseInt(item_text.match(/\d+[\d,]*/)[0].replace(/,/g, ''), 10);
            const plural_name = $($.parseHTML(item_text)).filter("a").text();

            if (!Object.prototype.hasOwnProperty.call(inventory, item_name)) {
                logger.debug(`Looted "${item_name}", but it is not in user inventory`);
                return null;
            }
            const loot_object = {
                amount:      item_amount,
                lucky:       item_text.includes('class="lucky"'),
                id:          inventory[item_name].item_id,
                name:        inventory[item_name].name,
                plural_name: item_amount > 1 ? plural_name : '',
            };

            logger.debug("Loot object", {loot_object});

            return loot_object;
        }).filter(loot => loot);
    }

    function escapeButtonClose() {
        if (userSettings['escape-button-close'] === false) {
            return;
        }

        $(document).keyup(function (e) {
            if (e.key === "Escape" && $('a[id*=jsDialogClose],input[class*=jsDialogClose],a[class*=messengerUINotificationClose],a[class*=closeButton],input[value*=Close]').length > 0) {
                $('a[id*=jsDialogClose],input[class*=jsDialogClose],a[class*=messengerUINotificationClose],a[class*=closeButton],input[value*=Close]').each(function () {
                    $(this).click();
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
        });

        logger.info(`Helper Extension version ${isDev ? "DEV" : mhhh_version} loaded! Good luck!`);
    }

    main();
}());
