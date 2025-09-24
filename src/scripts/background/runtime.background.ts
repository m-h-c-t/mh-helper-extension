import {BrowserApi} from "@scripts/services/browser/browser-api";
import {LoggerService} from "@scripts/services/logging";

export default class RuntimeBackground {
    constructor(
        private logger: LoggerService
    ) {

        BrowserApi.addListener(chrome.runtime.onUpdateAvailable, this.onUpdateAvailable);
        BrowserApi.addListener(chrome.runtime.onInstalled, this.onInstalled);
    }

    async init() {
        if (!chrome.runtime) {
            return;
        }

        return Promise.resolve();
    }

    private onUpdateAvailable = (details: chrome.runtime.UpdateAvailableDetails) => {
        const currentVersion = chrome.runtime.getManifest().version;
        this.logger.info(`Runtime update available: ${currentVersion} -> ${details.version}`);

        BrowserApi.reloadExtension();
    };

    private onInstalled = (details: chrome.runtime.InstalledDetails) => {
        this.logger.info(`runtime onInstalled reason: ${details.reason}`);

        if (details.reason === 'update') {
            this.logger.debug("Reloading all MouseHunt tabs due to extension update...");
            void this.reloadMouseHuntTabs();
        }
    };

    private async reloadMouseHuntTabs() {
        const tabs = await BrowserApi.tabsQuery({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']});

        for (const tab of tabs) {
            if (tab.id) {
                await chrome.tabs.reload(tab.id);
            }
        }
    }
}
