import { User } from "../types/hg";
import { IRule } from "./interfaces";

class UserRequiredDifferences implements IRule<User> {
    readonly description = "Pre and post user's 'num_active_turns' and 'next_activeturn_seconds' should differ";
    readonly required_differences: (keyof User)[] = [
        "num_active_turns",
        "next_activeturn_seconds"
    ]

    isValid(pre: User, post: User): boolean {
        return this.required_differences.every(key => pre[key] != post[key]);
    }
}

class UserNumActiveTurnsIncrementedByOne implements IRule<User> {
    readonly description = "User number of active turns should increase by 1";
    isValid(pre: User, post: User): boolean {
        return post.num_active_turns - pre.num_active_turns === 1;
    }
}

export const UserRules: IRule<User>[] = [
    new UserRequiredDifferences,
    new UserNumActiveTurnsIncrementedByOne
]
