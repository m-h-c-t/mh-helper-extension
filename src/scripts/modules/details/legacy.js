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
