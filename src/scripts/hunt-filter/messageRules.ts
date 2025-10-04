import type { IntakeMessage } from '../types/mhct';
import type { IPropertyRule } from './interfaces';

class IntakeMessageSameCheese implements IPropertyRule<IntakeMessage> {
    readonly description = 'Cheese should not change';
    readonly property = 'cheese';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.cheese.name === post.cheese.name;
    }
}

class IntakeMessageSameWeapon implements IPropertyRule<IntakeMessage> {
    readonly description = 'Trap should not change';
    readonly property = 'trap';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.trap.name === post.trap.name;
    }
}

class IntakeMessageSameCharm implements IPropertyRule<IntakeMessage> {
    readonly description = 'Charm should not change';
    readonly property = 'charm';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.charm != null && post.charm !== null)
            && pre.charm.name === post.charm.name;
    }
}

class IntakeMessageSameBase implements IPropertyRule<IntakeMessage> {
    readonly description = 'Base should not change';
    readonly property = 'base';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.base.name === post.base.name;
    }
}

class IntakeMessageSameLocation implements IPropertyRule<IntakeMessage> {
    readonly description = 'Location should not change';
    readonly property = 'location';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.location !== null && post.location !== null)
            && pre.location.name === post.location.name;
    }
}

class IntakeMessageSameStage implements IPropertyRule<IntakeMessage> {
    readonly description = 'Stage should not change';
    readonly property = 'stage';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        // Juggling check. Valid if both stages are undefined or null.
        if (pre.stage == null && post.stage == null) {
            return true;
        }

        // stage can be a object so just use stringify
        return JSON.stringify(pre.stage) === JSON.stringify(post.stage);
    }
}

class IntakeMessageSameAuras implements IPropertyRule<IntakeMessage> {
    readonly description = 'Auras should not change';
    readonly property = 'auras';
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        if (pre.auras == null && post.auras == null) {
            return true;
        }

        if ((pre.auras == null) !== (post.auras == null)) {
            return false;
        }

        // Compare array lengths
        if (pre.auras!.length !== post.auras!.length) {
            return false;
        }

        return pre.auras!.every(aura => post.auras!.includes(aura))
            && post.auras!.every(aura => pre.auras!.includes(aura));
    }
}

export const MessageRules: IPropertyRule<IntakeMessage>[] = [
    new IntakeMessageSameCheese(),
    new IntakeMessageSameWeapon(),
    new IntakeMessageSameCharm(),
    new IntakeMessageSameBase(),
    new IntakeMessageSameLocation(),
    new IntakeMessageSameStage(),
    new IntakeMessageSameAuras(),
];
