import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class BountifulBeanstalkStager implements IStager {
    readonly environment: string = 'Bountiful Beanstalk';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestBountifulBeanstalk;

        if (!quest) {
            throw new Error('QuestBountifulBeanstalk is undefined');
        }

        if (quest.in_castle) {
            const castle = quest.castle;

            // Good Test Name Floor => Good Test Name
            let floor = castle.current_floor.name
                .replace(/\sFloor$/, '');

            // Extreme Mystery Room -> Mystery
            const room = castle.current_room.name
                .replace(/^(Standard|Super|Extreme|Ultimate)/, '')
                .replace(/(Bean )?Room$/, '')
                .trim();

            if (castle.is_boss_encounter) {
                floor += ' Giant';
            }

            message.stage = `${floor} - ${room}`;
        } else {
            message.stage = 'Beanstalk';

            if (quest.beanstalk.is_boss_encounter) {
                message.stage = 'Beanstalk Boss';
            }
        }
    }
}
