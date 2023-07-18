/*jslint browser:true */
import {IntakeRejectionEngine} from "./hunt-filter/engine";
import {ConsoleLogger, LogLevel} from './util/logger';
import {getUnixTimestamp} from "./util/time";
import * as successHandlers from './modules/ajax-handlers';
import {HornHud} from './util/HornHud';
import * as detailers from './modules/details';
import * as stagers from './modules/stages';
import * as stagingFuncs from './modules/stages/legacy';
import * as detailingFuncs from './modules/details/legacy';

(function () {
    'use strict';

    let base_domain_url = "https://www.mhct.win";
    let main_intake_url, map_intake_url, convertible_intake_url, map_helper_url, rh_intake_url, rejection_intake_url;

    let mhhh_version = 0;
    let hunter_id_hash = '0';

    const logger = new ConsoleLogger();
    const rejectionEngine = new IntakeRejectionEngine(logger);
    const ajaxSuccessHandlers = [
        new successHandlers.GWHGolemAjaxHandler(logger, showFlashMessage),
        new successHandlers.SEHAjaxHandler(logger, submitConvertible),
        new successHandlers.SBFactoryAjaxHandler(logger, submitConvertible),
    ];

    async function main() {
        try {
            if (!window.jQuery) {
                throw "Can't find jQuery.";
            }

            const settings = await getSettingsAsync();
            await initialLoad(settings);
            addWindowMessageListeners();
            if (settings?.tracking_enabled) {
                logger.info("Tracking is enabled in settings.");
                addAjaxHandlers();
            } else {
                logger.info("Tracking is disabled in settings.");
            }
            finalLoad(settings);
        } catch (error) {
            logger.error("Failed to initialize.", error);
        }
    }

    // Define Get settings function
    function getSettings(callback) {
        window.addEventListener("message", function listenSettings(event) {
            if (event.data.mhct_settings_response !== 1) {
                return;
            }
            const settings = event.data.settings;

            logger.setLevel(settings.debug_logging ? LogLevel.Debug : LogLevel.Info);

            if (callback && typeof(callback) === "function") {
                window.removeEventListener("message", listenSettings);
                callback(settings);
            }
        }, false);
        window.postMessage({mhct_settings_request: 1}, "*");
    }

    async function getSettingsAsync() {
        return new Promise((resolve) => {
            getSettings(data => resolve(data));
        });
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

    async function initialLoad(settings) {
        mhhh_version = formatVersion($("#mhhh_version").val());
        if (mhhh_version == 0) {
            logger.info("Test version detected, turning on debug mode and pointing to server on localhost");
            base_domain_url = 'http://localhost';
        }
        if (settings.debug_logging || mhhh_version == 0) {
            logger.setLevel(LogLevel.Debug);
            logger.debug("Debug mode activated");
            logger.debug("initialLoad ran with settings", {settings});
        }
        main_intake_url = base_domain_url + "/intake.php";
        map_intake_url = base_domain_url + "/map_intake.php";
        convertible_intake_url = base_domain_url + "/convertible_intake.php";
        map_helper_url = base_domain_url + "/maphelper.php";
        rh_intake_url = base_domain_url + "/rh_intake.php";
        rejection_intake_url = base_domain_url + "/rejection_intake.php";

        await createHunterIdHash();
    }

    // Listening for calls
    function addWindowMessageListeners() {
        window.addEventListener('message', ev => {
            if (ev.data.mhct_message == null) {
                return;
            }

            if (ev.data.mhct_message === 'userhistory') {
                window.open(`${base_domain_url}/searchByUser.php?hunter_id=${hunter_id_hash}`);
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

            // Crown submission results in either the boolean `false`, or the total submitted crowns.
            if (ev.data.mhct_message === 'crownSubmissionStatus') {
                const counts = ev.data.submitted;
                if (counts) {
                    displayFlashMessage(ev.data.settings, "success",
                        `Submitted ${counts} crowns for ${$('span[class*="titleBar-name"]').text()}.`);
                } else if (counts != null) {
                    displayFlashMessage(ev.data.settings, "error", "There was an issue submitting crowns on the backend.");
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

    function openBookmarklet(url) {
        fetch(url).then(response => response.text()).then((data) => {
            const new_source = url.replace("menu", "\" + e + \"");
            const tsitus_menu = data.replace(',n="https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-"+e+".min.js";t.src=n', ";t.src=\"" + new_source + "\"");
            document.location.href = "javascript:void function(){" + tsitus_menu + "%0A}();";
        });
    }

    // Get map mice
    function openMapMiceSolver(solver) {
        let url = '';
        let glue = '';
        let method = '';
        let input_name ='';
        if (solver === 'mhmh') {
            url = map_helper_url;
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
        };
        $.post('https://www.mousehuntgame.com/managers/ajax/users/treasuremap.php', payload, null, 'json')
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
        getSettings(settings => displayFlashMessage(settings, type, message));
    }

    /**
     * Display the given message in an appropriately colored pop-up flash message.
     * @param {Object <string, any>} settings The user's extension settings
     * @param {"error"|"warning"|"success"} type The type of message being displayed, which controls the color and duration.
     * @param {string} message The message content to display.
     */
    function displayFlashMessage(settings, type, message) {
        if ((type === 'success' && !settings.success_messages)
            || (type !== 'success' && !settings.error_messages)) {
            return;
        }
        const mhhh_flash_message_div = $('#mhhh_flash_message_div');
        mhhh_flash_message_div.text("MHCT Helper: " + message);

        mhhh_flash_message_div.css('left', 'calc(50% - ' + (mhhh_flash_message_div.width() / 2) + 'px)');

        if (type === 'success') {
            mhhh_flash_message_div.css('background', 'lightgreen');
            mhhh_flash_message_div.css('border', '1px solid green');
        } else if (type === 'error') {
            mhhh_flash_message_div.css('background', 'pink');
            mhhh_flash_message_div.css('border', '1px solid red');
        } else { // warning
            mhhh_flash_message_div.css('background', 'gold');
            mhhh_flash_message_div.css('border', '1px solid darkgoldenrod');
        }

        mhhh_flash_message_div.fadeIn(() => {
            setTimeout(() => $('#mhhh_flash_message_div').fadeOut(), 1500 + 2000 * (type !== "success"));
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
                    },
                    dataType: "json",
                }).done(userRqResponse => {
                    logger.debug("Got user object, invoking huntSend", {userRqResponse});
                    hunt_xhr.addEventListener("loadend", () => {
                        logger.debug("Overall 'Hunt Requested' Timing %i (ms)", performance.now() - huntRequestTimeStart);
                        // Call record hunt with the pre-hunt and hunt (post) user objects.
                        recordHuntWithPrehuntUser(userRqResponse, JSON.parse(hunt_xhr.responseText));
                    }, false);
                    hunt_send.apply(hunt_xhr, huntArgs);
                });
            };
            return hunt_xhr;
        };
    }

    // Listening routers
    function addAjaxHandlers() {
        $(document).ajaxSend(getUserBeforeHunting);
        $(document).ajaxSuccess((event, xhr, ajaxOptions) => {
            const url = ajaxOptions.url;
            if (url.includes("mousehuntgame.com/managers/ajax/users/treasuremap.php")) {
                recordMap(xhr);
            } else if (url.includes("mousehuntgame.com/managers/ajax/users/useconvertible.php")) {
                recordConvertible(xhr);
            } else if (url.includes("mousehuntgame.com/managers/ajax/pages/page.php")) {
                if (url.includes("page_arguments%5Btab%5D=kings_crowns")) {
                    getSettings(settings => recordCrowns(settings, xhr, url));
                }
            } else if (url.includes("mousehuntgame.com/managers/ajax/events/kings_giveaway.php")) {
                // Triggers on Birthday Items claim, room change click (+others, perhaps).
                // Wed Jun 23 2021 22:00:00 GMT-0400 [King's Giveaway Key Vanishing date 15th])
                getSettings(settings => recordPrizePack(settings, xhr));
            } else if (url.includes("mousehuntgame.com/managers/ajax/users/session.php")) {
                createHunterIdHash();
            }

            for (const handler of ajaxSuccessHandlers) {
                if (handler.match(url)) {
                    handler.execute(xhr.responseJSON);
                }
            }
        });
    }

    /**
     * Record Crowns. The xhr response data also includes a `mouseData` hash keyed by each mouse's
     * HG identifier and with the associated relevant value properties of `name` and `num_catches`
     * @param {Object <string, any>} settings The user's extension settings.
     * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
     * @param {string} url The URL that invoked the function call.
     */
    function recordCrowns(settings, xhr, url) {
        const mouseCrowns = xhr.responseJSON?.page?.tabs?.kings_crowns?.subtabs?.[0]?.mouse_crowns;
        if (!mouseCrowns) {
            logger.debug('Skipped crown submission due to unhandled XHR structure');
            window.postMessage({
                "mhct_log_request": 1,
                "is_error": true,
                "crown_submit_xhr_response": xhr.responseJSON,
                "reason": "Unable to determine King's Crowns",
            }, window.origin);
            return;
        }

        // Traditional snuids are digit-only, but new snuids are `hg_` plus a hash, e.g.
        //    hg_0ffb7add4e6e14d8e1147cb3f12fe84d
        const url_params = url.match(/snuid%5D=(\w+)/);
        const badgeGroups = mouseCrowns.badge_groups;
        if (!url_params || !badgeGroups) {
            return;
        }

        const payload = {
            user: url_params[1],
            timestamp: Math.round(Date.now() / 1000),

            bronze: 0,
            silver: 0,
            gold: 0,
            platinum: 0,
            diamond: 0,
        };

        /** Rather than compute counts ourselves, use the `badge` display data.
         * badges: [
         *     {
         *         badge: (2500   | 1000     | 500  | 100    | 10),
         *         type: (diamond | platinum | gold | silver | bronze),
         *         mice: string[]
         *     },
         *     ...
         * ]
         */
        badgeGroups.forEach(group => {
            const type = group.type;
            if (Object.prototype.hasOwnProperty.call(payload, type)) {
                payload[type] = group.count;
            }
        });
        logger.debug("MHCT: Crowns payload: ", payload);

        // Prevent other extensions (e.g. Privacy Badger) from blocking the crown
        // submission by submitting from the content script.
        window.postMessage({
            "mhct_crown_update": 1,
            "crowns": payload,
            "settings": settings,
        }, window.origin);
    }

    /**
     * Record Mini Prize Pack convertible submissions as convertibles in MHCT
     * @param {Object <string, any>} settings The user's extension settings.
     * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
     */
    function recordPrizePack(settings, xhr) {
        if (
            !xhr.responseJSON || !xhr.responseJSON.kings_giveaway_result ||
            !xhr.responseJSON.inventory || !xhr.responseJSON.kings_giveaway_result.quantity ||
            xhr.responseJSON.kings_giveaway_result.slot !== "bonus"
        ) {
            logger.debug('Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.');
            window.postMessage({
                "mhct_log_request": 1,
                "is_error": true,
                "kga_2021_response": xhr.responseJSON,
                "reason": "Unable to parse kga 2021 response. This is normal if a pack wasn't opened",
            }, window.origin);
            return;
        }
        const result = xhr.responseJSON.kings_giveaway_result;
        const inventory = xhr.responseJSON.inventory;

        const convertible = {
            name: "King's Mini Prize Pack",
            id: 130008,
            quantity: result.quantity,
        };

        const item_map = {
            "gold_stat_item": 431,
        };

        const items = [];
        result.items.forEach(item => {
            const i = {
                "type": item.type,
                "quantity": parseInt((item.quantity + ",").replace(/,/g, ""), 10),
            };
            if (item.type in inventory && inventory[item.type].item_id) {
                i.id = inventory[item.type].item_id;
            }
            else if (item.type in item_map) {
                i.id = item_map[item.type];
            }
            items.push(i);
        });

        logger.debug("Prizepack: ", {convertible, items, settings});
        submitConvertible(convertible, items);
    }

    // Record map mice
    function recordMap(xhr) {
        const resp = xhr.responseJSON;
        if (resp.treasure_map_inventory?.relic_hunter_hint) {
            sendMessageToServer(rh_intake_url, {
                hint: resp.treasure_map_inventory.relic_hunter_hint,
            });
        }

        const {map_id, name} = resp.treasure_map ?? {};
        if (!map_id || !name) {
            return;
        }
        const map = {
            mice: getMapMice(resp),
            id: map_id,
            name: name.replace(/ treasure/i, '')
                .replace(/rare /i, '')
                .replace(/common /i, '')
                .replace(/Ardouous/i, 'Arduous'),
        };

        // Send to database
        sendMessageToServer(map_intake_url, map);
    }

    /**
     * @param {Object <string, any>} pre_response The object obtained prior to invoking `activeturn.php`.
     * @param {Object <string, any>} post_response Parsed JSON representation of the response from calling activeturn.php
     */
    function recordHuntWithPrehuntUser(pre_response, post_response) {
        logger.debug("In recordHuntWithPrehuntUser pre and post:", pre_response, post_response);

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
        }
        if (logger.getLevel() === LogLevel.Debug) {
            const differences = {};
            diffUserObjects(differences, new Set(), new Set(Object.keys(user_post)), user_pre, user_post);
            logger.debug("User object diff", differences);
        }

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
         * @param {Object<string, any>} user A the main user object (pre or post) used to populate the message
         * @param {Object<string, any>} user_post The post-hunt user object
         * @param {Object <string, any>} hunt Journal entry corresponding with the hunt
         * @returns
         */
        function createIntakeMessage(user, user_post, hunt) {
            // Obtain the main hunt information from the journal entry and user objects.
            const message = createMessageFromHunt(hunt, user, user_post);
            if (!message) {
                logger.info("Missing Info (will try better next hunt)(1)");
                return;
            }

            // Perform validations and stage corrections.
            fixLGLocations(message, user, user_post, hunt);

            addStage(message, user, user_post, hunt);
            addHuntDetails(message, user, user_post, hunt);
            addLoot(message, hunt, post_response.inventory);

            return message;
        }

        let message_pre;
        let message_post;
        try {
            // Create two intake messages. One based on pre-response. The other based on post-response.
            message_pre = createIntakeMessage(user_pre, user_post, hunt);
            message_post = createIntakeMessage(user_post, user_post, hunt);
        } catch (error) {
            logger.error("Something went wrong creating message", error);
        }

        if (message_pre === null || message_post === null) {
            logger.log("Missing Info (will try better next hunt)(2)");
            return;
        }

        // Validate the differences between the two intake messages
        validated = rejectionEngine.validateMessage(message_pre, message_post);
        if (!validated) {
            // collect limited info for stage and location rejections
            const invalidProperties = rejectionEngine.getInvalidIntakeMessageProperties(message_pre, message_post);
            if (invalidProperties.has('stage') || invalidProperties.has('location')) {
                const rejection_message = createRejectionMessage(message_pre, message_post);
                sendMessageToServer(rejection_intake_url, rejection_message);
            }

            return;
        }

        logger.debug("Recording hunt", {message_var:message_pre, user_pre, user_post, hunt});
        // Upload the hunt record.
        sendMessageToServer(main_intake_url, message_pre);
    }

    // Add bonus journal entry stuff to the hunt_details
    function calcMoreDetails(hunt) {
        let new_details = {};
        if ('more_details' in hunt) {
            new_details = hunt.more_details;
        }
        return new_details;
    }

    // Record convertible items
    function recordConvertible(xhr) {
        const response = xhr?.responseJSON;

        if (!response?.convertible_open?.items || !response.convertible_open.type) {
            return;
        }

        let convertible;
        const opened_key = response.convertible_open.type;
        if (Object.prototype.hasOwnProperty.call(response.items, opened_key)) {
            convertible = response.items[opened_key];
        }

        if (!convertible) {
            logger.warn("Couldn't find any items from opened convertible");
            return;
        }

        const results = response.convertible_open.items;
        const our_map = {
            gold_stat_item: 431,
            point_stat_item: 644,
        };
        const items = [];
        results.forEach(result => {
            if  (Object.prototype.hasOwnProperty.call(response.inventory, result.type)) {
                items.push({
                    id: response.inventory[result.type].item_id,
                    type: result.type,
                    name: result.name,
                    pluralized_name: result.pluralized_name || '',
                    quantity: result.quantity,
                });
            }
            else if (result.type in our_map) {
                items.push({
                    id: our_map[result.type],
                    type: result.type,
                    name: result.name,
                    pluralized_name: result.pluralized_name || '',
                    quantity: result.quantity,
                });
            }
        });
        if (items.length === 0) {
            return;
        }

        submitConvertible(convertible, items);
    }

    /**
     * @typedef {Object} HgItem
     * @property {number} id HitGrab's ID for this item
     * @property {string} name HitGrab's display name for this item
     * @property {number} quantity the number of this item received or opened
     */

    /**
     * Helper function to submit opened items.
     * @param {HgItem} convertible The item that was opened.
     * @param {HgItem[]} items An array of items that were obtained by opening the convertible
     */
    function submitConvertible(convertible, items) {
        const record = {
            convertible: getItem(convertible),
            items: items.map(getItem),
            asset_package_hash: Date.now(),
        };

        // Send to database
        logger.debug("submitting convertible", {record});
        sendMessageToServer(convertible_intake_url, record);
    }

    function sendMessageToServer(url, final_message) {
        if (final_message.entry_timestamp == null) {
            final_message.entry_timestamp = getUnixTimestamp();
        }

        getSettings(settings => {
            if (!settings?.tracking_enabled) { return; }
            const basic_info = {
                hunter_id_hash,
                entry_timestamp: final_message.entry_timestamp,
                extension_version: mhhh_version,
            };


            // Get UUID
            $.post(base_domain_url + "/uuid.php", basic_info).done(data => {
                if (data) {
                    final_message.uuid = data;
                    final_message.hunter_id_hash = hunter_id_hash;
                    final_message.extension_version = mhhh_version;
                    sendAlready(url, final_message);
                }
            });
        });
    }

    function sendAlready(url, fin_message) {
        // Send to database
        $.post(url, fin_message)
            .done(data => {
                if (data) {
                    const response = JSON.parse(data);
                    showFlashMessage(response.status, response.message);
                }
            });
    }

    /**
     * Find the active journal entry, and handle supported "bonus journals" such as the Relic Hunter attraction.
     * @param {Object <string, any>} hunt_response The JSON response returned from a horn sound.
     * @returns {Object <string, any>} The journal entry corresponding to the active hunt.
     */
    function parseJournalEntries(hunt_response, max_old_entry_id) {
        let journal = {};
        const more_details = {};
        more_details['hunt_count'] = 0;
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
                    sendMessageToServer(main_intake_url, rh_message);
                    logger.debug(`Found the Relic Hunter in ${rh_message.rh_environment}`);
                }
            }
            else if (css_class.search(/prizemouse/) !== -1) {
                // Handle a prize mouse attraction.
                if (logger.getLevel() === LogLevel.Debug) {
                    window.postMessage({
                        "mhct_log_request": 1,
                        "prize mouse journal": markup,
                    }, window.origin);
                }
                // TODO: Implement data submission
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

                        submitConvertible(convertible, items);
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

                        submitConvertible(convertible, items);
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

                        submitConvertible(convertible, items);
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

                        submitConvertible(convertible, items);
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

                        submitConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/alchemists_cookbook_base_bonus/) !== -1) {

                more_details['alchemists_cookbook_base_bonus'] = true;
                logger.debug("Adding Cookbook Base Bonus to details", {procs: more_details});
            }
            else if (css_class.search(/boiling_cauldron_potion_bonus/) !== -1) {
                const is_boon = (css_class.search(/boon_potion_bonus/) !== -1);
                const is_gloom = (user.environment_name === "Gloomy Greenwood");
                const data = markup.render_data.text;
                let trap_name = "Boiling Cauldron Trap";
                if (is_boon || is_gloom) {
                    trap_name += " (";
                    if (is_boon) {
                        trap_name += "Boon";
                        if (is_gloom) {
                            trap_name += " ";
                        }
                    }
                    if (is_gloom) {
                        trap_name += "Gloom";
                    }
                    trap_name += ")";
                }
                const potionRegex = /item\.php\?item_type=(.*?)"/;
                if (potionRegex.test(data)) {
                    const resultPotion = data.match(potionRegex)[1];
                    if ("inventory" in hunt_response && resultPotion in hunt_response.inventory) {
                        const {name: potionName, item_id: potionId} = hunt_response.inventory[resultPotion];
                        if (potionName && potionId) {
                            const convertible = {
                                id: 3304 + (is_boon ? 100000 : 0) + (is_gloom ? 90000 : 0), // Boon / Gloom logic
                                name: trap_name,
                                quantity: 1,
                            };
                            const items = [{
                                id: potionId, //need to get this
                                name: potionName,
                                quantity: 1,
                            }];
                            logger.debug("Boiling Cauldron Trap proc", {boiling_cauldron_trap: items});

                            submitConvertible(convertible, items);
                        }
                    }
                }
                more_details['boiling_cauldron_trap_bonus'] = true;
                if (is_boon) {
                    more_details['gloomy_cauldron_boon'] = true;
                }
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

                        submitConvertible(convertible, items);
                    }
                }
            }
            else if (css_class.search(/pirate_sleigh_trigger/) !== -1) {
                // SS Scoundrel Sleigh got 'im!
                more_details['pirate_sleigh_trigger'] = true;
                logger.debug("Pirate Sleigh proc", {procs: more_details});
            }
            else if (css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1) {
                more_details['hunt_count']++;
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
            journal['more_details'] = more_details;
        }
        return journal;
    }

    /**
     * Initialize the message with main hunt details.
     * @param {Object <string, any>} journal The journal entry corresponding to the active hunt.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @returns {Object <string, any> | null} The message object, or `null` if an error occurred.
     */
    function createMessageFromHunt(journal, user, user_post) {
        const message = {};
        const debug_logs = [];

        // Entry ID
        message.entry_id = journal.render_data.entry_id;

        // Entry Timestamp
        message.entry_timestamp = journal.render_data.entry_timestamp;

        // Location
        if (!user.environment_name || !user_post.environment_name) {
            window.console.error('MHCT: Missing Location');
            return null;
        }
        message.location = {
            name: user.environment_name,
            id: user.environment_id,
        };
        if (user_post.environment_id != user.environment_id) {
            debug_logs.push(`User auto-traveled from ${user.environment_name} to ${user_post.environment_name}`);
        }

        // Shield (true / false)
        message.shield = user.has_shield;

        // Total Power, Luck, Attraction
        message.total_power = user.trap_power;
        if (user_post.trap_power !== user.trap_power) {
            debug_logs.push(`User setup power changed from ${user.trap_power} to ${user_post.trap_power}`);
        }

        message.total_luck = user.trap_luck;
        if (user_post.trap_luck !== user.trap_luck) {
            debug_logs.push(`User setup luck changed from ${user.trap_luck} to ${user_post.trap_luck}`);
        }

        message.attraction_bonus = Math.round(user.trap_attraction_bonus * 100);
        if (user_post.trap_attraction_bonus !== user.trap_attraction_bonus) {
            debug_logs.push(`User setup attraction bonus changed from ${user.trap_attraction_bonus} to ${user_post.trap_attraction_bonus}`);
        }

        // Setup components
        const components = [
            {prop: 'weapon', message_field: 'trap', required: true, replacer: / trap$/i},
            {prop: 'base', message_field: 'base', required: true, replacer: / base$/i},
            {prop: 'bait', message_field: 'cheese', required: true, replacer: / cheese$/i},
            {prop: 'trinket', message_field: 'charm', required: false, replacer: / charm$/i},
        ];
        // All pre-hunt users must have a weapon, base, and cheese.
        const missing = components.filter(component => component.required === true
            && !Object.prototype.hasOwnProperty.call(user, `${component.prop}_name`)
        );
        if (missing.length) {
            window.console.error(`MHCT: Missing required setup component: ${missing.map(c => c.message_field).join(', ')}`);
            return null;
        }
        // Assign component values to the message.
        components.forEach(component => {
            const prop_name = `${component.prop}_name`;
            const prop_id = `${component.prop}_item_id`;
            const item_name = user[prop_name];
            message[component.message_field] = (!item_name) ? {} : {
                id: user[prop_id],
                name: item_name.replace(component.replacer, ''),
            };

            if (item_name !== user_post[prop_name]) {
                debug_logs.push(`User ${component.message_field} changed: Was '${item_name}' and is now '${user_post[prop_name] || "None"}'`);
            }
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

        debug_logs.forEach(log_message => logger.debug(log_message));

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

    /** @type {Object <string, Function>} */
    const location_stage_lookup = {
        "Balack's Cove": stagingFuncs.addBalacksCoveStage,
        "Bristle Woods Rift": stagingFuncs.addBristleWoodsRiftStage,
        "Burroughs Rift": stagingFuncs.addBurroughsRiftStage,
        "Claw Shot City": stagingFuncs.addClawShotCityStage,
        "Cursed City": stagingFuncs.addLostCityStage,
        "Festive Comet": stagingFuncs.addFestiveCometStage,
        "Frozen Vacant Lot": stagingFuncs.addFestiveCometStage,
        "Fiery Warpath": stagingFuncs.addFieryWarpathStage,
        "Floating Islands": stagingFuncs.addFloatingIslandsStage,
        "Foreword Farm": stagingFuncs.addForewordFarmStage,
        "Fort Rox": stagingFuncs.addFortRoxStage,
        "Furoma Rift": stagingFuncs.addFuromaRiftStage,
        "Gnawnian Express Station": stagingFuncs.addTrainStage,
        "Harbour": stagingFuncs.addHarbourStage,
        "Iceberg": stagingFuncs.addIcebergStage,
        "Labyrinth": stagingFuncs.addLabyrinthStage,
        "Living Garden": stagingFuncs.addGardenStage,
        "Lost City": stagingFuncs.addLostCityStage,
        "Mousoleum": stagingFuncs.addMousoleumStage,
        "Moussu Picchu": stagingFuncs.addMoussuPicchuStage,
        "Muridae Market": stagingFuncs.addMuridaeMarketStage,
        "Queso Geyser": stagingFuncs.addQuesoGeyserStage,
        "Sand Dunes": stagingFuncs.addSandDunesStage,
        "Seasonal Garden": stagingFuncs.addSeasonalGardenStage,
        "Slushy Shoreline": stagingFuncs.addSlushyShorelineStage,
        "Sunken City": stagingFuncs.addSunkenCityStage,
        "Table of Contents": stagingFuncs.addTableOfContentsStage,
        "Toxic Spill": stagingFuncs.addToxicSpillStage,
        "Twisted Garden": stagingFuncs.addGardenStage,
        "Valour Rift": stagingFuncs.addValourRiftStage,
        "Whisker Woods Rift": stagingFuncs.addWhiskerWoodsRiftStage,
        "Zokor": stagingFuncs.addZokorStage,
    };

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
        // legacy staging funcs
        const stage_func = location_stage_lookup[user.environment_name];
        if (stage_func) {
            stage_func(message, user, user_post, hunt);
        }

        // IStagers
        const stager = location_stager_lookup[user.environment_name];
        if (stager) {
            stager.addStage(message, user, user_post, hunt);
        }
    }

    /** @type {Object <string, Function>} */
    const location_huntdetails_lookup = {
        "Bristle Woods Rift": detailingFuncs.calcBristleWoodsRiftHuntDetails,
        "Claw Shot City": detailingFuncs.calcClawShotCityHuntDetails,
        "Fiery Warpath": detailingFuncs.calcFieryWarpathHuntDetails,
        "Fort Rox": detailingFuncs.calcFortRoxHuntDetails,
        "Harbour": detailingFuncs.calcHarbourHuntDetails,
        "Sand Crypts": detailingFuncs.calcSandCryptsHuntDetails,
        "Table of Contents": detailingFuncs.calcTableofContentsHuntDetails,
        "Valour Rift": detailingFuncs.calcValourRiftHuntDetails,
        "Whisker Woods Rift": detailingFuncs.calcWhiskerWoodsRiftHuntDetails,
        "Zokor": detailingFuncs.calcZokorHuntDetails,
        "Zugzwang's Tower": detailingFuncs.calcZugzwangsTowerHuntDetails,
    };

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
        const details_func = location_huntdetails_lookup[user.environment_name];
        let locationHuntDetails = details_func ? details_func(message, user, user_post, hunt) : undefined;

        const detailer = location_detailer_lookup[user.environment_name];
        if (detailer) {
            locationHuntDetails = detailer.addDetails(message, user, user_post, hunt);
        }

        // Then, get any global hunt details (such as from ongoing events, auras, etc).
        const globalHuntDetails = [
            detailingFuncs.calcHalloweenHuntDetails,
            detailingFuncs.calcLNYHuntDetails,
            detailingFuncs.calcLuckyCatchHuntDetails,
            detailingFuncs.calcPillageHuntDetails,
        ].map((details_func) => details_func(message, user, user_post, hunt))
            .filter(details => details);

        globalHuntDetails.push(...detailers.globalDetailerModules
            .map(detailer => detailer.addDetails(message, user, user_post, hunt))
            .filter(details => details));

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

    /**
     *
     * @param {Object} item An object that looks like an item for convertibles. Has an id (or item_id), name, and quantity
     * @returns {Object} An item with an id, name, and quantity
     */
    function getItem(item) {
        return {
            id: item.item_id || item.id,
            name: item.name,
            // type: item.type,
            quantity: item.quantity,
            // class: item.class || item.classification
        };
    }

    function pad(num, size) {
        let s = String(num);
        while (s.length < (size || 2)) {s = "0" + s;}
        return s;
    }

    function formatVersion(version) {
        version = version.split('.');
        version = version[0] + pad(version[1], 2) + pad(version[2], 2);
        version = Number(version);
        return version;
    }

    function escapeButtonClose() {
        $(document).keyup(function (e) {
            if (e.key === "Escape" && $('a[id*=jsDialogClose],input[class*=jsDialogClose],a[class*=messengerUINotificationClose],a[class*=closeButton],input[value*=Close]').length > 0) {
                $('a[id*=jsDialogClose],input[class*=jsDialogClose],a[class*=messengerUINotificationClose],a[class*=closeButton],input[value*=Close]').each(function () {
                    $(this).click();
                });
            }
        });
    }

    // Finish configuring the extension behavior.
    function finalLoad(settings) {
        if (settings.escape_button_close) {
            escapeButtonClose();
        }

        // If this page is a profile page, query the crown counts (if the user tracks crowns).
        const profileAutoScan = () => {
            const profile_RE = /profile.php\?snuid=(\w+)$/g; // "$" at regex end = only auto-fetch when AJAX route changing onto a plain profile page
            const profile_RE_matches = document.URL.match(profile_RE);
            if (profile_RE_matches !== null && profile_RE_matches.length) {
                const profile_snuid = profile_RE_matches[0].replace("profile.php?snuid=", "");

                // Form data directly in URL to distinguish it from a profile "King's Crowns" tab click
                const crownUrl = `https://www.mousehuntgame.com/managers/ajax/pages/page.php?page_class=HunterProfile&page_arguments%5Btab%5D=kings_crowns&page_arguments%5Bsub_tab%5D=false&page_arguments%5Bsnuid%5D=${profile_snuid}&uh=${user.unique_hash}`;

                $.post(crownUrl, "sn=Hitgrab&hg_is_ajax=1", null, "json")
                    .fail(err => {
                        logger.debug(`Crown query failed for snuid=${profile_snuid}`, err);
                    });
            }
        };

        // Checks for route changes and then rescans for plain profiles
        const URLDiffCheck = () => {
            const cachedURL = localStorage.getItem("mhct-url-cache");
            const currentURL = document.URL;

            if (!cachedURL || (cachedURL && cachedURL !== currentURL)) {
                localStorage.setItem("mhct-url-cache", currentURL);
                profileAutoScan();
            }
        };

        URLDiffCheck(); // Initial call on page load
        $(document).ajaxStop(URLDiffCheck); // AJAX event listener for subsequent route changes

        let versionInfo = "version " + mhhh_version;
        if (Number(mhhh_version) == 0) {
            versionInfo = "TEST version";
        }

        // Tell content script we are done loading
        window.postMessage({
            mhct_finish_load: 1,
        });

        logger.info(`${versionInfo} loaded! Good luck!`);
    }

    main();
}());
