import type {IMessageExemption} from "@scripts/hunt-filter/interfaces";
import type {IntakeMessage} from "@scripts/types/mhct";

// TODO: Use the beanstalk stager to generate stages

/**
 * Allow transitions between Beanstalk and Beanstalk Boss
 */
class BeanstalkBossExemption implements IMessageExemption {
    readonly description = "Beanstalk Boss encounter";
    readonly property = "stage";

    readonly BeanstalkMice: string[] = [
        "Budrich Thornborn",
        "Leafton Beanwell",
    ];
    readonly BeanstalkBossMouse = "Vinneus Stalkhome";

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

    private isTransitionToBoss(preStage: unknown, postStage: unknown, mouse: unknown) {
        return preStage === "Beanstalk" &&
            postStage === "Beanstalk Boss" &&
            this.isBeanstalkMouse(mouse);
    }

    private isTransitionFromBoss(preStage: unknown, postStage: unknown, mouse: unknown) {
        return preStage === "Beanstalk Boss" &&
        postStage === "Beanstalk" &&
        this.isBeanstalkBoss(mouse);
    }

    private isBeanstalkMouse(mouse: unknown) {
        return typeof mouse === 'string' && this.BeanstalkMice.includes(mouse);
    }

    private isBeanstalkBoss(mouse: unknown) {
        return typeof mouse === 'string' && mouse === this.BeanstalkBossMouse;
    }
}

/**
 * Allow transitions from Castle Giant stages to beanstalk stages (boss too)
 */
class CastleBossExemption implements IMessageExemption {
    readonly description = "Bountiful Beanstalk Castle Giant encounter";
    readonly property = "stage";

    readonly CastleBossStagesToMouse: {[key: string]: string | undefined} = {
        'Dungeon Giant': 'Dungeon Master' ,
        'Ballroom Giant': 'Malevolent Maestro' ,
        'Great Hall Giant': 'Mythical Giant King',
    };

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {

        // Only allow transitions from boss to outside for now
        if (
            this.isTransitionFromBoss(pre.stage, post.stage, pre.mouse)
        ) {
            return ['stage', 'cheese'];
        }

        return null;
    }

    private isTransitionFromBoss(preStage: unknown, postStage: unknown, mouse: unknown) {
        return this.isCastleStageAndBoss(preStage, mouse)
            && this.isBeanstalkStage(postStage);
    }

    /** Check if stage is a known castle giant stage that matches associated mouse */
    private isCastleStageAndBoss(stage: unknown, mouse: unknown) {
        if (typeof stage === 'string') {
            // Trim off the ' - Zone Name' portion of stage
            const floorStage = stage.replace(/ -.*$/, '');
            return this.CastleBossStagesToMouse[floorStage] === mouse;
        }

        return false;
    }

    private isBeanstalkStage(stage: unknown) {
        // Returning to a beanstalk boss is impossible. Progress is reset.
        return stage === "Beanstalk";
    }
}

export const bountifulBeanstalkExemptions = [
    new BeanstalkBossExemption(),
    new CastleBossExemption(),
];
