import { LoggerService } from "@scripts/util/logger";
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
        if (!url.includes("mousehuntgame.com/managers/ajax/events/winter_hunt_region.php")) {
            return false;
        }

        if (Date.now() > new Date("2023-01-21T05:00:00").getTime()) {
            return false;
        }

        return true;
    }

    public async execute(responseJSON: any): Promise<void> {
        // Triggers on Golem claim, dispatch, upgrade, and on "Decorate" click (+others, perhaps).
        const golemData: GolemResponse | undefined = responseJSON?.golem_rewards
        if (!golemData) {
            this.logger.debug("Skipped GWH golem submission since there are no golem rewards.", responseJSON);
            return;
        }

        // CBS added this field to the preview at our requests
        // but golem_loot reponse doesn't have it. If it does make it back uncomment
        // next line and remove the one after.
        //const location = golemData.environment.name,
        const location = this.getLocationFromJournalMarkup(responseJSON.journal_markup);

        if (location == null) {
            this.logger.warn("Skipped GWH golem submission due to empty location.", responseJSON);
            return;
        }

        const payload: GolemPayload = {
            timestamp: Date.now(),
            location: location,
            loot: []
        };

        // HACK: app script as of now needs at least 1 common item to pass validation
        payload.loot.push({
            name: 'Fake Item',
            quantity: 0,
            // @ts-ignore suppress that rarity is not one of allowed
            rarity: 'Common',
        });

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

    /**
     * Extract the claimed golem location from HG response.
     * @param journalMarkup The journal_markup field from the winter_hunt_area.php response when claiming a golem
     */
    private getLocationFromJournalMarkup(journalMarkup: any): string | null {
        const journal = journalMarkup as [
            {
                render_data?: {
                    text?: string
                }
            }
        ]

        const golemLocationRegex = /My golem returned from (?:the )?(.+) with/
        for (const journalEntry of journal) {
            const result = golemLocationRegex.exec(journalEntry?.render_data?.text ?? "");
            if (result) {
                return result[1];
            }
        }

        return null;
    }
}
