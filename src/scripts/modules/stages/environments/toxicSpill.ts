import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {PollutionTitle, PollutionTitles, PollutionTitleStatus} from "@scripts/types/hg/quests";
import {IStager} from "../stages.types";


export class ToxicSpillStager implements IStager {
    readonly environment: string = 'Toxic Spill';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const preQuest = userPre.quests.QuestPollutionOutbreak;
        const postQuest = userPost.quests.QuestPollutionOutbreak;

        if (!preQuest || !postQuest) {
            throw new Error('QuestPollutionOutbreak is undefined');
        }

        const pre_titles = preQuest.titles;
        const post_titles = postQuest.titles;
        const formatted_titles: Record<PollutionTitle, string> = {
            hero:                 'Hero',
            knight:               'Knight',
            lord_lady:            'Lord/Lady',
            baron_baroness:       'Baron/Baroness',
            count_countess:       'Count/Countess',
            duke_dutchess:        'Duke/Duchess',
            grand_duke:           'Grand Duke/Duchess',
            archduke_archduchess: 'Archduke/Archduchess',
        };

        const active_pre_title = this.getActiveTitle(pre_titles);
        const active_post_title = this.getActiveTitle(post_titles);

        if (!this.isValidTitle(active_pre_title) || !this.isValidTitle(active_post_title)) {
            throw new Error('Skipping hunt due to unknown active title');
        }

        if (active_pre_title !== active_post_title) {
            throw new Error('Skipping hunt during server-side pollution change');
        }

        message.stage = formatted_titles[active_pre_title];
    }

    private isValidTitle(value: unknown): value is PollutionTitle {
        return typeof value === 'string' && PollutionTitles.includes(value as PollutionTitle);
    }

    private getActiveTitle(titles: Record<PollutionTitle, PollutionTitleStatus>): string | undefined {
        // find() will make a array of [PollutionTitle, {active: true}]. '.[0]' accesses first item in array (the title)
        return Object.entries(titles).find(([title, status]) => status.active)?.[0];
    }
}
