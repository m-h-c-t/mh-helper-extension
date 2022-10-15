import { IntakeMessage } from "../types/mhct";
import { IFilteredRule, RuleBase } from "./interfaces";

export class IntakeMessageSameCheese extends RuleBase<IntakeMessage> implements IFilteredRule<IntakeMessage> {
    readonly property = "cheese";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.cheese.name === post.cheese.name;
    }
}

export class IntakeMessageSameWeapon extends RuleBase<IntakeMessage> implements IFilteredRule<IntakeMessage> {
    readonly property = "trap";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.trap.name === post.trap.name;
    }
}

export class IntakeMessageSameBase extends RuleBase<IntakeMessage> implements IFilteredRule<IntakeMessage> {
    readonly property = "base";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.base.name === post.base.name;
    }
}

export class IntakeMessageSameLocation extends RuleBase<IntakeMessage> implements IFilteredRule<IntakeMessage> {
    readonly property = "location";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.location !== null && post.location !== null)
            && pre.location.name === post.location.name;
    }
}

export class IntakeMessageSameStage extends RuleBase<IntakeMessage> implements IFilteredRule<IntakeMessage> {
    readonly property = "stage";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        // Juggling check. Valid if both stages are undefined or null.
        if (pre.stage == null && post.stage == null) {
            return true;
        }

        // stage can be a object so just use stringify
        return JSON.stringify(pre.stage) === JSON.stringify(post.stage);
    }
}
