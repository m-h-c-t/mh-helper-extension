import {User, JournalMarkup} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {IEnvironmentDetailer} from "../details.types";

/**
 * Detailer for the Epilogue Falls environment.
 *
 * Current Details:
 * zone_quality: string - The quality of the current rapids zone (from name, e.g. "Sparse", "Common" or "Abundant")
 */
export class EpilogueFallsDetailer implements IEnvironmentDetailer {
    readonly environment = "Epilogue Falls";

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): object | undefined {
        const quest = userPre.quests.QuestEpilogueFalls;
        if (!quest?.on_rapids) {
            return;
        }

        const qualityMatch = /^(Sparse|Common|Abundant)/.exec(quest.rapids.zone_data.name);
        if (qualityMatch) {
            return {
                zone_quality: qualityMatch[1],
            };
        }
    }
}
