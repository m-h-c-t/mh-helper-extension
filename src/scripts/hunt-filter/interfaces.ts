import { IntakeMessage } from "../types/mhct";

/**
 * Describes a way to validate a pre and post object
 */
export interface IRule<K> {
    /**
     * Rule name. Used for logging.
     */
    readonly name: string;
    /**
     * Check if two objects are valid between each other.
     * @param pre The pre-hunt object
     * @param post The post-hunt object
     * @returns true if valid, otherwise false
     */
    isValid(pre: K, post: K): boolean;
}

/**
 * Provides a rule for a specific property of T
 */
export interface IFilteredRule<T> extends IRule<T> {
    readonly property: (keyof T);
}

/**
 * Contract for implementing exemptions of IntakeMessage
 */
export interface IMessageExemption {
    /**
     * 
     */
    readonly name: string;
    /**
     * When this property name is invalid on an intake message, 
     * this rule will try to provide exemptions.
     */
    readonly property: (keyof IntakeMessage);
    /**
     * Get exemptions for the given pre and post messages
     * @param pre The pre-hunt IntakeMessage
     * @param post The post-hunt IntakeMessage
     * @returns An array of keys (of IntakeMessage) for which properties has been exempted or null. 
     */
    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null;
}

/**
 * Base class for all rules to gather class name for logging
 */
export abstract class RuleBase<K> implements IRule<K> {
    readonly name: string;

    constructor() {
        this.name = this.constructor.name;
    }

    abstract isValid(pre: K, post: K): boolean;
}
