import type { JournalMarkup, User } from '@scripts/types/hg';
import type { QuestFortRox } from '@scripts/types/hg/quests';
import type { IntakeMessage } from '@scripts/types/mhct';
import type { RecursivePartial } from '@tests/utility/types';

import { FortRoxStager } from '@scripts/modules/stages/environments/fortRox';
import { UserBuilder } from '@tests/utility/builders';
import { mergician } from 'mergician';
import { mock } from 'vitest-mock-extended';

describe('Fort Rox stages', () => {
    const message = mock<IntakeMessage>();
    const postUser = mock<User>();
    const journal = mock<JournalMarkup>();

    let preUser: User & {quests: {QuestFortRox: QuestFortRox}};
    let stager: FortRoxStager;

    beforeEach(() => {
        stager = new FortRoxStager();

        const quest: QuestFortRox = {
            current_phase: 'day',
            tower_status: '',
            fort: {
                w: {level: 0, status: 'inactive'},
                b: {level: 0, status: 'inactive'},
                c: {level: 0, status: 'inactive'},
                m: {level: 0, status: 'inactive'},
                t: {level: 0, status: 'inactive'}
            }
        };
        preUser = new UserBuilder()
            .withEnvironment({
                environment_id: 0,
                environment_name: 'Fort Rox',
            })
            .withQuests({QuestFortRox: quest})
            .build() as User & {quests: {QuestFortRox: QuestFortRox}};
    });

    it('should be for the Fort Rox environment', () => {
        expect(stager.environment).toBe('Fort Rox');
    });

    it('should throw when QuestFortRox is undefined', () => {
        // @ts-expect-error - testing nullish input
        preUser.quests.QuestFortRox = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestFortRox is undefined');
    });

    it.each`
        nightStage          | expected
        ${'stage_one'}      | ${'Twilight'}
        ${'stage_two'}      | ${'Midnight'}
        ${'stage_three'}    | ${'Pitch'}
        ${'stage_four'}     | ${'Utter Darkness'}
        ${'stage_five'}     | ${'First Light'}
    `('should set stage to $expected during night when in $nightStage', ({nightStage, expected}) => {
        preUser.quests.QuestFortRox = generateQuest({
            current_phase: 'night',
            current_stage: nightStage,
        });

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should throw when night stage is unknown', () => {
        preUser.quests.QuestFortRox = generateQuest({
            current_phase: 'night',
            // @ts-expect-error - testing invalid input
            current_stage: 'stage_foo',
            tower_status: '',
            fort: preUser.quests.QuestFortRox.fort
        });

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping unknown Fort Rox stage');
    });

    it('should set stage to Day when is day', () => {
        preUser.quests.QuestFortRox = generateQuest({
            current_phase: 'day',
            tower_status: '',
            fort: preUser.quests.QuestFortRox.fort
        });

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Day');
    });

    it('should set stage to Dawn when in dawn', () => {
        preUser.quests.QuestFortRox = generateQuest({
            current_phase: 'dawn',
            tower_status: '',
            fort: preUser.quests.QuestFortRox.fort
        });

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Dawn');
    });

    it('should set stage to Heart of the Meteor when in lair', () => {
        preUser.quests.QuestFortRox = generateQuest({
            current_phase: 'lair',
            tower_status: '',
            fort: preUser.quests.QuestFortRox.fort
        });

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Heart of the Meteor');
    });

    it('should throw when there is an unhandled state', () => {
        preUser.quests.QuestFortRox = generateQuest({
            // @ts-expect-error - testing invalid input
            current_phase: null,
            tower_status: '',
            fort: preUser.quests.QuestFortRox.fort
        });

        expect(() => {
            stager.addStage(message, preUser, postUser, journal);
        }).toThrow('Skipping unknown Fort Rox stage');
    });

    function generateQuest(quest: RecursivePartial<QuestFortRox>): QuestFortRox {
        // @ts-expect-error - allowing partial for test generation
        return mergician({
            current_phase: 'day',
            tower_status: '',
            fort: {
                w: {level: 0, status: 'inactive'},
                b: {level: 0, status: 'inactive'},
                c: {level: 0, status: 'inactive'},
                m: {level: 0, status: 'inactive'},
                t: {level: 0, status: 'inactive'}
            }
        }, quest);
    }
});
