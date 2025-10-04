import type { HgResponse } from '../types/hg';
import type { IRule } from './interfaces';

export class HgResponseBothRequireSuccess implements IRule<HgResponse> {
    readonly description = 'Both responses should have a \'success\' of 1';
    isValid(pre: HgResponse, post: HgResponse): boolean {
        return pre.success === 1 && post.success === 1;
    }
}

export class HgResponsePreNeedsPage implements IRule<HgResponse> {
    readonly description = 'Pre-response should have a \'page\' field';
    isValid(pre: HgResponse, post: HgResponse): boolean {
        return pre.page !== undefined && pre.page !== null;
    }
}

export class HgResponseActiveTurn implements IRule<HgResponse> {
    readonly description = 'Post-response should have true \'active_turn\'';
    isValid(pre: HgResponse, post: HgResponse): boolean {
        return post.active_turn === true;
    }
}

export const ResponseRules: IRule<HgResponse>[] = [
    new HgResponseBothRequireSuccess(),
    new HgResponsePreNeedsPage(),
    new HgResponseActiveTurn(),
];
