import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class BountifulBeanstalkStager implements IStager {
    readonly environment: string = 'Bountiful Beanstalk';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestBountifulBeanstalk;

        if (!quest) {
            throw new Error('QuestBountifulBeanstalk is undefined');
        }

    }
}
