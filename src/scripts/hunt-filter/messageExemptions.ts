import { IntakeMessage } from "../types/mhct";
import { IMessageExemption } from "./interfaces";

abstract class MessageExemptionBase implements IMessageExemption {
    readonly name: string;
    abstract property: keyof IntakeMessage;

    constructor() {
        this.name = this.constructor.name;
    }

    abstract getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null;
}

/**
 * Provides an exemption on the 'location' difference. Iff the mouse was 
 * a Realm Ripper and the user moved from FG -> AR. Give exemptions for
 * 'location' and 'stage'.
 */
export class RealmRipperLocationExemption extends MessageExemptionBase {
    readonly property = "location";
    getExemptions(pre: IntakeMessage, post: IntakeMessage): (keyof IntakeMessage)[] | null {
        if (pre.location?.name === "Forbidden Grove"
            && post.location?.name === "Acolyte Realm" 
            && pre.mouse === "Realm Ripper") {
            return [ "location", "stage" ]
        }
        
        return null;
    }
}
