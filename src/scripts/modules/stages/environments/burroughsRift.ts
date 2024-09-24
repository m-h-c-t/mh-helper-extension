import {type User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {MistTier, MistTiers} from '@scripts/types/hg/quests';
import {type IStager} from '../stages.types';

export class BurroughsRiftStager implements IStager {
    readonly environment: string = 'Burroughs Rift';

    readonly tierToStage: Record<MistTier, string> = {
        'tier_0': 'Mist 0',
        'tier_1': 'Mist 1-5',
        'tier_2': 'Mist 6-18',
        'tier_3': 'Mist 19-20',
    };

    /**
     * Report the misting state
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestRiftBurroughs;

        if (!quest) {
            throw new Error('QuestRiftBurroughs is undefined');
        }

        if (!this.isValidMistTier(quest.mist_tier)) {
            throw new Error('Skipping unknown Burroughs Rift mist state');
        }

        message.stage = this.tierToStage[quest.mist_tier];
    }

    private isValidMistTier(value: unknown): value is MistTier {
        return typeof value === 'string' && MistTiers.includes(value as MistTier);
    }
}
