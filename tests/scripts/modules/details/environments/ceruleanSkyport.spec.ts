import type { JournalMarkup, User } from '@scripts/types/hg';
import type { QuestCeruleanSkyport } from '@scripts/types/hg/quests/ceruleanSkyport';
import type { IntakeMessage } from '@scripts/types/mhct';

import { CeruleanSkyportDetailer } from '@scripts/modules/details/environments/ceruleanSkyport';
import { UserBuilder } from '@tests/utility/builders';

describe('Cerulean Skyport Detailer', () => {
    let detailer: CeruleanSkyportDetailer;
    let user: User;

    beforeEach(() => {
        detailer = new CeruleanSkyportDetailer();
        user = new UserBuilder().withQuests({}).build();
    });

    it('is registered for Cerulean Skyport', () => {
        expect(detailer.environment).toBe('Cerulean Skyport');
    });

    it('returns undefined when the quest is missing', () => {
        expect(detailer.addDetails({} as IntakeMessage, user, {} as User, {} as JournalMarkup)).toBeUndefined();
    });

    it('returns undefined while the hunter is Docked', () => {
        user.quests.QuestCeruleanSkyport = getQuest({
            is_shipping: false,
            is_intercepting: false,
            current_shipment: [],
            current_raid: [],
        });

        expect(detailer.addDetails({} as IntakeMessage, user, {} as User, {} as JournalMarkup)).toBeUndefined();
    });

    it('returns the shipment destination while shipping', () => {
        user.quests.QuestCeruleanSkyport = getQuest({
            is_shipping: true,
            is_intercepting: false,
            current_shipment: {
                type: 'gas_shipment',
                name: 'Atmospherium Gas Shipment',
                location: {name: 'Zokor'},
            },
            current_raid: [],
        });

        expect(detailer.addDetails({} as IntakeMessage, user, {} as User, {} as JournalMarkup)).toEqual({
            port: 'Zokor',
        });
    });

    it('returns the raid name while intercepting', () => {
        user.quests.QuestCeruleanSkyport = getQuest({
            is_shipping: false,
            is_intercepting: true,
            current_shipment: [],
            current_raid: {
                type: 'fort_rox_raid',
                name: 'Fort Rox',
            },
        });

        expect(detailer.addDetails({} as IntakeMessage, user, {} as User, {} as JournalMarkup)).toEqual({
            port: 'Fort Rox',
        });
    });

    function getQuest(quest: QuestCeruleanSkyport): QuestCeruleanSkyport {
        return quest;
    }
});
