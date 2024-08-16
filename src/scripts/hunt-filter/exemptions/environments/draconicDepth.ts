import type {IMessageExemption} from '@scripts/hunt-filter/interfaces';
import type {IntakeMessage} from '@scripts/types/mhct';

class DraconicDepthsCavernExemptions implements IMessageExemption {
    readonly description = 'Allow transitions between cavern stages';
    readonly property = 'stage';

    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (pre.location?.name !== 'Draconic Depths' || post.location?.name !== 'Draconic Depths') {
            return null;
        }

        if (typeof pre.stage !== 'string' || typeof post.stage !== 'string') {
            return null;
        }

        if (pre.stage.startsWith('Cavern') && post.stage === 'Crucible Forge') {
            return ['stage', 'cheese'];
        }

        if (pre.stage.startsWith('Cavern') && post.stage.startsWith('Cavern')) {
            return ['stage'];
        }

        return null;
    }
}

export const draconicDepthsExemptions = [
    new DraconicDepthsCavernExemptions(),
];
