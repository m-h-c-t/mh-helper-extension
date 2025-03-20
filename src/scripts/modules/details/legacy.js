/**
     * Record the Cannon state and whether the hunt was taken in a stockpile location.
     * @param {Object <string, any>} message The message to be sent.
     * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
     * @param {Object <string, any>} user_post The user state object, after the hunt.
     * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
     */
export function calcHalloweenHuntDetails(message, user, user_post, hunt) {
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
export function calcLNYHuntDetails(message, user, user_post, hunt) {
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
export function calcLuckyCatchHuntDetails(message, user, user_post, {render_data}) {
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
export function calcPillageHuntDetails(message, user, user_post, {render_data}) {
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
export function calcBristleWoodsRiftHuntDetails(message, user, user_post, hunt) {
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
 * Log the mouse populations, remaining total, boss invincibility, and streak data.
 * MAYBE: Record usage of FW charms, e.g. "targeted mouse was attracted"
 * charm_ids 534: Archer, 535: Cavalry, 536: Commander, 537: Mage, 538: Scout, 539: Warrior
 *   540: S Archer, 541: S Cavalry, 542: S Mage, 543: S Scout, 544: S Warrior, 615: S Commander
 * @param {Object <string, any>} message The message to be sent.
 * @param {Object <string, any>} user The user state object, when the hunt was invoked (pre-hunt).
 * @param {Object <string, any>} user_post The user state object, after the hunt.
 * @param {Object <string, any>} hunt The journal entry corresponding to the active hunt.
 */
export function calcFieryWarpathHuntDetails(message, user, user_post, hunt) {
    const attrs = user.viewing_atts.desert_warpath;
    const fw = {};
    if ([1, 2, 3].includes(parseInt(attrs.wave, 10))) {
        const asType = name => name.replace(/desert_|_weak|_epic|_strong/g, "");

        if (attrs.streak_quantity > 0) {
            fw.streak_count = parseInt(attrs.streak_quantity, 10);
            fw.streak_type = asType(attrs.streak_type);
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
        //logger.debug("Skipping due to unknown FW wave", {record: message, user, user_post, hunt});
        throw new Error(`Unknown FW Wave "${attrs.wave}"`);
    }

    return fw;
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
