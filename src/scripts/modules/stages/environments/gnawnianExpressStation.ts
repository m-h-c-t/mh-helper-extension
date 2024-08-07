import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {TroubleArea, type BoardingPhase} from '@scripts/types/hg/quests/gnawnianExpressStation';
import {type IStager} from '../stages.types';

export class GnawnianExpressStationStager implements IStager {
    readonly environment: string = 'Gnawnian Express Station';

    /**
     * Report on the unique minigames in each sub-location. Reject hunts for which the train
     * moved / updated / departed, as the hunt stage is ambiguous.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestTrainStation;
        const final_quest = userPost.quests.QuestTrainStation;

        if (!quest || !final_quest) {
            throw new Error('QuestTrainStation is undefined');
        }

        if (quest.on_train !== final_quest.on_train) {
            throw new Error('Skipping hunt due to server-side train stage change');
        }


        // Pre- & post-hunt user object agree on train & phase statuses.
        if (!quest.on_train || !final_quest.on_train) {
            message.stage = 'Station';
            return;
        }

        if (quest.current_phase !== final_quest.current_phase) {
            throw new Error('Skipping hunt due to server-side train stage change');
        }

        if (quest.current_phase === 'supplies') {
            let stage = '1. Supply Depot';
            if (quest.minigame && quest.minigame.supply_hoarder_turns > 0) {
                // More than 0 (aka 1-5) Hoarder turns means a Supply Rush is active
                stage += ' - Rush';
            } else {
                stage += ' - No Rush';
                if (userPre.trinket_name === 'Supply Schedule Charm') {
                    stage += ' + SS Charm';
                }
            }
            message.stage = stage;
        } else if (quest.current_phase === 'boarding') {
            let stage = '2. Raider River';
            // Raider River has an additional server-side state change.
            const area = quest.minigame.trouble_area;
            const final_area = (final_quest as BoardingPhase).minigame.trouble_area;

            if (area !== final_area) {
                throw new Error('Skipping hunt during server-side trouble area change');
            }

            const charm_id = message.charm?.id ?? -1;
            const area_to_charm: Record<TroubleArea, number> = {
                'door': 1210,
                'rails': 1211,
                'roof': 1212,
            };
            const has_correct_charm = area_to_charm[area] === charm_id;
            if (has_correct_charm) {
                stage += ' - Defending Target';
            } else if ([1210, 1211, 1212].includes(charm_id)) {
                stage += ' - Defending Other';
            } else {
                stage += ' - Not Defending';
            }
            message.stage = stage;
        } else if (quest.current_phase === 'bridge_jump') {
            let stage = '3. Daredevil Canyon';
            if (userPre.trinket_name === 'Magmatic Crystal Charm') {
                stage += ' - Magmatic Crystal';
            } else if (userPre.trinket_name === 'Black Powder Charm') {
                stage += ' - Black Powder';
            } else if (userPre.trinket_name === 'Dusty Coal Charm') {
                stage += ' - Dusty Coal';
            } else {
                stage += ' - No Fuelers';
            }
            message.stage = stage;
        }
    }
}
