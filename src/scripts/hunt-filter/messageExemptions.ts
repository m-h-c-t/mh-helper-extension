import { IntakeMessage } from "../types/mhct";
import { IMessageExemption } from "./engine";

/**
 * Provides an exemption on the 'location' difference. Iff the mouse was 
 * a Realm Ripper and the user moved from FG -> AR. Give exemptions for
 * 'location' and 'stage'.
 */
export class RealmRipperLocationExemption implements IMessageExemption {
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