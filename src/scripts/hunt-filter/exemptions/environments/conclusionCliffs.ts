import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';

import { type IntakeMessage } from '@scripts/types/mhct';

/**
 * Exemption for valid stage transitions in Conclusion Cliffs.
 *
 * Valid transitions:
 * - Any "Writing <Genre>" ↔ Any other "Writing <Genre>"
 * - Any "Writing <Genre>" → "Postscript" or "Fantasy Postscript"
 * - "Postscript" or "Fantasy Postscript" → "Not Writing"
 */
class ConclusionCliffsStageExemption implements IMessageExemption {
    readonly description = 'Conclusion Cliffs stage transitions';
    readonly property = 'stage';

    private readonly writingGenres = [
        'Writing Adventure',
        'Writing Comedy',
        'Writing Romance',
        'Writing Suspense',
        'Writing Tragedy',
        'Writing Fantasy',
    ];

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        // Only apply to Conclusion Cliffs location
        if (pre.location?.name !== 'Conclusion Cliffs' || post.location?.name !== 'Conclusion Cliffs') {
            return null;
        }

        if (typeof pre.stage !== 'string' || typeof post.stage !== 'string') {
            return null;
        }

        // No exemption if stages are the same
        if (pre.stage === post.stage) {
            return null;
        }

        // Check if transition is valid
        if (this.isValidTransition(pre.stage, post.stage)) {
            return ['stage'];
        }

        return null;
    }

    private isValidTransition(preStage: string, postStage: string): boolean {
        const preIsWriting = this.writingGenres.includes(preStage);
        const postIsWriting = this.writingGenres.includes(postStage);
        const preIsPostscript = preStage === 'Postscript' || preStage === 'Fantasy Postscript';
        const postIsPostscript = postStage === 'Postscript' || postStage === 'Fantasy Postscript';

        // Writing genre to any other writing genre
        if (preIsWriting && postIsWriting) {
            return true;
        }

        // Any writing genre to postscript (regular or fantasy)
        if (preIsWriting && postIsPostscript) {
            return true;
        }

        // Postscript (regular or fantasy) to not writing
        if (preIsPostscript && postStage === 'Not Writing') {
            return true;
        }

        return false;
    }
}

export const conclusionCliffsExemptions: IMessageExemption[] = [
    new ConclusionCliffsStageExemption(),
];
