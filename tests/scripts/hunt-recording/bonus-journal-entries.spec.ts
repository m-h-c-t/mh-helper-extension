import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { LoggerService } from '@scripts/services/logging';
import type { UserSettings } from '@scripts/services/settings/settings.service';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

import { BonusJournalEntries } from '@scripts/hunt-recording/bonus-journal-entries';
import { ItemCache } from '@scripts/hunt-recording/item-cache';
import { HgResponseBuilder, UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

const entry = (css_class: string, text = ''): JournalMarkup => ({
    render_data: {
        entry_id: 1, css_class, entry_timestamp: 0, text, environment: '', entry_date: '', mouse_type: '',
    },
});

describe('BonusJournalEntries', () => {
    let submissionService: ReturnType<typeof mock<SubmissionService>>;
    let itemCache: ItemCache;
    let bonusEntries: BonusJournalEntries;

    beforeEach(() => {
        submissionService = mock<SubmissionService>();
        itemCache = new ItemCache(mock<LoggerService>(), mock(), mock());
        bonusEntries = new BonusJournalEntries(
            mock<LoggerService>(),
            submissionService,
            mock<ExtensionLog>(),
            itemCache,
            () => ({'tracking-events': false}) as UserSettings,
        );
    });

    const inEnvironment = (environment_name: string): HgResponse => new HgResponseBuilder()
        .withUser(new UserBuilder().withEnvironment({environment_id: 1, environment_name}).build())
        .build();

    it('adds the Rainbow Quill detail in the hunt\'s own environment', () => {
        const bonus = bonusEntries.read([entry('entry short misc custom rainbowQuillSpecialEffect')], inEnvironment('Afterword Acres'));

        expect(bonus.moreDetails).toEqual({rainbow_quill_trigger: true});
    });

    it('skips the Rainbow Quill detail outside the Folklore Forest regions that track it', () => {
        const bonus = bonusEntries.read([entry('entry short misc custom rainbowQuillSpecialEffect')], inEnvironment('Gloomy Greenwood'));

        expect(bonus.moreDetails).toEqual({});
    });

    it('resolves Desert Heater Base loot by name from the item cache', () => {
        itemCache.record(new HgResponseBuilder()
            .withInventory({gouda_cheese: {item_id: 98, name: 'Gouda Cheese', type: 'gouda_cheese', quantity: 1}})
            .build());
        const response = new HgResponseBuilder().withUnknown({inventory: []}).build();
        const heater = entry('entry short misc custom desert_heater_base_trigger',
            'The mouse dropped 3 <a class="" href="https://www.mousehuntgame.com/item.php?item_type=gouda_cheese">Gouda Cheese</a>');

        const bonus = bonusEntries.read([heater], response);
        bonusEntries.submitConvertibles(bonus, response.inventory);

        expect(submissionService.submitItemConvertible).toHaveBeenCalledExactlyOnceWith(
            {id: 2952, name: 'Desert Heater Base', quantity: 1},
            [{id: 98, name: 'Gouda Cheese', quantity: 3}],
        );
    });

    it('returns the entries that are not bonus entries', () => {
        const hunt = entry('entry short active catchsuccess');
        const bonus = bonusEntries.read([entry('entry short misc custom pirate_sleigh_trigger'), hunt], new HgResponseBuilder().build());

        expect(bonus.others).toEqual([hunt]);
        expect(bonus.moreDetails).toEqual({pirate_sleigh_trigger: true});
    });
});
