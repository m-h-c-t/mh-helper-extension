import { LoggerService } from "../util/logger";
import { AjaxSuccessHandler } from "./ajaxSuccessHandler";
import { GolemPayload, GolemResponse } from "./golem.types";

const rarities = ["area", "hat", "scarf"] as const;

export class GWHGolemAjaxHandler extends AjaxSuccessHandler {

    constructor(protected logger: LoggerService) {
        super();
    }

    public match(url: string): boolean {
        if (!url.includes("mousehuntgame.com/managers/ajax/events/winter_hunt.php")) {
            return false;
        }

        // Triggers on Golem claim, dispatch, upgrade, and on "Decorate" click (+others, perhaps).
        // (GMT): Sat Jan 21 2023 05:00:00 GMT+0000)
        if (Date.now() > 1674277200000) {
            return false;
        }

        return true;
    }

    public async execute(responseJSON: any): Promise<void> {
        // Because response is of 'any' type, union the possibility of
        // undefined since we don't know where the data will be located in the response structure
        const golemData: GolemResponse | undefined = responseJSON?.golem_loot // 99.99% probability that this needs to be changed;
        if (!golemData) {
            this.logger.warn("Skipped GWH golem submission due to unhandled XHR structure.", responseJSON);
            return;
        }

        const payload: GolemPayload = {
            timestamp: Date.now(),
            location: golemData.environment.name,
            loot: []
        };

        for (const rarity of rarities) {
            const golemItems = golemData.items[rarity];
            for (const golemItem of golemItems) {
                payload.loot.push({
                    name: golemItem.name,
                    quantity: golemItem.quantity,
                    rarity
                });
            }
        }

        if (payload.loot.length > 0) {
            this.logger.debug("GWH Golem: {golem}", payload)
            const success = await this.submitGolems([payload])

            // Tell main.js to display a banner (potential refactor this to a service later)
            window.postMessage({
                mhct_message: 'golemSubmissionStatus',
                submitted: success
            }, window.origin)
        }
    }

    /**
     * Promise to submit the given golem(s) loot for external storage
     * @param golems
     * @returns True if submitted successfully, otherwise false.
     */
    public async submitGolems(golems: GolemPayload[]) {
        if (!golems || !Array.isArray(golems) || !golems.length) {
            return false;
        }

        const endpoint = "https://script.google.com/macros/s/AKfycbzQjEgLA5W7ZUVKydZ_l_Cm8419bI8e0Vs2y3vW2S_RwlF-6_I/exec";
        const options: RequestInit = {
            mode: 'cors',
            method: 'POST',
            credentials: 'omit',
        };

        let allOk = true;
        for (const golem of golems) {
            const payload = new FormData();
            payload.set('golemString', JSON.stringify(golem));
            payload.set('schemaVersion', '2');
            try {
                const resp = await fetch(endpoint, {...options, body: payload});
                allOk = allOk && resp.ok;
                if (!resp.ok) this.logger.error('Error submitting golem', {golem});
            } catch (error) {
                allOk = false;
                this.logger.error('Golem Fetch/Network Error', {error});
            }
        }
        return allOk ? golems.length : false;
    }
}
