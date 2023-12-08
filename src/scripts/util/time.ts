
/**
 * Get the current Unix timestamp
 * @returns Seconds since epoch
 */
export function getUnixTimestamp(): number {
    return Math.round(Date.now() / 1000);
}

/**
 * Checks if the current time has pass the end date of an event.
 * @param eventEndDate The date at which ajax events will stop
 * @returns
 */
export function hasEventEnded(eventEndDate: Date) {
    return Date.now() > eventEndDate.getTime();
}
