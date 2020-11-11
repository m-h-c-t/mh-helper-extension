/*jslint browser:true */

(function () {
    'use strict';

    const base_domain_url = "https://www.agiletravels.com";
    const db_url = base_domain_url + "/intake.php";
    const map_intake_url = base_domain_url + "/map_intake.php";
    const convertible_intake_url = base_domain_url + "/convertible_intake.php";
    const map_helper_url = base_domain_url + "/maphelper.php";

    if (!window.jQuery) {
        console.log("MHHH: Can't find jQuery, exiting.");
        return;
    }
    const mhhh_version = $("#mhhh_version").val();

    var debug_logging = false;

    // Listening for calls
    window.addEventListener('message', ev => {
        if (ev.data.mhct_message == null) {
            return;
        }

        if (typeof user.user_id === 'undefined') {
            alert('Please make sure you are logged in into MH.');
            return;
        }
        if (ev.data.mhct_message === 'userhistory') {
            window.open(`${base_domain_url}/searchByUser.php?user=${user.user_id}`);
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
            } else {
                displayFlashMessage(ev.data.settings, "error", "There was an issue submitting crowns on the backend.");
            }
            return;
        }

    }, false);

    function sound_horn() {
        if ($("#huntTimer").text() !== "Ready!") {
            return;
        }

        if ($(".mousehuntHud-huntersHorn").length) { // FreshCoat™ Layout
            $(".mousehuntHud-huntersHorn").click();
        } else if ($(".hornbutton a").length) { // Old Layout
            $(".hornbutton a").click();
        }
    }

    function openBookmarklet(url) {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/javascript");
        xhr.open("GET", url, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                document.location.href = xhr.responseText;
            }
        };
        xhr.send();
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
            last_read_journal_entry_id: lastReadJournalEntryId
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
            setTimeout(() => $('#mhhh_flash_message_div').fadeOut(), 1500 + 1000 * (type !== "success"));
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
        if (debug_logging) {window.console.time("Overall 'Hunt Requested' Timing");}
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
                        uh: user.unique_hash
                    },
                    dataType: "json"
                }).done(userRqResponse => {
                    if (debug_logging) {window.console.log({message: "Got user object, invoking huntSend", userRqResponse});}
                    hunt_xhr.addEventListener("loadend", () => {
                        if (debug_logging) {window.console.timeEnd("Overall 'Hunt Requested' Timing");}
                        // Call record hunt with the pre-hunt user object.
                        recordHuntWithPrehuntUser(JSON.parse(hunt_xhr.responseText), userRqResponse.user);
                    }, false);
                    hunt_send.apply(hunt_xhr, huntArgs);
                });
            };
            return hunt_xhr;
        };
    }

    // Listening routers
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
        }
    });

    // Get settings
    function getSettings(callback) {
        window.addEventListener("message", function listenSettings(event) {
            if (event.data.mhct_settings_response !== 1) {
                return;
            }

            // Locally cache the logging setting.
            debug_logging = !!event.data.settings.debug_logging;

            if (callback && typeof(callback) === "function") {
                window.removeEventListener("message", listenSettings);
                callback(event.data.settings);
            }
        }, false);
        window.postMessage({mhct_settings_request: 1}, "*");
    }

    /**
     * Record Crowns. The xhr response data also includes a `mouseData` hash keyed by each mouse's
     * HG identifier and with the associated relevant value properties of `name` and `num_catches`
     * @param {Object <string, any>} settings The user's extension settings.
     * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
     * @param {string} url The URL that invoked the function call.
     */
    function recordCrowns(settings, xhr, url) {
        if (!settings || !settings.track_crowns) {
            return;
        // TODO: Replace with optional chaining, once full spec compliance is obtained.
        } else if (!xhr.responseJSON || !xhr.responseJSON.page || !xhr.responseJSON.page.tabs
            || !xhr.responseJSON.page.tabs.kings_crowns || !Array.isArray(xhr.responseJSON.page.tabs.kings_crowns.subtabs)
            || !xhr.responseJSON.page.tabs.kings_crowns.subtabs[0] || !xhr.responseJSON.page.tabs.kings_crowns.subtabs[0].mouse_crowns
        ) {
            if (debug_logging) window.console.log('Skipped crown submission due to unhandled XHR structure');
            window.postMessage({
                "mhct_log_request": 1,
                "is_error": true,
                "crown_submit_xhr_response": xhr.responseJSON,
                "reason": "Unable to determine King's Crowns"
            }, window.origin);
            return;
        }

        // Traditional snuids are digit-only, but new snuids are `hg_` plus a hash, e.g.
        //    hg_0ffb7add4e6e14d8e1147cb3f12fe84d
        const url_params = url.match(/snuid%5D=(\w+)/);
        const badgeGroups = xhr.responseJSON.page.tabs.kings_crowns.subtabs[0].mouse_crowns.badge_groups;
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
            diamond: 0
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
            if (payload.hasOwnProperty(type)) {
                payload[type] = group.count;
            }
        });
        if (debug_logging) {window.console.log(payload);}

        // Prevent other extensions (e.g. Privacy Badger) from blocking the crown
        // submission by submitting from the content script.
        window.postMessage({
            "mhct_crown_update": 1,
            "crowns": payload,
            "settings": settings
        }, window.origin);
    }

    // Record map mice
    function recordMap(xhr) {
        const resp = xhr.responseJSON;
        if (!resp.treasure_map || !resp.treasure_map.map_id || !resp.treasure_map.name) {
            return;
        }
        const map = {
            mice: getMapMice(resp),
            id: resp.treasure_map.map_id,
            name: resp.treasure_map.name.replace(/\ treasure/i, '')
                .replace(/rare\ /i, '')
                .replace(/common\ /i, '')
                .replace(/Ardouous/i, 'Arduous'),
            user_id: resp.user.user_id,
            entry_timestamp: Math.round(Date.now() / 1000)
        };

        map.extension_version = formatVersion(mhhh_version);

       // Send to database
       sendMessageToServer(map_intake_url, map);
    }

    /**
     * @param {Object <string, any>} response Parsed JSON representation of the response from calling activeturn.php
     * @param {Object <string, any>} user_pre The user object obtained prior to invoking `activeturn.php`.
     */
    function recordHuntWithPrehuntUser(response, user_pre) {
        if (debug_logging) {window.console.log({message: "In recordHuntWithPrehuntUser", response, user_pre});}
        // Require some difference between the user and response.user objects. If there is
        // no difference, then no hunt occurred to separate them (i.e. a KR popped, or a friend hunt occurred).
        const required_differences = [
            "num_active_turns",
            "next_activeturn_seconds"
        ];
        const user_post = response.user;

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
        if (debug_logging) {
            const differences = {};
            diffUserObjects(differences, new Set(), new Set(Object.keys(user_post)), user_pre, user_post);
            window.console.log({differences});
        }

        const hunt = parseJournalEntries(response);
        // DB submissions only occur if the call was successful (i.e. it did something) and was an active hunt
        if (!response.success || !response.active_turn) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(1)");
            return;
        } else if (!hunt || Object.keys(hunt).length === 0) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(2)");
            return;
        }

        if (!required_differences.every(key => user_pre[key] != user_post[key])
                || user_post.num_active_turns - user_pre.num_active_turns !== 1) {
            window.console.log("MHHH: Required pre/post hunt differences not observed.");
            return;
        }

        // Obtain the main hunt information from the journal entry and user objects.
        const message = createMessageFromHunt(hunt, user_pre, user_post);
        if (!message || !message.location || !message.location.name || !message.trap.name || !message.base.name || !message.cheese.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(1)");
            return;
        }

        // Perform validations and stage corrections.
        fixLGLocations(message, user_pre, user_post, hunt);
        addStage(message, user_pre, user_post, hunt);
        addHuntDetails(message, user_pre, user_post, hunt);
        if (!message.location || !message.location.name || !message.cheese || !message.cheese.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(2)");
            return;
        }

        addLoot(message, hunt, response.inventory);
        if (debug_logging) {window.console.log({message, user_pre, user_post, hunt});}
        // Upload the hunt record.
        sendMessageToServer(db_url, message);
    }

    // Record convertible items
    function recordConvertible(xhr) {
        if (!xhr || !xhr.responseJSON || !xhr.responseJSON.items || !xhr.responseJSON.messageData || !xhr.responseJSON.messageData.message_model) {
            return;
        }
        if (!xhr.responseJSON.messageData.message_model.messages || xhr.responseJSON.messageData.message_model.messages.length !== 1) {
            return;
        }

        const response = xhr.responseJSON;

        let convertible;
        for (const key in response.items) {
            if (!response.items.hasOwnProperty(key)) continue;
            if (convertible) {
                window.console.log("MHHH: Multiple items are not supported (yet)");
                return;
            }
            convertible = response.items[key];
        }

        if (!convertible) {
            window.console.log("MHHH: Couldn't find any item");
            return;
        }

        const message = response.messageData.message_model.messages[0];
        if (!message.isNew || !message.messageData || !message.messageData.items || message.messageData.items.length === 0) {
            return;
        }

        const items = message.messageData.items;
        submitConvertible(convertible, items, response.user.user_id);
    }

    /**
     * @typedef {Object} HgItem
     * @property {number} item_id HitGrab's ID for this item
     * @property {string} name HitGrab's display name for this item
     * @property {number} quantity the number of this item received or opened
     */

    /**
     * Helper function to submit opened items.
     * @param {HgItem} convertible The item that was opened.
     * @param {HgItem[]} items An array of items that were obtained by opening the convertible
     * @param {string} userId the user associated with the submission
     */
    function submitConvertible(convertible, items, user_id) {
        const record = {
            convertible: getItem(convertible),
            items: items.map(getItem),
            extension_version: formatVersion(mhhh_version),
            asset_package_hash: Date.now(),
            user_id: user_id,
            entry_timestamp: Math.round(Date.now() / 1000)
        };

        // Send to database
        sendMessageToServer(convertible_intake_url, record);
    }

    function sendMessageToServer(url, final_message) {
        const basic_info = {
            user_id: final_message.user_id,
            entry_timestamp: final_message.entry_timestamp
        };

        // Get UUID
        $.post(base_domain_url + "/uuid.php", basic_info)
            .done(data => {
                if (data) {
                    final_message.uuid = data;
                    sendAlready(url, final_message);
                }
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
    function parseJournalEntries(hunt_response) {
        let journal = {};
        if (!hunt_response.journal_markup) {
            return null;
        }
        hunt_response.journal_markup.forEach(markup => {
            const css_class = markup.render_data.css_class;
            // Handle a Relic Hunter attraction.
            if (css_class.search(/(relicHunter_catch|relicHunter_failure)/) !== -1) {
                const rh_message = {
                    extension_version: formatVersion(mhhh_version),
                    user_id: hunt_response.user.user_id,
                    rh_environment: markup.render_data.environment,
                    entry_timestamp: markup.render_data.entry_timestamp
                };
                // If this occurred after the daily reset, submit it. (Trap checks & friend hunts
                // may appear and have been back-calculated as occurring before reset).
                if (rh_message.entry_timestamp > Math.round(new Date().setUTCHours(0, 0, 0, 0) / 1000)) {
                    sendMessageToServer(db_url, rh_message);
                    if (debug_logging) {window.console.log(`MHHH: Found the Relic Hunter in ${rh_message.rh_environment}`);}
                }
            }
            else if (css_class.search(/prizemouse/) !== -1) {
                // Handle a prize mouse attraction.
                if (debug_logging) {
                    window.postMessage({
                        "mhct_log_request": 1,
                        "prize mouse journal": markup
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
                            "reason": `Didn't find named loot "${lootName}" in inventory`
                        }, window.origin);
                    } else {
                        const convertible = {
                            id: 2952, // Desert Heater Base's item ID
                            name: "Desert Heater Base",
                            quantity: 1
                        };
                        const items = [{ id: loot.item_id, name: lootName, quantity: lootQty }];
                        if (debug_logging) { window.console.log({ desert_heater_loot: items }); }

                        submitConvertible(convertible, items, hunt_response.user.user_id)
                    }
                } else {
                    window.postMessage({
                        "mhct_log_request": 1,
                        "is_error": true,
                        "desert heater journal": markup,
                        "inventory": hunt_response.inventory,
                        "reason": "Didn't match quantity and loot name regex patterns"
                    }, window.origin);
                }
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
                            "reason": "Unable to parse Gilded Charm proc quantity"
                        }, window.origin);
                    } else {
                        const convertible = {
                            id: 2174, // Gilded Charm's item ID
                            name: "Gilded Charm",
                            quantity: 1
                        };
                        const items = [{ id: 114, name: "SUPER|brie+", quantity: lootQty }];
                        if (debug_logging) { window.console.log({ gilded_charm: items }); }

                        submitConvertible(convertible, items, hunt_response.user.user_id)
                    }
                }
            }
            else if (Object.keys(journal).length !== 0) {
                // Only the first regular mouse attraction journal entry can be the active one.
            }
            else if (css_class.search(/linked|passive|misc/) !== -1) {
                // Ignore any friend hunts, trap checks, or custom loot journal entries.
            }
            else if (css_class.includes('active') && css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1) {
                journal = markup;
            }
        });
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
        const message = {
            extension_version: formatVersion(mhhh_version),
        };
        const debug_logs = [];

        // Hunter ID.
        message.user_id = parseInt(user.user_id, 10);
        if (isNaN(message.user_id)) {
            throw new Error(`MHHH: Unexpected user id value ${user.user_id}`);
        }

        // Entry ID
        message.entry_id = journal.render_data.entry_id;

        // Entry Timestamp
        message.entry_timestamp = journal.render_data.entry_timestamp;

        // Location
        if (!user.environment_name || !user_post.environment_name) {
            window.console.error('MH Helper: Missing Location');
            return null;
        }
        message.location = {
            name: user.environment_name,
            id: user.environment_id
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
            { prop: 'weapon', message_field: 'trap', required: true, replacer: /\ trap/i },
            { prop: 'base', message_field: 'base', required: true, replacer: /\ base/i },
            { prop: 'bait', message_field: 'cheese', required: true, replacer: /\ cheese/i },
            { prop: 'trinket', message_field: 'charm', required: false, replacer: /\ charm/i }
        ];
        // All pre-hunt users must have a weapon, base, and cheese.
        const missing = components.filter(component => component.required === true && !user.hasOwnProperty(`${component.prop}_name`));
        if (missing.length) {
            window.console.error(`MH Helper: Missing required setup component: ${missing.map(c => c.message_field).join(', ')}`);
            return null;
        }
        // Assign component values to the message.
        components.forEach(component => {
            const prop_name = `${component.prop}_name`;
            const prop_id = `${component.prop}_item_id`;
            const item_name = user[prop_name];
            message[component.message_field] = (!item_name) ? {} : {
                id: user[prop_id],
                name: item_name.replace(component.replacer, '')
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
                window.console.error(`MHHH: Unknown "catch" journal css: ${journal_css}`);
                return null;
            }
            // Remove HTML tags and other text around the mouse name.
            message.mouse = journal.render_data.text
                .replace(/^.*?;\">/, '')    // Remove all text through the first sequence of `;">`
                .replace(/<\/a>.*/i, '')    // Remove text after the first <a href>'s closing tag </a>
                .replace(/\ mouse$/i, '');  // Remove " [Mm]ouse" if it is not a part of the name (e.g. Dread Pirate Mousert)
        }

        const quest = getActiveLNYQuest(user.quests);
        if (quest && quest.has_stockpile === "found" && !quest.mice.every(boss => boss.is_caught === true)) {
            // Ignore event cheese hunts as the player is attracting the Costumed mice in a specific order.
            const event_cheese = Object.keys(quest.items)
                .filter(itemName => itemName.search(/lunar_new_year\w+cheese/) >= 0)
                .map(cheeseName => quest.items[cheeseName]);
            if (event_cheese.some(cheese => cheese.status === "active")) {
                return null;
            }
        }
        if (debug_logging) {
            debug_logs.forEach(m => window.console.log(m));
        }

        return message;
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
                "false": {id: 42, name: "Sand Crypts"}}
        };
        const env = env_to_location[message.location.id];
        if (env) {
            const is_normal = user.quests[env.quest].is_normal.toString();
            Object.assign(message.location, env[is_normal]);
        } else if (["Living Garden", "Twisted Garden",
                "Lost City", "Cursed City",
                "Sand Dunes", "Sand Crypts"].includes(message.location.name)) {
            if (debug_logging) {window.console.warn({record: message, user, user_post, hunt});}
            throw new Error(`MHHH: Unexpected location id ${message.location.id} for LG-area location`);
        }
    }

    /** @type {Object <string, Function>} */
    const location_stage_lookup = {
        "Balack's Cove": addBalacksCoveStage,
        "Bristle Woods Rift": addBristleWoodsRiftStage,
        "Burroughs Rift": addBurroughsRiftStage,
        "Claw Shot City": addClawShotCityStage,
        "Cursed City": addLostCityStage,
        "Festive Comet": addFestiveCometStage,
        "Fiery Warpath": addFieryWarpathStage,
        "Floating Islands": addFloatingIslandsStage,
        "Forbidden Grove": addForbiddenGroveStage,
        "Fort Rox": addFortRoxStage,
        "Furoma Rift": addFuromaRiftStage,
        "Gnawnian Express Station": addTrainStage,
        "Harbour": addHarbourStage,
        "Iceberg": addIcebergStage,
        "Labyrinth": addLabyrinthStage,
        "Living Garden": addGardenStage,
        "Lost City": addLostCityStage,
        "Mousoleum": addMousoleumStage,
        "Moussu Picchu": addMoussuPicchuStage,
        "Muridae Market": addMuridaeMarketStage,
        "Queso Geyser": addQuesoGeyserStage,
        "SUPER|brie+ Factory": addSBFactoryStage,
        "Sand Dunes": addSandDunesStage,
        "Seasonal Garden": addSeasonalGardenStage,
        "Slushy Shoreline": addSlushyShorelineStage,
        "Sunken City": addSunkenCityStage,
        "Toxic Spill": addToxicSpillStage,
        "Twisted Garden": addGardenStage,
        "Valour Rift": addValourRiftStage,
        "Whisker Woods Rift": addWhiskerWoodsRiftStage,
        "Zokor": addZokorStage,
    };

    /**
     * Use `quests` or `viewing_atts` data to assign appropriate location-specific stage information.
     * @param {Object <string, any>} message The message to be sent
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt
     */
    function addStage(message, user, user_post, hunt) {
        const stage_func = location_stage_lookup[user.environment_name];
        if (stage_func) {
            stage_func(message, user, user_post, hunt);
        }
    }

    /**
     * Add the "wall state" for Mousoleum hunts.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMousoleumStage(message, user, user_post, hunt) {
        message.stage = (user.quests.QuestMousoleum.has_wall) ? "Has Wall" : "No Wall";
    }

    /**
     * Separate hunts with certain mice available from those without.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHarbourStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestHarbour;
        // Hunting crew + can't yet claim booty = Pirate Crew mice are in the attraction pool
        if (quest.status === "searchStarted" && !quest.can_claim) {
            message.stage = "On Bounty";
        } else {
            message.stage = "No Bounty";
        }
    }

    /**
     * Separate hunts with certain mice available from those without.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addClawShotCityStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestClawShotCity;
        /**
         * !map_active && !has_wanted_poster => Bounty Hunter can be attracted
         * !map_active && has_wanted_poster => Bounty Hunter is not attracted
         * map_active && !has_wanted_poster => On a Wanted Poster
         */

        if (!quest.map_active && !quest.has_wanted_poster) {
            message.stage = "No poster";
        } else if (!quest.map_active && quest.has_wanted_poster) {
            message.stage = "Has poster";
        } else if (quest.map_active) {
            message.stage = "Using poster";
        } else {
            if (debug_logging) {window.console.warn({record: message, pre: quest, post: user_post.quests.QuestClawShotCity});}
            throw new Error("MHHH: Unexpected Claw Shot City quest state");
        }
    }

    /**
     * Set the stage based on decoration and boss status.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFestiveCometStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestWinterHunt2019;
        if (!quest) {
            return;
        }

        if (quest.comet.current_phase === 11) {
            message.stage = "Boss";
        } else {
            let theme = quest.decorations.current_decoration || "none";
            if (theme == "none") {
                theme = "No Decor";
            } else {
                theme = theme.replace(/festive_([a-z_]+)_shorts_stat_item/i, "$1").replace(/_/g, " ");
                theme = theme.charAt(0).toUpperCase() + theme.slice(1);
            }
            message.stage = theme;
        }
    }

    /**
     * MP stage reflects the weather categories
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMoussuPicchuStage(message, user, user_post, hunt) {
        const elements = user.quests.QuestMoussuPicchu.elements;
        message.stage = {
            rain: `Rain ${elements.rain.level}`,
            wind: `Wind ${elements.wind.level}`
        };
    }

    /**
     * WWR stage reflects the zones' rage categories
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addWhiskerWoodsRiftStage(message, user, user_post, hunt) {
        const zones = user.quests.QuestRiftWhiskerWoods.zones;
        const clearing = zones.clearing.level;
        const tree = zones.tree.level;
        const lagoon = zones.lagoon.level;

        const rage = {};
        if (0 <= clearing && clearing <= 24) {
            rage.clearing = 'CC 0-24';
        } else if (clearing <= 49) {
            rage.clearing = 'CC 25-49';
        } else if (clearing === 50) {
            rage.clearing = 'CC 50';
        }

        if (0 <= tree && tree <= 24) {
            rage.tree = 'GGT 0-24';
        } else if (tree <= 49) {
            rage.tree = 'GGT 25-49';
        } else if (tree === 50) {
            rage.tree = 'GGT 50';
        }

        if (0 <= lagoon && lagoon <= 24) {
            rage.lagoon = 'DL 0-24';
        } else if (lagoon <= 49) {
            rage.lagoon = 'DL 25-49';
        } else if (lagoon === 50) {
            rage.lagoon = 'DL 50';
        }
        if (!rage.clearing || !rage.tree || !rage.lagoon) {
            if (debug_logging) {window.console.warn({message: "Skipping unexpected WWR quest state", user, user_post, hunt});}
            message.location = null;
        } else {
            message.stage = rage;
        }
    }

    /**
     * Labyrinth stage reflects the type of hallway.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLabyrinthStage(message, user, user_post, hunt) {
        if (user.quests.QuestLabyrinth.status === "hallway") {
            const hallway = user.quests.QuestLabyrinth.hallway_name;
            // Remove first word (like Short)
            message.stage = hallway.substr(hallway.indexOf(" ") + 1).replace(/\ hallway/i, '');
        } else {
            // Not recording intersections at this time.
            message.location = null;
        }
    }

    /**
     * Stage in the FW reflects the current wave only.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFieryWarpathStage(message, user, user_post, hunt) {
        const wave = user.viewing_atts.desert_warpath.wave;
        message.stage = (wave === "portal") ? "Portal" : `Wave ${wave}`;
    }

    /**
     * Set the stage based on the tide. Reject hunts near tide intensity changes.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBalacksCoveStage(message, user, user_post, hunt) {
        const tide = user.viewing_atts.tide;
        const direction = user.viewing_atts.tide_direction;
        const imminent_state_change = (user.viewing_atts.cycle_progress >= 99
                // Certain transitions do not change the tide intensity, and are OK to track.
                && !(tide === "low" && direction === "in")
                && !(tide === "high" && direction === "out"));
        if (!imminent_state_change && tide) {
            message.stage = tide.charAt(0).toUpperCase() + tide.substr(1);
            if (message.stage === "Med") {
                message.stage = "Medium";
            }
            message.stage += " Tide";
        } else {
            if (debug_logging) {window.console.log({message: "Skipping hunt during server-side tide change", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     * Read the viewing attributes to determine the season. Reject hunts where the season changed.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSeasonalGardenStage(message, user, user_post, hunt) {
        const season = user.viewing_atts.season;
        const final_season = user_post.viewing_atts.season;
        if (season && final_season && season === final_season) {
            switch (season) {
                case "sr":
                    message.stage = "Summer";
                    break;
                case "fl":
                    message.stage = "Fall";
                    break;
                case "wr":
                    message.stage = "Winter";
                    break;
                default:
                    if (debug_logging) {window.console.log({message: "Assumed spring", season, user, user_post});}
                    message.stage = "Spring";
                    break;
            }
        } else {
            if (debug_logging) {window.console.log({message: "Skipping hunt during server-side season change", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     * Read the bucket / vial state to determine the stage for Living & Twisted garden.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addGardenStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestLivingGarden;
        const container_status = (quest.is_normal) ? quest.minigame.bucket_state : quest.minigame.vials_state;
        message.stage = (container_status === "dumped") ? "Pouring" : "Not Pouring";
    }

    /**
     * Determine if there is a stampede active
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSandDunesStage(message, user, user_post, hunt) {
        message.stage = (user.quests.QuestSandDunes.minigame.has_stampede) ? "Stampede" : "No Stampede";
    }

    /**
     * Indicate whether or not the Cursed / Corrupt mouse is present
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLostCityStage(message, user, user_post, hunt) {
        // TODO: Partially cursed, for Cursed City?
        message.stage = (user.quests.QuestLostCity.minigame.is_cursed) ? "Cursed" : "Not Cursed";
    }

    /**
     * Report the current distance / obstacle.
     * TODO: Stage / hunt details for first & second icewing hunting?
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addIcebergStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestIceberg;
        message.stage = (({
            "Treacherous Tunnels": "0-300ft",
            "Brutal Bulwark":    "301-600ft",
            "Bombing Run":      "601-1600ft",
            "The Mad Depths":  "1601-1800ft",
            "Icewing's Lair":       "1800ft",
            "Hidden Depths":   "1801-2000ft",
            "The Deep Lair":        "2000ft",
            "General":            "Generals"
        })[quest.current_phase]);

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "Skipping unknown Iceberg stage", pre: quest, post: user_post.quests.QuestIceberg, hunt});}
            message.location = null;
        }
    }

    /**
     * Report the Softserve Charm status.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSlushyShorelineStage(message, user, user_post, hunt) {
        message.stage = "Not Softserve";
        if (user.trinket_name === "Softserve Charm") {
            message.stage = "Softserve";
        }
    }

    /**
     * Report the Artisan Charm status.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMuridaeMarketStage(message, user, user_post, hunt) {
        message.stage = "Not Artisan";
        if (user.trinket_name === "Artisan Charm") {
            message.stage = "Artisan";
        }
    }

    /**
     * Report the zone and depth, if any.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSunkenCityStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestSunkenCity;
        if (!quest.is_diving) {
            message.stage = "Docked";
            return;
        }

        const depth = quest.distance;
        message.stage = quest.zone_name;
        if (depth < 2000) {
            message.stage += " 0-2km";
        } else if (depth < 10000) {
            message.stage += " 2-10km";
        } else if (depth < 15000) {
            message.stage += " 10-15km";
        } else if (depth < 25000) {
            message.stage += " 15-25km";
        } else if (depth >= 25000) {
            message.stage += " 25km+";
        }
    }

    /**
     * Report the stage as the type and quantity of clues required.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addZokorStage(message, user, user_post, hunt) {
        const zokor_district = user.quests.QuestAncientCity.district_name;
        if (zokor_district) {
            const zokor_stages = {
                "Garden":     "Farming 0+",
                "Study":      "Scholar 15+",
                "Shrine":     "Fealty 15+",
                "Outskirts":  "Tech 15+",
                "Room":       "Treasure 15+",
                "Minotaur":   "Lair - Each 30+",
                "Temple":     "Fealty 50+",
                "Auditorium": "Scholar 50+",
                "Farmhouse":  "Farming 50+",
                "Center":     "Tech 50+",
                "Vault":      "Treasure 50+",
                "Library":    "Scholar 80+",
                "Manaforge":  "Tech 80+",
                "Sanctum":    "Fealty 80+"
            };
            for (const [key, value] of Object.entries(zokor_stages)) {
                const pattern = new RegExp(key, "i");
                if (zokor_district.search(pattern) !== -1) {
                    message.stage = value;
                    break;
                }
            }
        }

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "Skipping unknown Zokor district", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     * Report the pagoda / battery charge information.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFuromaRiftStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestRiftFuroma;
        if (quest.view_state.includes("trainingGrounds")) {
            message.stage = "Outside";
        } else if (quest.view_state.includes("pagoda")) {
            message.stage = (({
                "charge_level_one":   "Battery 1",
                "charge_level_two":   "Battery 2",
                "charge_level_three": "Battery 3",
                "charge_level_four":  "Battery 4",
                "charge_level_five":  "Battery 5",
                "charge_level_six":   "Battery 6",
                "charge_level_seven": "Battery 7",
                "charge_level_eight": "Battery 8",
                "charge_level_nine":  "Battery 9",
                "charge_level_ten":   "Battery 10"
            })[quest.droid.charge_level]);
        }

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "Skipping unknown Furoma Rift droid state", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     *
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addToxicSpillStage(message, user, user_post, hunt) {
        const titles = user.quests.QuestPollutionOutbreak.titles;
        const final_titles = user_post.quests.QuestPollutionOutbreak.titles;
        const formatted_titles = {
            hero:                 'Hero',
            knight:               'Knight',
            lord_lady:            'Lord/Lady',
            baron_baroness:       'Baron/Baroness',
            count_countess:       'Count/Countess',
            duke_dutchess:        'Duke/Duchess',
            grand_duke:           'Grand Duke/Duchess',
            archduke_archduchess: 'Archduke/Archduchess'
        };
        for (const [title, level] of Object.entries(titles)) {
            if (level.active) {
                if (final_titles[title].active === level.active) {
                    message.stage = formatted_titles[title];
                }
                break;
            }
        }
        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "Skipping hunt during server-side pollution change", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     * Report the misting state
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBurroughsRiftStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestRiftBurroughs;
        message.stage = (({
            "tier_0": "Mist 0",
            "tier_1": "Mist 1-5",
            "tier_2": "Mist 6-18",
            "tier_3": "Mist 19-20"
        })[quest.mist_tier]);
        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "Skipping unknown Burroughs Rift mist state", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     * Report on the unique minigames in each sub-location. Reject hunts for which the train
     * moved / updated / departed, as the hunt stage is ambiguous.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addTrainStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestTrainStation;
        const final_quest = user_post.quests.QuestTrainStation;
        // First check that the user is still in the same stage.
        const changed_state = (quest.on_train !== final_quest.on_train
                || quest.current_phase !== final_quest.current_phase);
        if (changed_state) {
            if (debug_logging) {window.console.log({message: "Skipping hunt during server-side train stage change", user, user_post, hunt});}
            message.location = null;
        } else {
            // Pre- & post-hunt user object agree on train & phase statuses.
            if (!quest.on_train || quest.on_train === "false") {
                message.stage = "Station";
            } else if (quest.current_phase === "supplies") {
                let stage = "1. Supply Depot";
                if (quest.minigame && quest.minigame.supply_hoarder_turns > 0) {
                    // More than 0 (aka 1-5) Hoarder turns means a Supply Rush is active
                    stage += " - Rush";
                } else {
                    stage += " - No Rush";
                }
                message.stage = stage;
            } else if (quest.current_phase === "boarding") {
                let stage = "2. Raider River";
                if (quest.minigame && quest.minigame.trouble_area) {
                    // Raider River has an additional server-side state change.
                    const area = quest.minigame.trouble_area;
                    const final_area = final_quest.minigame.trouble_area;
                    if (area !== final_area) {
                        if (debug_logging) {window.console.log({message: "Skipping hunt during server-side trouble area change", user, user_post, hunt});}
                        message.location = null;
                    } else {
                        const charm_id = message.charm.id;
                        const has_correct_charm = (({
                            "door": 1210,
                            "rails": 1211,
                            "roof": 1212
                        })[area] === charm_id);
                        if (has_correct_charm) {
                            stage += " - Defending Target";
                        } else if ([1210, 1211, 1212].includes(charm_id)) {
                            stage += " - Defending Other";
                        } else {
                            stage += " - Not Defending";
                        }
                    }
                }
                message.stage = stage;
            } else if (quest.current_phase === "bridge_jump") {
                message.stage = "3. Daredevil Canyon";
            }
        }
    }

    /**
     * Report the progress through the night
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFortRoxStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestFortRox;
        if (quest.is_lair) {
            message.stage = "Heart of the Meteor";
        } else if (quest.is_dawn) {
            message.stage = "Dawn";
        } else if (quest.is_day) {
            message.stage = "Day";
        } else if (quest.is_night) {
            message.stage = (({
                "stage_one":   "Twilight",
                "stage_two":   "Midnight",
                "stage_three": "Pitch",
                "stage_four":  "Utter Darkness",
                "stage_five":  "First Light"
            })[quest.current_stage]);
        }

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "Skipping unknown Fort Rox stage", pre: quest, post: user_post.quests.QuestFortRox});}
            message.location = null;
        }
    }

    /**
     * Report the state of the door to the Realm. The user may be auto-traveled by this hunt, either
     * due to the use of a Ripper charm while the door is open, or because the door is closed at the time
     * of the hunt itself. If the door closes between the time HG computes the prehunt user object and when
     * HG receives the hunt request, we should reject logging the hunt.
     * MAYBE: Realm Ripper charm? ID = 2345, name = "chamber_cleaver_trinket"
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addForbiddenGroveStage(message, user, user_post, hunt) {
        const was_open = user.viewing_atts.grove_open;
        // 1% time => 9.6 minutes for door open and state_progress rounds to 100 (2.4 minutes for closed).
        const imminent_state_change = (user.viewing_atts.state_progress >= 99);
        if (imminent_state_change) {
            if (debug_logging) {window.console.log({message: "Skipping hunt during server-side door change", user, user_post, hunt});}
            message.location = null;
        } else {
            message.stage = (was_open) ? "Open" : "Closed";
        }
    }

    /**
     * Report the current chamber name.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBristleWoodsRiftStage(message, user, user_post, hunt) {
        message.stage = user.quests.QuestRiftBristleWoods.chamber_name;
        if (message.stage === "Rift Acolyte Tower") {
            message.stage = "Entrance";
        }
    }

    /**
     * Separate boss-stage hunts from other hunts in rooms.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSBFactoryStage(message, user, user_post, hunt) {
        const factory = user.quests.QuestBirthday2020.factory_atts;
        if (message.mouse === "Vincent, The Magnificent" || factory.boss_warning) {
            message.stage = "Boss";
        } else {
            message.stage = (({
                "pumping_room":           "Pump Room",
                "mixing_room":            "Mixing Room",
                "break_room":             "Break Room",
                "quality_assurance_room": "QA Room"
            })[factory.current_room]);
            if (!message.stage) {
                message.stage = "No Room";
            }
        }
    }

    /**
     * Report the state of corks and eruptions
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addQuesoGeyserStage(message, user, user_post, hunt) {
        const state = user.quests.QuestQuesoGeyser.state;
        if (state === "collecting") {
            message.stage = "Cork Collecting";
        } else if (state === "corked") {
            message.stage = "Pressure Building";
        } else if (state === "eruption") {
            // Tiny/Small/Medium/Large/Epic Eruption
            message.stage = user.quests.QuestQuesoGeyser.state_name;
        }
    }

    /**
     * Report tower stage: Outside, Eclipse, Floors 1-7, 9-15, 17-23, 25-31+, Umbra
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addValourRiftStage(message, user, user_post, hunt) {
        const attrs = user.environment_atts || user.enviroment_atts;
        switch (attrs.state) {
            case "tower":
                let floor = attrs.floor;
                let stageName;

                if (floor >= 1 && floor % 8 === 0) {
                    stageName = "Eclipse";
                } else if (floor >= 1 && floor <= 7) {
                    stageName = "Floors 1-7";
                } else if (floor >= 9 && floor <= 15) {
                    stageName = "Floors 9-15";
                } else if (floor >= 17 && floor <= 23) {
                    stageName = "Floors 17-23";
                } else if (floor >= 25) {
                    stageName = "Floors 25-31+";
                }

                if (attrs.active_augmentations.tu) {
                    stageName = "UU " + stageName;
                }

                message.stage = stageName;
                break;
            case "farming":
                message.stage = "Outside";
                break;
            default:
                if (debug_logging) {window.console.log({message: "Skipping unknown Valour Rift stage", pre: attrs, post: user_post.environment_atts || user_post.enviroment_atts});}
                message.location = null;
                break;
        }
    }

    function addFloatingIslandsStage(message, user, user_post, hunt) {
        const envAttributes = user.environment_atts || user.enviroment_atts;
        const pirates = ["No Pirates", "Some Pirates", "All Pirates"];
        message.stage = envAttributes.hunting_site_atts.island_name;
        if (envAttributes.hunting_site_atts.is_enemy_encounter && !envAttributes.hunting_site_atts.is_high_tier_island) {
            message.stage = "Warden";
        }
        else if (user.bait_name === "Sky Pirate Swiss Cheese") {
            message.stage = pirates[user.enviroment_atts.hunting_site_atts.activated_island_mod_types.filter(item => item === "sky_pirates").length];
        }
        else if ((user.bait_name === "Cloud Cheesecake") &&
                 (user.enviroment_atts.hunting_site_atts.activated_island_mod_types.filter(item => item === "loot_cache").length === 2)) {
            message.stage += " - L2";
        }
    }

    /** @type {Object <string, Function>} */
    const location_huntdetails_lookup = {
        "Bristle Woods Rift": addBristleWoodsRiftHuntDetails,
        "Claw Shot City": addClawShotCityHuntDetails,
        "Fiery Warpath": addFieryWarpathHuntDetails,
        "Floating Islands": addFloatingIslandsHuntDetails,
        "Fort Rox": addFortRoxHuntDetails,
        "Harbour": addHarbourHuntDetails,
        "Sand Crypts": addSandCryptsHuntDetails,
        "Valour Rift": addValourRiftHuntDetails,
        "Whisker Woods Rift": addWhiskerWoodsRiftHuntDetails,
        "Zokor": addZokorHuntDetails,
        "Zugzwang's Tower": addZugzwangsTowerHuntDetails
    };

    /**
     * Determine additional detailed parameters that are otherwise only visible to db exports and custom views.
     * These details may eventually be migrated to help inform location-specific stages.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHuntDetails(message, user, user_post, hunt) {
        // First add any location-specific details:
        const details_func = location_huntdetails_lookup[user.environment_name];
        if (details_func) {
            details_func(message, user, user_post, hunt);
        }

        // Apply any global hunt details (such as from ongoing events, auras, etc).
        [
            addEggHuntDetails,
            addHalloweenHuntDetails,
            addLNYHuntDetails,
            addLuckyCatchHuntDetails,
            addPillageHuntDetails,
        ].forEach(details_func => details_func(message, user, user_post, hunt));
    }

    /**
     * Record the Eggscavator Charge level, both before and after the hunt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addEggHuntDetails(message, user, user_post, hunt) {
        const quest = getActiveSEHQuest(user.quests);
        const post_quest = getActiveSEHQuest(user_post.quests);
        if (quest && post_quest) {
            message.hunt_details = Object.assign(message.hunt_details || {}, {
                is_egg_hunt: true,
                egg_charge_pre: parseInt(quest.charge_quantity, 10),
                egg_charge_post: parseInt(post_quest.charge_quantity, 10),
                can_double_eggs: (quest.charge_doubler === "active"),
            });
        }
    }

    /**
     * Record the Cannon state and whether the hunt was taken in a stockpile location.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHalloweenHuntDetails(message, user, user_post, hunt) {
        const quest = getActiveHalloweenQuest(user.quests);
        if (quest) {
            message.hunt_details = Object.assign(message.hunt_details || {}, {
                is_halloween_hunt: true,
                is_firing_cannon: !!(quest.is_cannon_enabled || quest.is_long_range_cannon_enabled),
                is_in_stockpile: !!quest.has_stockpile
            });
        }
    }

    /**
     * Set a value for LNY bonus luck, if it can be determined. Otherwise flag LNY hunts.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLNYHuntDetails(message, user, user_post, hunt) {
        const quest = getActiveLNYQuest(user.quests);
        if (quest) {
            message.hunt_details = Object.assign(message.hunt_details || {}, {
                is_lny_hunt: true,
                lny_luck: (quest.lantern_status.includes("noLantern") || !quest.is_lantern_active)
                    ? 0
                    : Math.min(50, Math.floor(parseInt(quest.lantern_height, 10) / 10))
            });
        }
    }

    /**
     * Track whether a catch was designated "lucky" or not.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLuckyCatchHuntDetails(message, user, user_post, hunt) {
        if (message.caught) {
            message.hunt_details = Object.assign(message.hunt_details || {}, {
                is_lucky_catch: hunt.render_data.css_class.includes("luckycatchsuccess")
            });
        }
    }

    /**
     * Track whether a FTC resulted in a pillage, and if so, the damage dealt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addPillageHuntDetails(message, user, user_post, { render_data }) {
        if (!message.caught && render_data.css_class.includes('catchfailuredamage')) {
            const match = render_data.text.match(/Additionally, .+ ([\d,]+) .*(gold|bait|points)/);
            if (!match || match.length !== 3)
                return;

            message.hunt_details = Object.assign(message.hunt_details || {}, {
                "pillage_amount": parseInt(match[1].replace(/,/g,''), 10),
                "pillage_type": match[2],
            });
        }
    }

    /**
     * Track additional state for the Bristle Woods Rift
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBristleWoodsRiftHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestRiftBristleWoods;
        const details = {
            has_hourglass: quest.items.rift_hourglass_stat_item.quantity >= 1,
            chamber_status: quest.chamber_status,
            cleaver_status: quest.cleaver_status
        };
        // Buffs & debuffs are 'active', 'removed', or ""
        for (const [key, value] of Object.entries(quest.status_effects)) {
            details[`effect_${key}`] = value === 'active';
        }

        if (quest.chamber_name === 'Acolyte') {
            details.obelisk_charged = quest.obelisk_percent === 100;
            details.acolyte_sand_drained = details.obelisk_charged && quest.acolyte_sand === 0;
        }
        message.hunt_details = details;
    }

    /**
     * Track the poster type. Specific available mice require information from `treasuremap.php`.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addClawShotCityHuntDetails(message, user, user_post, hunt) {
        const map = user.quests.QuestRelicHunter.maps.filter(m => m.name.endsWith("Wanted Poster"))[0];
        if (map && !map.is_complete) {
            message.hunt_details = {
                poster_type: map.name.replace(/Wanted Poster/i, "").trim(),
                at_boss: (map.remaining === 1),
            };
        }
    }

    /**
     * Log the mouse populations, remaining total, boss invincibility, and streak data.
     * MAYBE: Record usage of FW charms, e.g. "targeted mouse was attracted"
     * charm_ids 534: Archer, 535: Cavalry, 536: Commander, 537: Mage, 538: Scout, 539: Warrior
     *   540: S Archer, 541: S Cavalry, 542: S Mage, 543: S Scout, 544: S Warrior, 615: S Commander
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFieryWarpathHuntDetails(message, user, user_post, hunt) {
        const attrs = user.viewing_atts.desert_warpath;
        const fw = {};
        if ([1, 2, 3].includes(parseInt(attrs.wave, 10))) {
            const asType = name => name.replace(/desert_|_weak|_epic|_strong/g, "");

            if (attrs.streak_quantity > 0) {
                fw.streak_count = parseInt(attrs.streak_quantity, 10),
                fw.streak_type = asType(attrs.streak_type),
                fw.streak_increased_on_hunt = (message.caught === 1 &&
                    fw.streak_type === asType(user_post.viewing_atts.desert_warpath.streak_type));
            }

            // Track the mice remaining in the wave, per type and in total.
            let remaining = 0;
            [
                "desert_warrior",
                "desert_warrior_weak",
                "desert_warrior_epic",
                "desert_scout",
                "desert_scout_weak",
                "desert_scout_epic",
                "desert_archer",
                "desert_archer_weak",
                "desert_archer_epic",
                "desert_mage",
                "desert_mage_strong",
                "desert_cavalry",
                "desert_cavalry_strong",
                "desert_artillery"
            ].filter(name => name in attrs.mice).forEach(mouse => {
                const q = parseInt(attrs.mice[mouse].quantity, 10);
                fw[`num_${asType(mouse)}`] = q;
                remaining += q;
            });
            const wave_total = ({1: 105, 2: 185, 3: 260})[attrs.wave];
            // Support retreats when 10% or fewer total mice remain.
            fw.morale = remaining / wave_total;

            fw.has_support_mice = (attrs.has_support_mice === "active");
            if (fw.has_support_mice) {
                // Calculate the non-rounded `morale_percent` viewing attribute.
                fw.support_morale = (wave_total - remaining) / (.9 * wave_total);
            }
        } else if ([4, "4", "portal"].includes(attrs.wave)) {
            // If the Warmonger or Artillery Commander was already caught (i.e. Ultimate Charm),
            // don't record any hunt details since there isn't anything to learn.
            const boss = attrs.mice[(message.stage === "Portal") ?
                    "desert_artillery_commander" : "desert_boss"];
            if (parseInt(boss.quantity, 10) !== 1) {
                return;
            }
            // Theurgy Wardens are "desert_elite_gaurd". Yes, "gaurd".
            fw.num_warden = parseInt(attrs.mice.desert_elite_gaurd.quantity, 10);
            fw.boss_invincible = !!fw.num_warden;
        } else {
            if (debug_logging) {window.console.warn({record: message, user, user_post, hunt});}
            throw new Error(`Unknown FW Wave "${attrs.wave}"`);
        }

        message.hunt_details = fw;
    }

    /**
     * Categorize the available buffs that may be applied on the hunt, such as an active Tower's
     * auto-catch chance, or the innate ability to weaken all Weremice.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFortRoxHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestFortRox;
        const ballista_level = parseInt(quest.fort.b.level, 10);
        const cannon_level = parseInt(quest.fort.c.level, 10);
        const details = {};
        if (quest.is_night) {
            Object.assign(details, {
                weakened_weremice:      (ballista_level >= 1),
                can_autocatch_weremice: (ballista_level >= 2),
                autocatch_nightmancer:  (ballista_level >= 3),

                weakened_critters:      (cannon_level >= 1),
                can_autocatch_critters: (cannon_level >= 2),
                autocatch_nightfire:    (cannon_level >= 3),
            });
        }
        // The mage tower's auto-catch can be applied during Day and Dawn phases, too.
        const tower_state = quest.tower_status.includes("inactive") ? 0
                : parseInt(quest.fort.t.level, 10);
        details.can_autocatch_any = (tower_state >= 2);

        message.hunt_details = details;
    }

    /**
     * Report whether certain mice were attractable on the hunt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHarbourHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestHarbour;
        const details = {
            on_bounty: (quest.status === "searchStarted"),
        };
        quest.crew.forEach(mouse => {
            details[`has_caught_${mouse.type}`] = (mouse.status === "caught");
        });
        message.hunt_details = details;
    }

    /**
     * Track the grub salt level
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSandCryptsHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestSandDunes;
        if (quest && !quest.is_normal && quest.minigame && quest.minigame.type === 'grubling') {
            if (["King Grub", "King Scarab"].includes(message.mouse)) {
                message.hunt_details = {
                    salt: quest.minigame.salt_charms_used,
                };
            }
        }
    }

    /**
     * For Lactrodectus hunts, if MBW can be attracted (and is not guaranteed), record the rage state.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addWhiskerWoodsRiftHuntDetails(message, user, user_post, hunt) {
        if (message.cheese.id === 1646) {
            const zones = user.quests.QuestRiftWhiskerWoods.zones;
            const rage = {
                clearing: parseInt(zones.clearing.level, 10),
                tree: parseInt(zones.tree.level, 10),
                lagoon: parseInt(zones.lagoon.level, 10)
            };
            const total_rage = rage.clearing + rage.tree + rage.lagoon;
            if (total_rage < 150 && total_rage >= 75) {
                if (rage.clearing > 24 && rage.tree > 24 && rage.lagoon > 24) {
                    message.hunt_details = Object.assign(rage, {total_rage});
                }
            }
        }
    }

    /**
     * For the level-3 districts, report whether the boss was defeated or not.
     * For the Minotaur lair, report the categorical label, number of catches, and meter width.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addZokorHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestAncientCity;
        if (quest.boss.includes("hiddenDistrict")) {
            message.hunt_details = {
                minotaur_label: quest.boss.replace(/hiddenDistrict/i, "").trim(),
                lair_catches: -(quest.countdown - 20),
                minotaur_meter: parseFloat(quest.width)
            };
        } else if (quest.district_tier === 3) {
            message.hunt_details = {
                boss_defeated: (quest.boss === "defeated"),
            };
        }
    }

    /**
     * Report the progress on Technic and Mystic pieces. Piece progress is reported as 0 - 16 for each
     * side, where 0-7 -> only Pawns, 8/9 -> Pawns + Knights, and 16 = means King caught (only Pawns + Rooks available)
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addZugzwangsTowerHuntDetails(message, user, user_post, hunt) {
        const attrs = user.viewing_atts;
        const zt = {
            amplifier: parseInt(attrs.zzt_amplifier, 10),
            technic: parseInt(attrs.zzt_tech_progress, 10),
            mystic: parseInt(attrs.zzt_mage_progress, 10)
        };
        zt.cm_available = (zt.technic === 16 || zt.mystic === 16) && message.cheese.id === 371;
        message.hunt_details = zt;
    }

    /**
     * Report active augmentations and floor number
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addValourRiftHuntDetails(message, user, user_post, hunt) {
        const attrs = user.environment_atts || user.enviroment_atts;
        // active_augmentations is undefined outside of the tower
        if (attrs.state === "tower") {
            message.hunt_details = {
                floor: attrs.floor, // exact floor number (can be used to derive prestige and floor_type)
                // No compelling use case for the following 3 augments at the moment
                // super_siphon: !!attrs.active_augmentations.ss, // active = true, inactive = false
                // string_stepping: !!attrs.active_augmentations.sste,
                // elixir_rain: !!attrs.active_augmentations.er,
            };
        }
    }

    function addFloatingIslandsHuntDetails(message, user, user_post, hunt) {
        const envAttributes = user.environment_atts || user.enviroment_atts;
        const { island_loot } = envAttributes.hunting_site_atts
        const lootItems = island_loot.reduce((prev, current) => Object.assign(prev, {
            [current.type]: current.quantity},
        ), {});

        message.hunt_details = lootItems;
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
            const item_amount = parseInt(item_text.match(/\d+[0-9,]*/)[0].replace(/,/g, ''));
            const plural_name = $($.parseHTML(item_text)).filter("a").text();

            if (item_name in inventory) {
                const loot_object = {
                amount:      item_amount,
                lucky:       item_text.includes('class="lucky"'),
                id:          inventory[item_name].item_id,
                name:        inventory[item_name].name,
                plural_name: item_amount > 1 ? plural_name : ''
                };

                if (debug_logging) { window.console.log({ message: "Loot object", loot_object }); }

                return loot_object;
            }
        }).filter(loot => loot);
    }

    function getItem(item) {
        return {
            id: item.item_id || item.id,
            name: item.name,
            // type: item.type,
            quantity: item.quantity
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

    /**
     * Return the active Halloween quest object, if possible.
     * @param {Object <string, Object <string, any>>} allQuests the `user.quests` object containing all of the user's quests
     * @returns {Object <string, any> | null} The quest if it exists, else `null`
     */
    function getActiveHalloweenQuest(allQuests) {
        const quest_names = Object.keys(allQuests)
            .filter(name => name.includes("QuestHalloween"));
        return (quest_names.length
            ? allQuests[quest_names[0]]
            : null);
    }

    /**
     * Return the active LNY quest object, if possible.
     * @param {Object <string, Object <string, any>>} allQuests the `user.quests` object containing all of the user's quests
     * @returns {Object <string, any> | null} The quest if it exists, else `null`
     */
    function getActiveLNYQuest(allQuests) {
        const quest_names = Object.keys(allQuests)
            .filter(name => name.includes("QuestLunarNewYear"));
        return (quest_names.length
            ? allQuests[quest_names[0]]
            : null);
    }

    /**
     * Return the active Spring Egg Hunt quest, if possible.
     * @param {Object <string, Object <string, any>>} allQuests the `user.quests` object containing all of the user's quests
     * @returns {Object <string, any> | null} The quest if it exists, else `null`
     */
    function getActiveSEHQuest(allQuests) {
        const quest_names = Object.keys(allQuests)
            .filter(name => name.includes("QuestSpringHunt"));
        return (quest_names.length
            ? allQuests[quest_names[0]]
            : null);
    }

    // Finish configuring the extension behavior.
    getSettings(settings => {
        if (settings.debug_logging) {
            window.console.log({message: "Initialized with settings", settings});
        }

        // If this page is a profile page, query the crown counts (if the user tracks crowns).
        if (settings.track_crowns) {
            function profileAutoScan() {
                const profile_RE = /profile.php\?snuid=(\w+)$/g; // "$" at regex end = only auto-fetch when AJAX route changing onto a plain profile page
                const profile_RE_matches = document.URL.match(profile_RE);
                if (profile_RE_matches !== null && profile_RE_matches.length) {
                    const profile_snuid = profile_RE_matches[0].replace("profile.php?snuid=", "");

                    // Form data directly in URL to distinguish it from a profile "King's Crowns" tab click
                    const crownUrl = `https://www.mousehuntgame.com/managers/ajax/pages/page.php?page_class=HunterProfile&page_arguments%5Btab%5D=kings_crowns&page_arguments%5Bsub_tab%5D=false&page_arguments%5Bsnuid%5D=${profile_snuid}&uh=${user.unique_hash}`;

                    $.post(crownUrl, "sn=Hitgrab&hg_is_ajax=1", null, "json")
                        .fail(err => {
                            if (settings.debug_logging) {
                                window.console.log({message: `Crown query failed for snuid=${profile_snuid}`, err});
                            }
                        });
                }
            }

            // Checks for route changes and then rescans for plain profiles
            function URLDiffCheck() {
                const cachedURL = localStorage.getItem("mhct-url-cache");
                const currentURL = document.URL;

                if (!cachedURL || (cachedURL && cachedURL !== currentURL)) {
                    localStorage.setItem("mhct-url-cache", currentURL);
                    profileAutoScan();
                }
            }

            URLDiffCheck(); // Initial call on page load
            $(document).ajaxStop(URLDiffCheck); // AJAX event listener for subsequent route changes
        }

        window.console.log("MH Hunt Helper v" + mhhh_version + " loaded! Good luck!");
    });
}());
