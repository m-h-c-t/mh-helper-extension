/**
 * Track the poster type. Specific available mice require information from `treasuremap.php`.
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function calcClawShotCityHuntDetails(message, user, user_post, hunt) {
    const map = user.quests.QuestRelicHunter.maps.filter(m => m.name.endsWith("Wanted Poster"))[0];
    if (map && !map.is_complete) {
        return {
            poster_type: map.name.replace(/Wanted Poster/i, "").trim(),
            at_boss: (map.remaining === 1),
        };
    }
}

/**
 * Categorize the available buffs that may be applied on the hunt, such as an active Tower's
 * auto-catch chance, or the innate ability to weaken all Weremice.
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function calcFortRoxHuntDetails(message, user, user_post, hunt) {
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
export function calcHarbourHuntDetails(message, user, user_post, hunt) {
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
export function calcSandCryptsHuntDetails(message, user, user_post, hunt) {
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
export function calcTableofContentsHuntDetails(message, user, user_post, hunt) {
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
export function calcValourRiftHuntDetails(message, user, user_post, hunt) {
    const attrs = user.quests.QuestRiftValour;
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
export function calcWhiskerWoodsRiftHuntDetails(message, user, user_post, hunt) {
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
export function calcZokorHuntDetails(message, user, user_post, hunt) {
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
export function calcZugzwangsTowerHuntDetails(message, user, user_post, hunt) {
    const attrs = user.viewing_atts;
    const zt = {
        amplifier: parseInt(attrs.zzt_amplifier, 10),
        technic: parseInt(attrs.zzt_tech_progress, 10),
        mystic: parseInt(attrs.zzt_mage_progress, 10),
    };
    zt.cm_available = (zt.technic === 16 || zt.mystic === 16) && message.cheese.id === 371;
    return zt;
}
