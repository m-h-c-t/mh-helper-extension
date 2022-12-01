export abstract class AjaxSuccessHandler {
    abstract match(url: string): boolean;
    abstract execute(responseJSON: any): Promise<void>;
}