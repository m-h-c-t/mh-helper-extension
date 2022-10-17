import { User } from "../types/hg";
import { IRule, RuleBase } from "./interfaces";

class UserRequiredDifferences extends RuleBase<User> {
    readonly required_differences: (keyof User)[] = [
        "num_active_turns",
        "next_activeturn_seconds"
    ]

    isValid(pre: User, post: User): boolean {
        return this.required_differences.every(key => pre[key] != post[key]);
    }
}

class UserNumActiveTurnsIncrementedByOne extends RuleBase<User> {
    isValid(pre: User, post: User): boolean {
        return post.num_active_turns - pre.num_active_turns === 1;
    }
}

export const UserRules: IRule<User>[] = [
    new UserRequiredDifferences,
    new UserNumActiveTurnsIncrementedByOne
]
