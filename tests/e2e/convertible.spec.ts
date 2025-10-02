import {LoggingAssertions} from '@tests/utility/logging-assertions';
import {ConvertibleMessageBuilder, HgConvertibleResponseBuilder} from '@tests/utility/builders';
import {openConvertible} from './util/openConvertible';
import MockServer from './util/mockServer';
import nock from 'nock';
import qs from 'qs';

describe('MHCT Convertible Submission', () => {
    let server: MockServer;

    beforeEach(() => {
        vi.resetAllMocks();
        server = new MockServer();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should intake an opened convertible', async () => {
        const convertibleResponse = new HgConvertibleResponseBuilder()
            .withConvertible({
                convertible: {
                    name: 'Baz Convertible',
                    item_id: 555,
                    type: 'baz_convertible',
                    quantity: 1
                },
                items: [
                    {
                        item_id: 555,
                        name: 'Foo Stat Item',
                        pluralized_name: 'Foo Stat Items',
                        type: 'foo_stat_item',
                        quantity: 32,
                    }
                ]
            })
            .build();

        server.HitGrabServer
            .post('/managers/ajax/users/useconvertible.php')
            .reply(200, () => convertibleResponse);

        const postedDataPromise = server.on('request', 'https://www.mhct.win/convertible_intake.php');

        // "Open" convertible
        await openConvertible('baz_convertible', 1);

        // Data is posted to mhct as x-www-form-urlencoded
        try {
            const event = await postedDataPromise;
            const data = await event.request.text();
            const actual = qs.parse(data);

            const expected = new ConvertibleMessageBuilder()
                .build(convertibleResponse);
            expect(actual).toEqual(expect.objectContaining(expected));
        } finally {
            LoggingAssertions.expectNoWarningsOrErrors();
        }
    });
});
