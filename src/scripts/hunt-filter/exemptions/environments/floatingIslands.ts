import type {IMessageExemption} from "@scripts/hunt-filter/interfaces";
import type {IntakeMessage} from "@scripts/types/mhct";

class EnemyEncounterExemption implements IMessageExemption {
    readonly description = "Transition involving enemy encounter (boss)";
    readonly property = "stage";
    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (
            this.isTransitionToBoss(pre.stage, post.stage, pre.mouse) ||
            this.isTransitionFromBoss(pre.stage, post.stage, pre.mouse)
        ) {
            return ["stage"];
        }

        return null;
    }

    /** Returns true if the post stage is known boss stage and the mouse is any BUT a boss */
    private isTransitionToBoss(preStage: unknown, postStage: unknown, mouse: unknown) {
        return this.isBossStage(postStage) && !this.isBossMouse(mouse);
    }

    /** Returns true if the pre stage is known boss stage and the mouse is only a boss */
    private isTransitionFromBoss(preStage: unknown, postStage: unknown, mouse: unknown) {
        return this.isBossStage(preStage) && this.isBossMouse(mouse);
    }

    private isBossStage(stage: unknown): boolean {
        if (typeof stage !== 'string') {
            return false;
        }

        return stage === 'Empress' ||
            stage === 'Warden' ||
            stage.endsWith('Paragon');
    }

    private isBossMouse(mouse: unknown): boolean {
        if (typeof mouse !== 'string') {
            return false;
        }

        return mouse === 'Empyrean Empress' ||
            mouse.startsWith("Paragon of") ||
            mouse.startsWith("Warden of");
    }
}

export const floatingIslandsExemptions = [
    new EnemyEncounterExemption(),
];
