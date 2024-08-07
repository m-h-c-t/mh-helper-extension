import {LoggerService} from "@scripts/util/logger";
import {AjaxSuccessHandler} from "./ajaxSuccessHandler";
import {HgResponse, JournalMarkup} from "@scripts/types/hg";
import {BeanstalkRarityPayload} from "./beanstalkRoomTracker.types";
import {CastleAttributes, Embellishment} from "@scripts/types/hg/quests";

/**
 * Reports room rarities so they can be analyzed with other tools
 */
export class BountifulBeanstalkRoomTrackerAjaxHandler extends AjaxSuccessHandler {
    constructor(
        private logger: LoggerService,
        private showFlashMessage: (type: "error" | "warning" | "success", message: string) => void
    ) {
        super();
    }

    public match(url: string): boolean {
        // We use bountiful_beanstalk.php when the user plants a vine to submit first room
        // Otherwise, use activeturn to check if user is at the start/end of a room
        if (!(
            url.includes("mousehuntgame.com/managers/ajax/environment/bountiful_beanstalk.php") ||
            url.includes("mousehuntgame.com/managers/ajax/turns/activeturn.php")
        )) {
            return false;
        }

        return true;
    }

    public async execute(responseJSON: HgResponse): Promise<void> {

        const {user} = responseJSON;
        if (user.environment_name != "Bountiful Beanstalk") {
            this.logger.debug("BBRoomTracker: Not in BB environment");
            return;
        }

        // Deterimine if bountiful_beanstalk.php.
        // Verify user has planted vine and not just toggling CC
        const isActiveHuntOrPlantedVine = responseJSON.active_turn ?? this.userPlantedVine(responseJSON.journal_markup);
        if (!isActiveHuntOrPlantedVine) {
            this.logger.debug(`BBRoomTracker: Didn't plant vine or too many journal entries (${responseJSON.journal_markup?.length} entries)`);
            return;
        }

        // Should not be null but check just in case
        const quest = user.quests.QuestBountifulBeanstalk;
        if (quest == null) {
            this.logger.warn("BBRoomTracker: Quest was null!");
            return;
        }

        if (!quest.in_castle) {
            this.logger.debug("BBRoomTracker: User not in castle");
            return;
        }

        // We submit the current room iff:
        // 1) At step 0
        // 2) Not being chased

        // Submit the next room iff:
        // 1) At step 19
        // 2) Being chased
        const isAtRelaventPosition = this.isStartingNewRoom(quest) || this.isStartingChase(quest);
        if (!isAtRelaventPosition) {
            this.logger.debug("BBRoomTracker: User not in a submittable position");
            return;
        }

        const success = await this.submitRoomData(quest);
        if (success) {
            this.showFlashMessage('success', "Castle room data submitted successfully");
        } else {
            this.logger.warn("BBRoomTracker: Error submitting castle room data");
        }

        return;
    }

    private async submitRoomData(quest: CastleAttributes): Promise<boolean> {
        this.logger.debug(`BBRoomTracker: Submitting ${quest.castle.is_boss_chase ? 'next' : 'current'} room`);
        const room = quest.castle.is_boss_chase
            ? quest.castle.next_room
            : quest.castle.current_room;
        const data: BeanstalkRarityPayload = {
            version: 1,
            floor: quest.castle.current_floor.type,
            embellishments: {
                golden_key: this.hasEmbellishment('golden_key', quest.embellishments),
                ruby_remover: this.hasEmbellishment('ruby_remover', quest.embellishments),
            },
            room: room.type,
        };
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbynfLfTaN6tnEYBE1Z9iPJEtO4xCCvsqHQqiu246JCKCUvwQU8WyICEJGzX45UF3HPmAA/exec',
                {
                    method: 'POST',
                    headers: {
                        // using 'application/json' causes cors issues b/c of fetch OPTIONS preflight
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify(data),
                });

            return response.ok;
        } catch (err) {
            this.logger.error('BBRoomTracker: Castle room data network error', err);
            return false;
        }
    }

    /**
     * Checks if the user planted a vine by looking for a css class in the journal markup.
     * @param journalMarkup Journal markup returned from response
    */
    private userPlantedVine(journalMarkup: JournalMarkup[] | undefined): boolean {
        if (journalMarkup == null) {
            return false;
        }

        if (journalMarkup.length != 1) {
            return false;
        }

        const markup = journalMarkup[0];
        return markup.render_data.css_class.indexOf('bountifulBeanstalk-plantedVine') > -1;
    }

    private isStartingNewRoom(quest: CastleAttributes): boolean {
        return quest.castle.room_position == 0 && quest.castle.is_boss_chase == false;
    }

    private isStartingChase(quest: CastleAttributes): boolean {
        return quest.castle.room_position == 19 && quest.castle.is_boss_chase == true;
    }

    private hasEmbellishment(embellishmentType: 'golden_key' | 'ruby_remover', userEmbellishments: Embellishment[]): boolean {
        const embellishment = userEmbellishments.find(v => v.type == embellishmentType);

        return embellishment?.is_active ?? false;
    }
}
