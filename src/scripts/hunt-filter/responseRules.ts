import { ApiResponse } from "../types/hg";
import { RuleBase } from "./interfaces";

export class ApiResponseBothRequireSuccess extends RuleBase<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.success === 1 && post.success === 1;
    }
}

export class ApiResponsePreNeedsPage extends RuleBase<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.page !== undefined && pre.page !== null;
    }
}

export class ApiResponseActiveTurn extends RuleBase<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return post.active_turn === true;
    }
}
