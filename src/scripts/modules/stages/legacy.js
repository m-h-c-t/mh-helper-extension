/**
 * Set the stage based on decoration and boss status.
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function addFestiveCometStage(message, user, user_post, hunt) {
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
 * WWR stage reflects the zones' rage categories
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function addWhiskerWoodsRiftStage(message, user, user_post, hunt) {
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
        message.location = null;
    } else {
        message.stage = rage;
    }
}

/**
}

/**
 * Read the viewing attributes to determine the season. Reject hunts where the season changed.
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function addSeasonalGardenStage(message, user, user_post, hunt) {
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
                message.stage = "Spring";
                break;
        }
    } else {
        message.location = null;
    }
}

/**
 * Report the current distance / obstacle.
 * TODO: Stage / hunt details for first & second icewing hunting?
 * @param {import("@scripts/types/mhct").IntakeMessage} message The message to be sent.
 * @param {import("@scripts/types/hg").User} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {import("@scripts/types/hg").User} user_post The user state object, after the hunt.
 * @param {unknown} hunt The journal entry corresponding to the active hunt.
 */
export function addIcebergStage(message, user, user_post, hunt) {
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
        message.location = null;
    }
}

/**
 * Report the zone and depth, if any.
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function addSunkenCityStage(message, user, user_post, hunt) {
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
 * Report the pagoda / battery charge information.
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function addFuromaRiftStage(message, user, user_post, hunt) {
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
export function addToxicSpillStage(message, user, user_post, hunt) {
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
export function addBurroughsRiftStage(message, user, user_post, hunt) {
    const quest = user.quests.QuestRiftBurroughs;
    message.stage = (({
        "tier_0": "Mist 0",
        "tier_1": "Mist 1-5",
        "tier_2": "Mist 6-18",
        "tier_3": "Mist 19-20",
    })[quest.mist_tier]);
    if (!message.stage) {
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
export function addTrainStage(message, user, user_post, hunt) {
    const quest = user.quests.QuestTrainStation;
    const final_quest = user_post.quests.QuestTrainStation;
    // First check that the user is still in the same stage.
    const changed_state = (quest.on_train !== final_quest.on_train
        || quest.current_phase !== final_quest.current_phase);
    if (changed_state) {
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
            if (quest.minigame?.trouble_area) {
            // Raider River has an additional server-side state change.
                const area = quest.minigame.trouble_area;
                const final_area = final_quest.minigame.trouble_area;
                if (area !== final_area) {
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
export function addForewordFarmStage(message, user, user_post, hunt) {
    const quest = user.quests.QuestForewordFarm;
    if (quest?.mice_state && typeof quest.mice_state === "string") {
        message.stage = quest.mice_state.split('_').map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
    }
}

/**
/**
 * Report tower stage: Outside, Eclipse, Floors 1-7, 9-15, 17-23, 25-31+, Umbra
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function addValourRiftStage(message, user, user_post, hunt) {
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
            message.location = null;
            break;
    }
}
