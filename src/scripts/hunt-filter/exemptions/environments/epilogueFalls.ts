import {IMessageExemption} from "@scripts/hunt-filter/interfaces";
import {IntakeMessage} from "@scripts/types/mhct";

/**
 * Stage exemptions for transitions between stages in Epilogue Falls.
 * Handles exemptions for all transitions between:
 * - Shore
 * - Rapids
 * - Waterfall
 * - Grotto
 */
export const epilogueFallsExemptions: IMessageExemption[] = [
    {
        description: "Epilogue Falls stage changes",
        property: "stage",

        getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
            if (pre.location?.name !== "Epilogue Falls" || post.location?.name !== "Epilogue Falls") {
                return null;
            }

            if (typeof pre.stage !== "string" || typeof post.stage !== "string") {
                return null;
            }

            // Valid stage transitions
            const validTransitions: Record<string, { next: string[], extraAllowed: (keyof IntakeMessage)[] }> = {
                "Shore": {next: [], extraAllowed: []},
                "Rapids": {next: ["Shore", "Waterfall"], extraAllowed: ["cheese"]},
                "Waterfall": {next: ["Shore", "Grotto"], extraAllowed: ["cheese"]},
                "Grotto": {next: ["Shore"], extraAllowed: ["cheese"]},
            };

            // Check if the transition is valid
            if (pre.stage !== post.stage) {
                const allowedTransitions = validTransitions[pre.stage];
                if (allowedTransitions?.next.includes(post.stage)) {
                    return ["stage", ...allowedTransitions.extraAllowed];
                }
            }

            return null;
        }
    }
];
