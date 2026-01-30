import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/**
 * Stage exemptions for transitions between stages in Queso Geyser.
 * Handles exemptions for transitions between:
 * - Cork Collecting
 * - Pressure Building (corked)
 * - Eruption (Tiny/Small/Medium/Large/Epic Eruption)
 * - Cork Collecting (claim)
 */
export const quesoGeyserExemptions: IMessageExemption[] = [
    {
        description: 'Queso Geyser stage changes',
        property: 'stage',

        getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
            if (pre.location?.name !== 'Queso Geyser' || post.location?.name !== 'Queso Geyser') {
                return null;
            }

            if (typeof pre.stage !== 'string' || typeof post.stage !== 'string') {
                return null;
            }

            // Check for Pressure Building -> Eruption transition
            if (pre.stage === 'Pressure Building' && post.stage.includes('Eruption')) {
                return ['stage'];
            }

            // Check for Eruption -> Cork Collecting (claim) transition
            if (pre.stage.includes('Eruption') && post.stage === 'Cork Collecting') {
                return ['stage'];
            }

            return null;
        }
    }
];
