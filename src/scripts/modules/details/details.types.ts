import type {JournalMarkup, User} from "@scripts/types/hg";
import type {IntakeMessage} from "@scripts/types/mhct";

/**
 * An object that can add hunt details.
 */
export interface IDetailer {
    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): object | undefined;
}

export interface IEnvironmentDetailer extends IDetailer {
    /**
     * The location the detailer matches
     */
     readonly environment: string;
}
