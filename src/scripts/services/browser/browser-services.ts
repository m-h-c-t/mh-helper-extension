export function isBrowserSafariApi(): boolean {
    return (
        navigator.userAgent.includes(" Safari/")
        && !navigator.userAgent.includes(" Chrome/")
        && !navigator.userAgent.includes(" Chromium/")
    );
}
