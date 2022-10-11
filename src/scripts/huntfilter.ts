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
        ];
    }

    private initUserRules() {
        this.userRules = [
        ];
    }

    private initMessageRules() {
        this.messageRules = [
        ]
    }
}

interface IRule<K> {
    isValid(pre: K, post: K): boolean;
}

