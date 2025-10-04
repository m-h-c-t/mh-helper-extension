import { isBrowserSafariApi } from '@scripts/services/browser/browser-services';

export class BrowserApi {
    static isSafariApi: boolean = isBrowserSafariApi();

    static async tabsQuery(options: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
        return await chrome.tabs.query(options);
    }

    static async tabsQueryFirst(options: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab | null> {
        const tabs = await BrowserApi.tabsQuery(options);
        if (tabs.length > 0) {
            return tabs[0];
        }

        return null;
    }

    /**
     * Gets the background page for the extension. This method is
     * not valid within manifest v3 background service workers. As
     * a result, it will return null when called from that context.
     */
    static getBackgroundPage(): Window | null {
        if (typeof chrome.extension.getBackgroundPage === 'undefined') {
            return null;
        }

        return chrome.extension.getBackgroundPage();
    }

    /**
     * Accepts a window object and determines if it is
     * associated with the background page of the extension.
     *
     * @param window - The window to check.
     */
    static isBackgroundPage(window: Window & typeof globalThis): boolean {
        return typeof window !== 'undefined' && window === BrowserApi.getBackgroundPage();
    }

    // Keep track of all the events registered in a Safari popup so we can remove
    // them when the popup gets unloaded, otherwise we cause a memory leak
    private static trackedChromeEventListeners: [
        event: chrome.events.Event<(...args: unknown[]) => unknown>,
        callback: (...args: unknown[]) => unknown,
    ][] = [];

    static messageListener(
        name: string,
        callback: (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: any,
            sender: chrome.runtime.MessageSender,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sendResponse: any,
        ) => boolean | void,
    ) {
        BrowserApi.addListener(chrome.runtime.onMessage, callback);
    }

    /**
     * Adds a callback to the given chrome event in a cross-browser platform manner.
     *
     * **Important:** All event listeners in the browser extension popup context must
     * use this instead of the native APIs to handle unsubscribing from Safari properly.
     *
     * @param event - The event in which to add the listener to.
     * @param callback - The callback you want registered onto the event.
    */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static addListener<T extends (...args: readonly any[]) => any>(
        event: chrome.events.Event<T>,
        callback: T,
    ) {
        event.addListener(callback);

        if (BrowserApi.isSafariApi && !BrowserApi.isBackgroundPage(self)) {
            BrowserApi.trackedChromeEventListeners.push([event, callback]);
            BrowserApi.setupUnloadListeners();
        }
    }

    /**
     * Removes a callback from the given chrome event in a cross-browser platform manner.
     * @param event - The event in which to remove the listener from.
     * @param callback - The callback you want removed from the event.
     */
    static removeListener<T extends (...args: readonly unknown[]) => unknown>(
        event: chrome.events.Event<T>,
        callback: T,
    ) {
        event.removeListener(callback);

        if (BrowserApi.isSafariApi && !BrowserApi.isBackgroundPage(self)) {
            const index = BrowserApi.trackedChromeEventListeners.findIndex(([_event, eventListener]) => {
                return eventListener == callback;
            });
            if (index !== -1) {
                BrowserApi.trackedChromeEventListeners.splice(index, 1);
            }
        }
    }

    // Setup the event to destroy all the listeners when the popup gets unloaded in Safari, otherwise we get a memory leak
    private static setupUnloadListeners() {
        // The MDN recommend using 'visibilitychange' but that event is fired any time the popup window is obscured as well
        // 'pagehide' works just like 'unload' but is compatible with the back/forward cache, so we prefer using that one
        self.addEventListener('pagehide', () => {
            for (const [event, callback] of BrowserApi.trackedChromeEventListeners) {
                event.removeListener(callback);
            }
        });
    }

    /**
    * Handles reloading the extension using the underlying functionality exposed by the browser API.
    */
    static reloadExtension() {
        // If we do `chrome.runtime.reload` on safari they will send an onInstalled reason of install
        // and that prompts us to show a new tab, this apparently doesn't happen on sideloaded
        // extensions and only shows itself production scenarios. See: https://bitwarden.atlassian.net/browse/PM-12298
        if (this.isSafariApi) {
            return self.location.reload();
        }
        return chrome.runtime.reload();
    }
}
