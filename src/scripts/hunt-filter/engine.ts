import { ApiResponse, User } from "../types/hg";
import { IntakeMessage } from "../types/mhct";
import * as ResponseRules from "./responseRules";
import * as UserRules from "./userRules";
import * as MessageExemptions from "./messageExemptions";
import * as MessageRules from "./messageRules";

/**
 * Describes a way to validate a pre and post object
 */
export interface IRule<K> {
    /**
     * Check if two objects are valid between each other.
     * @param pre The pre-hunt object
     * @param post The post-hunt object
     * @returns true if valid, otherwise false
     */
    isValid(pre: K, post: K): boolean;
}

/**
 * Provides a rule for a specific property of T
 */
export interface IFilteredRule<T> extends IRule<T> {
    readonly property: (keyof T);
}

/**
 * Contract for implementing exemptions of IntakeMessage
 */
export interface IMessageExemption {
    readonly property: (keyof IntakeMessage);
    /**
     * Get exemptions for the given pre and post messages
     * @param pre The pre-hunt IntakeMessage
     * @param post The post-hunt IntakeMessage
     * @returns An array of keys (of IntakeMessage) for which properties has been exempted or null. 
     */
    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null;
}

/**
 * Uses pluggable rule to validate data before a hunt can be
 * submitted to the database
 */
export class IntakeRejectionEngine {
    responseRules: IRule<ApiResponse>[] = [];
    userRules: IRule<User>[] = [];
    messageRules: IFilteredRule<IntakeMessage>[] = [];
    messageExemptions: IMessageExemption[] = [];

    constructor() {
        this.initResponseRules();
        this.initUserRules();
        this.initMessageRules();
    };

    public validateResponse(pre: ApiResponse, post: ApiResponse): boolean {
        return this.responseRules.every(r => r.isValid(pre, post));
    }

    public validateUser(pre: User, post: User): boolean {
        return this.userRules.every(r => r.isValid(pre, post));
    }

    public validateMessage(pre: IntakeMessage, post: IntakeMessage): boolean {
        // TODO: Refactor? Location is being set to null in stage funcs so it'll fail later
        if (pre.location === null || post.location === null) {
            return false;
        }

        // Run rules. Build set of currently invalid properties
        // { "location", "stage" }
        const invalidProperties = new Set<(keyof IntakeMessage)>();
        for (const rule of this.messageRules) {
            const valid: boolean = rule.isValid(pre, post);
            if (!valid) {
                invalidProperties.add(rule.property);
            }
        }

        // Don't have to run exemption rules if there are no violations
        if (invalidProperties.size === 0) {
            return true;
        }

        // Find exception objects that will run for given key
        const relevant_exemptions_providers = this.messageExemptions.filter(e => invalidProperties.has(e.property));

        // Do we need to filter them furthur? 
        // Exception object could give specific key and value to filter on.
        // Didn't pre-optimize but could be worth if there are many, many exemptions and they are slow (doubtful)
        for (const exemption_provider of relevant_exemptions_providers) {

            // Each exemption can give multiple keys that it accounts for.
            // For example, the location and stage will change when catching realm ripper
            // so that exemption provides [ "location", "stage" ]
            const exemptions = exemption_provider.getExemptions(pre, post);
            if (exemptions && exemptions.length > 0) {
                exemptions.forEach(e => invalidProperties.delete(e));
            }

            if (invalidProperties.size == 0) {
                return true;
            }
        }
        
        return false;
    }

    private initResponseRules() {
        this.responseRules = [
            new ResponseRules.ApiResponseBothRequireSuccess(),
            new ResponseRules.ApiResponsePreNeedsPage(),
            new ResponseRules.ApiResponseActiveTurn(),
        ];
    }

    private initUserRules() {
        this.userRules = [
            new UserRules.UserRequiredDifferences(),
            new UserRules.UserNumActiveTurnsIncrementedByOne(),
        ];
    }

    private initMessageRules() {
        this.messageRules = [
            new MessageRules.IntakeMessageSameCheese(),
            new MessageRules.IntakeMessageSameWeapon(),
            new MessageRules.IntakeMessageSameBase(),
            new MessageRules.IntakeMessageSameLocation(),
            new MessageRules.IntakeMessageSameStage(),
        ];

        this.messageExemptions = [
            new MessageExemptions.RealmRipperLocationExemption(),
        ];
    }
}
