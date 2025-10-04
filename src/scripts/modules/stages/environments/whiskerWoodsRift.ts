import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';
import { parseHgInt } from '@scripts/util/number';

import { type IStager } from '../stages.types';

export class WhiskerWoodsRiftStager implements IStager {
    readonly environment: string = 'Whisker Woods Rift';

    /**
     * WWR stage reflects the zones' rage categories
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        if (!userPre.quests.QuestRiftWhiskerWoods) {
            throw new Error('QuestRiftWhiskerWoods is undefined');
        }

        const zones = userPre.quests.QuestRiftWhiskerWoods.zones;
        const clearing = parseHgInt(zones.clearing.level);
        const tree = parseHgInt(zones.tree.level);
        const lagoon = parseHgInt(zones.lagoon.level);

        const rage: {
            clearing?: string;
            tree?: string;
            lagoon?: string;
        } = {};

        if (0 <= clearing && clearing <= 24) {
            rage.clearing = 'CC 0-24';
        } else if (25 <= clearing && clearing <= 49) {
            rage.clearing = 'CC 25-49';
        } else if (clearing === 50) {
            rage.clearing = 'CC 50';
        }

        if (0 <= tree && tree <= 24) {
            rage.tree = 'GGT 0-24';
        } else if (25 <= tree && tree <= 49) {
            rage.tree = 'GGT 25-49';
        } else if (tree === 50) {
            rage.tree = 'GGT 50';
        }

        if (0 <= lagoon && lagoon <= 24) {
            rage.lagoon = 'DL 0-24';
        } else if (25 <= lagoon && lagoon <= 49) {
            rage.lagoon = 'DL 25-49';
        } else if (lagoon === 50) {
            rage.lagoon = 'DL 50';
        }

        if (!rage.clearing || !rage.tree || !rage.lagoon) {
            throw new Error('Unexpected WWR quest state');
        } else {
            message.stage = rage;
        }
    }
}
