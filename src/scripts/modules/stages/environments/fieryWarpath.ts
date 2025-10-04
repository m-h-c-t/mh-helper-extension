import type { FieryWarpathViewingAttributes, User } from '@scripts/types/hg';

import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class FieryWarpathStager implements IStager {
    readonly environment: string = 'Fiery Warpath';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        this.isFieryWarpath(userPre);

        const wave = userPre.viewing_atts.desert_warpath.wave;
        message.stage = (wave === 'portal') ? 'Portal' : `Wave ${wave}`;
    }

    private isFieryWarpath(user: User): asserts user is User & {viewing_atts: FieryWarpathViewingAttributes} {
        if (!('desert_warpath' in user.viewing_atts) || user.viewing_atts.desert_warpath == null) {
            throw new Error('Fiery Warpath viewing attributes are undefined');
        }
    }
}
