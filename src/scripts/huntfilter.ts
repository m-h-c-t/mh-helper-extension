import { ApiResponse, User } from "./types/hg";
import { IntakeMessage } from "./types/mhct";

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
        // Run rules. Build object of invalid keys
        // { "location": false, "stage": false }
        const invalidProperties = new Set<(keyof IntakeMessage)>();
        for (const rule of this.messageRules) {
            const valid: boolean = rule.isValid(pre, post);
            if (!valid) {
                invalidProperties.add(rule.property);
            }
        }

        // Don't have to run exemption rules if there are no exceptions
        if (invalidProperties.size === 0) {
            return true;
        }

        // Find exception objects that will run for given key
        const relevant_exemptions_providers = this.messageExemptions.filter(e => invalidProperties.has(e.property));

        // Do we need to filter them furthur? 
        // Exception object could give specific key and value to filter on.
        // Didn't pre-optimize but could be worth if there are many, many exemptions and they are slow (doubt)
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
            new ApiResponseBothRequireSuccess(),
            new ApiResponsePreNeedsPage(),
            new ApiResponseActiveTurn(),
        ];
    }

    private initUserRules() {
        this.userRules = [
            new UserRequiredDifferences(),
            new UserNumActiveTurnsIncrementedByOne(),
        ];
    }

    private initMessageRules() {
        this.messageRules = [
            new IntakeMessageSameCheese(),
            new IntakeMessageSameWeapon(),
            new IntakeMessageSameBase(),
            new IntakeMessageSameLocation(),
            new IntakeMessageSameStage(),
        ];

        this.messageExemptions = [
            new RealmRipperLocationExemption(),
        ];
    }
}

/**
 * Describes a way to validate a pre and post object
 */
interface IRule<K> {
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
interface IFilteredRule<T> extends IRule<T> {
    readonly property: (keyof T);
}

/**
 * Contract for implementing exemptions of IntakeMessage
 */
interface IMessageExemption {
    readonly property: (keyof IntakeMessage);
    /**
     * Get exemptions for the given pre and post messages
     * @param pre The pre-hunt IntakeMessage
     * @param post The post-hunt IntakeMessage
     * @returns An array of keys (of IntakeMessage) for which properties has been exempted. 
     */
    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | undefined;
}

class ApiResponseBothRequireSuccess implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.success === 1 && post.success === 1;
    }
}

class ApiResponsePreNeedsPage implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.page !== undefined && pre.page !== null;
    }
}

class ApiResponseActiveTurn implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return post.active_turn === true;
    }
}

class UserRequiredDifferences implements IRule<User> {
    readonly required_differences: (keyof User)[] = [
        "num_active_turns",
        "next_activeturn_seconds"
    ]

    isValid(pre: User, post: User): boolean {
        return this.required_differences.every(key => pre[key] != post[key]);
    }
}

class UserNumActiveTurnsIncrementedByOne implements IRule<User> {
    isValid(pre: User, post: User): boolean {
        return post.num_active_turns - pre.num_active_turns === 1;
    }
}

class IntakeMessageSameCheese implements IFilteredRule<IntakeMessage> {
    readonly property = "cheese";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.cheese.name === post.cheese.name;
    }
}

class IntakeMessageSameWeapon implements IFilteredRule<IntakeMessage> {
    readonly property = "trap";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.trap.name === post.trap.name;
    }
}

class IntakeMessageSameBase implements IFilteredRule<IntakeMessage> {
    readonly property = "base";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return pre.base.name === post.base.name;
    }
}

class IntakeMessageSameLocation implements IFilteredRule<IntakeMessage> {
    readonly property = "location";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.location !== null && post.location !== null)
            && pre.location.name === post.location.name;
    }
}

class IntakeMessageSameStage implements IFilteredRule<IntakeMessage> {
    readonly property = "stage";
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.stage || post.stage) && pre.stage === post.stage;
    }
}

/**
 * Provides an exemption on the 'location' difference. Iff the mouse was 
 * a Realm Ripper and the user moved from FG -> AR. Give exemptions for
 * 'location' and 'stage'.
 */
class RealmRipperLocationExemption implements IMessageExemption {
    readonly property = "location";
    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | undefined {
        if (pre.location?.name === "Forbidden Grove"
            && post.location?.name === "Acolyte Realm" 
            && pre.mouse === "Realm Ripper") {
            return [ "location", "stage" ]
        }
        
        return;
    }
}
