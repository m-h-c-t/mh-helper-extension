import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';

/**
 * An object that can add a stage for an environment (location).
 */
export interface IStager {
    /**
     * The location the stager matches
     */
    readonly environment: string;

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void;
}
