import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {FloatingIslandsStager} from '@scripts/modules/stages/environments/floatingIslands';
import {User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {FloatingIslandHuntingSiteAtts} from '@scripts/types/hg/quests/floatingIslands';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage, getDefaultUser} from '@tests/scripts/hunt-filter/common';
import * as stageTest from '@tests/scripts/modules/stages/environments/floatingIslands.spec';

describe('Floating Islands exemptions', () => {
    let logger: LoggerService;
    let stager: FloatingIslandsStager;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        stager = new FloatingIslandsStager();
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preUser = {...getDefaultUser(), ...getFloatingIslandsUser()};
            postUser = {...getDefaultUser(), ...getFloatingIslandsUser()};
            preMessage = {...getDefaultIntakeMessage()};
            postMessage = {...getDefaultIntakeMessage()};
        });

        describe('Enemy Encounters' , () => {
            describe.each<{mouse: string, atts: Partial<FloatingIslandHuntingSiteAtts>}>([
                {mouse: 'Warden of Wind', atts: {is_low_tier_island: true}},
                {mouse: 'Paragon of the Lawless', atts: {is_high_tier_island: true}},
                {mouse: 'Empyrean Empress', atts: {is_vault_island: true}},

            ])('$mouse', ({mouse, atts}) => {
                const bossAtts: Partial<FloatingIslandHuntingSiteAtts> = {
                    is_enemy_encounter: true,
                    ...atts,
                };
                const regularAtts: Partial<FloatingIslandHuntingSiteAtts> = {
                    is_enemy_encounter: false,
                    ...atts,
                };

                it('should accept on transition to boss', () => {
                    preMessage.mouse = postMessage.mouse = 'Daydreamer';
                    // regular atts go in pre, boss goes in post
                    setHuntingSiteAtts(regularAtts, bossAtts);

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(true);
                });

                it('should accept on transition from boss', () => {
                    preMessage.mouse = postMessage.mouse = mouse;
                    // reverse the above condition to get transtion from boss
                    setHuntingSiteAtts(bossAtts, regularAtts);

                    const valid = target.validateMessage(preMessage, postMessage);

                    expect(valid).toBe(true);
                });
            });

        });

        function setHuntingSiteAtts(preAttributes: Partial<FloatingIslandHuntingSiteAtts>,
            postAttributes: Partial<FloatingIslandHuntingSiteAtts>) {
            preUser.quests = {
                QuestFloatingIslands: {
                    hunting_site_atts: Object.assign({}, stageTest.getDefaultEnvironmentAtts(), preAttributes),
                },
            };

            postUser.quests = {
                QuestFloatingIslands: {
                    hunting_site_atts: Object.assign({}, stageTest.getDefaultEnvironmentAtts(), postAttributes),
                },
            };

            applyStage();
        }

        /** Sets the pre and post message stage based on current pre and post user */
        function applyStage() {
            stager.addStage(preMessage, preUser, {} as User, {});
            stager.addStage(postMessage, postUser, {} as User, {});
        }
    });

    function getFloatingIslandsUser(): User {
        return {
            environment_name: 'Floating Islands',
            quests: {
                QuestFloatingIslands: stageTest.getDefaultQuest(),
            },
        } as User;
    }
});
