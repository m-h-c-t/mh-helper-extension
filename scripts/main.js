/*jslint browser:true */

(function () {
    'use strict';

    var base_domain_url = "https://mhhunthelper.agiletravels.com";
    var db_url = base_domain_url + "/intake.php";
    var map_intake_url = base_domain_url + "/map_intake.php";
    var convertible_intake_url = base_domain_url + "/convertible_intake.php";

    if (!window.jQuery) {
        console.log("MHHH: Can't find jQuery, exiting.");
        return;
    }
    var mhhh_version = $("#mhhh_version").val();

    // Listening for calls
    window.addEventListener('message', ev => {
        if (ev.data.jacks_message == null) {
            return;
        }

        if (typeof user.user_id === 'undefined') {
            alert('Please make sure you are logged in into MH.');
            return;
        }
        if (ev.data.jacks_message === 'userhistory') {
            window.open(base_domain_url + '/searchByUser.php?user=' + user.user_id);
            return;
        }

        if (ev.data.jacks_message === 'mhmh'
            || ev.data.jacks_message === 'ryonn') {
            openMapMiceSolver(ev.data.jacks_message);
            return;
        }

        if (ev.data.jacks_message === 'horn') {
            sound_horn();
            return;
        }

        if ('tsitu_loader' === ev.data.jacks_message) {
            window.tsitu_loader_offset = ev.data.tsitu_loader_offset;
            openBookmarklet(ev.data.file_link);
            return;
        }

        if (ev.data.jacks_message === 'show_horn_alert') {
            let sound_the_horn = confirm("Horn is Ready! Sound it?");
            if (sound_the_horn) {
                sound_horn();
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
        let xhr = new XMLHttpRequest();
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
        if (solver === 'mhmh') {
            url = 'https://mhmaphelper.agiletravels.com/mice/';
            glue = '+';
        } else if (solver === 'ryonn') {
            url = 'http://dbgames.info/mousehunt/tavern?q=';
            glue = ';';
        } else {
            return;
        }

        let payload = {
            map_id: user.quests.QuestRelicHunter.default_map_id,
            action: "map_info",
            uh: user.unique_hash,
            last_read_journal_entry_id: lastReadJournalEntryId
        };
        $.post('https://www.mousehuntgame.com/managers/ajax/users/relichunter.php', payload, null, 'json')
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
                    let mice = getMapMice(data, true);
                    let new_window = window.open('');
                    new_window.location = encodeURI(url + mice.join(glue));
                }
            });
    }

    // Extract map mice from a map
    function getMapMice(data, uncaught_only) {
        let mice = [];
        $.each(data.treasure_map.groups, (key, group) => {
            if (uncaught_only && !group.name.includes('Uncaught mice ')) {
                return;
            }

            $.each(group.goals, (key, mouse) => mice.push(mouse.name));
        });
        return mice;
    }

    function showFlashMessage(type, message) {
        getSettings(settings => displayFlashMessage(settings, type, message));
    }

    function displayFlashMessage(settings, type, message) {
        if ((type === 'success' && !settings.success_messages)
            || (type !== 'success' && !settings.error_messages)) {
            return;
        }
        let mhhh_flash_message_div = $('#mhhh_flash_message_div');
        mhhh_flash_message_div.text("Jack's MH Helper: " + message);

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
            setTimeout(() => $('#mhhh_flash_message_div').fadeOut(), 1500);
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
        // Override the XMLHttpRequest that will be used with our own.
        ajaxOptions.xhr = function () {
            // Create the original XMLHttpRequest, whose `send()` will sound the horn.
            const hunt_xhr = create_hunt_XHR();
            const huntSend = hunt_xhr.send;
            // Override the original send to first query the user object.
            // Trigger trap check calculations by forcing non-memoized return.
            hunt_xhr.send = (...huntArgs) => {
                $.ajax({
                    method: "post",
                    url: "/managers/ajax/pages/page.php",
                    data: {
                        sn: "Hitgrab",
                        hg_is_ajax: 1,
                        page: "Title",
                        page_arguments: [{force: true}],
                        last_read_journal_entry_id: lastReadJournalEntryId,
                        uh: user.unique_hash
                    },
                    dataType: "json"
                }).done(userRqResponse => {
                    window.console.log({message: "Got user object, invoking huntSend", userRqResponse});
                    hunt_xhr.addEventListener("loadend", () => {
                        // Call record hunt with the pre-hunt user object.
                        recordHuntWithPrehuntUser(JSON.parse(hunt_xhr.responseText), userRqResponse.user);
                    }, false);
                    huntSend.apply(hunt_xhr, huntArgs);
                });
            };
            return hunt_xhr;
        };
    }

    // Listening routers
    $(document).ajaxSend(getUserBeforeHunting);
    $(document).ajaxSuccess((event, xhr, ajaxOptions) => {
        const url = ajaxOptions.url;
        if (url.includes("mousehuntgame.com/managers/ajax/users/relichunter.php")) {
            recordMap(xhr);
        } else if (url.includes("mousehuntgame.com/managers/ajax/users/useconvertible.php")) {
            recordConvertible(xhr);
        } else if (url.includes("mousehuntgame.com/managers/ajax/users/profiletabs.php?action=badges")) {
            getSettings(settings => recordCrowns(settings, xhr, url));
        }
    });

    // Get settings
    function getSettings(callback) {
        window.addEventListener("message", function listenSettings(event) {
            if (event.data.jacks_settings_response !== 1) {
                return;
            }

            if (callback && typeof(callback) === "function") {
                window.removeEventListener("message", listenSettings);
                callback(event.data.settings);
            }
        }, false);
        window.postMessage({jacks_settings_request: 1}, "*");
    }

    // Record Crowns
    function recordCrowns(settings, xhr, url) {
        if (!settings.track_crowns) {
            return;
        }
        let url_params = url.match(/snuid=([0-9]+)/);
        if (!url_params || !Object.keys(xhr.responseJSON.mouse_data).length) {
            return;
        }

        let payload = {
            user: url_params[1],
            timestamp: Math.round(Date.now() / 1000),
            mice: [],

            bronze: 0,
            silver: 0,
            gold: 0
        };

        $.each(xhr.responseJSON.badges, (key, value) => payload[value.type] = value.mice.length);

        $.post('https://script.google.com/macros/s/AKfycbxPI-eLyw-g6VG6s-3f_fbM6EZqOYp524TSAkGrKO23Ge2k38ir/exec',
            {'main': JSON.stringify(payload)});

        showFlashMessage("success", "Thank you for submitting crowns!");
    }

    // Record map mice
    function recordMap(xhr) {
        let resp = xhr.responseJSON;
        if (!resp.treasure_map || !resp.treasure_map.map_id || !resp.treasure_map.name) {
            return;
        }
        let map = {
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
     * @param {Object <string, any>} preHuntUser The user object obtained prior to invoking `activeturn.php`.
     */
    function recordHuntWithPrehuntUser(response, preHuntUser) {
        window.console.log({message: "In sendHuntWithUser", response, preHuntUser});
        // Require some difference between the user and response.user objects. If there is
        // no difference, then no hunt occurred to separate them (i.e. a KR popped, or a friend hunt occurred).
        const requiredDifferences = [
            "num_active_turns",
            "next_activeturn_seconds"
        ];
        const postHuntUser = response.user;
        const differences = {};
        /**
         * Store the difference between generic primitives and certain objects in `result`
         * @param {Object <string, any>} result The object to write diffs into
         * @param {Set<string>} pre Keys associated with the current `obj_pre`
         * @param {Set<string>} post Keys associated with the current `obj_post`
         * @param {Object <string, any>} obj_pre The pre-hunt user object (or associated nested object)
         * @param {Object <string, any>} obj_post The post-hunt user object (or associated nested object)
         */
        function diffUserObjects(result, pre, post, obj_pre, obj_post) {
            const allowedSimpleDiff = new Set(['string', 'number', 'boolean']);
            for (let [key, value] of Object.entries(obj_pre).filter(pair => !pair[0].endsWith("hash"))) {
                pre.add(key);
                if (!post.has(key)) {
                    result[key] = {in: "pre", val: value};
                } else if (allowedSimpleDiff.has(typeof value)) {
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
        diffUserObjects(differences, new Set(), new Set(Object.keys(postHuntUser)), preHuntUser, postHuntUser);
        window.console.log({differences});

        const hunt = parseJournalEntries(response);
        // DB submissions only occur if the call was successful (i.e. it did something) and was an active hunt
        if (!response.success || !response.active_turn) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(1)");
            return;
        } else if (!hunt || Object.keys(hunt).length === 0) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(2)");
            return;
        }

        const diffKeys = new Set(Object.keys(differences));
        if (!requiredDifferences.every(key => diffKeys.has(key))
                || postHuntUser.num_active_turns - preHuntUser.num_active_turns !== 1) {
            window.console.log("MHHH: Required pre/post hunt differences not observed.");
            return;
        }

        // Obtain the main hunt information from the journal entry and user objects.
        const message = createMessageFromHunt(hunt, preHuntUser, postHuntUser);
        if (!message || !message.location || !message.location.name || !message.trap.name || !message.base.name || !message.cheese.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(1)");
            return;
        }

        // Perform validations and stage corrections.
        fixLGLocations(message, preHuntUser, postHuntUser, hunt);
        addStage(message, preHuntUser, postHuntUser, hunt);
        addHuntDetails(message, preHuntUser, postHuntUser, hunt);
        if (!message.location || !message.location.name || !message.cheese || !message.cheese.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(2)");
            return;
        }

        addLoot(message, hunt);
        window.console.log({message, preHuntUser, postHuntUser, hunt});
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

        let response = xhr.responseJSON;

        let convertible;
        for (let key in response.items) {
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

        let message = response.messageData.message_model.messages[0];
        if (!message.isNew || !message.messageData || !message.messageData.items || message.messageData.items.length === 0) {
            return;
        }
        let items = message.messageData.items;

        let record = {
            convertible: getItem(convertible),
            items: items.map(getItem.bind(null)),
            extension_version: formatVersion(mhhh_version),
            asset_package_hash: Date.now(),
            user_id: response.user.user_id,
            entry_timestamp: Math.round(Date.now() / 1000)
        };

        // Send to database
        sendMessageToServer(convertible_intake_url, record);
    }

    function sendMessageToServer(url, final_message) {
        let basic_info = {
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
                    let response = JSON.parse(data);
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
                    window.console.log(`MHHH: Found the Relic Hunter in ${rh_message.rh_environment}`);
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
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @returns {Object <string, any> | null} The message object, or `null` if an error occurred.
     */
    function createMessageFromHunt(journal, user, postHuntUser) {
        const message = {
            extension_version: formatVersion(mhhh_version)
        };

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
        if (!user.location || !postHuntUser.location) {
            window.console.error('MH Helper: Missing Location');
            return null;
        }
        message.location = {
            name: user.location,
            id: user.environment_id
        };
        if (postHuntUser.environment_id != user.environment_id) {
            window.console.log(`User auto-traveled from ${user.location} to ${postHuntUser.location}`);
        }

        // Shield (true / false)
        message.shield = user.has_shield;

        // Total Power, Luck, Attraction
        message.total_power = user.trap_power;
        if (postHuntUser.trap_power !== user.trap_power) {
            window.console.log(`User setup power changed from ${user.trap_power} to ${postHuntUser.trap_power}`);
        }
        message.total_luck = user.trap_luck;
        if (postHuntUser.trap_luck !== user.trap_luck) {
            window.console.log(`User setup luck changed from ${user.trap_luck} to ${postHuntUser.trap_luck}`);
        }
        message.attraction_bonus = Math.round(user.trap_attraction_bonus * 100);
        if (postHuntUser.trap_attraction_bonus !== user.trap_attraction_bonus) {
            window.console.log(`User setup attraction bonus changed from ${user.trap_attraction_bonus} to ${postHuntUser.trap_attraction_bonus}`);
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

            if (item_name !== postHuntUser[prop_name]) {
                window.console.log(`User ${component.message_field} changed: Was '${item_name}' and is now '${postHuntUser[prop_name] || "None"}'`);
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
                .replace(/^.*?\">/, '')      // Remove text through the first closing angle bracket >.
                .replace(/\<\/a\>.*/i, '')   // Remove text after the first <a href>'s closing tag </a>
                .replace(/\ mouse$/i, '');   // Remove " [Mm]ouse" if it is not a part of the name (e.g. Dread Pirate Mousert)
        }

        return message;
    }

    /**
     * Living & Twisted Garden areas share the same HG environment ID, so use the quest data
     * to assign the appropriate ID for our database.
     * @param {Object <string, any>} message The message to be sent
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt
     */
    function fixLGLocations(message, user, postHuntUser, hunt) {
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
        }
        const env = env_to_location[message.location.id];
        if (env) {
            const is_normal = user.quests[env.quest].is_normal.toString();
            Object.assign(message.location, env[is_normal]);
        } else if (["Living Garden", "Twisted Garden",
                "Lost City", "Cursed City",
                "Sand Dunes", "Sand Crypts"].includes(message.location.name)) {
            window.console.warn({record: message, pre: user, post: postHuntUser, hunt});
            throw new Error(`MHHH: Unexpected location id ${message.location.id} for LG-area location`);
        }
    }

    /** @type {Object <string, Function>} */
    const locationStageLookup = {
        "Balack's Cove": addBalacksCoveStage,
        "Bristle Woods Rift": addBristleWoodsRiftStage,
        "Burroughs Rift": addBurroughsRiftStage,
        "Claw Shot City": addClawShotCityStage,
        "Cursed City": addLostCityStage,
        "Festive Comet": addFestiveCometStage,
        "Fiery Warpath": addFieryWarpathStage,
        "Forbidden Grove": addForbiddenGroveStage,
        "Fort Rox": addFortRoxStage,
        "Furoma Rift": addFuromaRiftStage,
        "Gnawnian Express Station": addTrainStage,
        "Harbour": addHarbourStage,
        "Iceberg": addIcebergStage,
        "Labyrinth": addLabyrinthStage,
        "Living Garden": addLivingGardenStage,
        "Lost City": addLostCityStage,
        "Mousoleum": addMousoleumStage,
        "Moussu Picchu": addMoussuPicchuStage,
        "Mysterious Anomaly": addMysteriousAnomalyStage,
        "Sand Dunes": addSandDunesStage,
        "Seasonal Garden": addSeasonalGardenStage,
        "Sunken City": addSunkenCityStage,
        "Toxic Spill": addToxicSpillStage,
        "Twisted Garden": addTwistedGardenStage,
        "Whisker Woods Rift": addWhiskerWoodsRiftStage,
        "Zokor": addZokorStage,
    };

    /**
     * Use `quests` or `viewing_atts` data to assign appropriate location-specific stage information.
     * @param {Object <string, any>} message The message to be sent
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt
     */
    function addStage(message, user, postHuntUser, hunt) {
        const stageFunc = locationStageLookup[user.location];
        if (stageFunc) {
            stageFunc(message, user, postHuntUser, hunt);
        }
    }

    /**
     * Add the "wall state" for Mousoleum hunts.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMousoleumStage(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestMousoleum;
        if (quest.has_wall) {
            message.stage = "Has Wall";
        } else {
            message.stage = "No Wall";
        }
        if (quest.has_wall && !postHuntUser.quests.QuestMousoleum.has_wall) {
            window.console.log({message: "Wall broke down on this active hunt.", pre: quest, post: postHuntUser.quests.QuestMousoleum});
        }
    }

    /**
     * Separate hunts with crew available from those without. Each crew member can be caught only once per bounty.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHarbourStage(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestHarbour;
        // Hunting crew + can't yet claim booty = Pirate Crew mice are in the attraction pool
        if (quest.status === "searchStarted" && !quest.can_claim) {
            message.stage = "On Bounty";
        } else {
            message.stage = "No Bounty";
        }
    }

    /**
     *
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addClawShotCityStage(message, user, postHuntUser, hunt) {
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
            window.console.log({record: message, pre: quest, post: postHuntUser.quests.QuestClawShotCity});
            throw new Error("MHHH: Unexpected Claw Shot City quest state");
        }
    }

    /**
     * Set the stage based on decoration and boss status.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFestiveCometStage(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestWinterHunt2018;
        if (!quest) {
            return;
        }

        if (quest.comet.at_boss === true) {
            message.stage = "Boss";
        } else {
            let theme = quest.decorations.current_decoration || "none";
            if (theme == "none") {
                theme = "No Decor";
            } else {
                // Capitalize every useful word in the decoration string.
                theme = theme.replace(/_festive_decoration_stat_item/i, '')
                    .replace(/_/i, ' ')
                    .split(" ")
                    .map(word => word[0].toUpperCase() + word.substr(1))
                    .join(" ");
            }
            message.stage = theme;
        }
    }

    /**
     * MP stage reflects the weather categories
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMoussuPicchuStage(message, user, postHuntUser, hunt) {
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
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addWhiskerWoodsRiftStage(message, user, postHuntUser, hunt) {
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
            window.console.log({record: message, pre: user.quests.QuestRiftWhiskerWoods, post: postHuntUser.quests.QuestRiftWhiskerWoods});
            throw new Error("Unexpected WWR quest state");
        }

        message.stage = rage;
    }

    /**
     * Labyrinth stage reflects the type of hallway
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLabyrinthStage(message, user, postHuntUser, hunt) {
        if (user.quests.QuestLabyrinth.status === "hallway") {
            const hallway = user.quests.QuestLabyrinth.hallway_name;
            // Remove first word (like Short)
            message.stage = hallway.substr(hallway.indexOf(" ") + 1).replace(/\ hallway/i, '');
        } else {
            window.console.log({message: "Non-hallway Labyrinth hunts are boring", pre: user.quests.QuestLabyrinth, post: postHuntUser.quests.QuestLabyrinth});
            // Not recording last hunt of a hallway and intersections at this time
            message.location = null;
        }
    }

    /**
     * Stage in the FW reflects the current wave only.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFieryWarpathStage(message, user, postHuntUser, hunt) {
        const wave = user.viewing_atts.desert_warpath.wave;
        message.stage = (wave === "portal") ? "Portal" : `Wave ${wave}`;
    }

    /**
     * Set the stage based on the tide
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBalacksCoveStage(message, user, postHuntUser, hunt) {
        const tide = user.viewing_atts.tide;
        if (tide) {
            message.stage = tide.charAt(0).toUpperCase() + tide.substr(1);
            if (message.stage === "Med") {
                message.stage = "Medium";
            }
            message.stage += " Tide";
        } else {
            window.console.log({record: message, pre: user, post: postHuntUser});
            throw new Error("No tide found for Balack's Cove");
        }
    }

    /**
     * Read the viewing attributes to determine the season.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSeasonalGardenStage(message, user, postHuntUser, hunt) {
        switch (user.viewing_atts.season) {
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
                window.console.log({message: "Assumed spring", season: user.viewing_atts.season, pre: user, post: postHuntUser});
                message.stage = "Spring";
                break;
        }
    }

    /**
     * Read the bucket state to determine the stage
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLivingGardenStage(message, user, postHuntUser, hunt) {
        const bucket = user.quests.QuestLivingGarden.minigame.bucket_state;
        if (bucket) {
            if (bucket === "filling") {
                message.stage = "Not Pouring";
            } else {
                window.console.log({message: "Assumed poured state", bucket, pre: user.quests.QuestLivingGarden, post: postHuntUser.quests.QuestLivingGarden});
                message.stage = "Pouring";
            }
        } else {
            window.console.log({record: message, pre: user, post: postHuntUser});
            throw new Error("No bucket found for Living Garden");
        }
    }

    /**
     * Determine if there is a stampede active
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSandDunesStage(message, user, postHuntUser, hunt) {
        message.stage = (user.quests.QuestSandDunes.minigame.has_stampede) ? "Stampede" : "No Stampede";
    }

    /**
     * Indicate whether or not the Cursed / Corrupt mouse is present
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLostCityStage(message, user, postHuntUser, hunt) {
        // TODO: Partially cursed, for Cursed City?
        message.stage = (user.quests.QuestLostCity.minigame.is_cursed) ? "Cursed" : "Not Cursed";
    }

    /**
     * Read the state of both buckets. TODO: refactor to `addGardenStage` for both LG/TG.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addTwistedGardenStage(message, user, postHuntUser, hunt) {
        message.stage = (user.quests.QuestLivingGarden.minigame.vials_state === "dumped")
            ? "Pouring" : "Not Pouring";
    }

    /**
     * Report the distance or obstacle
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addIcebergStage(message, user, postHuntUser, hunt) {
        const phase = user.quests.QuestIceberg.current_phase;
        if (!phase) {
            window.console.log({message: "No Iceberg quest data", pre: user.quests.QuestIceberg, post: postHuntUser.quests.QuestIceberg});
            throw new Error("Unable to set Iceberg phase");
        }
        // TODO: Special stage for first & second icewing hunting?
        // Switch on current depth after checking what phase has for generals
        switch (phase) {
            case "Treacherous Tunnels":
                message.stage = "0-300ft";
                break;
            case "Brutal Bulwark":
                message.stage = "301-600ft";
                break;
            case "Bombing Run":
                message.stage = "601-1600ft";
                break;
            case "The Mad Depths":
                message.stage = "1601-1800ft";
                break;
            case "Icewing's Lair":
                message.stage = "1800ft";
                break;
            case "Hidden Depths":
                message.stage = "1801-2000ft";
                break;
            case "The Deep Lair":
                message.stage = "2000ft";
                break;
            case "General":
                message.stage = "Generals";
                break;
            default:
                window.console.log({record: message, pre: user.quests.QuestIceberg, post: postHuntUser.quests.QuestIceberg});
                throw new Error(`Unexpected Iceberg phase ${phase}`);
        }
    }

    /**
     * Report the zone and depth, if any
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSunkenCityStage(message, user, postHuntUser, hunt) {
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
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addZokorStage(message, user, postHuntUser, hunt) {
        const zokor_district = user.quests.QuestAncientCity.district_name;
        if (!zokor_district) {
            window.console.log({message: "No Zokor district information", pre: user, post: postHuntUser});
            return;
        }

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

        if (!message.stage) {
            window.console.log({message: "Did not match known Zokor stages to current district", zokor_district, pre: user, post: postHuntUser});
            message.stage = zokor_district;
        }
    }

    /**
     * Report the pagoda & battery charge information.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFuromaRiftStage(message, user, postHuntUser, hunt) {
        switch (user.quests.QuestRiftFuroma.droid.charge_level) {
            case "":
                message.stage = "Outside";
                break;
            case "charge_level_one":
                message.stage = "Battery 1";
                break;
            case "charge_level_two":
                message.stage = "Battery 2";
                break;
            case "charge_level_three":
                message.stage = "Battery 3";
                break;
            case "charge_level_four":
                message.stage = "Battery 4";
                break;
            case "charge_level_five":
                message.stage = "Battery 5";
                break;
            case "charge_level_six":
                message.stage = "Battery 6";
                break;
            case "charge_level_seven":
                message.stage = "Battery 7";
                break;
            case "charge_level_eight":
                message.stage = "Battery 8";
                break;
            case "charge_level_nine":
                message.stage = "Battery 9";
                break;
            case "charge_level_ten":
                message.stage = "Battery 10";
                break;
            default:
                window.console.log({message: "Unknown battery state", pre: user.quests.QuestRiftFuroma, post: postHuntUser.quests.QuestRiftFuroma});
                throw new Error("Could not determine Furoma Rift battery state");
        }
    }

    /**
     *
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addToxicSpillStage(message, user, postHuntUser, hunt) {
        const titles = user.quests.QuestPollutionOutbreak.titles;
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
                message.stage = formatted_titles[title];
                break;
            }
        }
        if (!message.stage) {
            window.console.log({record: message, pre: user.quests.QuestPollutionOutbreak, post: postHuntUser.quests.QuestPollutionOutbreak});
            throw new Error("Unable to determine active outbreak")
        }
    }

    /**
     * Report the misting state
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBurroughsRiftStage(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestRiftBurroughs;
        switch (quest.mist_tier) {
            case "tier_0":
                message.stage = "Mist 0";
                break;
            case "tier_1":
                message.stage = "Mist 1-5";
                break;
            case "tier_2":
                message.stage = "Mist 6-18";
                break;
            case "tier_3":
                message.stage = "Mist 19-20";
                break;
        }

        // Validate misting & edge behaviors.
        const mist_pre = quest.mist_released;
        const mist_post = postHuntUser.quests.QuestRiftBurroughs.mist_released;
        if (quest.is_misting && quest.can_mist) {
            if (mist_post < 20 && mist_post - mist_pre !== 1) {
                throw new Error("Bad mist transition");
            }
        } else {
            if (mist_pre > 0 && mist_pre - mist_post !== 1) {
                throw new Error("Bad mist transition");
            }
        }
        if (mist_pre === 0 && quest.mist_tier === "tier_0") {
            // OK
        } else if (mist_pre > 0 && mist_pre <= 5 && quest.mist_tier === "tier_1") {
            // OK
        } else if (mist_pre > 5 && mist_pre <= 18 && quest.mist_tier === "tier_2") {
            // OK
        } else if (mist_pre > 18 && quest.mist_tier === "tier_3") {
            // OK
        } else {
            window.console.log({record: message, pre: quest, post: postHuntUser.quests.QuestRiftBurroughs});
            throw new Error("Bad mist validation")
        }
    }

    /**
     * Report on the unique minigames in each sub-location
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addTrainStage(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestTrainStation;
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
                const charm_id = message.charm.id;
                const charmFor = {
                    "door": 1210,
                    "rails": 1211,
                    "roof": 1212
                };
                if (charmFor[quest.minigame.trouble_area] === charm_id) {
                    stage += " - Defending Target";
                } else if ([1210, 1211, 1212].includes(charm_id)) {
                    stage += " - Defending Other";
                } else {
                    stage += " - Not Defending";
                }
            }
            message.stage = stage;
        } else if (quest.current_phase === "bridge_jump") {
            let stage = "3. Daredevil Canyon";
            const charm_id = message.charm.id;
            if (charm_id === 1208) {
                stage += " - Dusty Coal";
            } else if (charm_id === 1207) {
                stage += " - Black Powder";
            } else if (charm_id === 1209) {
                stage += " - Magmatic Crystal";
            }
            message.stage = stage;
        }
    }

    /**
     * Report the progress through the night
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addFortRoxStage(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestFortRox;
        if (quest.is_lair) {
            message.stage = "Heart of the Meteor";
        } else if (quest.is_dawn) {
            message.stage = "Dawn";
        } else if (quest.is_day) {
            message.stage = "Day";
        } else if (quest.is_night) {
            switch (quest.current_stage) {
                case "stage_one":
                    message.stage = "Twilight";
                    break;
                case "stage_two":
                    message.stage = "Midnight";
                    break;
                case "stage_three":
                    message.stage = "Pitch";
                    break;
                case "stage_four":
                    message.stage = "Utter Darkness";
                    break;
                case "stage_five":
                    message.stage = "First Light";
                    break;
            }
        }
        if (!message.stage) {
            window.console.log({record: message, pre: quest, post: postHuntUser.quests.QuestFortRox});
            throw new Error("Unable to determine Fort Rox stage");
        }
    }

    /**
     * Report the state of the door to the Realm
     * TODO: Realm Ripper charm? ID = 2345, name = "chamber_cleaver_trinket"
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addForbiddenGroveStage(message, user, postHuntUser, hunt) {
        const state = user.viewing_atts/*path*/;
        message.stage = (state) ? "Open" : "Closed";
    }

    /**
     * Report the current chamber name.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBristleWoodsRiftStage(message, user, postHuntUser, hunt) {
        message.stage = user.quests.QuestRiftBristleWoods.chamber_name;
        if (message.stage === "Rift Acolyte Tower") {
            message.stage = "Entrance";
        }
    }

    /**
     * Report the current year.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMysteriousAnomalyStage(message, user, postHuntUser, hunt) {
        message.stage = user.quests.QuestBirthday2018.current_year;
    }


    /** @type {Object <string, Function>} */
    const locationHuntDetailsLookup = {
        "Bristle Woods Rift": addBristleWoodsRiftHuntDetails,
        "Mysterious Anomaly": addMysteriousAnomalyHuntDetails,
        "Sand Crypts": addSandCryptsHuntDetails,
        "Zugzwang's Tower": addZugzwangsTowerHuntDetails
    };

    /**
     * Determine additional detailed parameters that are otherwise only visible to db exports and custom views.
     * These details may eventually be migrated to help inform location-specific stages.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addHuntDetails(message, user, postHuntUser, hunt) {
        // First add any location-specific details:
        const detailsFunc = locationHuntDetailsLookup[user.location];
        if (detailsFunc) {
            detailsFunc(message, user, postHuntUser, hunt);
        }

        // TODO: Apply any global hunt details (such as from ongoing events, auras, etc).
    }

    /**
     * Track additional state for the Bristle Woods Rift
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addBristleWoodsRiftHuntDetails(message, user, postHuntUser, hunt) {
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
     * Additional state for the 2018 Birthday
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addMysteriousAnomalyHuntDetails(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestBirthday2018;
        message.hunt_details = {
            boss_status: quest.boss_status,
            furthest_year: quest.furthest_year
        };
    }

    /**
     * Track the grub salt level
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addSandCryptsHuntDetails(message, user, postHuntUser, hunt) {
        const quest = user.quests.QuestSandDunes;
        if (quest && !quest.is_normal && quest.minigame && quest.minigame.type === 'grubling') {
            if (["King Grub", "King Scarab"].includes(message.mouse)) {
                message.hunt_details = {
                    salt: quest.minigame.salt_charms_used
                };
            }
        }
    }

    /**
     * Report the progress on Technic and Mystic pieces. Piece progress is reported as 0 - 16 for each
     * side, where 0-7 -> only Pawns, 8/9 -> Pawns + Knights, and 16 = means King caught (only Pawns + Rooks available)
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} postHuntUser The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addZugzwangsTowerHuntDetails(message, user, postHuntUser, hunt) {
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
     * Extract loot information from the hunt's journal entry.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addLoot(message, hunt) {
        const desc = hunt.render_data.text;
        if (!desc.includes("following loot:")) {
            return;
        }
        const loot_text = desc.substring(desc.indexOf("following loot:") + 15);
        const loot_array = loot_text.split(/,\s|\sand\s/g);
        // let render_array = desc.split(/<a\s/);

        message.loot = loot_array.map(item_text => {
            const loot_obj = {
                amount: item_text.match(/(\d+,?)+/i)[0].replace(/,/g, ''),
                lucky: item_text.includes('class="lucky"')
            };
            const name = item_text.replace(/^(.*?);">/, '').replace(/<\/a>/, '');
            loot_obj.name = (loot_obj.amount > 1) ? name.replace(/s$/i, '') : name;

            // Exceptions
            switch (loot_obj.name) {
                case 'Rift-torn Roots':
                case 'Rift Cherries':
                case 'Savoury Vegetables':
                case 'Sap-filled Thorns':
                case 'Doobers':
                case 'Crumbly Rift Salts':
                case 'Brain Bits':
                case 'Plumepearl Herbs':
                    loot_obj.name = loot_obj.name.replace(/s$/i, '');
                    break;
                case 'Plates of Fealty':
                    loot_obj.name = 'Plate of Fealty';
                    break;
                case 'Cavern Fungi':
                    loot_obj.name = 'Cavern Fungus';
                    break;
                case 'Ancient Hourglas':
                    loot_obj.name = 'Ancient Hourglass';
                    break;
                case 'Shards of Glass':
                case 'Shards of Glas':
                    loot_obj.name = 'Shard of Glass';
                    break;
                case 'Bolts of Cloth':
                    loot_obj.name = 'Bolt of Cloth';
                    break;
                case "Flamin' Spice Leaves":
                case "Hot Spice Leaves":
                case "Medium Spice Leaves":
                case "Mild Spice Leaves":
                case "Flamin' Spice Leave":
                case "Hot Spice Leave":
                case "Medium Spice Leave":
                case "Mild Spice Leave":
                    loot_obj.name = loot_obj.name.replace(/ Leaves?/, ' Leaf');
                    break;
            }

            if (loot_obj.name.includes(' of Gold ')) {
                const loot_name = loot_obj.name;
                const loot_amount = loot_name.substring(loot_name.indexOf('(') + 1, loot_name.indexOf(')'));
                loot_obj.amount = loot_obj.amount * parseInt(loot_amount.replace(/,/g, ''), 10);
                loot_obj.name = 'Gold';
            }

            return loot_obj;
        });
    }

    function getItem(item) {
        return {
            id: item.item_id,
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

    window.console.log("MH Hunt Helper v" + mhhh_version + " loaded! Good luck!");
}());
