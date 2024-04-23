import type {IMessageExemption} from "@scripts/hunt-filter/interfaces";
import type {IntakeMessage} from "@scripts/types/mhct";

/**
 * Provides an exemption on the 'cheese' difference when cheese runs out.
 */
class OutOfCheeseExemption implements IMessageExemption {
    readonly description = "Ran out of cheese";
    readonly property = "cheese";

    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (
            pre.cheese.id > 0 &&
            post.cheese.id == 0
        ) {
            return ["cheese"];
        }

        return null;
    }
}

/**
 * Provides an exemption on the 'charm' difference when charms run out.
 */
class OutOfCharmsExemption implements IMessageExemption {
    readonly description = "Ran out of cheese";
    readonly property = "charm";

    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (
            (pre.charm?.id ?? 0) > 0 &&
            post.charm?.id === 0
        ) {
            return ["charm"];
        }

        return null;
    }
}

export const globalExemptions = [
    new OutOfCheeseExemption(),
    new OutOfCharmsExemption(),
];
