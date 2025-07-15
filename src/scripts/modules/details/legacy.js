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
