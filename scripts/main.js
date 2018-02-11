/*jslint browser:true */

(function () {
    'use strict';

    var db_url = "https://mhhunthelper.agiletravels.com/intake.php";
    var map_intake_url = "https://mhhunthelper.agiletravels.com/map_intake.php";
    var convertible_intake_url = "https://mhhunthelper.agiletravels.com/convertible_intake.php";

    if (!window.jQuery) {
        console.log("MHHH: Can't find jQuery, exiting.");
        return;
    }
    var mhhh_version = $("#mhhh_version").val();

    // Listening for calls
    window.addEventListener('message', function(ev){
        if (null === ev.data.jacks_message) {
            return;
        }
        if (typeof user.user_id === 'undefined') {
            alert('Please make sure you are logged in into MH.');
            return;
        }
        if (ev.data.jacks_message === 'userhistory') {
            window.open('https://mhhunthelper.agiletravels.com/searchByUser.php?user=' + user.user_id);
            return;
        }

        if (ev.data.jacks_message === 'mhmh'
            || ev.data.jacks_message === 'tsitu_map'
            || ev.data.jacks_message === 'ryonn') {
            openMapMiceSolver(ev.data.jacks_message);
            return;
        }

        if (ev.data.jacks_message === 'horn') {
            if ($("#huntTimer").text() !== "Ready!") {
                return;
            }

            if ($(".mousehuntHud-huntersHorn").length) { // FreshCoat™ Layout
                $(".mousehuntHud-huntersHorn").click();
            } else if ($(".hornbutton a").length) { // Old Layout
                $(".hornbutton a").click();
            }
            return;
		}

        if (['tsitu_cre', 'tsitu_setup'].indexOf(ev.data.jacks_message) !== -1) {
            getBookmarklet(ev.data.file_link);
            return;
        }

    }, false);

    function getBookmarklet(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var js_script = xhr.responseText;
                attachToMHPage(js_script);
            }
        };
        xhr.send();
    }

    function attachToMHPage(js_script) {
        var script_element = document.createElement('script');
        var script_code = document.createTextNode("function jacks_bookmarklet_run() { " + js_script + "document.getElementById(\"jacks_attached_script\").outerHTML='';}");
        script_element.appendChild(script_code);
        script_element.setAttribute("id", "jacks_attached_script");
        script_element.type = 'text/javascript';
        script_element.onload = function() {
            this.remove();
        };
        document.body.appendChild(script_element);
        document.location.href="javascript:jacks_bookmarklet_run();";
    }

    // Get map mice
    function openMapMiceSolver(solver) {
        var url = '';
        var glue = '';
        if (solver === 'mhmh') {
            url = 'https://mhmaphelper.agiletravels.com/mice/';
            glue = '+';
        } else if (solver === 'tsitu_map') {
            url = 'https://tsitu.github.io/MH-Tools/map.html?mice=';
            glue = '/';
        } else if (solver === 'ryonn') {
            url = 'http://dbgames.info/mousehunt/tavern?q=';
            glue = ';';
        } else {
            return;
        }

        var new_window = window.open('');
        var payload = {view_state: "hasMap", action: "info", uh: user.unique_hash, last_read_journal_entry_id: lastReadJournalEntryId};
        $.post('https://www.mousehuntgame.com/managers/ajax/users/relichunter.php', payload, null, 'json')
            .done(function (data) {
                if (data) {
                    if (!data.treasure_map || data.treasure_map.view_state === "noMap") {
						new_window.close();
                        alert('Please make sure you are logged in into MH and are currently member of a treasure map.');
                        return;
                    }
                    var mice = getMapMice(data, true);
                    new_window.location = encodeURI(url + mice.join(glue));
                }
            });
    }

    // Extract map mice from a map
    function getMapMice(data, uncaught_only) {
        var mice = [];
        $.each(data.treasure_map.groups, function(key, group) {
            if (!uncaught_only) {
                $.each(group.mice, function(key, mouse) {
                    mice.push(mouse.name);
                });
            } else if (group.is_uncaught) {
                $.each(group.mice, function(key, mouse) {
                    mice.push(mouse.name);
                });
            }
        });
        return mice;
    }

    function showFlashMessage(type, message) {
        window.addEventListener("message", function(event) {
            if (event.data.jacks_settings_response !== 1 || event.data.get_options !== "messages") {
                return;
            }

            if ((type === 'success' && event.data.settings.success_messages)
                || (type !== 'success' && event.data.settings.error_messages)){
                displayFlashMessage(type, message);
            }
        }, false);
        window.postMessage({jacks_settings_request: 1, get_options: "messages"}, "*");
    }

    function displayFlashMessage(type, message) {
        var mhhh_flash_message_div = $('#mhhh_flash_message_div');
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

        mhhh_flash_message_div.fadeIn(function() {
            setTimeout(function() {
                $('#mhhh_flash_message_div').fadeOut();
            }, 1500);
        });
    }

    // Listening router
    $(document).ajaxSuccess(function (event, xhr, ajaxOptions) {
    //   /* Method        */ ajaxOptions.type
    //   /* URL           */ ajaxOptions.url
    //   /* Response body */ xhr.responseText
    //   /* Request body  */ ajaxOptions.data

        if (ajaxOptions.url.indexOf("mousehuntgame.com/managers/ajax/turns/activeturn.php") !== -1) {
            recordHunt(xhr);
        } else if (ajaxOptions.url.indexOf("mousehuntgame.com/managers/ajax/users/relichunter.php") !== -1) {
            recordMap(xhr);
        } else if (ajaxOptions.url.indexOf("mousehuntgame.com/managers/ajax/users/useconvertible.php") !== -1) {
            recordConvertible(xhr);
        }
    });

    // Record map mice
    function recordMap(xhr) {
        if (!xhr.responseJSON.treasure_map || !xhr.responseJSON.treasure_map.board_id || !xhr.responseJSON.treasure_map.name) {
            return;
        }
        var map = {};
        map.mice = getMapMice(xhr.responseJSON);
        map.id = xhr.responseJSON.treasure_map.board_id;
        map.name = xhr.responseJSON.treasure_map.name.replace(/\ treasure/i, '');
        map.name = map.name.replace(/rare\ /i, '');
        map.name = map.name.replace(/common\ /i, '');
        map.name = map.name.replace(/Ardouous/i, 'Arduous');

        map.extension_version = formatVersion(mhhh_version);

        // Send to database
       sendMessageToServer(map_intake_url, map);
    }

    // Record successful hunt
    function recordHunt(xhr) {
        var response = JSON.parse(xhr.responseText);
        var message = {};
        var journal = {};
        message.extension_version = formatVersion(mhhh_version);

        if (!response.active_turn || !response.success || !response.journal_markup) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(1)");
            return;
        }

        for (var i=0; i < response.journal_markup.length; i++) {
            var journal_entry = response.journal_markup[i].render_data;
            if (journal_entry.css_class.indexOf("relicHunter_catch") !== -1) {
                message.rh_environment = journal_entry.environment;
                sendMessageToServer(db_url, message);
                continue;
            }

            if (Object.keys(journal).length !== 0) {
                continue;
            }

            if (journal_entry.css_class.search(/linked|passive|misc/) !== -1) {
                continue;
            }

            if (journal_entry.css_class.search(/(catchfailure|catchsuccess|attractionfailure)/) !== -1 &&
                journal_entry.css_class.indexOf('active') !== -1) {
                journal = response.journal_markup[i];
                continue;
            }

            if (response.journal_markup[i].publish_data.attachment.href.indexOf('journal_Active') !== -1) {
                journal = response.journal_markup[i];
                continue;
            }
        }

        if (Object.keys(journal).length === 0) {
            window.console.log("MHHH: Missing Info (trap check or friend hunt)(2)");
            return;
        }

        message = getMainHuntInfo(message, response, journal);
        if (!message || !message.location || !message.location.name || !message.cheese.name || !message.trap.name || !message.base.name) {
            window.console.log("MHHH: Missing Info (will try better next hunt)(1)");
            return;
        }

        message = fixLGLocations(message, response, journal);
        message = getStage(message, response, journal);
        message = getHuntDetails(message, response, journal);
        message = fixTransitionMice(message, response, journal); // Must be after get stage and get details to fix bad stages

        if (!message || !message.location || !message.location.name) {
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

        var response = xhr.responseJSON;

        var convertible;
        for (var key in response.items) {
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

        var message = xhr.responseJSON.messageData.message_model.messages[0];
        if (!message.isNew || !message.messageData || !message.messageData.items || message.messageData.items.length === 0) {
            return;
        }
        var items = message.messageData.items;

        var record = {
            convertible: getItem(convertible),
            items: items.map(getItem.bind(null)),
            extension_version: formatVersion(mhhh_version),
            asset_package_hash: response.asset_package_hash,
            user_id: response.user.user_id
        };

        // Send to database
        sendMessageToServer(convertible_intake_url, record);
    }

    function sendMessageToServer(url, message) {
        // Send to database
        $.post(url, message)
            .done(function (data) {
                if (data) {
                    var response = JSON.parse(data);
                    showFlashMessage(response.status, response.message);
                }
            });
    }

    function getMainHuntInfo(message, response, journal) {

        // Entry ID
        message.entry_id = journal.render_data.entry_id;

        // Entry Timestamp
        message.entry_timestamp = journal.render_data.entry_timestamp;

        // User ID
        message.user_id = response.user.user_id;

        // Location
        if (!response.user.location) {
            console.log('MH Helper: Missing Location');
            return "";
        }
        message.location = {};
        message.location.name = response.user.location;
        message.location.id = response.user.environment_id;

        // Trap
        if (!response.user.weapon_name) {
            console.log('MH Helper: Missing Trap');
            return "";
        }
        message.trap = {};
        message.trap.name = response.user.weapon_name.replace(/\ trap/i, '');
        message.trap.id = response.user.weapon_item_id;

        // Base
        if (!response.user.base_name) {
            console.log('MH Helper: Missing Base');
            return "";
        }
        message.base = {};
        message.base.name = response.user.base_name.replace(/\ base/i, '');
        message.base.id = response.user.base_item_id;

        // Charm
        message.charm = {};
        if (response.user.trinket_name) {
            message.charm.name = response.user.trinket_name.replace(/\ charm/i, '');
            message.charm.id = response.user.trinket_item_id;
        }

        // Cheese
        if (!response.user.bait_name) {
            console.log('MH Helper: Missing Cheese');
            return "";
        }
        message.cheese = {};
        message.cheese.name = response.user.bait_name.replace(/\ cheese/i, '');
        message.cheese.id = response.user.bait_item_id;

        // Shield (true / false)
        message.shield = response.user.has_shield;

        // Total Power, Luck, Attraction
        message.total_power = response.user.trap_power;
        message.total_luck = response.user.trap_luck;
        message.attraction_bonus = Math.round(response.user.trap_attraction_bonus*100);

        // Caught / Attracted / Mouse
        var outcome = journal.publish_data.attachment.name;
        if (outcome.indexOf('I caught') !== -1) {
            message.caught = 1;
            message.attracted = 1;
            message.mouse = outcome.replace(/i\ caught\ an?\ /i, '');
            message.mouse = message.mouse.replace(/(\ mouse)?\!/i, '');
        } else if (outcome.indexOf('I failed to catch') !== -1) {
            message.caught = 0;
            message.attracted = 1;
            message.mouse = outcome.replace(/i\ failed\ to\ catch\ an?\ /i, '');
            message.mouse = message.mouse.replace(/(\ mouse)?\./i, '');
        } else if (outcome.indexOf('I failed to attract') !== -1) {
            message.caught = 0;
            message.attracted = 0;
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
                        message.hunt_details.has_hourglass = true
                        message.hunt_details.chamber_status = 'closed'
                        message.hunt_details.obelisk_charged = true
                        message.hunt_details.acolyte_sand_drained = true
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
                if (message.mouse === "Naughty Nougat") {
                    message.stage = "Core";
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
                message = getFobiddenGroveStage(message, response, journal);
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
            case "Iceberg":
                message = getIcebergStage(message, response, journal);
                break;
            case "Labyrinth":
                message = getLabyrinthStage(message, response, journal);
                break;
            case "Living Garden":
                message = getLivingGardenStage(message, response, journal);
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
        }

        return message;
    }

    function getFestiveCometStage(message, response, journal) {
        if (!response.user.quests.QuestWinterHunt2017) {
            return message;
        }

        if (response.user.quests.QuestWinterHunt2017.comet.at_boss === true) {
            message.stage = "Core";
            return message;
        }

        message.stage = response.user.quests.QuestWinterHunt2017.comet.phase_name;
        for (var key in response.user.quests.QuestWinterHunt2017.comet.phases) {
            if (response.user.quests.QuestWinterHunt2017.comet.phases[key].status === "active") {
                message.stage += ' (' + key.replace(/phase_/, '') + ')';
                break;
            }
        }

        return message;
    }

    function getMoussuPicchuStage(message, response, journal) {
        message.stage = {};
        message.stage.rain = 'Rain ' + response.user.quests.QuestMoussuPicchu.elements.rain.level;
        message.stage.wind = 'Wind ' + response.user.quests.QuestMoussuPicchu.elements.wind.level;

        return message;
    }

    function getWhiskerWoodsRiftStage(message, response, journal) {
        var clearing = response.user.quests.QuestRiftWhiskerWoods.zones.clearing.level;
        var tree = response.user.quests.QuestRiftWhiskerWoods.zones.tree.level;
        var lagoon = response.user.quests.QuestRiftWhiskerWoods.zones.lagoon.level;

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
        if (response.user.viewing_atts.desert_warpath.wave === 'portal') {
            message.stage = 'Portal';
        } else {
            message.stage = "Wave " + response.user.viewing_atts.desert_warpath.wave;
        }

        return message;
    }

    function getBalacksCoveStage(message, response, journal) {
        if (response.user.viewing_atts.tide) {
            var tide = response.user.viewing_atts.tide;
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
        if (response.user.quests.QuestLivingGarden.minigame.bucket_state) {
            var bucket = response.user.quests.QuestLivingGarden.minigame.bucket_state;
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
        if (!response.user.quests.QuestIceberg.current_phase) {
            return '';
        }

        //switch on current depth after checking what phase has for generals
        switch (response.user.quests.QuestIceberg.current_phase) {
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
        if (!response.user.quests.QuestSunkenCity.is_diving) {
            message.stage = "Docked";
            return message;
        }

        // "if else" faster than "switch" calculations
        var depth = response.user.quests.QuestSunkenCity.distance;
        if (depth < 2000) {
            message.stage = "0-2km";
        } else if (depth < 10000) {
            message.stage = "2-10km";
        } else if (depth < 15000) {
            message.stage = "10-15km";
        } else if (depth < 25000) {
            message.stage = "15-25km";
        } else if (depth >= 25000) {
            message.stage = "25km+";
        }

        return message;
    }

    function getZokorStage(message, response, journal) {
        if (!response.user.quests.QuestAncientCity.district_name) {
            return message;
        }

        var zokor_stages = {
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

        var zokor_district = response.user.quests.QuestAncientCity.district_name;

        var search_string;
        $.each(zokor_stages, function(key, value) {
            search_string = new RegExp(key, "i");
            if (zokor_district.indexOf(search_string) !== -1) {
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
        var titles = response.user.quests.QuestPollutionOutbreak.titles;
        var formatted_titles = {
            hero:                 'Hero',
            knight:               'Knight',
            lord_lady:            'Lord/Lady',
            baron_baroness:       'Baron/Baroness',
            count_countess:       'Count/Countess',
            duke_dutchess:        'Duke/Duchess',
            grand_duke:           'Grand Duke/Duchess',
            archduke_archduchess: 'Archduke/Archduchess'
        };
        $.each(titles, function(title, level) {
            if (!level.active) {
                return true; // Continue
            }
            message.stage = formatted_titles[title];
            return false; // Break
        });
        return message;
    }

    function getBurroughsRiftStage(message, response, journal) {
        switch (response.user.quests.QuestRiftBurroughs.mist_tier) {
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

        if (!response.user.quests.QuestRiftBurroughs.can_mist) {
            return message;
        }

        // Correcting edge cases, still doesn't cover mist level 1->0
        if (response.user.quests.QuestRiftBurroughs.is_misting) {
            if (response.user.quests.QuestRiftBurroughs.mist_released === 1) {
                message.stage = "Mist 0";
            } else if (response.user.quests.QuestRiftBurroughs.mist_released === 6) {
                message.stage = "Mist 1-5";
            } else if (response.user.quests.QuestRiftBurroughs.mist_released === 19) {
                message.stage = "Mist 6-18";
            }
        } else {
            if (response.user.quests.QuestRiftBurroughs.mist_released === 18) {
                message.stage = "Mist 19-20";
            } else if (response.user.quests.QuestRiftBurroughs.mist_released === 5) {
                message.stage = "Mist 6-18";
            }
        }
        return message;
    }

    function getTrainStage(message, response, journal) {
        if (response.user.quests.QuestTrainStation.on_train) {
            switch (response.user.quests.QuestTrainStation.phase_name) {
                case "Supply Depot":
                    message.stage = "1st Phase";
                    break;
                case "Raider River":
                    message.stage = "2nd Phase";
                    break;
                case "Daredevil Canyon":
                    message.stage = "3rd Phase";
                    break;
            }
        } else {
            message.stage = "Station";
        }

        return message;
    }

    function getFortRoxStage(message, response, journal) {
        if (response.user.quests.QuestFortRox.is_lair) {
            message.stage = "Heart of the Meteor";
        } else if (response.user.quests.QuestFortRox.is_dawn) {
            message.stage = "Dawn";
        } else if (response.user.quests.QuestFortRox.is_day) {
            message.stage = "Day";
        } else if (response.user.quests.QuestFortRox.is_night) {
            switch (response.user.quests.QuestFortRox.current_stage) {
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

    function getFobiddenGroveStage(message, response, journal) {
        if (message.mouse === "Realm Ripper") {
            message.stage = "Closed";
        } else {
            message.stage = "Open";
        }

        return message;
    }

    function getBristleWoodsRiftStage(message, response, journal) {
        if (response.user.quests.QuestRiftBristleWoods.chamber_name === "Rift Acolyte Tower") {
            message.stage = "Entrance";
        } else {
            message.stage = response.user.quests.QuestRiftBristleWoods.chamber_name;
        }

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
        }

        return message;
    }

    function getBristleWoodsRiftHuntDetails(message, response, journal) {
        message.hunt_details = {}
        var quest = response.user.quests.QuestRiftBristleWoods
        for (var key in quest.status_effects) {
            if (!quest.status_effects.hasOwnProperty(key)) continue
            message.hunt_details['effect_'+key] = quest.status_effects[key] === 'active'
        }
        message.hunt_details.has_hourglass = quest.items.rift_hourglass_stat_item.quantity >= 1
        message.hunt_details.chamber_status = quest.chamber_status
        if (quest.chamber_name === 'Acolyte') {
            message.hunt_details.obelisk_charged = quest.obelisk_percent === 100
            message.hunt_details.acolyte_sand_drained = message.hunt_details.obelisk_charged && quest.acolyte_sand === 0
        }

        return message;
    }

    function getLoot(message, response, journal) {
        if (journal.publish_data.attachment.description.indexOf("following loot:") === -1) {
            return message;
        }
        var loot_text = journal.publish_data.attachment.description.substring(journal.publish_data.attachment.description.indexOf("following loot:") + 15);
        var loot_array = loot_text.split(/,\s|\sand\s/g);
        var render_array = journal.render_data.text.split(/<a\s/);

        message.loot = [];
        for (var i = 0, len = loot_array.length; i < len; i++) {
            var loot_item = loot_array[i].split(/\s(.+)/);

            message.loot[i] = {};
            message.loot[i].amount = loot_item[0].replace(/,/i, '');
            message.loot[i].name = loot_item[1];

            if (message.loot[i].amount > 1) {
                message.loot[i].name = message.loot[i].name.replace(/s$/i, '');
            }

            // Exceptions
            switch (message.loot[i].name) {
                case 'Rift-torn Roots':
                case 'Rift Cherries':
                case 'Savoury Vegetables':
                case 'Sap-filled Thorns':
                case 'Doobers':
                case 'Crumbly Rift Salts':
                case 'Brain Bits':
                case 'Plumepearl Herbs':
                    message.loot[i].name = message.loot[i].name.replace(/s$/i, '');
                    break;
                case 'Plates of Fealty':
                    message.loot[i].name = 'Plate of Fealty';
                    break;
                case 'Cavern Fungi':
                    message.loot[i].name = 'Cavern Fungus';
                    break;
                case 'Ancient Hourglas':
                    message.loot[i].name = 'Ancient Hourglass';
                    break;
                case 'Shard of Glas':
                    message.loot[i].name = 'Shard of Glass';
                    break;
                case 'Bolts of Cloth':
                    message.loot[i].name = 'Bolt of Cloth';
                    break;
            }
            if (message.loot[i].name.indexOf(' of Gold ') !== -1) {
                var loot_name = message.loot[i].name;
                var loot_amount = loot_name.substring(loot_name.indexOf('(')+1, loot_name.indexOf(')'));
                message.loot[i].amount = message.loot[i].amount * parseInt(loot_amount.replace(/,/, ''));
                message.loot[i].name = 'Gold';
            }
            var render_item = render_array.filter(function (render) {
                return render.indexOf(loot_item[1]) !== -1
            })[0];
            message.loot[i].lucky = render_item && render_item.indexOf('class="lucky"') !== -1
        }

        return message;
    }

    function getItem(item) {
        return {
            id: item.item_id,
            name: item.name,
            //type: item.type,
            quantity: item.quantity
            //class: item.class || item.classification
        }
    }

    function pad(num, size) {
        var s = String(num);
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
