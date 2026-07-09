import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/**
 * Allow transitions to Docked
 */
class CeruleanSkyportDockedExemption implements IMessageExemption {
    readonly description = 'Cerulean Skyport Docked encounter';
    readonly property = 'stage';

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (post.stage === 'Docked') {
            return ['cheese', 'stage'];
        }

        return null;
    }
}

export const ceruleanSkyportExemptions: IMessageExemption[] = [
    new CeruleanSkyportDockedExemption(),
];
