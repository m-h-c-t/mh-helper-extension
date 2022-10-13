import { IntakeMessage } from "../types/mhct";
import { IFilteredRule } from "./engine";


export class IntakeMessageSameCheese implements IFilteredRule<IntakeMessage> {
    readonly property = "cheese";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.cheese.name === post.cheese.name;
    }
}

export class IntakeMessageSameWeapon implements IFilteredRule<IntakeMessage> {
    readonly property = "trap";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.trap.name === post.trap.name;
    }
}

export class IntakeMessageSameBase implements IFilteredRule<IntakeMessage> {
    readonly property = "base";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.base.name === post.base.name;
    }
}

export class IntakeMessageSameLocation implements IFilteredRule<IntakeMessage> {
    readonly property = "location";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.location !== null && post.location !== null)
            && pre.location.name === post.location.name;
    }
}

export class IntakeMessageSameStage implements IFilteredRule<IntakeMessage> {
    readonly property = "stage";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.stage || post.stage) && pre.stage === post.stage;
    }
}
