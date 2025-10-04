/**
 * Gets a number from a Hg stringy number (may contain commas).
 *
 * @param value A number that can be a string with commas.
 * @returns The parsed number.
 */
export function parseHgInt(value: string | number): number {
    if (value == null) {
        throw new Error('Cannot parse undefined value');
    }

    if (typeof value === 'number') {
        return value;
    }

    return parseInt(value.replace(/,/g, ''), 10);
}
