import {HornHud} from './util/HornHud';

(function () {
if (document.body == null) {
    return;
}
// Pass version # from manifest to injected script
const extension_version = document.createElement("input");
extension_version.setAttribute("id", "mhhh_version");
extension_version.setAttribute("type", "hidden");
extension_version.setAttribute("value", chrome.runtime.getManifest().version);
document.body.appendChild(extension_version);

// Add flash message div
const mhhh_flash_message_div = document.createElement("div");
mhhh_flash_message_div.setAttribute("id", "mhhh_flash_message_div");
mhhh_flash_message_div.setAttribute(
    "style",
    "display:none;" +
    "z-index:100;" +
    "position:fixed;" +
    "top: 0;" +
    "background-color: white;" +
    "padding: 1em;" +
    "font-size: larger;" +
    "width: 100%;" +
    "text-align: center;" +
    "box-shadow: 0px 1px 4px 0px black;" +
    "opacity: 95%;" +
    "pointer-events: none;" +
    "font-weight: 600;");
document.body.appendChild(mhhh_flash_message_div);

async function showDarkMode() {
    const settings = await new Promise((resolve) => {
        chrome.storage.sync.get({
            dark_mode: false,
        }, data => resolve(data));
    });

    function includeCSSfile(filepath) {
        const link_tag = document.createElement('link');
        link_tag.setAttribute('rel', 'stylesheet');
        link_tag.setAttribute('type', 'text/css');
        link_tag.setAttribute('href', chrome.runtime.getURL(filepath));
        (document.head || document.documentElement).appendChild(link_tag);
    }

    if (settings.dark_mode) {
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
showDarkMode();

// Inject main script
function injectMainScript() {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('scripts/main.js');
    (document.head || document.documentElement).appendChild(s);
    s.onload = () => {
        s.remove();
    };
}

injectMainScript();

// Handles messages from popup or background.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if ([
        "userhistory",
        "mhmh",
        "ryonn",
        "horn",
        "mhsh"
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
            getSettings()
                .then(settings => event.source.postMessage({
                    "mhct_settings_response": 1,
                    "settings": settings,
                }, event.origin));
        } else if (data.mhct_crown_update === 1) {
            data.origin = event.origin;
            chrome.runtime.sendMessage(data, (wasSubmitted) => event.source.postMessage({
                "mhct_message": "crownSubmissionStatus",
                "submitted": wasSubmitted,
                "settings": data.settings,
            }, event.origin));
        } else if (data.mhct_log_request === 1) {
            chrome.runtime.sendMessage({"log": data});
        } else if (data.mhct_finish_load === 1) {
            showTsituLoader();
        }
    },
    false
);

    /**
     * Promise to get the extension's settings.
     * @returns {Promise <Object <string, any>>} The extension's settings
     */
    function getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get({
                // DEFAULTS
                success_messages: true,
                error_messages: true,
                debug_logging: false,
                icon_timer: true,
                horn_sound: false,
                custom_sound: '',
                horn_volume: 100,
                horn_alert: false,
                horn_webalert: false,
                horn_popalert: false,
                tracking_enabled: true,
                escape_button_close: false,
                dark_mode: false,
            },
            items => {
                if (chrome.runtime.lastError) {
                    window.console.error(chrome.runtime.lastError.message);
                }
                resolve(items || {});
            });
        });
    }

    /**
     * Promise to show Tsitu's menu via the embedded script.
     * @param {boolean} forceShow Bypass settings and always show
     */
    async function showTsituLoader(forceShow) {
        const settings = await new Promise((resolve) => {
            chrome.storage.sync.get({
                tsitu_loader_on: false,
                tsitu_loader_offset: 80,
            }, data => resolve(data));
        });

        if (forceShow | settings.tsitu_loader_on) {
            // There must be a better way of doing this
            window.postMessage({
                mhct_message: 'tsitu_loader',
                // ensure offset is a string: https://github.com/tsitu/MH-Tools/blob/584b0182195d2fc35756dd34a74ee0573b845d1f/src/bookmarklet/bm-menu.js#L205
                tsitu_loader_offset: `${settings.tsitu_loader_offset}`,
                file_link: chrome.runtime.getURL('third_party/tsitu/bm-menu.min.js'),
            }, "*");
        }
    }

}());
