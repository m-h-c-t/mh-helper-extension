/*jslint browser:true */
import {IntakeRejectionEngine} from "./hunt-filter/engine";
import {Logger, LogLevel} from "./util/logger";

(function () {
    'use strict';

    const base_domain_url = "https://www.mhct.win";
    const db_url = base_domain_url + "/intake.php";
    const map_intake_url = base_domain_url + "/map_intake.php";
    const convertible_intake_url = base_domain_url + "/convertible_intake.php";
    const map_helper_url = base_domain_url + "/maphelper.php";
    const rh_intake_url = base_domain_url + "/rh_intake.php";

    if (!window.jQuery) {
        console.log("MHCT: Can't find jQuery, exiting.");
        return;
    }

    const mhhh_version = formatVersion($("#mhhh_version").val());

    let debug_logging = false;
    const logger = new Logger();
    const rejectionEngine = new IntakeRejectionEngine(logger);

    // Define Get settings function
    function getSettings(callback) {
        window.addEventListener("message", function listenSettings(event) {
            if (event.data.mhct_settings_response !== 1) {
                return;
            }

            // Locally cache the logging setting.
            debug_logging = !!event.data.settings.debug_logging;
            logger.setLevel(debug_logging ? LogLevel.Debug : LogLevel.Info);

            if (callback && typeof(callback) === "function") {
                window.removeEventListener("message", listenSettings);
                callback(event.data.settings);
            }
        }, false);
        window.postMessage({mhct_settings_request: 1}, "*");
    }

    // Create hunter id hash using forge library
    // https://github.com/digitalbazaar/forge
    let hunter_id_hash = '0';
    function createHunterIdHash() {
        if (typeof user.user_id === 'undefined') {
            alert('MHCT: Please make sure you are logged in into MH.');
            return;
        }

        if (debug_logging) { console.log("hunter_id: " + user.user_id.toString().trim()); }
        // eslint-disable-next-line no-undef
        const md = forge.md.sha512.create();
        md.update(user.user_id.toString().trim());
        if (debug_logging) { console.log("hunter_id_hash: " + md.digest().toHex()); }
        hunter_id_hash = md.digest().toHex();
    }

    // Load settings
    function initialLoad(settings) {
        if (settings.debug_logging) {
            debug_logging = true;
            console.log("MHCT: Debug mode activated!");
            console.log({message: "MHCT: initialLoad ran with settings", settings});
        }
        createHunterIdHash();
    }
    getSettings(settings => initialLoad(settings));

    // Listening for calls
    window.addEventListener('message', ev => {
        if (ev.data.mhct_message == null) {
            return;
        }

        if (typeof user.user_id === 'undefined') {
            alert('MHCT: Please make sure you are logged in into MH.');
            return;
        }
        if (ev.data.mhct_message === 'userhistory') {
            window.open(`${base_domain_url}/searchByUser.php?user=${user.user_id}&hunter_id=${hunter_id_hash}`);
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
            } else if (counts != null) {
                displayFlashMessage(ev.data.settings, "error", "There was an issue submitting crowns on the backend.");
            } else if (debug_logging) {
                window.console.log('MHCT: Skipped submission (already sent).');
            }
            return;
        }

        // Golem submission results in either the boolean `false`, or the number of submitted golems.
        if (ev.data.mhct_message === 'golemSubmissionStatus') {
            const count = ev.data.submitted;
            if (count) {
                displayFlashMessage(ev.data.settings, 'success', 'Snow Golem data submitted successfully');
            } else {
                displayFlashMessage(ev.data.settings, 'error', 'Snow Golem data submission failed, sorry!');
            }
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
        fetch(url).then(response => response.text()).then((data) => {
            const new_source = url.replace("menu", "\" + t + \"");
            const tsitus_menu = data.replace(',d="https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@"+e+"/src/bookmarklet/bm-"+t+".min.js";n.src=d', ";n.src=\"" + new_source + "\"");
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
            setTimeout(() => $('#mhhh_flash_message_div').fadeOut(), 2500 + 1000 * (type !== "success"));
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
        if (debug_logging) {window.console.time("MHCT: Overall 'Hunt Requested' Timing");}
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
                    if (debug_logging) {window.console.log({message: "MHCT: Got user object, invoking huntSend", userRqResponse});}
                    hunt_xhr.addEventListener("loadend", () => {
                        if (debug_logging) {window.console.timeEnd("MHCT: Overall 'Hunt Requested' Timing");}
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
        } else if (url.includes("mousehuntgame.com/managers/ajax/events/winter_hunt.php")) {
            // Triggers on Golem claim, dispatch, upgrade, and on "Decorate" click (+others, perhaps).
            // (GMT): Friday, January 31, 2022 12:00:00 AM [GWH 2021 placeholder end date])
            if (Date.now() < 1643605200000) {
                getSettings(settings => recordGWH2021Golems(settings, xhr));
            }
        } else if (url.includes("mousehuntgame.com/managers/ajax/events/birthday_factory.php")) {
            // Triggers on Birthday Items claim, room change click (+others, perhaps).
            getSettings(settings => recordSnackPack(settings, xhr));
        } else if (url.includes("mousehuntgame.com/managers/ajax/events/kings_giveaway.php")) {
            // Triggers on Birthday Items claim, room change click (+others, perhaps).
            // Wed Jun 23 2021 22:00:00 GMT-0400 [King's Giveaway Key Vanishing date 15th])
            getSettings(settings => recordPrizePack(settings, xhr));
        }
    });

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
            if (debug_logging) window.console.log('MHCT: Skipped crown submission due to unhandled XHR structure');
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
        if (debug_logging) {window.console.log({message: "MHCT: Crowns payload: ", payload});}

        // Prevent other extensions (e.g. Privacy Badger) from blocking the crown
        // submission by submitting from the content script.
        window.postMessage({
            "mhct_crown_update": 1,
            "crowns": payload,
            "settings": settings,
        }, window.origin);
    }

    /**
     * Record GWH 2021 golem submissions
     * @param {Object <string, any>} settings The user's extension settings.
     * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
     */
    function recordGWH2021Golems(settings, xhr) {
        const {messages} = xhr.responseJSON?.messageData?.message_model ?? {};
        if (!messages) {
            if (debug_logging) window.console.log('MHCT: Skipped GWH golem submission due to unhandled XHR structure');
            window.postMessage({
                "mhct_log_request": 1,
                "is_error": true,
                "gwh_golem_submit_xhr_response": xhr.responseJSON,
                "reason": "Unable to parse GWH response",
            }, window.origin);
            return;
        }

        const golems = messages
            .filter(({messageData}) => messageData.content && messageData.content.title.includes('Snow Golem reward'))
            .map(({messageData, messageDate}) => {
                const {title, body} = messageData.content;
                const locationName = /from (?:the )?(.+)!/.exec(title)[1].trim();
                const payload = {
                    uid: messageData.stream_publish_data.params.user_id.toString(),
                    timestamp: new Date(`${messageDate}Z`).getTime(),
                    location: locationName,
                    loot: [],
                };
                // In case the timestamping failed.
                if (Number.isNaN(payload.timestamp) || Math.abs(Date.now() - payload.timestamp) > 10000) {
                    payload.timestamp = Date.now();
                }

                // Use an in-memory DOM tree to obtain the items, slots, & quantities.
                const doc = new DOMParser().parseFromString(body, 'text/html');
                const gwh_prefix = '.winterHunt2021-claimRewardPopup';

                // Get only the item boxes which actually have an item (i.e. ignore locked slots).
                const lootDivs = Array.from(doc.querySelectorAll(`${gwh_prefix}-content ${gwh_prefix}-item`))
                    .map((itemDiv) => [`${gwh_prefix}-item-rarity`, '.quantity', `${gwh_prefix}-item-name`]
                        .map((sel) => itemDiv.querySelector(sel)))
                    .filter(([rarityEl, qtyEl, itemEl]) => rarityEl && qtyEl && itemEl);

                // Update the location data with the rarity-item-quantity information.
                lootDivs.forEach(([rarityEl, qtyEl, itemEl]) => {
                    const rarity = rarityEl.textContent === 'Magical Hat' ? 'Hat'
                        : rarityEl.textContent.charAt(0).toUpperCase() + rarityEl.textContent.slice(1);
                    const quantity = parseInt(qtyEl.textContent.replace(/,/g, '').trim(), 10); // Remove commas from e.g. 10,000 gold
                    const name = itemEl.textContent.includes('SUPER|brie') ? 'SUPER|brie+' : itemEl.textContent.trim();
                    payload.loot.push({name, quantity, rarity});
                });
                return payload;
            });
        if (golems.length) {
            if (debug_logging) window.console.log({message: 'MHCT: GWH Golem:', golems});
            window.postMessage({mhct_golem_submit: 1, golems, settings}, window.origin);
        }
    }

    /**
     * Record Birthday 2021 snack pack submissions as convertibles in MHCT
     * @param {Object <string, any>} settings The user's extension settings.
     * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
     */
    function recordSnackPack(settings, xhr) {
        const {vending_machine_purchase: purchase, user} = xhr.responseJSON ?? {};
        if (!purchase.type || !user?.user_id) {
            if (debug_logging) window.console.log('MHCT: Skipped Bday 2021 snack pack submission due to unhandled XHR structure');
            window.postMessage({
                "mhct_log_request": 1,
                "is_error": true,
                "bday_2021_submit_xhr_response": xhr.responseJSON,
                "reason": "Unable to parse bday 2021 response",
            }, window.origin);
            return;
        }

        // Convert pack code names to made-up internal identifiers
        const packs = {
            larry_starter_mix_snack_pack:	130001,
            tribal_crunch_snack_pack:	130002,
            wild_west_ranch_rings_snack_pack:	130003,
            sandy_bert_bites_snack_pack:	130004,
            hollow_heights_party_pack_snack_pack:	130005,
            riftios_snack_pack:	130006,
        };
        const convertible = {};
        if (purchase.type in packs) {
            convertible["name"] = purchase.type;
            convertible["id"] = packs[purchase.type];
            convertible["quantity"] = purchase.quantity;
        }
        const cheeses = {
            'Gauntlet Cheese Tier 7': 92,
            'Rumble Cheese': 110,
            'Runny Cheese': 907,
            'Onyx Gorgonzola': 106,
            'Gauntlet Cheese Tier 5': 90,
            'Gauntlet Cheese Tier 6': 91,
            'Magical Rancid Radioactive Blue Cheese': 2369,
            'Gauntlet Cheese Tier 4': 89,
            'Maki Cheese': 103,
            'Gauntlet Cheese Tier 8': 93,
            'Runic Cheese': 111,
            'Brie Cheese': 80,
            'Cherry Cheese': 343,
            'Crimson Cheese': 2700,
            'Abominable Asiago Cheese': 2470,
            'Limelight Cheese': 101,
            'Ancient Cheese': 79,
            'Wicked Gnarly Cheese': 121,
            'Susheese Cheese': 115,
            'Glutter Cheese': 96,
            'Grilled Cheese': 1529,
            'Combat Cheese': 82,
            'Radioactive Blue Cheese': 108,
            'Rancid Radioactive Blue Cheese': 1340,
            'Gauntlet Cheese Tier 3': 88,
            'Gauntlet Cheese Tier 2': 87,
            'Chedd-Ore Cheese': 2471,
            'Gnarled Cheese': 97,
            'Vanilla Stilton Cheese': 118,
            'Inferno Havarti Cheese': 100,
            'Galleon Gouda': 1814,
            'Vengeful Vanilla Stilton Cheese': 119,
            'Shell Cheese': 112,
            'Gumbo Cheese': 99,
            'Crunchy Cheese': 84,
            'Sweet Havarti Cheese': 116,
            'Spicy Havarti Cheese': 113,
            'Pungent Havarti Cheese': 107,
            'Magical Havarti Cheese': 102,
            'Crunchy Havarti Cheese': 85,
            'Creamy Havarti Cheese': 83,
            'Mild Queso': 2629,
            'Moon Cheese': 105,
            'Wildfire Queso': 2630,
            'Medium Queso': 2628,
            'Hot Queso': 2627,
            "Flamin' Queso": 2626,
            'Crescent Cheese': 2226,
            'Dewthief Camembert': 1007,
            'Lunaria Camembert': 1010,
            'Graveblossom Camembert': 1009,
            'Duskshade Camembert': 1008,
            'Plumepearl Herbs': 996,
            'Lunaria Petal': 991,
            'Graveblossom Petal': 990,
            'Duskshade Petal': 977,
            'Dreamfluff Herbs': 976,
            'Dewthief Petal': 975,
            'Windy Cheese': 2442,
            'Rainy Cheese': 2441,
            'Mineral Cheese': 1734,
            'Glowing Gruyere Cheese': 1733,
            'Gemstone Cheese': 1732,
            'Cloud Cheesecake': 3089,
            'Sky Pirate Swiss Cheese': 3090,
            'Dragonvine Cheese': 2440,
            'Diamond Cheese': 1731,
            'Rift Rumble Cheese': 2101,
            'Polluted Parmesan Cheese': 1550,
            'Gauntlet String Cheese': 2906,
            'Runic String Cheese': 2344,
            'Resonator Cheese': 1425,
            'Lactrodectus Lancashire Cheese': 1646,
            'Master Fusion Cheese': 2099,
            'Maki String Cheese': 2080,
            'Magical String Cheese': 1426,
            'Ancient String Cheese': 2343,
            'Riftiago Cheese': 1428,
            'Terre Ricotta Cheese': 1551,
            'Rift Susheese': 2102,
            'Rift Glutter Cheese': 2097,
            'Rift Combat Cheese': 2096,
            'Null Onyx Gorgonzola': 2100,
            'Extra Rich Cloud Cheesecake': 3274,
        };
        const items = [];
        if ("items" in purchase) {
            purchase.items.forEach(item => {
                items.push({
                    id: cheeses[item.name],
                    name: item.name,
                    quantity: item.quantity,
                });
            });
        }
        if (debug_logging) window.console.log({message:"MHCT: ", convertible, items, settings});
        submitConvertible(convertible, items, user.user_id);
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
            xhr.responseJSON.kings_giveaway_result.slot !== "bonus" || !xhr.responseJSON.user.user_id
        ) {
            if (debug_logging) window.console.log('MHCT: Skipped mini prize pack submission due to unhandled XHR structure. This is probably fine.');
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

        if (debug_logging) window.console.log({messsage: "MHCT: Prizepack: ", convertible: convertible, items: items, settings: settings});
        submitConvertible(convertible, items, xhr.responseJSON.user.user_id);
    }

    // Record map mice
    function recordMap(xhr) {
        const resp = xhr.responseJSON;
        const entry_timestamp = Math.round(Date.now() / 1000);
        if (resp.treasure_map_inventory?.relic_hunter_hint) {
            sendMessageToServer(rh_intake_url, {
                hint: resp.treasure_map_inventory.relic_hunter_hint,
                user_id: resp.user.user_id,
                entry_timestamp: entry_timestamp,
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
            user_id: resp.user.user_id,
            entry_timestamp: entry_timestamp,
        };

        map.extension_version = mhhh_version;

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
        if (debug_logging) {
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
            return;
        }

        logger.debug("Recording hunt", {message_var:message_pre, user_pre, user_post, hunt});
        // Upload the hunt record.
        sendMessageToServer(db_url, message_pre);
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
            window.console.log("MHCT: Couldn't find any item");
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

        submitConvertible(convertible, items, response.user.user_id);
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
     * @param {string} user_id the user associated with the submission
     */
    function submitConvertible(convertible, items, user_id) {
        const record = {
            convertible: getItem(convertible),
            items: items.map(getItem),
            extension_version: mhhh_version,
            asset_package_hash: Date.now(),
            user_id,
            entry_timestamp: Math.round(Date.now() / 1000),
        };

        // Send to database
        if (debug_logging) {window.console.log({message: "MHCT: submitting convertible", record:record});}
        sendMessageToServer(convertible_intake_url, record);
    }

    function sendMessageToServer(url, final_message) {
        getSettings(settings => {
            if (!settings?.tracking_enabled) { return; }
            const basic_info = {
                user_id: final_message.user_id,
                hunter_id_hash,
                entry_timestamp: final_message.entry_timestamp,
            };


            // Get UUID
            $.post(base_domain_url + "/uuid.php", basic_info).done(data => {
                if (data) {
                    final_message.uuid = data;
                    final_message.hunter_id_hash = hunter_id_hash;
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
        if (debug_logging) {window.console.log({message: `MHCT: Before filtering there's ${journal_entries.length} journal entries.`, journal_entries:journal_entries, max_old_entry_id:max_old_entry_id});}
        journal_entries = journal_entries.filter(x => Number(x.render_data.entry_id) > Number(max_old_entry_id));
        if (debug_logging) {window.console.log({message: `MHCT: After filtering there's ${journal_entries.length} journal entries left.`, journal_entries:journal_entries, max_old_entry_id:max_old_entry_id});}

        // Cancel everything if there's trap check somewhere
        if (journal_entries.findIndex(x => x.render_data.css_class.search(/passive/) !== -1) !== -1) {
            window.console.log("MHCT: Found trap check too close to hunt. Aborting.");
            return null;
        }

        journal_entries.forEach(markup => {
            const css_class = markup.render_data.css_class;
            // Handle a Relic Hunter attraction.
            if (css_class.search(/(relicHunter_catch|relicHunter_failure)/) !== -1) {
                const rh_message = {
                    extension_version: mhhh_version,
                    user_id: hunt_response.user.user_id,
                    rh_environment: markup.render_data.environment,
                    entry_timestamp: markup.render_data.entry_timestamp,
                };
                // If this occurred after the daily reset, submit it. (Trap checks & friend hunts
                // may appear and have been back-calculated as occurring before reset).
                if (rh_message.entry_timestamp > Math.round(new Date().setUTCHours(0, 0, 0, 0) / 1000)) {
                    sendMessageToServer(db_url, rh_message);
                    if (debug_logging) {window.console.log(`MHCT: Found the Relic Hunter in ${rh_message.rh_environment}`);}
                }
            }
            else if (css_class.search(/prizemouse/) !== -1) {
                // Handle a prize mouse attraction.
                if (debug_logging) {
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
                        if (debug_logging) { window.console.log({message:"MHCT: ", desert_heater_loot: items}); }

                        submitConvertible(convertible, items, hunt_response.user.user_id);
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
                        if (debug_logging) { window.console.log({message:"MHCT: Submitting Unstable Charm: ", unstable_charm_loot: items}); }

                        submitConvertible(convertible, items, hunt_response.user.user_id);
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
                        if (debug_logging) { window.console.log({message:"MHCT: Submitting Gift Wrapped Charm: ", gift_wrapped_charm_loot: items}); }

                        submitConvertible(convertible, items, hunt_response.user.user_id);
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
                        if (debug_logging) { window.console.log({message:"MHCT: Submitting Torch Charm: ", torch_charm_loot: items}); }

                        submitConvertible(convertible, items, hunt_response.user.user_id);
                    }
                }
            }
            else if (css_class.search(/alchemists_cookbook_base_bonus/) !== -1) {

                more_details['alchemists_cookbook_base_bonus'] = true;
                if (debug_logging) {window.console.log({message: "MHCT: ", procs: more_details});}
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
                            if (debug_logging) { window.console.log({message: "MHCT: ", boiling_cauldron_trap: items}); }

                            submitConvertible(convertible, items, hunt_response.user.user_id);
                        }
                    }
                }
                more_details['boiling_cauldron_trap_bonus'] = true;
                if (is_boon) {
                    more_details['gloomy_cauldron_boon'] = true;
                }
                if (debug_logging) {window.console.log({message: "MHCT: ", procs: more_details});}
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
                        if (debug_logging) { window.console.log({message: "MHCT: ", gilded_charm: items}); }

                        submitConvertible(convertible, items, hunt_response.user.user_id);
                    }
                }
            }
            else if (css_class.search(/pirate_sleigh_trigger/) !== -1) {
                // SS Scoundrel Sleigh got 'im!
                more_details['pirate_sleigh_trigger'] = true;
                if (debug_logging) {window.console.log({message: "MHCT: ", procs: more_details});}
            }
            else if (css_class.search(/(catchfailure|catchsuccess|attractionfailure|stuck_snowball_catch)/) !== -1) {
                more_details['hunt_count']++;
                if (debug_logging) {window.console.log({message: "MHCT: Got a hunt record ", procs: more_details});}
                if (css_class.includes('active')) {
                    journal = markup;
                    if (debug_logging) {window.console.log({message: "MHCT: Found the active hunt", journal});}
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
        const message = {
            extension_version: mhhh_version,
        };
        const debug_logs = [];

        // Hunter ID.
        message.user_id = parseInt(user.user_id, 10);
        if (isNaN(message.user_id)) {
            throw new Error(`MHCT: Unexpected user id value ${user.user_id}`);
        }

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

        if (debug_logging) {
            debug_logs.forEach(log_message => window.console.log(`MHCT: ${log_message}`));
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
            if (debug_logging) {window.console.warn({record: message, user, user_post, hunt});}
            throw new Error(`MHCT: Unexpected location id ${message.location.id} for LG-area location`);
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
        "Frozen Vacant Lot": addFestiveCometStage,
        "Fiery Warpath": addFieryWarpathStage,
        "Floating Islands": addFloatingIslandsStage,
        "Forbidden Grove": addForbiddenGroveStage,
        "Foreword Farm": addForewordFarmStage,
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
        "Table of Contents": addTableOfContentsStage,
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
            throw new Error("MHCT: Unexpected Claw Shot City quest state");
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
        const quest = user.quests.QuestWinterHunt2021;
        if (!quest) {
            return;
        }

        if (quest.comet.current_phase === 11) {
            message.stage = "Boss";
        }
        else if (/Pecan Pecorino/.test(user.bait_name)) {
            let theme = quest.decorations.current_decoration || "none";
            if (theme == "none") {
                theme = "No Decor";
            } else {
                theme = theme.replace(/^([a-z_]+)_yule_log_stat_item/i, "$1").replace(/_/g, " ");
                theme = theme.charAt(0).toUpperCase() + theme.slice(1);
            }
            message.stage = theme;
        } else {
            message.stage = 'N/A';
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
            wind: `Wind ${elements.wind.level}`,
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
            message.stage = hallway.substr(hallway.indexOf(" ") + 1).replace(/ hallway/i, '');
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
        const tide = user.quests.QuestBalacksCove.tide.level;
        const direction = user.quests.QuestBalacksCove.tide.direction;
        const progress = user.quests.QuestBalacksCove.tide.percent;
        const imminent_state_change = (progress >= 99
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
            if (debug_logging) {window.console.log({message: "MHCT: Skipping hunt during server-side tide change", user, user_post, hunt});}
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
                    if (debug_logging) {window.console.log({message: "MHCT: Assumed spring", season, user, user_post});}
                    message.stage = "Spring";
                    break;
            }
        } else {
            if (debug_logging) {window.console.log({message: "MHCT: Skipping hunt during server-side season change", user, user_post, hunt});}
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
            "General":            "Generals",
        })[quest.current_phase]);

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "MHCT: Skipping unknown Iceberg stage", pre: quest, post: user_post.quests.QuestIceberg, hunt});}
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
                "Sanctum":    "Fealty 80+",
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
            if (debug_logging) {window.console.log({message: "MHCT: Skipping unknown Zokor district", user, user_post, hunt});}
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
                "charge_level_ten":   "Battery 10",
            })[quest.droid.charge_level]);
        }

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "MHCT: Skipping unknown Furoma Rift droid state", user, user_post, hunt});}
            message.location = null;
        }
    }

    /**
     * Set the Table of Contents Stage
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addTableOfContentsStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestTableOfContents;
        if (quest) {
            if (quest.is_writing) {
                if (quest.current_book.volume > 0) {
                    message.stage = 'Encyclopedia';
                } else {
                    message.stage = 'Pre-Encyclopedia';
                }
            } else {
                message.stage = 'Not Writing';
            }
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
            archduke_archduchess: 'Archduke/Archduchess',
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
            if (debug_logging) {window.console.log({message: "MHCT: Skipping hunt during server-side pollution change", user, user_post, hunt});}
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
            "tier_3": "Mist 19-20",
        })[quest.mist_tier]);
        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "MHCT: Skipping unknown Burroughs Rift mist state", user, user_post, hunt});}
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
            if (debug_logging) {window.console.log({message: "MHCT: Skipping hunt during server-side train stage change", user, user_post, hunt});}
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
                    if (user.trinket_name === "Supply Schedule Charm") {
                        stage += " + SS Charm";
                    }
                }
                message.stage = stage;
            } else if (quest.current_phase === "boarding") {
                let stage = "2. Raider River";
                if (quest.minigame && quest.minigame.trouble_area) {
                    // Raider River has an additional server-side state change.
                    const area = quest.minigame.trouble_area;
                    const final_area = final_quest.minigame.trouble_area;
                    if (area !== final_area) {
                        if (debug_logging) {window.console.log({message: "MHCT: Skipping hunt during server-side trouble area change", user, user_post, hunt});}
                        message.location = null;
                    } else {
                        const charm_id = message.charm.id;
                        const has_correct_charm = (({
                            "door": 1210,
                            "rails": 1211,
                            "roof": 1212,
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
                let stage = "3. Daredevil Canyon";
                if (user.trinket_name === "Magmatic Crystal Charm") {
                    message.stage += " - Magmatic Crystal";
                } else if (user.trinket_name === "Black Powder Charm") {
                    stage += " - Black Powder";
                } else if (user.trinket_name === "Dusty Coal Charm") {
                    stage += "  - Dusty Coal";
                } else {
                    stage += " - No Fuelers";
                }
                message.stage = stage;
            }
        }
    }

    /**
     * Add the pest indication
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function addForewordFarmStage(message, user, user_post, hunt) {
        const quest = user.quests.QuestForewordFarm;
        if (quest && quest.mice_state && typeof quest.mice_state === "string") {
            message.stage = quest.mice_state.split('_').map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
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
                "stage_five":  "First Light",
            })[quest.current_stage]);
        }

        if (!message.stage) {
            if (debug_logging) {window.console.log({message: "MHCT: Skipping unknown Fort Rox stage", pre: quest, post: user_post.quests.QuestFortRox});}
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
        const was_open = user.quests.QuestForbiddenGrove.grove.is_open;
        if (was_open != user_post.quests.QuestForbiddenGrove.grove.is_open) {
            if (debug_logging) {window.console.log({message: "MHCT: Skipping hunt during server-side door change", user, user_post, hunt});}
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
        const factory = user.quests.QuestSuperBrieFactory.factory_atts;
        if (message.mouse === "Vincent, The Magnificent" || factory.boss_warning) {
            message.stage = "Boss";
        } else {
            message.stage = (({
                "pumping_room":           "Pump Room",
                "mixing_room":            "Mixing Room",
                "break_room":             "Break Room",
                "quality_assurance_room": "QA Room",
            })[factory.current_room]);
            if (!message.stage || !/Coggy Colby/.test(user.bait_name) ) {
                message.stage = "Any Room";
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
            case "tower": {
                const {floor} = attrs;
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
            }
            case "farming":
                message.stage = "Outside";
                break;
            default:
                if (debug_logging) {window.console.log({message: "MHCT: Skipping unknown Valour Rift stage", pre: attrs, post: user_post.environment_atts || user_post.enviroment_atts});}
                message.location = null;
                break;
        }
    }

    function addFloatingIslandsStage(message, user, user_post, hunt) {
        const envAttributes = user.environment_atts || user.enviroment_atts;
        const pirates = ["No Pirates", "Pirates x1", "Pirates x2", "Pirates x3", "Pirates x4"];
        const hsa = envAttributes.hunting_site_atts;
        message.stage = hsa.island_name;

        if (hsa.is_enemy_encounter) {
            if (hsa.is_low_tier_island)
                message.stage = "Warden";
            else if (hsa.is_high_tier_island)
                message.stage += " Paragon";
            else if (hsa.is_vault_island)
                message.stage = "Empress";
            else
                message.stage += " Enemy Encounter";
        }
        else if (user.bait_name === "Sky Pirate Swiss Cheese") {
            message.stage = hsa.is_vault_island ? "Vault " : "Island ";
            message.stage += pirates[hsa.activated_island_mod_types.filter(item => item === "sky_pirates").length];
        }
        else if (((user.bait_name === "Extra Rich Cloud Cheesecake") || (user.bait_name === "Cloud Cheesecake")) &&
                 (hsa.activated_island_mod_types.filter(item => item === "loot_cache").length >= 2)) {
            message.stage += ` - Loot x${hsa.activated_island_mod_types.filter(item => item === "loot_cache").length}`;
        }
        // This is a new if situation to account for the above scenarios. It adds to them.
        else if (hsa.is_vault_island
            && 'activated_island_mod_types' in hsa
            && Array.isArray(hsa.activated_island_mod_types)) {
            //NOTE: There is a paperdoll attribute that may be quicker to use
            const panels = {};
            hsa.activated_island_mod_types.forEach(t => t in panels ? panels[t]++ : panels[t] = 1);
            let counter = 0;
            let mod_type = '';
            for (const [type, num] of Object.entries(panels)) {
                if (num >= 3) {
                    counter = num;
                    mod_type = hsa.island_mod_panels.filter(p => p.type === type)[0].name;
                }
            }
            if (counter && mod_type)
                message.stage += ` ${counter}x ${mod_type}`;
        }
    }

    /** @type {Object <string, Function>} */
    const location_huntdetails_lookup = {
        "Bristle Woods Rift": calcBristleWoodsRiftHuntDetails,
        "Claw Shot City": calcClawShotCityHuntDetails,
        "Fiery Warpath": calcFieryWarpathHuntDetails,
        // "Floating Islands": calcFloatingIslandsHuntDetails, // Moved to stages
        "Fort Rox": calcFortRoxHuntDetails,
        "Harbour": calcHarbourHuntDetails,
        "Sand Crypts": calcSandCryptsHuntDetails,
        "Table of Contents": calcTableofContentsHuntDetails,
        "Valour Rift": calcValourRiftHuntDetails,
        "Whisker Woods Rift": calcWhiskerWoodsRiftHuntDetails,
        "Zokor": calcZokorHuntDetails,
        "Zugzwang's Tower": calcZugzwangsTowerHuntDetails,
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
        // First, get any location-specific details:
        const details_func = location_huntdetails_lookup[user.environment_name];
        const locationHuntDetails = details_func ? details_func(message, user, user_post, hunt) : undefined;

        // Then, get any global hunt details (such as from ongoing events, auras, etc).
        const globalHuntDetails = [
            calcEggHuntDetails,
            calcHalloweenHuntDetails,
            calcLNYHuntDetails,
            calcLuckyCatchHuntDetails,
            calcPillageHuntDetails,
        ].map((details_func) => details_func(message, user, user_post, hunt))
            .filter(details => details);

        const otherJournalDetails = calcMoreDetails(hunt); // This is probably not needed and can use hunt.more_details below

        // Finally, merge the details objects and add it to the message.
        if (locationHuntDetails || globalHuntDetails.length >= 0) {
            message.hunt_details = Object.assign({}, locationHuntDetails, ...globalHuntDetails, otherJournalDetails);
        }
    }

    /**
     * Record the Eggscavator Charge level, both before and after the hunt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcEggHuntDetails(message, user, user_post, hunt) {
        const quest = getActiveSEHQuest(user.quests);
        const post_quest = getActiveSEHQuest(user_post.quests);
        if (quest && post_quest) {
            return {
                is_egg_hunt: true,
                egg_charge_pre: parseInt(quest.charge_quantity, 10),
                egg_charge_post: parseInt(post_quest.charge_quantity, 10),
                can_double_eggs: (quest.charge_doubler === "active"),
            };
        }
    }

    /**
     * Record the Cannon state and whether the hunt was taken in a stockpile location.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcHalloweenHuntDetails(message, user, user_post, hunt) {
        const quest = getActiveHalloweenQuest(user.quests);
        if (quest) {
            return {
                is_halloween_hunt: true,
                is_firing_cannon: !!(quest.is_cannon_enabled || quest.is_long_range_cannon_enabled),
                is_in_stockpile: !!quest.has_stockpile,
            };
        }
    }

    /**
     * Set a value for LNY bonus luck, if it can be determined. Otherwise flag LNY hunts.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcLNYHuntDetails(message, user, user_post, hunt) {
        const quest = getActiveLNYQuest(user.quests);
        if (quest) {
            return {
                is_lny_hunt: true,
                lny_luck: (quest.lantern_status.includes("noLantern") || !quest.is_lantern_active)
                    ? 0
                    : Math.min(50, Math.floor(parseInt(quest.lantern_height, 10) / 10)),
            };
        }
    }

    /**
     * Track whether a catch was designated "lucky" or not.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcLuckyCatchHuntDetails(message, user, user_post, {render_data}) {
        if (message.caught) {
            return {
                is_lucky_catch: render_data.css_class.includes("luckycatchsuccess"),
            };
        }
    }

    /**
     * Track whether a FTC resulted in a pillage, and if so, the damage dealt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcPillageHuntDetails(message, user, user_post, {render_data}) {
        if (message.attracted && !message.caught && render_data.css_class.includes('catchfailuredamage')) {
            const match = render_data.text.match(/Additionally, .+ ([\d,]+) .*(gold|bait|points)/);
            if (match && match.length === 3) {
                return {
                    pillage_amount: parseInt(match[1].replace(/,/g,''), 10),
                    pillage_type: match[2],
                };
            }
        }
    }

    /**
     * Track additional state for the Bristle Woods Rift
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcBristleWoodsRiftHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestRiftBristleWoods;
        const details = {
            has_hourglass: quest.items.rift_hourglass_stat_item.quantity >= 1,
            chamber_status: quest.chamber_status,
            cleaver_status: quest.cleaver_status,
        };
        // Buffs & debuffs are 'active', 'removed', or ""
        for (const [key, value] of Object.entries(quest.status_effects)) {
            details[`effect_${key}`] = value === 'active';
        }

        if (quest.chamber_name === 'Acolyte') {
            details.obelisk_charged = quest.obelisk_percent === 100;
            details.acolyte_sand_drained = details.obelisk_charged && quest.acolyte_sand === 0;
        }
        return details;
    }

    /**
     * Track the poster type. Specific available mice require information from `treasuremap.php`.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcClawShotCityHuntDetails(message, user, user_post, hunt) {
        const map = user.quests.QuestRelicHunter.maps.filter(m => m.name.endsWith("Wanted Poster"))[0];
        if (map && !map.is_complete) {
            return {
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
    function calcFieryWarpathHuntDetails(message, user, user_post, hunt) {
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
                "desert_artillery",
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
            const boss = (message.stage === "Portal")
                ? attrs.mice.desert_artillery_commander
                : attrs.mice.desert_boss;
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

        return fw;
    }

    /**
     * Get the loot available for the hunt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
    function calcFloatingIslandsHuntDetails(message, user, user_post, hunt) {
        const envAttributes = user.environment_atts || user.enviroment_atts;
        const {island_loot} = envAttributes.hunting_site_atts;
        const lootItems = island_loot.reduce((prev, current) => Object.assign(prev, {
            [current.type]: current.quantity,
        }), {});

        return lootItems;
    }
     */

    /**
     * Categorize the available buffs that may be applied on the hunt, such as an active Tower's
     * auto-catch chance, or the innate ability to weaken all Weremice.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcFortRoxHuntDetails(message, user, user_post, hunt) {
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
        const tower_state = quest.tower_status.includes("inactive")
            ? 0
            : parseInt(quest.fort.t.level, 10);
        details.can_autocatch_any = (tower_state >= 2);

        return details;
    }

    /**
     * Report whether certain mice were attractable on the hunt.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcHarbourHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestHarbour;
        const details = {
            on_bounty: (quest.status === "searchStarted"),
        };
        quest.crew.forEach(mouse => {
            details[`has_caught_${mouse.type}`] = (mouse.status === "caught");
        });
        return details;
    }

    /**
     * Track the grub salt level
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcSandCryptsHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestSandDunes;
        if (quest && !quest.is_normal && quest.minigame && quest.minigame.type === 'grubling') {
            if (["King Grub", "King Scarab"].includes(message.mouse)) {
                return {
                    salt: quest.minigame.salt_charms_used,
                };
            }
        }
    }

    /**
     * Track the current volume if we're in an Encyclopedia
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcTableofContentsHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestTableOfContents;
        if (quest && quest.current_book.volume > 0) {
            return {
                volume: quest.current_book.volume,
            };
        }
    }

    /**
     * Report active augmentations and floor number
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcValourRiftHuntDetails(message, user, user_post, hunt) {
        const attrs = user.environment_atts || user.enviroment_atts;
        // active_augmentations is undefined outside of the tower
        if (attrs.state === "tower") {
            return {
                floor: attrs.floor, // exact floor number (can be used to derive prestige and floor_type)
                // No compelling use case for the following 3 augments at the moment
                // super_siphon: !!attrs.active_augmentations.ss, // active = true, inactive = false
                // string_stepping: !!attrs.active_augmentations.sste,
                // elixir_rain: !!attrs.active_augmentations.er,
            };
        }
    }

    /**
     * For Lactrodectus hunts, if MBW can be attracted (and is not guaranteed), record the rage state.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
    function calcWhiskerWoodsRiftHuntDetails(message, user, user_post, hunt) {
        if (message.cheese.id === 1646) {
            const zones = user.quests.QuestRiftWhiskerWoods.zones;
            const rage = {
                clearing: parseInt(zones.clearing.level, 10),
                tree: parseInt(zones.tree.level, 10),
                lagoon: parseInt(zones.lagoon.level, 10),
            };
            const total_rage = rage.clearing + rage.tree + rage.lagoon;
            if (total_rage < 150 && total_rage >= 75) {
                if (rage.clearing > 24 && rage.tree > 24 && rage.lagoon > 24) {
                    return Object.assign(rage, {total_rage});
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
    function calcZokorHuntDetails(message, user, user_post, hunt) {
        const quest = user.quests.QuestAncientCity;
        if (quest.boss.includes("hiddenDistrict")) {
            return {
                minotaur_label: quest.boss.replace(/hiddenDistrict/i, "").trim(),
                lair_catches: -(quest.countdown - 20),
                minotaur_meter: parseFloat(quest.width),
            };
        } else if (quest.district_tier === 3) {
            return {
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
    function calcZugzwangsTowerHuntDetails(message, user, user_post, hunt) {
        const attrs = user.viewing_atts;
        const zt = {
            amplifier: parseInt(attrs.zzt_amplifier, 10),
            technic: parseInt(attrs.zzt_tech_progress, 10),
            mystic: parseInt(attrs.zzt_mage_progress, 10),
        };
        zt.cm_available = (zt.technic === 16 || zt.mystic === 16) && message.cheese.id === 371;
        return zt;
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
                if (debug_logging) window.console.log(`MHCT: Looted "${item_name}", but it is not in user inventory`);
                return null;
            }
            const loot_object = {
                amount:      item_amount,
                lucky:       item_text.includes('class="lucky"'),
                id:          inventory[item_name].item_id,
                name:        inventory[item_name].name,
                plural_name: item_amount > 1 ? plural_name : '',
            };

            if (debug_logging) { window.console.log({message: "MHCT: Loot object", loot_object}); }

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
    getSettings(settings => {
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
                        if (settings.debug_logging) {
                            window.console.log({message: `MHCT: Crown query failed for snuid=${profile_snuid}`, err});
                        }
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

        let tempversion = "version " + mhhh_version;
        if (Number(mhhh_version) == 0) {
            tempversion = "TEST version";
        }
        window.console.log("MHCT: " + tempversion + " loaded! Good luck!");
    });
}());
