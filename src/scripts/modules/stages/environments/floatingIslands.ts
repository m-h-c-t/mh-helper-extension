import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IslandModType} from '@scripts/types/quests/floatingIslands';
import {type IStager} from '../stages.types';

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

        message.stage = hsa.island_name;

        const numActivePirates = getCountOfActiveModType('sky_pirates');
        const numActiveLootCaches = getCountOfActiveModType('loot_cache');
        const pirateStages = ["No Pirates", "Pirates x1", "Pirates x2", "Pirates x3", "Pirates x4"];

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
        else if (userPre.bait_name === "Sky Pirate Swiss Cheese") {
            message.stage = hsa.is_vault_island ? "Vault " : "Island ";
            message.stage += pirateStages[numActivePirates];
        }
        else if (((userPre.bait_name === "Extra Rich Cloud Cheesecake") || (userPre.bait_name === "Cloud Cheesecake")) &&
                 (numActiveLootCaches >= 2)) {
            message.stage += ` - Loot x${numActiveLootCaches}`;
        }
        // If a vault run has 3 or more active mods of the same type, add it to the stage name
        else if (hsa.is_vault_island && Array.isArray(hsa.activated_island_mod_types)) {
            // Takes an array of items, and returns a Map with the
            // counts of each item in the array.
            const panels: {[index: string]: number} = {};
            hsa.activated_island_mod_types.forEach(t => t in panels ? panels[t]++ : panels[t] = 1);

            for (const [islandType, count] of Object.entries(panels)) {
                if (count < 3) {
                    continue;
                }

                const mod_type = hsa.island_mod_panels.find(p => p.type === islandType)?.name;
                message.stage += ` ${count}x ${mod_type}`;
            }
        }
    }
}
