import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IStager } from '../stages.types';

export class DraconicDepthsStager implements IStager {
    readonly environment: string = 'Draconic Depths';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestDraconicDepths;

        if (!quest) {
            throw new Error('QuestDraconicDepths is undefined');
        }

        if (quest.in_cavern) {
            const category = quest.cavern.category.charAt(0).toUpperCase() + quest.cavern.category.slice(1);

            const currentTier = quest.cavern.loot_tier.current_tier;
            const lootTiers = quest.cavern.loot_tier.tier_data;

            // if we're not at the last tier (currentTier is one indexed), then we need a range '0-99'
            // which consists of the current tier threshold and the next tier threshold - 1
            // otherwise, we just need the a number '750+'
            let range: string;
            if (currentTier < lootTiers.length) {
                range = `${lootTiers[currentTier - 1].threshold}-${lootTiers[currentTier].threshold - 1}`;
            } else {
                range = `${lootTiers[currentTier - 1].threshold}+`;
            }

            if (quest.cavern.type === 'elemental_dragon_den') {
                message.stage = `Cavern: Elemental ${range}`;
            } else {
                message.stage = `Cavern: ${category} ${range}`;
            }
        } else {
            message.stage = 'Crucible Forge';
        }
    }
}
