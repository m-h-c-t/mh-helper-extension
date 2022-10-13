import { ApiResponse } from "../types/hg";
import { IRule } from "./engine";

export class ApiResponseBothRequireSuccess implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.success === 1 && post.success === 1;
    }
}

export class ApiResponsePreNeedsPage implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return pre.page !== undefined && pre.page !== null;
    }
}

export class ApiResponseActiveTurn implements IRule<ApiResponse> {
    isValid(pre: ApiResponse, post: ApiResponse): boolean {
        return post.active_turn === true;
    }
}