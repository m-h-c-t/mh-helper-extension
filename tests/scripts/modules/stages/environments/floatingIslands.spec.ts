import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {IStager} from "@scripts/modules/stages/stages.types";
import {FloatingIslandHuntingSiteAtts, QuestFloatingIslands} from "@scripts/types/hg/quests/floatingIslands";
import {FloatingIslandsStager} from "@scripts/modules/stages/environments/floatingIslands";

// Common Nomenclature
// LAI = Low Altitude Island
// HAI = High Altitude Island
// SP = Sky Palace = Vault

/* Stages
Base stage names are built from the powertype then appended with Low or High or Palace

All island names for reference
+-----------+------------------+--------------------+--------------------+
|   Type    |       Low        |        High        |       Palace       |
+-----------+------------------+--------------------+--------------------+
| Arcane    | Arcane Island    | Arcane Keep        | Arcane Cauldron    |
| Draconic  | Draconic Island  | Draconic Sanctuary | Draconic Hoard     |
| Forgotten | Forgotten Island | Forgotten Fortress | Forgotten Tomb     |
| Hydro     | Hydro Island     | Hydro Hideaway     | Hydro Reservoir    |
| Law       | Law Island       | Law Garrison       | Law Lockup         |
| Physical  | Physical Island  | Physical Palisade  | Physical Strongbox |
| Shadow    | Shadow Island    | Shadow Stronghold  | Shadow Crypt       |
| Tactical  | Tactical Island  | Tactical Castle    | Tactical Maze      |
+-----------+------------------+--------------------+--------------------+

Quotes ("") around a phrase indicate stage name, otherwise comments.

Enemy encounter stages:
"Warden"
"<powertype> Paragon"
"Empress"

Palace Stage Modifiers:
Whenever a palace run gets 3x of a the same modifier it gets put into a specific stage
"<stage> - <mod_counter>x <mod_type>"
<mod_type> can be the following:
"Jade"
"Emp Seal"
"Glass + Ore"
"Pirates" (only when NOT hunting with SPS)

Special stage cases
Loot cache are handled slightly different, both for low, high, and palace runs but only with CC and ERCC equipped
"<stage> - <mod_count>x Loot" (mod 2x for low/high and 2x to 4x for palace)
Pirates are the final special case. Equipping Sky Pirate Swiss will change the stage.
"<[Low|High]|Palace> - <mod_count>x Pirates" Choose "Low|High" or Palace, then up to 2x for low/high and up to 4x for palace

*/

describe('Floating Islands stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new FloatingIslandsStager();
        message = {} as IntakeMessage;
        preUser = {
            quests: {},
        } as User;
        postUser = {} as User;

    });

    it('should throw when QuestFloatingIslands is undefined', () => {
        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestFloatingIslands is undefined');
    });

    it('should throw on unhandled island state', () => {
        setHuntingSiteAtts({});
        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Unknown Floating Island stage');
    });

    describe('Enemy Encounters', () => {

        it('should set stage to Warden on low tier enemy encounter', () => {
            setHuntingSiteAtts({
                is_enemy_encounter: true,
                is_low_tier_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Warden');
        });

        it('should append Paragon to stage on high tier enemy encounter', () => {
            setHuntingSiteAtts({
                is_enemy_encounter: true,
                is_high_tier_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Paragon');
        });

        it('should set stage to Empress on vault enemy encounter', () => {
            setHuntingSiteAtts({
                is_enemy_encounter: true,
                is_vault_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Empress');
        });
    });

    describe('Pirates', () => {
        beforeEach(() => {
            preUser.bait_name = "Sky Pirate Swiss Cheese";
        });

        it('should be Island pirates with no vault', () => {
            setHuntingSiteAtts({
                is_low_tier_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Low|High - 0x Pirates');
        });

        it('should be Island pirates with vault', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Palace - 0x Pirates');
        });

        it('should append number of active pirate mod panels', () => {
            setHuntingSiteAtts({
                is_low_tier_island: true,
                activated_island_mod_types: ['ore_bonus', 'sky_pirates', 'sky_pirates'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Low|High - 2x Pirates');
        });
    });

    describe('Loot Cache', () => {
        it('should default stage when user has 1x loot_cache active with CCC', () => {
            preUser.bait_name = "Cloud Cheesecake";
            setHuntingSiteAtts({
                is_low_tier_island: true,
                activated_island_mod_types: ['loot_cache'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Low');
        });

        it('should set loot cache stage when user has at least 2x loot_cache active with CCC', () => {
            preUser.bait_name = "Cloud Cheesecake";
            setHuntingSiteAtts({
                is_low_tier_island: true,
                activated_island_mod_types: ['loot_cache', 'loot_cache'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Low - 2x Loot');
        });

        it('should set loot cache stage when user has at least 2x loot_cache active with ERCCC', () => {
            preUser.bait_name = "Extra Rich Cloud Cheesecake";
            setHuntingSiteAtts({
                is_vault_island: true,
                activated_island_mod_types: ['loot_cache', 'loot_cache', 'loot_cache', 'loot_cache'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Palace - 4x Loot');
        });
    });

    describe('Vault', () => {
        // Not exhaustive tests, just core functionality
        it('should set to default stage in vault', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Palace');
        });

        it('should set to default stage with less than 3 common active mod panels', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
                activated_island_mod_types: ['ore_gem_bonus', 'ore_gem_bonus', 'charm_bonus', 'charm_bonus'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Palace');
        });

        it('should set to glore type stage with 3 common active mod panels', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
                activated_island_mod_types: ['ore_gem_bonus', 'ore_gem_bonus', 'ore_gem_bonus', 'cloudstone_bonus'],
                island_mod_panels: [
                    {
                        type: 'ore_gem_bonus',
                        name: 'Ore and Glass Deposit',
                    },
                    {
                        type: 'cloudstone_bonus',
                        name: 'Empyrean Seal Stowage',
                    },
                ],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('TestPowertype Palace - 3x Glass + Ore');
        });
    });

    it('should match on Launch Pad', () => {
        setHuntingSiteAtts({
            island_name: 'Launch Pad',
        });
        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Launch Pad');
    });

    function setHuntingSiteAtts(attributes: Partial<FloatingIslandHuntingSiteAtts>) {
        preUser.quests = {
            QuestFloatingIslands: {
                hunting_site_atts: Object.assign({}, getDefaultEnvironmentAtts(), attributes),
            },
        };
    }
});

export function getDefaultQuest(): QuestFloatingIslands {
    return {
        hunting_site_atts: getDefaultEnvironmentAtts(),
    };
}

export function getDefaultEnvironmentAtts(): FloatingIslandHuntingSiteAtts {
    return {
        island_name: 'TestPowertype Island', // <powertype> Island. Tests should expect "Test" to be powertype
        is_enemy_encounter: null,
        is_low_tier_island: null,
        is_high_tier_island: null,
        is_vault_island: null,
        activated_island_mod_types: [],
        island_mod_panels: [],
    };
}
