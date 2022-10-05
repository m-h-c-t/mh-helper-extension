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
    "padding: 2em;" +
    "width: 100%;" +
    "text-align: center;" +
    "box-shadow: 0px 1px 4px 0px black;" +
    "opacity: 95%;" +
    "font-weight: 600;");
document.body.appendChild(mhhh_flash_message_div);

// Inject main script
const s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/main.js');
(document.head || document.documentElement).appendChild(s);
s.onload = () => {
    // Display Tsitu's Loader
    chrome.storage.sync.get({
        tsitu_loader_on: false,
        tsitu_loader_offset: 80,
    }, items => {
        if (items.tsitu_loader_on) {
            // There must be a better way of doing this
            window.postMessage({
                "mhct_message": 'tsitu_loader',
                "tsitu_loader_offset": items.tsitu_loader_offset,
                "file_link": chrome.runtime.getURL('third_party/tsitu/bm-menu.min.js'),
            }, "*");
        }
    });
    s.remove();
};

// Handles messages from popup or background.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if ([
        "userhistory",
        "mhmh",
        "ryonn",
        "horn",
        "tsitu_loader",
    ].includes(request.mhct_link)) {
        let file_link = '';
        if (request.mhct_link == "tsitu_loader") {
            file_link = chrome.runtime.getURL('third_party/tsitu/bm-menu.min.js');
        }
        // Forwards messages from popup to main script
        window.postMessage({"mhct_message": request.mhct_link, "file_link": file_link}, "*");
    } else if (request.mhct_link === "huntTimer") {
        // Check for a King's Reward, otherwise report the displayed time until next horn.
        let message = "Logged out";
        const krHudElement = document.getElementsByClassName('mousehuntHud-huntersHorn-response')[0];
        const krPageElement = document.getElementsByClassName('mousehuntPage-puzzle-form-state hasPuzzle')[0];
        const hunt_timer = document.getElementById('huntTimer');
        // KR can prompt a puzzle without the HUD changing. If either are displaying, a pending KR needs to be claimed
        if (krHudElement && window.getComputedStyle(krHudElement).display === 'block' ||
            krPageElement && window.getComputedStyle(krPageElement).display === 'block') {
            message = "King's Reward";
        } else if (hunt_timer) {
            message = hunt_timer.textContent;
        }
        sendResponse(message);
    } else if (request.mhct_link === "show_horn_alert") {
        window.postMessage({"mhct_message": request.mhct_link}, "*");
    }
});

// Handle messages from embedded script (main.js)
window.addEventListener("message",
    event => {
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
        } else if (data.mhct_golem_submit === 1) {
            data.origin = event.origin;
            chrome.runtime.sendMessage(data, (wasSubmitted) => event.source.postMessage({
                mhct_message: 'golemSubmissionStatus',
                submitted: wasSubmitted,
                settings: data.settings,
            }, event.origin));
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
            success_messages: true, // defaults
            error_messages: true, // defaults
            debug_logging: false, // defaults
            icon_timer: true, // defaults
            horn_sound: false, // defaults
            custom_sound: '', // defaults
            horn_volume: 100, // defaults
            horn_alert: false, // defaults
            horn_webalert: false, // defaults
            horn_popalert: false, // defaults
            tracking_enabled: true, // defaults
            escape_button_close: false, // defaults
        },
        items => {
            if (chrome.runtime.lastError) {
                window.console.error(chrome.runtime.lastError.message);
            }
            resolve(items || {});
        });
    });
}

}());
