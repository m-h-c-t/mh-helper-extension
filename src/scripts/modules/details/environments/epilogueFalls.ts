import {User, JournalMarkup} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {IEnvironmentDetailer} from "../details.types";

/**
 * Detailer for the Epilogue Falls environment.
 *
 * Current Details:
 * zone: string - The rapid zone the user is currently in (e.g. "Sparse Morsel")
 */
export class EpilogueFallsDetailer implements IEnvironmentDetailer {
    readonly environment = "Epilogue Falls";

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): object | undefined {

        const quest = userPre.quests.QuestEpilogueFalls;
        if (quest == null) {
            return;
        }

        if (!quest.on_rapids) {
            return;
        }

        return {
            zone: quest.rapids.zone_data.name.replace(" Zone", ""),
        };

    }
}
