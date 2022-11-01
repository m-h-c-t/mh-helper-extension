import { ApiResponse } from "../types/hg";
import { IRule } from "./interfaces";

export class ApiResponseBothRequireSuccess implements IRule<ApiResponse> {
    readonly description = "Both responses should have a 'success' of 1";
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.success === 1 && post.success === 1;
    }
}

export class ApiResponsePreNeedsPage implements IRule<ApiResponse> {
    readonly description = "Pre-response should have a 'page' field";
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.page !== undefined && pre.page !== null;
    }
}

export class ApiResponseActiveTurn implements IRule<ApiResponse> {
    readonly description = "Post-response should have true 'active_turn'";
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return post.active_turn === true;
    }
}

export const ResponseRules: IRule<ApiResponse>[] = [
    new ApiResponseBothRequireSuccess,
    new ApiResponsePreNeedsPage,
    new ApiResponseActiveTurn,
]
