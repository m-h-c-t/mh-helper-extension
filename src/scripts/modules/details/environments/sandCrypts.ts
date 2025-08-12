import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IEnvironmentDetailer} from '../details.types';
import type {IntakeMessage} from '@scripts/types/mhct';

export class SandCryptsDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Sand Crypts';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestSandDunes;

        // Track the grub salt level
        if (!quest || quest.is_normal || !quest.minigame || quest.minigame.type !== 'grubling') {
            return;
        }

        if (["King Grub", "King Scarab"].includes(message.mouse)) {
            return {
                salt: quest.minigame.salt_charms_used,
            };
        }
    }
}
