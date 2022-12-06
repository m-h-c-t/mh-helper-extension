import { LoggerService } from "../util/logger";
import { AjaxSuccessHandler } from "./ajaxSuccessHandler";
import { GolemPayload, GolemResponse } from "./golem.types";

const rarities = ["area", "hat", "scarf"] as const;

export class GWHGolemAjaxHandler extends AjaxSuccessHandler {

    constructor(
        private logger: LoggerService,
        private showFlashMessage: (type: "error" | "warning" | "success", message: string) => void
    ) {
        super();
    }

    public match(url: string): boolean {
        // Triggers on Golem claim, dispatch, upgrade, and on "Decorate" click (+others, perhaps).
        if (!url.includes("mousehuntgame.com/managers/ajax/events/winter_hunt_region.php")) {
            return false;
        }

        if (Date.now() > new Date("2023-01-21T05:00:00").getTime()) {
            return false;
        }

        return true;
    }

    public async execute(responseJSON: any): Promise<void> {
        const golemData: GolemResponse | undefined = responseJSON?.golem_rewards
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

            if (success) {
                this.showFlashMessage('success', 'Snow Golem data submitted successfully');
            } else {
                this.showFlashMessage('error', 'Snow Golem data submission failed, sorry!');
            }
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
                //const resp = await fetch(endpoint, {...options, body: payload});
                const resp = {ok: true};
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
