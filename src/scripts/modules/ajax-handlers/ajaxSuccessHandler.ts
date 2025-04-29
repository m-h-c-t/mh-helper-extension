import type {HgResponse} from "@scripts/types/hg";
import {LoggerService} from "@scripts/util/logger";
import {z} from "zod";

export abstract class AjaxSuccessHandler {
    abstract match(url: string): boolean;
    abstract execute(responseJSON: HgResponse): Promise<void>;
}

export abstract class ValidatedAjaxSuccessHandler extends AjaxSuccessHandler {
    abstract readonly schema: z.ZodSchema;

    constructor(private readonly logger: LoggerService) {
        super();
    }

    async execute(responseJSON: HgResponse): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data = await this.schema.parseAsync(responseJSON);
            await this.validatedExecute(data);
        } catch (e) {
            if (e instanceof z.ZodError) {
                this.logger.warn(`Couldn't validate JSON response`, e);
            }
            throw e;
        }
    }

    protected abstract validatedExecute(data: z.infer<typeof this.schema>): Promise<void>;
}
