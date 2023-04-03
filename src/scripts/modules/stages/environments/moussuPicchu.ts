import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class MoussuPicchuStager implements IStager {
    readonly environment: string = 'Moussu Picchu';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        if (!userPre.quests.QuestMoussuPicchu) {
            throw new Error('QuestMoussuPicchu is undefined');
        }

        const elements = userPre.quests.QuestMoussuPicchu.elements;
        message.stage = {
            rain: `Rain ${elements.rain.level}`,
            wind: `Wind ${elements.wind.level}`,
        };
    }
}
