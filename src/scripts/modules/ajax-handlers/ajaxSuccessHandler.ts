import type {HgResponse} from "@scripts/types/hg";

export abstract class AjaxSuccessHandler {
    abstract match(url: string): boolean;
    abstract execute(responseJSON: HgResponse): Promise<void>;
}
