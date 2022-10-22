import { IntakeMessage } from "../types/mhct";
import { IPropertyRule, RuleBase } from "./interfaces";

class IntakeMessageSameCheese extends RuleBase<IntakeMessage> implements IPropertyRule<IntakeMessage> {
    readonly property = "cheese";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.cheese.name === post.cheese.name;
    }
}

class IntakeMessageSameWeapon extends RuleBase<IntakeMessage> implements IPropertyRule<IntakeMessage> {
    readonly property = "trap";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.trap.name === post.trap.name;
    }
}

class IntakeMessageSameBase extends RuleBase<IntakeMessage> implements IPropertyRule<IntakeMessage> {
    readonly property = "base";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.base.name === post.base.name;
    }
}

class IntakeMessageSameLocation extends RuleBase<IntakeMessage> implements IPropertyRule<IntakeMessage> {
    readonly property = "location";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.location !== null && post.location !== null)
            && pre.location.name === post.location.name;
    }
}

class IntakeMessageSameStage extends RuleBase<IntakeMessage> implements IPropertyRule<IntakeMessage> {
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

export const MessageRules: IPropertyRule<IntakeMessage>[] = [
    new IntakeMessageSameCheese,
    new IntakeMessageSameWeapon,
    new IntakeMessageSameBase,
    new IntakeMessageSameLocation,
    new IntakeMessageSameStage,
]
