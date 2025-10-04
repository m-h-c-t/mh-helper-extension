import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/* stages for reference
    "Treacherous Tunnels": "0-300ft",
    "Brutal Bulwark":    "301-600ft",
    "Bombing Run":      "601-1600ft",
    "The Mad Depths":  "1601-1800ft",
    "Icewing's Lair":       "1800ft",
    "Hidden Depths":   "1801-2000ft",
    "The Deep Lair":        "2000ft",
    "General":            "Generals",
*/

/**
 * Allow transitions to and from the 'Generals' stage.
 *
 * The 'to' transition is relatively loose and allows any mouse that is not a general
 */
class IcebergGeneralExemption implements IMessageExemption {
    readonly description = 'Iceberg General caught';
    readonly property = 'stage';

    readonly generalMiceNames = [
        'General Drheller',
        'Lady Coldsnap',
        'Lord Splodington',
        'Princess Fist',
    ];

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (
            this.isTransitionToGenerals(post.stage, pre.mouse) ||
            this.isTransitionFromGenerals(pre.stage, pre.mouse)
        ) {
            return ['stage'];
        }

        return null;
    }

    /**
     * Returns true if you caught any mouse right before the Generals stage.
     */
    private isTransitionToGenerals(postStage: unknown, mouse: string): boolean {
        return postStage === 'Generals' && !this.generalMiceNames.includes(mouse);
    }

    /**
     * Returns true if you just caught a general mouse in the general stage
     */
    private isTransitionFromGenerals(preStage: unknown, mouse: string): boolean {
        return preStage === 'Generals' && this.generalMiceNames.includes(mouse);
    }
}

/**
 * Allows stage transitions when catching icewing
 *
 *
 * Does NOT allow the following:
 *
 * Moving back to Slushy Shoreline
 * Traps breaking
 */
class IcewingMouseExemption implements IMessageExemption {
    readonly description = 'Icewing caught in Icewing\'s Lair';
    readonly property = 'stage';

    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (
            pre.stage === '1800ft' &&
            post.stage === '1801-2000ft' &&
            pre.mouse === 'Icewing'
        ) {
            return ['stage'];
        }
        return null;
    }
}

class DeepMouseExemption implements IMessageExemption {
    readonly description = 'Deep Mouse caught in Deep Lair';
    readonly property = 'location';

    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (
            pre.location?.name === 'Iceberg' &&
            post.location?.name === 'Slushy Shoreline' &&
            pre.mouse === 'Deep'
        ) {
            return ['location', 'stage'];
        }
        return null;
    }
}

export const icebergExemptions = [
    new IcebergGeneralExemption(),
    new IcewingMouseExemption(),
    new DeepMouseExemption(),
];
