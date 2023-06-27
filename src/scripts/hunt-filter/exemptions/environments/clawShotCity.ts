import type {IMessageExemption} from "@scripts/hunt-filter/interfaces";
import type {IntakeMessage} from "@scripts/types/mhct";

class BountyHunterExemption implements IMessageExemption {
    readonly description = "Bounty Hunter caught in Claw Shot City";
    readonly property = "stage";
    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (
            pre.stage === "No poster" &&
            post.stage === "Has poster" &&
            pre.mouse === "Bounty Hunter"
        ) {
            return ["stage"];
        }

        return null;
    }
}

export const clawShotCityExemptions = [
    new BountyHunterExemption(),
];
