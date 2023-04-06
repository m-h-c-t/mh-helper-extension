import {type User} from '@scripts/types/hg';
import {type IEnvironmentDetailer} from '../details.types';
import {type QuestIceFortress} from '@scripts/types/quests/iceFortress';

export class IceFortressDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Ice Fortress';

    addDetails(message: any, userPre: User, userPost: User, journal: any): {} | undefined {
        const quest: QuestIceFortress | undefined = userPost.quests.QuestIceFortress;

        if (quest == null) {
            return;
        }

    }
}
