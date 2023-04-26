import {getUnixTimestamp} from "@scripts/util/time";

describe('getUnixTimetamp', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return the number of seconds since epoch', () => {
        const millisecondsSinceEpoch = 42000;
        jest.setSystemTime(millisecondsSinceEpoch);

        expect(getUnixTimestamp()).toBe(42);
    });
});
