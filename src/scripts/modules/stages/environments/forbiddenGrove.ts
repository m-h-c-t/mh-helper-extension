import type {User} from '@scripts/types/hg';
import type {IStager} from '../stages.types';

export class ForbiddenGroveStager implements IStager {
    readonly environment: string = 'Forbidden Grove';

    /**
     * Report the state of the door to the Realm. The user may be auto-traveled by this hunt, either
     * due to the use of a Ripper charm while the door is open, or because the door is closed at the time
     * of the hunt itself. If the door closes between the time HG computes the prehunt user object and when
     * HG receives the hunt request, we should reject logging the hunt.
     */
    addStage(message: any, userPre: User, userPost: User, journal: any): void {
        const preQuest = userPre.quests.QuestForbiddenGrove;
        const postQuest = userPost.quests.QuestForbiddenGrove;

        if (preQuest == null) {
            throw new Error('User is missing Forbidden Grove quest');
        }

        if (userPre.trinket_name === "Realm Ripper Charm") {
            message.stage = "Realm Ripper Charm";
            return;
        }

        const was_open = preQuest.grove.is_open;
        // Check if user was auto-traveled to AR (i.e FG quest will be undefined on post).
        // If they were, we can say door was closed for hunt.
        if (postQuest == null) {
            message.stage = "Closed";
            return;
        // Otherwise discard if doors dont match
        } else if (was_open != postQuest.grove.is_open) {
            throw new Error('Skipping hunt during server side door change');
        }

        message.stage = was_open ? "Open" : "Closed";
    }
}
