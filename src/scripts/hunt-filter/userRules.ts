import { User } from "../types/hg";
import { IRule } from "./engine";

export class UserRequiredDifferences implements IRule<User> {
    readonly required_differences: (keyof User)[] = [
        "num_active_turns",
        "next_activeturn_seconds"
    ]

    isValid(pre: User, post: User): boolean {
        return this.required_differences.every(key => pre[key] != post[key]);
    }
}

export class UserNumActiveTurnsIncrementedByOne implements IRule<User> {
    isValid(pre: User, post: User): boolean {
        return post.num_active_turns - pre.num_active_turns === 1;
    }
}
