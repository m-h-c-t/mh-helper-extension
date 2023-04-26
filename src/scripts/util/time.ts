
/**
 * Get the current Unix timestamp
 * @returns Seconds since epoch
 */
export function getUnixTimestamp(): number {
    return Math.round(Date.now() / 1000);
}
