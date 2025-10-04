import {LoggingAssertions} from '@tests/utility/logging-assertions';
import {HgResponseBuilder, IntakeMessageBuilder, UserBuilder} from '@tests/utility/builders';
import {soundHorn} from './util/soundHorn';
import MockServer from './util/mockServer';
import nock from 'nock';
import qs from 'qs';

describe('MHCT Hunt Submission', () => {

    let server: MockServer;

    beforeEach(() => {
        vi.resetAllMocks();
        server = new MockServer();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should intake a simple hunt', async () => {
        server.setPageResponse(
            new HgResponseBuilder()
                .withPage({
                    journal: {
                        entries_string: `data-entry-id='0'`,
                    },
                })
                .build()
        );

        const huntResponse = new HgResponseBuilder()
            .withActiveTurn(true)
            .withUser(
                new UserBuilder()
                    .withTurn({
                        num_active_turns: 1,
                        next_activeturn_seconds: 900,
                    })
                    .build()
            )
            .withJournalMarkup([
                {
                    render_data: {
                        entry_id: 1,
                        css_class: 'active catchsuccess',
                        entry_timestamp: 419,
                        text: 'MouseHunt Community Tools Mouse',
                        environment: 'Server Room',
                        entry_date: '12:00 am',
                        mouse_type: 'mhct',
                    },
                },
            ])
            .build();
        server.setActiveTurnResponse(huntResponse);

        const intakeRequestEvent = server.on('request', 'https://www.mhct.win/intake.php');

        await soundHorn();

        // Data is posted to mhct as x-www-form-urlencoded
        try {
            const event = await intakeRequestEvent;
            const data = await event.request.text();
            const actual = qs.parse(data);

            const expectedMessage = new IntakeMessageBuilder().build(huntResponse);
            expect(actual).toEqual(expect.objectContaining(expectedMessage));
        } finally {
            LoggingAssertions.expectNoWarningsOrErrors();
        }
    });
});

