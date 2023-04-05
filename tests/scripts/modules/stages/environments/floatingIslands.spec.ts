import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {IStager} from "@scripts/modules/stages/stages.types";
import {FloatingIslandHuntingSiteAtts} from "@scripts/types/quests/floatingIslands";
import {FloatingIslandsStager} from "@scripts/modules/stages/environments/floatingIslands";

// Common Nomenclature
// LAI = Low Altitude Island
// HAI = High Altitude Island
// SP = Sky Palace = Vault


/* Stages
Base stage names
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
"<high_stage> Paragon"
"Empress"

Palace Stage Modifiers:
Whenever a palace run gets 3x of a the same modifier it gets put into a specific stage
"<stage> <mod_counter>x <mod_type>"
<mod_type> can be the following:
"Ancient Jade Stockpile"
"Empyrean Seal Stowage"
"Ore and Glass Deposit"
"Sky Pirate Den" (only when NOT hunting with SPS)

Special stage cases
Loot cache are handled slightly different, both for low, high, and palace runs but only with CC and ERCC equipped
"<stage> - Loot x<mod_count>" (mod 2x for low/high and 2x to 4x for palace)
Pirates are the final special case. Equipping Sky Pirate Swiss will change the stage.
"No Pirates"
"<Island|Vault> Pirates x<mod_count>" Choose Island (even for high alt) or Vault, then up to 2x for low/high and up to 4x for palace

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

    describe('Enemy Encounters', () => {
        it('should set stage to island name by default', () => {
            setHuntingSiteAtts({});
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island');
        });

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

            expect(message.stage).toBe('Test Island Paragon');
        });

        it('should set stage to Empress on vault enemy encounter', () => {
            setHuntingSiteAtts({
                is_enemy_encounter: true,
                is_vault_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Empress');
        });

        it('should append Enemy Encounter to stage on unhandled enemy encounter', () => {
            setHuntingSiteAtts({
                is_enemy_encounter: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island Enemy Encounter');
        });
    });

    describe('Pirates', () => {
        beforeEach(() => {
            preUser.bait_name = "Sky Pirate Swiss Cheese";
        });

        it('should be Island pirates with no vault', () => {
            setHuntingSiteAtts({
                is_vault_island: false,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Island No Pirates');
        });

        it('should be Island pirates with no vault', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Vault No Pirates');
        });

        it('should append number of active pirate mod panels', () => {
            setHuntingSiteAtts({
                activated_island_mod_types: ['ore_bonus', 'sky_pirates', 'sky_pirates'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Island Pirates x2');
        });
    });

    describe('Loot Cache', () => {
        it('should default stage when user has 1x loot_cache active with CCC', () => {
            preUser.bait_name = "Cloud Cheesecake";
            setHuntingSiteAtts({
                activated_island_mod_types: ['loot_cache'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island');
        });

        it('should default stage when user has at least 2x loot_cache active with CCC', () => {
            preUser.bait_name = "Cloud Cheesecake";
            setHuntingSiteAtts({
                activated_island_mod_types: ['loot_cache', 'loot_cache'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island - Loot x2');
        });
    });

    describe('Vault', () => {
        // Not exhaustive tests, just core functionality
        it('should set to default stage in vault', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island');
        });

        it('should set to default stage with less than 3 common active mod panels', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
                activated_island_mod_types: ['ore_gem_bonus', 'ore_gem_bonus', 'charm_bonus', 'charm_bonus'],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island');
        });

        it('should set to default stage with less than 3 common active mod panels', () => {
            setHuntingSiteAtts({
                is_vault_island: true,
                activated_island_mod_types: ['ore_gem_bonus', 'ore_gem_bonus', 'ore_gem_bonus', 'cloudstone_bonus'],
                island_mod_panels: [
                    {
                        type: 'ore_gem_bonus',
                        name: 'Ore and Gem Deposit',
                    },
                    {
                        type: 'charm_bonus',
                        name: 'Empyrean Seal Stowage',
                    },
                ],
            });
            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('Test Island 3x Ore and Gem Deposit');
        });
    });

    function setHuntingSiteAtts(attributes: Partial<FloatingIslandHuntingSiteAtts>) {
        preUser.quests = {
            QuestFloatingIslands: {
                hunting_site_atts: Object.assign({}, getDefaultEnvironmentAtts(), attributes),
            },
        };
    }

    function getDefaultEnvironmentAtts(): FloatingIslandHuntingSiteAtts {
        return {
            island_name: 'Test Island',
            is_enemy_encounter: null,
            is_low_tier_island: null,
            is_high_tier_island: null,
            is_vault_island: null,
            activated_island_mod_types: [],
            island_mod_panels: [],
        };
    }
});
