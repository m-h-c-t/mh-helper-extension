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

