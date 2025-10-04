import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/**
 * Allow transitions between "On Bounty" and "No Bounty" stages in Harbor
 */
class HarbourBountyExemption implements IMessageExemption {
    readonly description = 'Harbor bounty status change';
    readonly property = 'stage';

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (this.isNowOnBounty(pre.stage, post.stage, pre.mouse) ||
            this.isNowNoBounty(pre.stage, post.stage, pre.mouse)) {
            return ['stage'];
        }

        return null;
    }

    private isNowOnBounty(preStage: unknown, postStage: unknown, mouse: string): boolean {
        return typeof preStage === 'string' && preStage === 'No Bounty' &&
            typeof postStage === 'string' && postStage === 'On Bounty' &&
            mouse === 'Pirate';
    }

    private isNowNoBounty(preStage: unknown, postStage: unknown, mouse: string): boolean {
        const pirateCrew = [
            'Barmy Gunner',
            'Bilged Boatswain',
            'Cabin Boy',
            'Corrupt Commodore',
            'Dashing Buccaneer'
        ];

        return typeof preStage === 'string' && preStage === 'On Bounty' &&
            typeof postStage === 'string' && postStage === 'No Bounty' &&
            pirateCrew.includes(mouse);
    }
}

export const harbourExemptions = [
    new HarbourBountyExemption(),
];
