import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IslandModType} from '@scripts/types/hg/quests/floatingIslands';
import {type IStager} from '../stages.types';

// See floatingIslands.spec.ts for docs about all stage names

export class FloatingIslandsStager implements IStager {
    readonly environment: string = 'Floating Islands';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestFloatingIslands;

        if (!quest) {
            throw new Error('QuestFloatingIslands is undefined');
        }

        const hsa = quest.hunting_site_atts;
        const getCountOfActiveModType = (type: IslandModType): number => {
            return hsa.activated_island_mod_types.filter(t => t == type).length;
        };

        const matcher = hsa.island_name.match(/^(Launch Pad|\w+).*$/);
        if (!matcher) {
            throw new Error('Failed to match Floating Island\'s island name.');
        }

        const powerType = matcher[1];

        if (hsa.is_low_tier_island) {
            message.stage = `${powerType} Low`;
        } else if (hsa.is_high_tier_island) {
            message.stage = `${powerType} High`;
        } else if (hsa.is_vault_island) {
            message.stage = `${powerType} Palace`;
        } else if (powerType == "Launch Pad") {
            message.stage = 'Launch Pad';
        } else {
            throw new Error('Unknown Floating Island stage');
        }

        const numActiveLootCaches = getCountOfActiveModType('loot_cache');

        if (hsa.is_enemy_encounter) {
            if (hsa.is_low_tier_island)
                message.stage = "Warden";
            else if (hsa.is_high_tier_island)
                message.stage = `${powerType} Paragon`;
            else if (hsa.is_vault_island)
                message.stage = "Empress";
            else
                message.stage += " Enemy Encounter";
        }
        else if (userPre.bait_name === "Sky Pirate Swiss Cheese") {
            const numActivePirates = getCountOfActiveModType('sky_pirates');
            message.stage = hsa.is_vault_island ? "Palace" : "Low|High";
            message.stage += ` - ${numActivePirates}x Pirates`;
        }
        else if (userPre.bait_name?.endsWith("Cloud Cheesecake") && numActiveLootCaches >= 2) {
            message.stage += ` - ${numActiveLootCaches}x Loot`;
        }
        // If a vault run has 3 or more active mods of the same type, add it to the stage name
        else if (hsa.is_vault_island && Array.isArray(hsa.activated_island_mod_types)) {
            // Takes an array of items, and returns a Map with the
            // counts of each item in the array.
            const panels: Record<string, number> = {};
            hsa.activated_island_mod_types.forEach(t => t in panels ? panels[t]++ : panels[t] = 1);

            for (const [islandType, count] of Object.entries(panels)) {
                if (count < 3) {
                    continue;
                }

                let mod_type = hsa.island_mod_panels.find(p => p.type === islandType)?.name;

                if (mod_type == null) {
                    throw new Error('The active island type could not be found in current island panels (this shouldn\'t be possible).');
                }

                const shortMod: Record<string, string> = {
                    'Ancient Jade Stockpile': 'Jade',
                    'Empyrean Seal Stowage': 'Emp Seal',
                    'Ore and Glass Deposit': 'Glass + Ore',
                    'Sky Pirate Den': 'Pirates',
                };

                if (shortMod[mod_type]) {
                    mod_type = shortMod[mod_type];
                }

                message.stage += ` - ${count}x ${mod_type}`;
            }
        }
    }
}
