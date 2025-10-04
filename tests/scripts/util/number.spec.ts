import { parseHgInt } from '@scripts/util/number';

describe('parseHgInt', () => {
    it('should throw on null or undefined input', () => {
        expect(() => parseHgInt(undefined!)).toThrow();
        expect(() => parseHgInt(null!)).toThrow();
    });

    it.each([
        42,
        100000,
        8,
    ])('should just return numbers', (x) => {
        expect(parseHgInt(x)).toBe(x);
    });

    it.each`
        input       | expected
        ${'86'}     | ${86}
        ${'951'}    | ${951}
        ${'1834'}   | ${1834}
    `('should parse string numbers', ({input, expected}) => {
        expect(parseHgInt(input)).toBe(expected);
    });

    it.each`
        input       | expected
        ${'8,765'}     | ${8765}
        ${'42,420'}    | ${42420}
        ${'1,000,000'} | ${1000000}
    `('should parse string numbers with commas', ({input, expected}) => {
        expect(parseHgInt(input)).toBe(expected);
    });
});
