// @vitest-environment happy-dom
import type { LoggerService } from '@scripts/services/logging';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgResponse, JournalMarkup } from '@scripts/types/hg';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { HuntRecorder } from '@scripts/hunt-recording/hunt-recorder';
import linkedEntryJson from '@tests/fixtures/friend-hunt/linked-journal-entry.json';
import { HgResponseBuilder, UserBuilder } from '@tests/utility/builders';
import $ from 'jquery';
import { mock } from 'vitest-mock-extended';

const linkedEntryFixture = linkedEntryJson as unknown as JournalMarkup;

const inventory = {
    cauldron_potion_ingredient_stat_item: {item_id: 1, name: 'Mousedrake Roots', type: 'cauldron_potion_ingredient_stat_item', quantity: 10},
    cursed_gold_stat_item: {item_id: 2, name: 'Cursed Gold', type: 'cursed_gold_stat_item', quantity: 10},
};

const buildResponse = (): HgResponse => new HgResponseBuilder()
    .withAuras({})
    .withInventory(inventory)
    .withUser(new UserBuilder().withEnvironment({environment_id: 1, environment_name: 'Gloomy Greenwood'}).build())
    .build();

describe('HuntRecorder', () => {
    let before: HgResponse;
    let after: HgResponse;
    let submissionService: ReturnType<typeof mock<SubmissionService>>;
    let recorder: HuntRecorder;

    beforeAll(() => {
        (globalThis as unknown as {$: unknown}).$ = $;
    });

    beforeEach(() => {
        before = buildResponse();
        after = buildResponse();
        submissionService = mock<SubmissionService>();
        const logger = mock<LoggerService>();
        recorder = new HuntRecorder(logger, new IntakeRejectionEngine(logger), submissionService);
    });

    it('submits a linked hunt with hunt_type and the before setup', () => {
        recorder.record({type: 'linked', before, after, entry: linkedEntryFixture});

        expect(submissionService.submitHunt).toHaveBeenCalledOnce();
        const msg = submissionService.submitHunt.mock.calls[0][0];
        expect(msg.hunt_details?.hunt_type).toBe('linked');
        expect(msg.mouse).toBe('Admiral Arrrgh');
        expect(msg.caught).toBe(1);
        expect(msg.attracted).toBe(1);
        expect(msg.entry_id).toBe(344018);
        expect(msg.loot).toEqual([
            expect.objectContaining({name: 'Mousedrake Roots', amount: 4}),
            expect.objectContaining({name: 'Cursed Gold', amount: 3500}),
        ]);
        expect(msg.trap.id).toBe(before.user.weapon_item_id);
    });

    it('does not submit or report rejection when a linked hunt fails message rules', () => {
        after.user.environment_name = 'Somewhere Else';

        recorder.record({type: 'linked', before, after, entry: linkedEntryFixture});

        expect(submissionService.submitHunt).not.toHaveBeenCalled();
        expect(submissionService.submitRejection).not.toHaveBeenCalled();
    });

    it('active hunts have no hunt_type', () => {
        recorder.record({type: 'active', before, after, entry: linkedEntryFixture});

        const msg = submissionService.submitHunt.mock.calls[0][0];
        expect(msg.hunt_details?.hunt_type).toBeUndefined();
    });

    it('still reports rejections for active hunts that change location', () => {
        after.user.environment_name = 'Somewhere Else';

        recorder.record({type: 'active', before, after, entry: linkedEntryFixture});

        expect(submissionService.submitHunt).not.toHaveBeenCalled();
        expect(submissionService.submitRejection).toHaveBeenCalledOnce();
    });
});
