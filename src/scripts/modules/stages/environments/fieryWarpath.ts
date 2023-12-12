import type {FieryWarpathViewingAttributes, ViewingAttributes, User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class FieryWarpathStager implements IStager {
    readonly environment: string = 'Fiery Warpath';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {

        const viewing_atts = userPre.viewing_atts;
        if (!this.isWarpath(viewing_atts)) {
            throw new Error('Fiery Warpath viewing attributes are undefined');
        }

        const wave = viewing_atts.desert_warpath.wave;
        message.stage = (wave === "portal") ? "Portal" : `Wave ${wave}`;
    }

    /**
     * Check if the given viewing attributes narrows down to the fiery warpath one
     */
    private isWarpath(object: ViewingAttributes): object is FieryWarpathViewingAttributes {
        return (object as FieryWarpathViewingAttributes).desert_warpath != null;
    }
}
