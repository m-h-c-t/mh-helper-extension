import type {IStager} from '../stages.types';
import type {User} from '@scripts/types/hg';
import type {IntakeMessage} from '@scripts/types/mhct';
import type {RoomType} from '@scripts/types/hg/quests';

export class SuperBrieFactoryStager implements IStager {
    readonly environment: string = 'SUPER|brie+ Factory';

    readonly roomTypeToStage: Record<RoomType, string> = {
        "pumping_room":           "Pump Room",
        "mixing_room":            "Mixing Room",
        "break_room":             "Break Room",
        "quality_assurance_room": "QA Room",
    };

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestSuperBrieFactory;

        if (quest == null) {
            throw new Error('User is in SB+ factory but quest wasn\'t found.');
        }

        if (quest.factory_atts.boss_warning === true) {
            message.stage = "Boss";
        } else {
            message.stage = this.roomTypeToStage[quest.factory_atts.current_room];
            if (!message.stage || !/Coggy Colby/.test(userPre.bait_name) ) {
                message.stage = "Any Room";
            }
        }
    }
}
