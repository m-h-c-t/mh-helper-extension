import type {IMessageExemption} from '@scripts/hunt-filter/interfaces';
import type {IntakeMessage} from '@scripts/types/mhct';

// As this is an older area, just allow all transitions between stages

class GnawnianExpressStationExemption implements IMessageExemption {
    readonly description = 'Allow transitions between station stages';
    readonly property = 'stage';

    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (pre.location?.name !== 'Gnawnian Express Station' || post.location?.name !== 'Gnawnian Express Station') {
            return null;
        }

        return ['stage'];
    }
}

export const gnawnianExpressStationExemptions = [
    new GnawnianExpressStationExemption(),
];
