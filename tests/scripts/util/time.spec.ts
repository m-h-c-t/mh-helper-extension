import { getUnixTimestamp } from '@scripts/util/time';

describe('getUnixTimetamp', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return the number of seconds since epoch', () => {
        const millisecondsSinceEpoch = 42000;
        vi.setSystemTime(millisecondsSinceEpoch);

        expect(getUnixTimestamp()).toBe(42);
    });
});
