import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/**
 * Allow stage transitions between blight tiers in Afterword Acres
 */
class AfterwordAcresBlightExemption implements IMessageExemption {
    readonly description = 'Afterword Acres blight tier progression';
    readonly property = 'stage';

    readonly validStages = ['1x', '2x', '4x', '8x'];
    readonly validTransitions = new Map([
        ['1x', ['2x']], // tier_1 ↔ tier_2
        ['2x', ['1x', '4x']], // tier_2 ↔ tier_1, tier_2 ↔ tier_3
        ['4x', ['2x', '8x']], // tier_3 ↔ tier_2, tier_3 ↔ tier_4
        ['8x', ['4x']], // tier_4 ↔ tier_3
    ]);

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (this.isValidBlightTransition(pre.stage, post.stage)) {
            return ['stage'];
        }

        return null;
    }

    /**
     * Returns true if transitioning between valid Afterword Acres stages
     * that are adjacent in the blight tier progression
     */
    private isValidBlightTransition(preStage: unknown, postStage: unknown): boolean {
        if (typeof preStage !== 'string' || typeof postStage !== 'string') {
            return false;
        }

        if (!this.validStages.includes(preStage) || !this.validStages.includes(postStage)) {
            return false;
        }

        // Allow transitions between adjacent tiers in either direction
        const allowedTransitions = this.validTransitions.get(preStage);
        return allowedTransitions?.includes(postStage) ?? false;
    }
}

export const afterwordAcresExemptions = [
    new AfterwordAcresBlightExemption(),
];
