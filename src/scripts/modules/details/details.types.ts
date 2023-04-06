import type {JournalMarkup, User} from "@scripts/types/hg";

/**
 * An object that can add hunt details.
 */
export interface IDetailer {
    addDetails(message: any, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined;
}

export interface IEnvironmentDetailer extends IDetailer {
    /**
     * The location the detailer matches
     */
     readonly environment: string;
}
