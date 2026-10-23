import { ApiService } from '@scripts/services/api.service';

describe('ApiService', () => {
    const fetchMock = vi.fn<typeof fetch>();
    let apiService: ApiService;

    beforeEach(() => {
        fetchMock.mockReset();
        fetchMock.mockResolvedValue(new Response(null, {status: 204}));
        vi.stubGlobal('fetch', fetchMock);

        apiService = new ApiService(() => 123456);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const getSentRequest = (): Request => fetchMock.mock.calls[0][0] as Request;

    it.each([
        'https://www.mousehuntgame.com/managers/ajax/pages/page.php',
        'https://www.mhct.win/uuid.php',
        'https://api.mouse.rip/items',
    ])('sends X-Requested-By header to %s', async (url) => {
        await apiService.send('POST', url, {foo: 'bar'}, false);

        expect(getSentRequest().headers.get('X-Requested-By')).toBe('MHCT/123456');
    });

    it('reads the version at send time', async () => {
        let version = 0;
        apiService = new ApiService(() => version);

        version = 999;
        await apiService.send('GET', 'https://www.mhct.win/', null, false);

        expect(getSentRequest().headers.get('X-Requested-By')).toBe('MHCT/999');
    });

    it('lets alterHeaders override the header', async () => {
        await apiService.send('GET', 'https://www.mhct.win/', null, false, (headers) => {
            headers.set('X-Requested-By', 'custom');
        });

        expect(getSentRequest().headers.get('X-Requested-By')).toBe('custom');
    });
});
