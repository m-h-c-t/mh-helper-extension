import {HornHud} from './util/hornHud';

(async function () {
if (document.body == null) {
    return;
}

let userSettings = {};
// Pass version # from manifest to injected script
const extension_version = document.createElement("input");
extension_version.setAttribute("id", "mhhh_version");
extension_version.setAttribute("type", "hidden");
extension_version.setAttribute("value", chrome.runtime.getManifest().version);
document.body.appendChild(extension_version);

async function createMessageDiv() {
    const type = userSettings['notification-message-display'];
    switch (type) {
        case 'hud': {
            break;
        }
        case 'toast':
        case 'banner': {
            const mhctMsg = document.createElement('div');
            mhctMsg.classList.add('mhct-msg-display', `mhct-${type}`);
            document.body.appendChild(mhctMsg);
            break;
        }
    }
}

async function showDarkMode() {
    function includeCSSfile(filepath) {
        const link_tag = document.createElement('link');
        link_tag.setAttribute('rel', 'stylesheet');
        link_tag.setAttribute('type', 'text/css');
        link_tag.setAttribute('href', chrome.runtime.getURL(filepath));
        (document.head || document.documentElement).appendChild(link_tag);
    }

    if (userSettings['enhancement-dark-mode']) {
        // There must be a better way of doing this

        const css_files = [
            "third_party/potatosalad/css/main.css",
            "third_party/potatosalad/css/messagebox.css",
            "third_party/potatosalad/css/giftbox.css",
            "third_party/potatosalad/css/trap.css",
            "third_party/potatosalad/css/inbox.css",
            "third_party/potatosalad/css/team.css",
            "third_party/potatosalad/css/marketplace.css",
            "third_party/potatosalad/css/profile.css",
            "third_party/potatosalad/css/shop.css",
            "third_party/potatosalad/css/scoreboard.css",
            "third_party/potatosalad/css/inventory.css",
            "third_party/potatosalad/css/treasuremap.css",
            "third_party/potatosalad/css/camp/camp.css",
            "third_party/potatosalad/css/camp/journal.css",
            "third_party/potatosalad/css/camp/hud.css",
        ];
        css_files.forEach(filepath => includeCSSfile(filepath));
        window.console.log("MHCT: Dark Theme loaded. Welcome to the Dark Side!");
    }
}

// Inject main script
function injectMainScript() {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('scripts/main.js');
    (document.head || document.documentElement).appendChild(s);
    s.onload = () => {
        s.remove();
    };
}

// Handles messages from popup or background.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if ([
        "userhistory",
        "mhmh",
        "ryonn",
        "horn",
    ].includes(request.mhct_link)) {
        // Forwards messages from popup to main script
        window.postMessage({"mhct_message": request.mhct_link}, "*");
    } else if (request.mhct_link === "huntTimer") {
        // Check for a King's Reward, otherwise report the displayed time until next horn.
        let message = "Logged out";
        const krPageElement = document.getElementsByClassName('mousehuntPage-puzzle-form-state hasPuzzle')[0];
        // KR can prompt a puzzle without the HUD changing. If either are displaying, a pending KR needs to be claimed
        if (HornHud.isPuzzleActive() ||
            krPageElement && window.getComputedStyle(krPageElement).display === 'block') {
            message = "King's Reward";
        } else {
            const timerText = HornHud.getTimerText();
            if (timerText) {
                message = timerText;
            }
        }
        sendResponse(message);
    } else if (request.mhct_link === "show_horn_alert") {
        window.postMessage({"mhct_message": request.mhct_link}, "*");
    } else if (request.mhct_link === "tsitu_loader") {
        showTsituLoader(true);
    } else if (request.mhct_link === "makenoise") {
        window.postMessage({"mhct_message": request.mhct_link, "volume": request.volume, "sound_url": request.sound_url}, "*");
    }
});

// Handle messages from embedded script (main.js)
window.addEventListener("message",
    event => {
        // Only accept messages from window with our embedded script
        if (event.source != window){
            return;
        }

        // Lots of MessageEvents are sent, so only respond to ones we know about.
        const data = event.data;
        if (data.mhct_settings_request === 1) {
            event.source.postMessage({
                "mhct_settings_response": 1,
                "settings": userSettings,
            }, event.origin);
        } else if (data.mhct_crown_update === 1) {
            data.origin = event.origin;
            chrome.runtime.sendMessage(data, (wasSubmitted) => event.source.postMessage({
                "mhct_message": "crownSubmissionStatus",
                "submitted": wasSubmitted,
            }, event.origin));
        } else if (data.mhct_log_request === 1) {
            chrome.runtime.sendMessage({"log": data});
        } else if (data.mhct_finish_load === 1) {
            showTsituLoader();
        } else if (data.mhct_display_message === 1) {
            displayFlashMessage(data.type, data.message);
        }
    },
    false
);

    /**
     * Promise to get the extension's settings.
     * @returns {Promise <Object <string, any>>} The extension's settings
     */
    async function getSettings() {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({what: 'userSettings'}, resolve);
        });
    }

    /**
     * Promise to show Tsitu's menu via the embedded script.
     * @param {boolean} forceShow Bypass settings and always show
     */
    async function showTsituLoader(forceShow = false) {
        if (forceShow || userSettings['enhancement-tsitu-loader']) {
            // There must be a better way of doing this
            window.postMessage({
                mhct_message: 'tsitu_loader',
                // ensure offset is a string: https://github.com/tsitu/MH-Tools/blob/584b0182195d2fc35756dd34a74ee0573b845d1f/src/bookmarklet/bm-menu.js#L205
                tsitu_loader_offset: `${userSettings['enhancement-tsitu-loader-offset']}`,
                file_link: chrome.runtime.getURL('third_party/tsitu/bm-menu.min.js'),
            }, "*");
        }
    }

    /**
     * Display the given message in an appropriately colored pop-up flash message.
     * @param {"error"|"warning"|"success"} type The type of message being displayed, which controls the color and duration.
     * @param {string} message The message content to display.
     */
    async function displayFlashMessage(type, message) {
        const showSuccess = userSettings['notification-success-messages'];
        const showError = userSettings['notification-error-messages'];

        if ((type === 'success' && !showSuccess) ||
            (type !== 'success' && !showError)
        ) {
            return;
        }

        if (userSettings['notification-message-display'] === 'hud') {
            await HornHud.showMessage(message, type);
        } else {
            const mhctMsg = document.querySelector('.mhct-msg-display');
            if (mhctMsg == null) {
                return;
            }

            mhctMsg.textContent = `MHCT Helper: ${message}`;
            mhctMsg.classList.add('mhct-msg-display--active', `mhct-${type}`);

            setTimeout(() => {
                mhctMsg.classList.remove('mhct-msg-display--active', `mhct-${type}`);
            }, 1500 + 2000 * (type !== "success"));
        }
    }

    // Initial page load setup
    userSettings = await getSettings();
    createMessageDiv();
    injectMainScript();
    showDarkMode();

}());
