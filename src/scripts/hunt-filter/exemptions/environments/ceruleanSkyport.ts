import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

/**
 * Allow transitions to Docked
 */
class CeruleanSkyportDockedExemption implements IMessageExemption {
    readonly description = 'Cerulean Skyport raid end';
    readonly property = 'stage';

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (
            pre.location?.name === 'Cerulean Skyport' &&
            post.location?.name === 'Cerulean Skyport' &&
            pre.stage !== 'Docked' &&
            post.stage === 'Docked'
        ) {
            return ['cheese', 'trap', 'stage'];
        }

        return null;
    }
}

export const ceruleanSkyportExemptions: IMessageExemption[] = [
    new CeruleanSkyportDockedExemption(),
];
