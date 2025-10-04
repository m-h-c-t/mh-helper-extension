import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/**
 * Provides an exemption on the 'stage' difference. Iff the mouse was
 * Vincent
 */
class VincentStageExemption implements IMessageExemption {
    readonly description = 'Vincent (Boss) caught in SB+ Factory';
    readonly property = 'stage';

    readonly roomStages = [
        'Pump Room',
        'Mixing Room',
        'Break Room',
        'QA Room',
        'Any Room',
    ];

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (
            pre.stage === 'Boss' &&
            (typeof post.stage === 'string') && this.roomStages.includes(post.stage) &&
            pre.mouse === 'Vincent, The Magnificent'
        ) {
            return ['stage'];
        }

        return null;
    }
}

export const superBrieFactoryExemptions = [
    new VincentStageExemption(),
];
