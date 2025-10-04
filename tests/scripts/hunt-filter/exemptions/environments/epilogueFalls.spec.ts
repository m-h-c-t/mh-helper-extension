import type { IStager } from '@scripts/modules/stages/stages.types';
import type { LoggerService } from '@scripts/services/logging';
import type { RapidZoneType, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { EpilogueFallsStager } from '@scripts/modules/stages/environments/epilogueFalls';
import { HgResponseBuilder, IntakeMessageBuilder, UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('Epilogue Falls exemptions', () => {
    const logger: LoggerService = mock<LoggerService>();
    let stager: IStager;
    let target: IntakeRejectionEngine;
    let responseBuilder: HgResponseBuilder;
    let messageBuilder: IntakeMessageBuilder;

    beforeEach(() => {
        stager = new EpilogueFallsStager();
        target = new IntakeRejectionEngine(logger);
        responseBuilder = new HgResponseBuilder();
        messageBuilder = new IntakeMessageBuilder();
    });

    describe('validateMessage', () => {
        let preUser: User;
        let postUser: User;
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            const userBuilder = new UserBuilder()
                .withEnvironment({
                    environment_id: 0,
                    environment_name: 'Epilogue Falls',
                })
                .withQuests({
                    QuestEpilogueFalls: {
                        on_rapids: false,
                        rapids: {
                            zone_data: {
                                type: 'low_morsel_zone',
                                name: 'Sparse Morsel Zone',
                            },
                        },
                    },
                });

            preUser = userBuilder.build();
            postUser = userBuilder.build();

            preMessage = messageBuilder.build(
                responseBuilder.withUser(preUser).build()
            );

            postMessage = messageBuilder.build(
                responseBuilder.withUser(postUser).build()
            );
        });

        it.each<{
            preOnRapids: boolean;
            preZone: RapidZoneType;
            postOnRapids: boolean;
            postZone: RapidZoneType;
            shouldAccept: boolean;
        }>([
            // Shore <-> Rapids
            {preOnRapids: false, preZone: 'low_morsel_zone', postOnRapids: true, postZone: 'low_morsel_zone', shouldAccept: false},
            {preOnRapids: true, preZone: 'low_morsel_zone', postOnRapids: false, postZone: 'low_morsel_zone', shouldAccept: true},
            // Rapids <-> Waterfall
            {preOnRapids: true, preZone: 'rich_hook_zone', postOnRapids: true, postZone: 'waterfall_zone', shouldAccept: true},
            {preOnRapids: true, preZone: 'waterfall_zone', postOnRapids: true, postZone: 'rich_hook_zone', shouldAccept: false},
            // Rapids <-> Grotto
            {preOnRapids: true, preZone: 'low_morsel_zone', postOnRapids: true, postZone: 'grotto_zone', shouldAccept: false},
            {preOnRapids: true, preZone: 'grotto_zone', postOnRapids: true, postZone: 'low_morsel_zone', shouldAccept: false},
            // Shore <-> Waterfall
            {preOnRapids: false, preZone: 'low_morsel_zone', postOnRapids: true, postZone: 'waterfall_zone', shouldAccept: false},
            {preOnRapids: true, preZone: 'waterfall_zone', postOnRapids: false, postZone: 'low_morsel_zone', shouldAccept: true},
            // Shore <-> Grotto
            {preOnRapids: false, preZone: 'low_morsel_zone', postOnRapids: true, postZone: 'grotto_zone', shouldAccept: false},
            {preOnRapids: true, preZone: 'grotto_zone', postOnRapids: false, postZone: 'low_morsel_zone', shouldAccept: true},
            // Waterfall <-> Grotto
            {preOnRapids: true, preZone: 'waterfall_zone', postOnRapids: true, postZone: 'grotto_zone', shouldAccept: true},
            {preOnRapids: true, preZone: 'grotto_zone', postOnRapids: true, postZone: 'waterfall_zone', shouldAccept: false},
        ])(
            'when on_rapids changes from $preOnRapids to $postOnRapids and zone changes from $preZone to $postZone, shouldAccept is $shouldAccept',
            ({preOnRapids, preZone, postOnRapids, postZone, shouldAccept}) => {
                preUser.quests.QuestEpilogueFalls!.on_rapids = preOnRapids;
                preUser.quests.QuestEpilogueFalls!.rapids.zone_data.type = preZone;
                postUser.quests.QuestEpilogueFalls!.on_rapids = postOnRapids;
                postUser.quests.QuestEpilogueFalls!.rapids.zone_data.type = postZone;
                calculateStage();

                const valid = target.validateMessage(preMessage, postMessage);
                expect(valid).toBe(shouldAccept);
            }
        );

        /** Sets the pre and post message stage based on current pre and post user */
        function calculateStage() {
            stager.addStage(preMessage, preUser, postUser, {});
            stager.addStage(postMessage, postUser, postUser, {});
        }
    });
});
