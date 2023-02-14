import { type User } from '@scripts/types/hg';

/**
 * An object that can add a stage for an environment (location).
 */
export interface IStager {
    /**
     * The location the stager matches
     */
    readonly environment: string;

    addStage(message: any, userPre: User, userPost: User, journal: any): void;
}
