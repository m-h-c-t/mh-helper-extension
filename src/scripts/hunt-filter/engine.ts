import {HgResponse, User} from "../types/hg";
import {IntakeMessage} from "../types/mhct";
import {LoggerService} from "../util/logger";
import {IRule, IPropertyRule, IMessageExemption} from "./interfaces";
import {ResponseRules} from "./responseRules";
import {UserRules} from "./userRules";
import {MessageRules} from "./messageRules";
import {MessageExemptions} from "./exemptions";

/**
 * Uses pluggable rule to validate data before a hunt can be
 * submitted to the database
 */
export class IntakeRejectionEngine {
    private logger: LoggerService;
    private responseRules: IRule<HgResponse>[] = [];
    private userRules: IRule<User>[] = [];
    private messageRules: IPropertyRule<IntakeMessage>[] = [];
    private messageExemptions: IMessageExemption[] = [];

    constructor(logger: LoggerService) {
        this.logger = logger;
        this.initResponseRules();
        this.initUserRules();
        this.initMessageRules();
    }

    public validateResponse(pre: HgResponse, post: HgResponse): boolean {
        return this.responseRules.every(r => {
            const isValid = r.isValid(pre, post);
            if (!isValid) {
                this.logger.debug(`Api responses invalid: ${r.description}`);
            }
            return isValid;
        });
    }

    public validateUser(pre: User, post: User): boolean {
        return this.userRules.every(r => {
            const isValid = r.isValid(pre, post);
            if (!isValid) {
                this.logger.debug(`User objects invalid: ${r.description}`);
            }
            return isValid;
        });
    }

    public validateMessage(pre: IntakeMessage, post: IntakeMessage): boolean {
        // TODO: Refactor? Location is being set to null in stage funcs so it'll fail later
        if (pre.location === null || post.location === null) {
            return false;
        }

        const invalidProperties = this.getInvalidIntakeMessageProperties(pre, post);

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
                this.logger.debug(`Got exemptions. Description: ${provider.description}`, {properties: exemptions});
                exemptions.forEach(e => invalidProperties.delete(e));
            }

            if (invalidProperties.size == 0) {
                this.logger.debug('Message was revalidated due to exemptions.');
                return true;
            }
        }

        this.logger.debug(`Message object invalid`, {
            properties: {...invalidProperties.values()},
            messages: {pre, post},
        });

        return false;
    }

    /**
     * Runs the IntakeMessage rules to build a set of currently invalid properties
     * @param pre
     * @param post
     * @returns {Set<(keyof IntakeMessage)>} A set of strings representing keys of invalid IntakeMessage properties
     */
    public getInvalidIntakeMessageProperties(pre: IntakeMessage, post: IntakeMessage): Set<(keyof IntakeMessage)> {
        const invalidProperties = new Set<(keyof IntakeMessage)>();
        for (const rule of this.messageRules) {
            const valid: boolean = rule.isValid(pre, post);
            if (!valid) {
                this.logger.debug(`Message invalid: ${rule.description}`);
                invalidProperties.add(rule.property);
            }
        }

        return invalidProperties;
    }

    private initResponseRules() {
        this.responseRules = ResponseRules;
    }

    private initUserRules() {
        this.userRules = UserRules;
    }

    private initMessageRules() {
        this.messageRules = MessageRules;
        this.messageExemptions = MessageExemptions;
    }
}
