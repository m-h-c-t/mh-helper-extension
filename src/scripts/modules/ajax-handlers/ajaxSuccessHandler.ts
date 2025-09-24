import type {HgResponse} from "@scripts/types/hg";
import {LoggerService} from "@scripts/services/logging";
import {z} from "zod";

export abstract class AjaxSuccessHandler {
    abstract match(url: string): boolean;
    abstract execute(responseJSON: HgResponse): Promise<void>;
}

export abstract class ValidatedAjaxSuccessHandler extends AjaxSuccessHandler {
    abstract readonly schema: z.ZodSchema;

    constructor(protected readonly logger: LoggerService) {
        super();
    }

    async execute(responseJSON: HgResponse): Promise<void> {
        let data: z.infer<typeof this.schema>;
        try {
            data = this.schema.parse(responseJSON);
        } catch (e) {
            if (e instanceof z.ZodError) {
                this.logger.warn(`Couldn't validate JSON response`, z.prettifyError(e));
            }

            return;
        }

        await this.validatedExecute(data);
    }

    protected abstract validatedExecute(data: z.infer<typeof this.schema>): Promise<void>;
}
