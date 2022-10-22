import { ApiResponse, User } from "../types/hg";
import { IntakeMessage } from "../types/mhct";
import { ILogger } from "../util/logger";
import { IRule, IPropertyRule, IMessageExemption } from "./interfaces";
import { ResponseRules } from "./responseRules";
import { UserRules } from "./userRules";
import { MessageRules } from "./messageRules";
import { MessageExemptions } from "./messageExemptions";

/**
 * Uses pluggable rule to validate data before a hunt can be
 * submitted to the database
 */
export class IntakeRejectionEngine {
    private logger: ILogger;
    private responseRules: IRule<ApiResponse>[] = [];
    private userRules: IRule<User>[] = [];
    private messageRules: IPropertyRule<IntakeMessage>[] = [];
    private messageExemptions: IMessageExemption[] = [];

    constructor(logger: ILogger) {
        this.logger = logger;
        this.initResponseRules();
        this.initUserRules();
        this.initMessageRules();
    };

    public validateResponse(pre: ApiResponse, post: ApiResponse): boolean {
        return this.responseRules.every(r => {
            const isValid = r.isValid(pre, post);
            if (!isValid) {
                this.logger.debug(`Reponse object invalid due to rule: ${r.name}`);
            }
            return isValid;
        });
    }

    public validateUser(pre: User, post: User): boolean {
        return this.userRules.every(r => {
            let isValid = r.isValid(pre, post);
            if (!isValid) {
                this.logger.debug(`User object invalid due to rule: ${r.name}`);
            }
            return isValid;
        });
    }

    public validateMessage(pre: IntakeMessage, post: IntakeMessage): boolean {
        // TODO: Refactor? Location is being set to null in stage funcs so it'll fail later
        if (pre.location === null || post.location === null) {
            return false;
        }

        // Run rules. Build set of currently invalid properties
        // { "location", "stage" }
        const invalidProperties = new Set<(keyof IntakeMessage)>();
        for (const rule of this.messageRules) {
            const valid: boolean = rule.isValid(pre, post);
            if (!valid) {
                this.logger.debug(`Message possibly invalid due to rule: ${rule.name}`);
                invalidProperties.add(rule.property);
            }
        }

        // Don't have to run exemption rules if there are no violations
        if (invalidProperties.size === 0) {
            return true;
        }

        // Find exception objects that will run for given key
        const exemption_providers = this.messageExemptions.filter(e => invalidProperties.has(e.property));
        this.logger.debug(`Got ${exemption_providers.length} exemption providers for these invalid properties:`, ...invalidProperties.values());

        // Do we need to filter them furthur? 
        // Exception object could give specific key and value to filter on.
        // Didn't pre-optimize but could be worth if there are many, many exemptions and they are slow (doubtful)
        for (const provider of exemption_providers) {
            // Each exemption can give multiple keys that it accounts for.
            // For example, the location and stage will change when catching realm ripper
            // so that exemption provides [ "location", "stage" ]
            const exemptions = provider.getExemptions(pre, post);
            if (exemptions && exemptions.length > 0) {
                this.logger.debug(`Generated exemptions from ${provider.name}`, { properties: exemptions });
                exemptions.forEach(e => invalidProperties.delete(e));
            }

            if (invalidProperties.size == 0) {
                this.logger.debug('Message was revalidated due to exemptions.');
                return true;
            }
        }

        this.logger.debug(`Message object invalid`, {
            properties: { ...invalidProperties.values() },
            messages: { pre, post }
        })
        
        return false;
    }

    private initResponseRules() {
        this.responseRules = ResponseRules;
    }

    private initUserRules() {
        this.userRules = UserRules;
    }

    private initMessageRules() {
        this.messageRules = MessageRules;
        this.messageExemptions = MessageExemptions
    }
}
