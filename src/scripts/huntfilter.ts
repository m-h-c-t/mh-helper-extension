import { ApiResponse, User } from "./types/hg";
import { IntakeMessage } from "./types/mhct";

export class IntakeRejectionEngine {
    responseRules: IRule<ApiResponse>[] = [];
    userRules: IRule<User>[] = [];
    messageRules: IRule<IntakeMessage>[] = [];

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
        return this.messageRules.every(r => r.isValid(pre, post));
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
            new IntakeMessageSameStage(),
        ]
    }
}

interface IRule<K> {
    isValid(pre: K, post: K): boolean;
}

class ApiResponseBothRequireSuccess implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.success === 1 && post.success === 1;
    }
}

class ApiResponsePreNeedsPage implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.page !== null;
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

class IntakeMessageSameStage implements IRule<IntakeMessage> {
    isValid(pre: IntakeMessage, post: IntakeMessage): boolean {
        return (pre.stage || post.stage) && pre.stage === post.stage;
    }
}
