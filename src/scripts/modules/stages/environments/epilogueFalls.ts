import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import type {IStager} from "../stages.types";

/**
 * Stager for Epilogue Falls environment.
 * Stages: Shore, Rapids, Waterfall, Grotto
 */
export class EpilogueFallsStager implements IStager {
    readonly environment = "Epilogue Falls";

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestEpilogueFalls;

        if (!quest) {
            throw new Error("QuestEpilogueFalls is undefined");
        }

        if (!quest.on_rapids) {
            message.stage = "Shore";
            return;
        }

        const zoneType = quest.rapids.zone_data.type;
        if (zoneType === "waterfall_zone") {
            message.stage = "Waterfall";
        } else if (zoneType === "grotto_zone") {
            message.stage = "Grotto";
        } else {
            message.stage = "Rapids";
        }
    }
}
