import type { LoggerService } from '@scripts/services/logging';
import type { HgResponse } from '@scripts/types/hg';

import { z } from 'zod';

export abstract class AjaxSuccessHandler {
    abstract match(url: string): boolean;
    abstract execute(responseJSON: HgResponse): Promise<void>;
}

export abstract class ValidatedAjaxSuccessHandler<TSchema extends z.ZodType> extends AjaxSuccessHandler {
    abstract readonly name: string;
    abstract readonly schema: TSchema;

    constructor(protected readonly logger: LoggerService) {
        super();
    }

    async execute(responseJSON: HgResponse): Promise<void> {
        const result = this.schema.safeParse(responseJSON);
        if (!result.success) {
            this.logger.warn(`ValidatedAjaxSuccessHandler: Invalid response for ${this.name}`, z.prettifyError(result.error), {
                response: responseJSON,
            });
            return;
        }

        await this.validatedExecute(result.data);
    }

    protected abstract validatedExecute(data: z.output<TSchema>): Promise<void>;
}
