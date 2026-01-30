import type { IStager } from '@scripts/modules/stages/stages.types';
import type { LoggerService } from '@scripts/services/logging';
import type { QuesoGeyserState, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { QuesoGeyserStager } from '@scripts/modules/stages/environments/quesoGeyser';
import { HgResponseBuilder, IntakeMessageBuilder, UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('Queso Geyser exemptions', () => {
    const logger: LoggerService = mock<LoggerService>();
    let stager: IStager;
    let target: IntakeRejectionEngine;
    let responseBuilder: HgResponseBuilder;
    let messageBuilder: IntakeMessageBuilder;

    beforeEach(() => {
        stager = new QuesoGeyserStager();
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
                    environment_name: 'Queso Geyser',
                })
                .withQuests({
                    QuestQuesoGeyser: {
                        state: 'collecting',
                        state_name: null,
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
            preState: QuesoGeyserState;
            preStateName: string | null;
            postState: QuesoGeyserState;
            postStateName: string | null;
            shouldAccept: boolean;
        }>([
            // Pressure Building -> Eruption (allowed)
            {preState: 'corked', preStateName: 'Tiny Cork', postState: 'eruption', postStateName: 'Tiny Eruption', shouldAccept: true},
            {preState: 'corked', preStateName: 'Small Cork', postState: 'eruption', postStateName: 'Small Eruption', shouldAccept: true},
            {preState: 'corked', preStateName: 'Medium Cork', postState: 'eruption', postStateName: 'Medium Eruption', shouldAccept: true},
            {preState: 'corked', preStateName: 'Large Cork', postState: 'eruption', postStateName: 'Large Eruption', shouldAccept: true},
            {preState: 'corked', preStateName: 'Epic Cork', postState: 'eruption', postStateName: 'Epic Eruption', shouldAccept: true},
            // Eruption -> Cork Collecting (allowed)
            {preState: 'eruption', preStateName: 'Tiny Eruption', postState: 'claim', postStateName: 'Tiny Eruption', shouldAccept: true},
            {preState: 'eruption', preStateName: 'Small Eruption', postState: 'claim', postStateName: 'Small Eruption', shouldAccept: true},
            {preState: 'eruption', preStateName: 'Medium Eruption', postState: 'claim', postStateName: 'Medium Eruption', shouldAccept: true},
            {preState: 'eruption', preStateName: 'Large Eruption', postState: 'claim', postStateName: 'Large Eruption', shouldAccept: true},
            {preState: 'eruption', preStateName: 'Epic Eruption', postState: 'claim', postStateName: 'Epic Eruption', shouldAccept: true},
            // Invalid transitions (not allowed)
            {preState: 'collecting', preStateName: null, postState: 'eruption', postStateName: 'Tiny Eruption', shouldAccept: false},
            {preState: 'eruption', preStateName: 'Tiny Eruption', postState: 'corked', postStateName: 'Tiny Cork', shouldAccept: false},
            {preState: 'claim', preStateName: 'Tiny Eruption', postState: 'eruption', postStateName: 'Tiny Eruption', shouldAccept: false},
        ])(
            'when state changes from $preState ($preStateName) to $postState ($postStateName), shouldAccept is $shouldAccept',
            ({preState, preStateName, postState, postStateName, shouldAccept}) => {
                preUser.quests.QuestQuesoGeyser!.state = preState;
                preUser.quests.QuestQuesoGeyser!.state_name = preStateName;
                postUser.quests.QuestQuesoGeyser!.state = postState;
                postUser.quests.QuestQuesoGeyser!.state_name = postStateName;
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
