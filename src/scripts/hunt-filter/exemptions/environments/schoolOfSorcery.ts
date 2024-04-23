import type {IMessageExemption} from "@scripts/hunt-filter/interfaces";
import type {IntakeMessage} from "@scripts/types/mhct";

/**
 * Allow transitions from Boss stages to course stages or hallway
 */
class CourseBossExemption implements IMessageExemption {
    readonly description = "School of Sorcery Boss Encounter";
    readonly property = "stage";

    readonly CourseBossStagesToMouse: Record<string, string | undefined> = {
        'Arcane Arts Boss': 'Arcane Master Sorcerer' ,
        'Shadow Sciences Boss': 'Shadow Master Sorcerer' ,
        'Final Exam Boss': 'Mythical Master Sorcerer',
    };

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {

        // Only allow transitions from boss to outside for now
        if (this.isTransitionFromBossToHallway(pre.stage, post.stage, pre.mouse)) {
            return ['stage', 'cheese'];
        }

        if (this.isTransitionFromBossToCourse(pre.stage, post.stage, pre.mouse)) {
            return ['stage'];
        }

        return null;
    }

    private isTransitionFromBossToHallway(preStage: unknown, postStage: unknown, mouse: unknown) {
        return this.isCourseStageAndBoss(preStage, mouse)
            && this.isHallwayStage(postStage);
    }

    private isTransitionFromBossToCourse(preStage: unknown, postStage: unknown, mouse: unknown) {
        return this.isCourseStageAndBoss(preStage, mouse)
            && this.isCourseStage(postStage);
    }

    /** Check if stage is a known boss stage that matches associated mouse */
    private isCourseStageAndBoss(stage: unknown, mouse: unknown) {
        if (typeof stage === 'string') {
            return this.CourseBossStagesToMouse[stage] === mouse;
        }

        return false;
    }

    private isCourseStage(stage: unknown) {
        return stage === 'Arcane Arts'
            || stage === 'Shadow Sciences'
            || stage === 'Final Exam - Arcane'
            || stage === 'Final Exam - Shadow';
    }

    private isHallwayStage(stage: unknown) {
        return stage === 'Hallway';
    }
}

export const schoolOfSorceryExemptions = [
    new CourseBossExemption(),
];
