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

    // Listening router
    $(document).ajaxSuccess((event, xhr, ajaxOptions) => {
    // /* Method */ ajaxOptions.type
    // /* URL */ ajaxOptions.url
    // /* Response body */ xhr.responseText
    // /* Request body */ ajaxOptions.data

        if (ajaxOptions.url.includes("mousehuntgame.com/managers/ajax/turns/activeturn.php")) {
            recordHunt(xhr);
        } else if (ajaxOptions.url.includes("mousehuntgame.com/managers/ajax/users/relichunter.php")) {
            recordMap(xhr);
        } else if (ajaxOptions.url.includes("mousehuntgame.com/managers/ajax/users/useconvertible.php")) {
            recordConvertible(xhr);
        } else if (ajaxOptions.url.includes("mousehuntgame.com/managers/ajax/users/profiletabs.php?action=badges")) {
            getSettings(settings => recordCrowns(settings, xhr, ajaxOptions.url));
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

    // Record successful hunt
    function recordHunt(xhr) {
        let response = JSON.parse(xhr.responseText);
        let journal = {};

        for (let i = 0; i < response.journal_markup.length; i++) {
            let journal_render_data = response.journal_markup[i].render_data;
            if (journal_render_data.css_class.search(/(relicHunter_catch|relicHunter_failure)/) !== -1) {
                let rh_message = { // to not set rh flag on regular hunt payload
                    extension_version: formatVersion(mhhh_version),
                    user_id: response.user.user_id,
                    rh_environment: journal_render_data.environment,
                    entry_timestamp: journal_render_data.entry_timestamp
                };
                // Check if rh was caught after reset
                if (rh_message.entry_timestamp > Math.round(new Date().setUTCHours(0, 0, 0, 0) / 1000)) {
                    sendMessageToServer(db_url, rh_message);
                }
                continue;
            }

            if (Object.keys(journal).length !== 0) {
                continue;
            }

            // Skip non-hunt entries like bonus loot from items, Enerchi/Unstable charms, Wild Tonic, etc.
            if (journal_render_data.css_class.search(/linked|passive|misc/) !== -1) {
                // Any notification about the LNY lantern becoming disabled due to running out of candles
                // precedes the entry for the active hunt. It is not necessarily the first (i===0) entry.
                if (journal_render_data.text.includes("I will no longer benefit from the magic of the Pig Lunar Lantern!")) {
                    response.lanternBecameDisabled = true;
                }
                continue;
            }

            if (journal_render_data.css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1 &&
                journal_render_data.css_class.includes('active')) {
                journal = response.journal_markup[i];
                continue;
            }
        }

        if (!response.active_turn || !response.success || !response.journal_markup) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(1)");
            return;
        }

        if (Object.keys(journal).length === 0) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(2)");
            return;
        }

        let message = {
            extension_version: formatVersion(mhhh_version),
            user_id: response.user.user_id
        };
        message = getMainHuntInfo(message, response, journal);
        if (!message || !message.location || !message.location.name || !message.trap.name || !message.base.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(1)");
            return;
        }

        message = fixLGLocations(message, response, journal);
        message = getStage(message, response, journal);
        message = getHuntDetails(message, response, journal);
        message = fixTransitionMice(message, response, journal); // Must be after get stage and get details to fix bad stages

        if (!message || !message.location || !message.location.name || !message.cheese.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(2)");
            return;
        }

        message = getLoot(message, response, journal);

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

    function getMainHuntInfo(message, response, journal) {
        // Entry ID
        message.entry_id = journal.render_data.entry_id;

        // Entry Timestamp
        message.entry_timestamp = journal.render_data.entry_timestamp;

        // Location
        let user_resp = response.user;
        if (!user_resp.location) {
            console.log('MH Helper: Missing Location');
            return "";
        }
        message.location = {
            name: user_resp.location,
            id: user_resp.environment_id
        };

        // Setup components
        let components = [
            { prop: 'weapon', message_field: 'trap', required: true, replacer: /\ trap/i },
            { prop: 'base', message_field: 'base', required: true, replacer: /\ base/i },
            { prop: 'trinket', message_field: 'charm', required: false, replacer: /\ charm/i },
            { prop: 'bait', message_field: 'cheese', required: true, replacer: /\ cheese/i }
        ];
        // Some components are required.
        let missing = components.filter(component => component.required === true && !user_resp.hasOwnProperty(component.prop + '_name'));
        if (missing.length) {
            console.log('MH Helper: Missing required setup component:' + missing.map(c => c.message_field).join(', '));
            return "";
        }
        // Assign component values to the message.
        components.forEach(component => {
            let prop_name = component.prop + '_name';
            let prop_id = component.prop + '_item_id';
            if (!user_resp[prop_name]) return;
            message[component.message_field] = {
                id: user_resp[prop_id],
                name: user_resp[prop_name].replace(component.replacer, '')
            };
        });

        // Shield (true / false)
        message.shield = user_resp.has_shield;

        // Total Power, Luck, Attraction
        message.total_power = user_resp.trap_power;
        message.total_luck = user_resp.trap_luck;
        message.attraction_bonus = Math.round(user_resp.trap_attraction_bonus * 100);

        // Caught / Attracted / FTA'd
        let journal_css = journal.render_data.css_class;
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
                console.log('MH Helper: Unknown "catch" journal css: ' + journal_css);
                return message;
            }
            // Remove HTML tags and other text around the mouse name.
            message.mouse = journal.render_data.text
                .replace(/^.*?\">/, '')      // Remove text through the first closing angle bracket >.
                .replace(/\<\/a\>.*/i, '')   // Remove text after the first <a href>'s closing tag </a>
                .replace(/\ mouse$/i, '');   // Remove " [Mm]ouse" if it is not a part of the name (e.g. Dread Pirate Mousert)
        }

        return message;
    }

    function fixLGLocations(message, response, journal) {
        if (message.location.id === 35) {
            if (response.user.quests.QuestLivingGarden.is_normal) {
                message.location.name = 'Living Garden';
                message.location.id = 35;
            } else {
                message.location.name = 'Twisted Garden';
                message.location.id = 5002;
            }
        } else if (message.location.id === 41) {
            if (response.user.quests.QuestLostCity.is_normal) {
                message.location.name = 'Lost City';
                message.location.id = 5000;
            } else {
                message.location.name = 'Cursed City';
                message.location.id = 41;
            }
        } else if (message.location.id === 42) {
            if (response.user.quests.QuestSandDunes.is_normal) {
                message.location.name = 'Sand Dunes';
                message.location.id = 5001;
            } else {
                message.location.name = 'Sand Crypts';
                message.location.id = 42;
            }
        }
        return message;
    }

    function fixTransitionMice(message, response, journal) {
        if (!message) {
            return "";
        }

        // Check by Location
        switch (message.location.name) {
            case "Acolyte Realm":
                if (message.mouse === "Realm Ripper") {
                    message.location.name = "Forbidden Grove";
                    message.location.id = 11;
                    message.stage = "Closed";
                }
                break;
            case "Bristle Woods Rift":
                if (message.mouse === "Absolute Acolyte" && message.caught === 1) {
                    message.stage = "Acolyte";
                    if (message.hunt_details) {
                        message.hunt_details.has_hourglass = true;
                        message.hunt_details.chamber_status = 'closed';
                        message.hunt_details.obelisk_charged = true;
                        message.hunt_details.acolyte_sand_drained = true;
                    }
                }
                break;
            case "Burroughs Rift":
                if (message.stage !== "Mist 19-20") {
                    if (message.mouse === "Menace of the Rift"
                        || message.mouse === 'Big Bad Behemoth Burroughs') {
                        message.stage = "Mist 19-20";
                    }
                } else {
                    if (message.mouse !== 'Big Bad Behemoth Burroughs'
                        && message.cheese.name === 'Terra Ricotta') {
                        message.stage = 'Mist 6-18';
                    }
                }
                break;
            case "Festive Comet":
                if (message.mouse === "Iceberg Sculptor") {
                    message.stage = "Boss";
                }
                break;
            case "Fiery Warpath":
                if (message.mouse === 'Artillery Commander') {
                    message.stage = "Portal";
                } else if (message.stage === 'Wave 1') {
                    if (message.mouse === 'Theurgy Warden'
                        || message.mouse === 'Warmonger') {
                        message.stage = 'Wave 4';
                    }
                } else if (message.stage === 'Wave 2') {
                    if (message.mouse === 'Vanguard'
                        || message.mouse === 'Desert Archer'
                        || message.mouse === "Desert Soldier") {
                        message.stage = 'Wave 1';
                    }
                } else if (message.stage === "Wave 3") {
                    if (message.mouse === "Flame Archer"
                        || message.mouse === "Flame Warrior"
                        || message.mouse === "Inferno Mage"
                        || message.mouse === "Sentinel"
                        || message.mouse === "Sand Cavalry") {
                        message.stage = "Wave 2";
                    }
                } else if (message.stage === "Wave 4") {
                    if (message.mouse !== "Theurgy Warden"
                        && message.mouse !== "Warmonger") {
                        message.stage = "Wave 3";
                    }
                }
                break;
            case "Fort Rox":
                if (message.stage === "Day") {
                    if (message.mouse === "Monster of the Meteor"
                        || message.mouse === "Dawn Guardian") {
                        message.stage = "Dawn";
                    } else if (message.mouse === "Arcane Summoner"
                        || message.mouse === "Battering Ram") {
                        return "";
                    }
                }
                if (message.mouse === "Heart of the Meteor") {
                    message.stage = "Heart of the Meteor";
                }
                break;
            case "Iceberg":
                if (message.stage === "Generals") {
                    if (message.mouse !== "Lady Coldsnap"
                        && message.mouse !== "Lord Splodington"
                        && message.mouse !== "Princess Fist"
                        && message.mouse !== "General Drheller") {
                        return "";
                    }
                } else {
                    if (message.mouse === "Lady Coldsnap"
                        || message.mouse === "Lord Splodington"
                        || message.mouse === "Princess Fist"
                        || message.mouse === "General Drheller") {
                        message.stage = "Generals";
                    }
                }
                break;
            case "Jungle of Dread":
                if (message.mouse === "Riptide") {
                    // Can't determine Balack's Cove stage
                    return "";
                }
                break;
            case "Moussu Picchu":
                if (message.mouse === "Ful'Mina, The Mountain Queen") {
                    if (message.stage.rain === "Rain medium") {
                        message.stage.rain = "Rain high";
                    }
                    if (message.stage.wind === "Wind medium") {
                        message.stage.wind = "Wind high";
                    }
                }
                break;
            case "Sand Dunes":
                if (message.mouse === "Grubling") {
                    message.stage = "Stampede";
                }
                break;
            case "Seasonal Garden":
                if (message.mouse === "Chess Master"
                    || message.mouse === "Technic King"
                    || message.mouse === "Mystic King") {
                    message.location.name = "Zugzwang's Tower";
                    message.location.id = 32;
                    delete message.stage;
                }
                break;
            case "Slushy Shoreline":
                if (message.mouse === "Icewing") {
                    message.location.name = "Iceberg";
                    message.location.id = 40;
                    message.stage = "1800ft";
                } else if (message.mouse === "Deep") {
                    message.location.name = "Iceberg";
                    message.location.id = 40;
                    message.stage = "2000ft";
                } else if (message.mouse === "Frostwing Commander") {
                    return "";
                }
                break;
            case "Twisted Garden":
                if (message.mouse === "Carmine the Apothecary") {
                    message.location.name = "Living Garden";
                    message.location.id = 35;
                }
                break;
            case "Whisker Woods Rift":
                if (message.mouse === "Cyclops Barbarian") {
                    message.stage.clearing = "CC 50";
                } else if (message.mouse === "Centaur Ranger") {
                    message.stage.tree = "GGT 50";
                } else if (message.mouse === "Tri-dra") {
                    message.stage.lagoon = "DL 50";
                } else if (message.mouse === "Monstrous Black Widow") {
                    message.stage.clearing = "CC 50";
                    message.stage.tree = "GGT 50";
                    message.stage.lagoon = "DL 50";
                }
                break;
        }

        // Check by Mouse
        // when M400 is caught, the cheese is disarmed, but it's only attracted to Fusion Fondue
        if (message.caught && message.mouse === 'M400') {
            message.cheese.name = 'Fusion Fondue';
            message.cheese.id = 1386;
        }

        const quest = getActiveLNYQuest(response.user.quests);
        // TODO: check if the last costumed mouse is caught, not the specific one.
        if (quest && quest.has_stockpile === "found" && !quest.mice.costumed_pig.includes("caught")) {
            // Ignore event cheese hunts as the player is attracting the Costumed mice in a specific order.
            const event_cheese = Object.keys(quest.items)
                .filter(itemName => itemName.search(/lunar_new_year\w+cheese/) >= 0)
                .map(cheeseName => quest.items[cheeseName]);
            if (event_cheese.some(cheese => cheese.status === "active")) {
                return "";
            }
        }

        return message;
    }

    function getStage(message, response, journal) {
        if (!message) {
            return "";
        }
        switch (response.user.location) {
            case "Balack's Cove":
                message = getBalacksCoveStage(message, response, journal);
                break;
            case "Bristle Woods Rift":
                message = getBristleWoodsRiftStage(message, response, journal);
                break;
            case "Burroughs Rift":
                message = getBurroughsRiftStage(message, response, journal);
                break;
            case "Claw Shot City":
                message = getClawShotCityStage(message, response, journal);
                break;
            case "Cursed City":
            case "Lost City":
                message = getLostCityStage(message, response, journal);
                break;
            case "Festive Comet":
                message = getFestiveCometStage(message, response, journal);
                break;
            case "Fiery Warpath":
                message = getFieryWarpathStage(message, response, journal);
                break;
            case "Forbidden Grove":
                message = getForbiddenGroveStage(message, response, journal);
                break;
            case "Fort Rox":
                message = getFortRoxStage(message, response, journal);
                break;
            case "Furoma Rift":
                message = getFuromaRiftStage(message, response, journal);
                break;
            case "Gnawnian Express Station":
                message = getTrainStage(message, response, journal);
                break;
            case "Harbour":
                message = getHarbourStage(message, response, journal);
                break;
            case "Iceberg":
                message = getIcebergStage(message, response, journal);
                break;
            case "Labyrinth":
                message = getLabyrinthStage(message, response, journal);
                break;
            case "Living Garden":
                message = getLivingGardenStage(message, response, journal);
                break;
            case "Mousoleum":
                message = getMousoleumStage(message, response, journal);
                break;
            case "Moussu Picchu":
                message = getMoussuPicchuStage(message, response, journal);
                break;
            case "Sand Dunes":
                message = getSandDunesStage(message, response, journal);
                break;
            case "Seasonal Garden":
                message = getSeasonalGardenStage(message, response, journal);
                break;
            case "Sunken City":
                message = getSunkenCityStage(message, response, journal);
                break;
            case "Toxic Spill":
                message = getToxicSpillStage(message, response, journal);
                break;
            case "Twisted Garden":
                message = getTwistedGardenStage(message, response, journal);
                break;
            case "Whisker Woods Rift":
                message = getWhiskerWoodsRiftStage(message, response, journal);
                break;
            case "Zokor":
                message = getZokorStage(message, response, journal);
                break;
            case "Mysterious Anomaly":
                message = getMysteriousAnomalyStage(message, response, journal);
                break;
        }

        return message;
    }

    function getMousoleumStage(message, response, journal) {
        let quest = response.user.quests.QuestMousoleum;
        if (quest.has_wall) {
            message.stage = "Has Wall";
        } else {
            message.stage = "No Wall";
        }

        return message;
    }

    function getHarbourStage(message, response, journal) {
        let quest = response.user.quests.QuestHarbour;
        // Hunting crew + can't yet claim booty = Pirate Crew mice are in the attraction pool
        if (quest.status === "searchStarted" && !quest.can_claim) {
            message.stage = "On Bounty";
        } else {
            message.stage = "No Bounty";
        }

        return message;
    }

    function getClawShotCityStage(message, response, journal) {
        let quest = response.user.quests.QuestClawShotCity;
        /**
         * !map_active && !has_wanted_poster => Bounty Hunter can be attracted
         * !map_active && has_wanted_poster => Bounty Hunter is not attracted
         * map_active && !has_wanted_poster => On a Wanted Poster
         */

        if (!quest.map_active && !quest.has_wanted_poster) {
            message.stage = "No poster";
        } else if (!quest.map_active && quest.has_wanted_poster) {
            message.stage = "Has poster";
        } else {
            message.stage = "Using poster";
        }

        return message;
    }

    function getFestiveCometStage(message, response, journal) {
        let quest = response.user.quests.QuestWinterHunt2018;
        if (!quest) {
            return message;
        }

        if (quest.comet.at_boss === true) {
            message.stage = "Boss";
        } else {
            message.stage = quest.decorations.current_decoration;
            if (message.stage === "none") {
                message.stage = "No Decor";
            } else {
                message.stage = message.stage.replace(/_festive_decoration_stat_item/i, '');
                message.stage = message.stage.replace(/_/i, ' ');

                // Capitalize every word in the stage
                message.stage = message.stage.split(" ");
                for (let i = 0, x = message.stage.length; i < x; i++) {
                    message.stage[i] = message.stage[i][0].toUpperCase() + message.stage[i].substr(1);
                }
                message.stage = message.stage.join(" ");
            }
        }
        return message;
    }

    function getMoussuPicchuStage(message, response, journal) {
        let elements = response.user.quests.QuestMoussuPicchu.elements;
        message.stage = {
            rain: 'Rain ' + elements.rain.level,
            wind: 'Wind ' + elements.wind.level
        };

        return message;
    }

    function getWhiskerWoodsRiftStage(message, response, journal) {
        let zones = response.user.quests.QuestRiftWhiskerWoods.zones;
        let clearing = zones.clearing.level;
        let tree = zones.tree.level;
        let lagoon = zones.lagoon.level;

        message.stage = {};
        if (0 <= clearing && clearing <= 24) {
            message.stage.clearing = 'CC 0-24';
        } else if (25 <= clearing && clearing <= 49) {
            message.stage.clearing = 'CC 25-49';
        } else {
            message.stage.clearing = 'CC 50';
        }

        if (0 <= tree && tree <= 24) {
            message.stage.tree = 'GGT 0-24';
        } else if (25 <= tree && tree <= 49) {
            message.stage.tree = 'GGT 25-49';
        } else {
            message.stage.tree = 'GGT 50';
        }

        if (0 <= lagoon && lagoon <= 24) {
            message.stage.lagoon = 'DL 0-24';
        } else if (25 <= lagoon && lagoon <= 49) {
            message.stage.lagoon = 'DL 25-49';
        } else {
            message.stage.lagoon = 'DL 50';
        }

        return message;
    }

    function getLabyrinthStage(message, response, journal) {
        if (response.user.quests.QuestLabyrinth.status === "hallway") {
            message.stage = response.user.quests.QuestLabyrinth.hallway_name;
            // Remove first word (like Short)
            message.stage = message.stage.substr(message.stage.indexOf(" ") + 1);
            message.stage = message.stage.replace(/\ hallway/i, '');
        } else {
            // Not recording last hunt of a hallway and intersections at this time
            return;
        }
        return message;
    }

    function getFieryWarpathStage(message, response, journal) {
        let wave = response.user.viewing_atts.desert_warpath.wave;
        if (wave === 'portal') {
            message.stage = 'Portal';
        } else {
            message.stage = "Wave " + wave;
        }

        return message;
    }

    function getBalacksCoveStage(message, response, journal) {
        let tide = response.user.viewing_atts.tide;
        if (tide) {
            message.stage = tide.substr(0, 1).toUpperCase() + tide.substr(1);
            if (message.stage === "Med") {
                message.stage = "Medium";
            }
            message.stage += " Tide";
        }
        return message;
    }

    function getSeasonalGardenStage(message, response, journal) {
        switch (response.user.viewing_atts.season) {
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
                message.stage = "Spring";
                break;
        }
        return message;
    }

    function getLivingGardenStage(message, response, journal) {
        let bucket = response.user.quests.QuestLivingGarden.minigame.bucket_state;
        if (bucket) {
            if (bucket === "filling") {
                message.stage = "Not Pouring";
            } else {
                message.stage = "Pouring";
            }
        }
        return message;
    }

    function getSandDunesStage(message, response, journal) {
        if (response.user.quests.QuestSandDunes.minigame.has_stampede) {
            message.stage = "Stampede";
        } else {
            message.stage = "No Stampede";
        }
        return message;
    }

    function getLostCityStage(message, response, journal) {
        if (response.user.quests.QuestLostCity.minigame.is_cursed) {
            message.stage = "Cursed";
        } else {
            message.stage = "Not Cursed";
        }
        return message;
    }

    function getTwistedGardenStage(message, response, journal) {
        if (response.user.quests.QuestLivingGarden.minigame.vials_state === "dumped") {
            message.stage = "Pouring";
        } else {
            message.stage = "Not Pouring";
        }
        return message;
    }

    function getIcebergStage(message, response, journal) {
        let phase = response.user.quests.QuestIceberg.current_phase;
        if (!phase) {
            return "";
        }

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
        }
        return message;
    }

    function getSunkenCityStage(message, response, journal) {
        let quest = response.user.quests.QuestSunkenCity;
        if (!quest.is_diving) {
            message.stage = "Docked";
            return message;
        }

        // If the hunter exited a zone, it gets complicated to determine what was the previous zone,
        // so just skip recording any zone
        if (response.journal_markup.some(markup => markup.render_data.text.includes("I finished exploring"))) {
            return "";
        }

        // "if else" faster than "switch" calculations
        let depth = quest.distance;
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

        return message;
    }

    function getZokorStage(message, response, journal) {
        let zokor_district = response.user.quests.QuestAncientCity.district_name;
        if (!zokor_district) {
            return message;
        }

        let zokor_stages = {
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

        $.each(zokor_stages, (key, value) => {
            let search_string = new RegExp(key, "i");
            if (zokor_district.search(search_string) !== -1) {
                message.stage = value;
                return false;
            }
        });

        if (!message.stage) {
            message.stage = zokor_district;
        }

        return message;
    }

    function getFuromaRiftStage(message, response, journal) {
        switch (response.user.quests.QuestRiftFuroma.droid.charge_level) {
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
        }
        return message;
    }

    function getToxicSpillStage(message, response, journal) {
        let titles = response.user.quests.QuestPollutionOutbreak.titles;
        let formatted_titles = {
            hero:                 'Hero',
            knight:               'Knight',
            lord_lady:            'Lord/Lady',
            baron_baroness:       'Baron/Baroness',
            count_countess:       'Count/Countess',
            duke_dutchess:        'Duke/Duchess',
            grand_duke:           'Grand Duke/Duchess',
            archduke_archduchess: 'Archduke/Archduchess'
        };
        $.each(titles, (title, level) => {
            if (!level.active) {
                return true; // Continue
            }
            message.stage = formatted_titles[title];
            return false; // Break
        });
        return message;
    }

    function getBurroughsRiftStage(message, response, journal) {
        let quest = response.user.quests.QuestRiftBurroughs;
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

        if (!quest.can_mist) {
            return message;
        }

        // Correcting edge cases, still doesn't cover mist level 1->0
        if (quest.is_misting) {
            if (quest.mist_released === 1) {
                message.stage = "Mist 0";
            } else if (quest.mist_released === 6) {
                message.stage = "Mist 1-5";
            } else if (quest.mist_released === 19) {
                message.stage = "Mist 6-18";
            }
        } else {
            if (quest.mist_released === 18) {
                message.stage = "Mist 19-20";
            } else if (quest.mist_released === 5) {
                message.stage = "Mist 6-18";
            }
        }

        return message;
    }

    function getTrainStage(message, response, journal) {
        let quest = response.user.quests.QuestTrainStation;
        if (quest.on_train) {
            switch (quest.phase_name) {
                case "Supply Depot":
                    message.stage = "1. Supply Depot";
                    break;
                case "Raider River":
                    message.stage = "2. Raider River";
                    break;
                case "Daredevil Canyon":
                    message.stage = "3. Daredevil Canyon";
                    break;
            }

            if (quest.minigame && quest.minigame.supply_hoarder_turns > 0) {
                // More than 0 (aka 1-5) Hoarder turns means a Supply Rush is active
                message.stage += " - Rush";
            } else {
                message.stage += " - No Rush";
            }
        } else {
            message.stage = "Station";
        }

        return message;
    }

    function getFortRoxStage(message, response, journal) {
        let quest = response.user.quests.QuestFortRox;
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

        return message;
    }

    function getForbiddenGroveStage(message, response, journal) {
        if (message.mouse === "Realm Ripper") {
            message.stage = "Closed";
        } else {
            message.stage = "Open";
        }

        return message;
    }

    function getBristleWoodsRiftStage(message, response, journal) {
        message.stage = response.user.quests.QuestRiftBristleWoods.chamber_name;
        if (message.stage === "Rift Acolyte Tower") {
            message.stage = "Entrance";
        }

        return message;
    }

    function getMysteriousAnomalyStage(message, response, journal) {
        message.stage = response.user.quests.QuestBirthday2018.current_year;

        return message;
    }

    function getHuntDetails(message, response, journal) {
        if (!message) {
            return "";
        }
        switch (response.user.location) {
            case "Bristle Woods Rift":
                message = getBristleWoodsRiftHuntDetails(message, response, journal);
                break;
            case "Mysterious Anomaly":
                message = getMysteriousAnomalyHuntDetails(message, response, journal);
                break;
        }

        // Set a value for LNY bonus luck, if it can be determined. Otherwise flag LNY hunts.
        const quest = getActiveLNYQuest(response.user.quests);
        if (quest) {
            // Avoid overwriting any existing hunt details.
            if (!message.hunt_details) {
                message.hunt_details = {};
            }
            message.hunt_details.is_lny_hunt = true;

            let lny_luck = null;
            if (quest.lantern_status.includes("noLantern")) {
                // The user has no pig lantern yet, so they cannot have bonus LNY luck.
                lny_luck = 0;
            } else if (quest.is_lantern_active || response.lanternBecameDisabled) {
                // Each hunt with the active lantern increases the height by 1, and thus possibly the luck.
                lny_luck = getLNYLuck(quest);
            } else {
                const yellow = quest.items.lny_unlit_lantern_stat_item;
                const red = quest.items.lny_unlit_lantern_2018_stat_item;
                // If the user has both candles, we know the lantern state was an explicit choice.
                // (Candles given via height rewards must be explicitly claimed.)
                if (parseInt(yellow.quantity, 10) > 0 && parseInt(red.quantity, 10) > 0) {
                    lny_luck = 0;
                } else {
                    // Without explicit knowledge of the pre-hunt state, we cannot determine if
                    // this hunt consumed the final equipped candle of either type. If that had
                    // indeed occurred, and the "lantern disabled" journal entry was not detected
                    // properly, assigning `lny_luck = 0` would be an error here. Since there is
                    // some possible doubt re: the state of lny_luck, leave it unset.
                }
            }

            if (lny_luck !== null) {
                message.hunt_details.lny_luck = lny_luck;
            }
        }

        return message;
    }

    function getBristleWoodsRiftHuntDetails(message, response, journal) {
        let quest = response.user.quests.QuestRiftBristleWoods;
        message.hunt_details = {
            has_hourglass: quest.items.rift_hourglass_stat_item.quantity >= 1,
            chamber_status: quest.chamber_status
        };
        for (let key in quest.status_effects) {
            if (!quest.status_effects.hasOwnProperty(key)) continue;
            message.hunt_details['effect_' + key] = quest.status_effects[key] === 'active';
        }

        if (quest.chamber_name === 'Acolyte') {
            message.hunt_details.obelisk_charged = quest.obelisk_percent === 100;
            message.hunt_details.acolyte_sand_drained = message.hunt_details.obelisk_charged && quest.acolyte_sand === 0;
        }

        return message;
    }

    function getMysteriousAnomalyHuntDetails(message, response, journal) {
        let quest = response.user.quests.QuestBirthday2018;
        message.hunt_details = {
            boss_status: quest.boss_status,
            furthest_year: quest.furthest_year
        };

        return message;
    }

    function getLoot(message, response, journal) {
        let desc = journal.render_data.text;
        if (!desc.includes("following loot:")) {
            return message;
        }
        let loot_text = desc.substring(desc.indexOf("following loot:") + 15);
        let loot_array = loot_text.split(/,\s|\sand\s/g);
        // let render_array = desc.split(/<a\s/);

        message.loot = loot_array.map(item_text => {
            let loot_obj = {
                amount: item_text.match(/(\d+,?)+/i)[0].replace(/,/g, '')
            };
            let name = item_text.replace(/^(.*?);">/, '').replace(/<\/a>/, '');
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
                let loot_name = loot_obj.name;
                let loot_amount = loot_name.substring(loot_name.indexOf('(') + 1, loot_name.indexOf(')'));
                loot_obj.amount = loot_obj.amount * parseInt(loot_amount.replace(/,/g, ''), 10);
                loot_obj.name = 'Gold';
            }

            loot_obj.lucky = item_text.includes('class="lucky"');

            return loot_obj;
        });

        return message;
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

    /**
     * Compute the bonus luck applied to a hunt based on the given post-hunt lantern height.
     * @param {Object <string, any>} lnyQuest A LNY quest object with the property `lantern_height`
     * @returns {number} The amount of luck associated with the given lantern height, or `null` if uncertain.
     */
    function getLNYLuck(lnyQuest) {
        // `lantern_height` is capped at 500, though `lit_lantern` keeps increasing. Red candles
        // provide a +2 bonus, so we cannot rely solely on `lit_lantern`.
        let postHuntHeight = parseInt(lnyQuest.lantern_height, 10);
        let luck = 0;
        if (postHuntHeight === 500) {
            // If we have claimed the final reward, or lit more than 500 lanterns, we are at max luck.
            if (lnyQuest.rows.row_49.includes("claimed") || parseInt(lnyQuest.lit_lantern, 10) > 500) {
                luck = 50;
            } else {
                // We cannot be sure if this was the hunt from 499 -> 500, or a hunt
                // at ht = 500 where the final reward just hasn't been claimed.
                luck = null;
            }
        } else if (postHuntHeight > 0) {
            let yellow = lnyQuest.items.lny_unlit_lantern_stat_item;
            let red = lnyQuest.items.lny_unlit_lantern_2018_stat_item;
            // Default to an underestimate of the pre-hunt height.
            let increase = 2;
            if (yellow.status === "active") {
                increase = 1;
            } else if (red.status === "active") {
                increase = 2;
            } else if (parseInt(red.quantity, 10) > 0) {
                // Neither is active, but we still have red candles --> ran out of yellows.
                increase = 1;
            }
            let preHuntHeight = Math.max(0, postHuntHeight - increase);
            luck = Math.min(50, Math.floor(preHuntHeight / 10));
        }
        return luck;
    }

    /**
     * @param {Object <string, Object <string, any>>} allQuests the `user.quests` object containing all of the user's quests
     * @returns {Object <string, any> | null} The quest if it exists, else `null`
     */
    function getActiveLNYQuest(allQuests) {
        const questNames = Object.keys(allQuests)
            .filter(questName => questName.includes("QuestLunarNewYear"));
        return (questNames.length
            ? allQuests[questNames[0]]
            : null);
    }

    window.console.log("MH Hunt Helper v" + mhhh_version + " loaded! Good luck!");
}());
