import type { User } from '@scripts/types/hg';
import type { QuestCeruleanSkyport } from '@scripts/types/hg/quests/ceruleanSkyport';
import type { IntakeMessage } from '@scripts/types/mhct';

import { CeruleanSkyportStager } from '@scripts/modules/stages/environments/ceruleanSkyport';

describe('Cerulean Skyport stages', () => {
    let stager: CeruleanSkyportStager;
    let message: IntakeMessage;

    beforeEach(() => {
        stager = new CeruleanSkyportStager();
        message = {} as IntakeMessage;
    });

    it('is registered for Cerulean Skyport', () => {
        expect(stager.environment).toBe('Cerulean Skyport');
    });

    it.each([undefined, null])('throws when QuestCeruleanSkyport is %p', (quest) => {
        const preUser = {quests: {QuestCeruleanSkyport: quest}} as User;

        expect(() => stager.addStage(message, preUser, {} as User, {}))
            .toThrow('QuestCeruleanSkyport is undefined');
    });

    it('sets Docked when the hunter is not shipping or intercepting', () => {
        stager.addStage(message, getUser({
            is_shipping: false,
            is_intercepting: false,
            current_shipment: [],
            current_raid: [],
        }), {} as User, {});

        expect(message.stage).toBe('Docked');
    });

    it.each([
        ['gas_shipment', 'Shipping - Atmo'],
        ['cloudstone_shipment', 'Shipping - Mining'],
        ['spice_shipment', 'Shipping - Spice'],
    ] as const)('maps %s to %s', (type, expected) => {
        stager.addStage(message, getUser({
            is_shipping: true,
            is_intercepting: false,
            current_shipment: {
                type,
                name: 'Shipment',
                location: {name: 'Anywhere'},
            },
            current_raid: [],
        }), {} as User, {});

        expect(message.stage).toBe(expected);
    });

    it('sets the intercepting stage from the active raid name', () => {
        stager.addStage(message, getUser({
            is_shipping: false,
            is_intercepting: true,
            current_shipment: [],
            current_raid: {
                type: 'fiery_warpath_raid',
                name: 'Fiery Warpath',
            },
        }), {} as User, {});

        expect(message.stage).toBe('Intercepting - Fiery Warpath');
    });

    it('prefers the intercepting stage when both shipping and intercepting are active', () => {
        stager.addStage(message, getUser({
            is_shipping: true,
            is_intercepting: true,
            current_shipment: {
                type: 'gas_shipment',
                name: 'Shipment',
                location: {name: 'Anywhere'},
            },
            current_raid: {
                type: 'fort_rox_raid',
                name: 'Fort Rox',
            },
        }), {} as User, {});
        expect(message.stage).toBe('Intercepting - Fort Rox');
    });

    function getUser(quest: QuestCeruleanSkyport): User {
        return {quests: {QuestCeruleanSkyport: quest}} as User;
    }
});
