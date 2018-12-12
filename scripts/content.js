(function () {
if (document.body == null) {
    return;
}
// Pass version # from manifest to injected script
var extension_version = document.createElement("input");
extension_version.setAttribute("id", "mhhh_version");
extension_version.setAttribute("type", "hidden");
extension_version.setAttribute("value", chrome.runtime.getManifest().version);
document.body.appendChild(extension_version);

// Add flash message div
var mhhh_flash_message_div = document.createElement("div");
mhhh_flash_message_div.setAttribute("id", "mhhh_flash_message_div");
mhhh_flash_message_div.setAttribute(
    "style",
    "display:none;" +
    "z-index:100;" +
    "position:fixed;" +
    "top:20%;" +
    "background-color: white;" +
    "padding: 10px;" +
    "border-radius: 5px;" +
    "box-shadow: 0 0 10px 1px black;");
document.body.appendChild(mhhh_flash_message_div);

// Inject main script
var s = document.createElement('script');
s.src = chrome.extension.getURL('scripts/main.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// Display Tsitu's Loader
chrome.storage.sync.get({
    tsitu_loader_on: false,
    tsitu_loader_offset: 80
}, items => {
    if (items.tsitu_loader_on) {
        // There must be a better way of doing this
        window.postMessage({
            "jacks_message": 'tsitu_loader',
            "tsitu_loader_offset": items.tsitu_loader_offset,
            "file_link": chrome.runtime.getURL('third_party/tsitus/bookmarkletloader')
        }, "*");
    }
});

// Handles messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if ([
        "userhistory",
        "mhmh",
        "ryonn",
        "horn",
        "tsitu_loader"
    ].includes(request.jacks_link)) {
        let file_link = '';
        if (request.jacks_link == "tsitu_loader") {
            file_link = chrome.extension.getURL('third_party/tsitus/bookmarkletloader');
        }
        // Forwards messages from popup to main script
        window.postMessage({ "jacks_message": request.jacks_link, "file_link": file_link }, "*");
    } else if (request.jacks_link === "huntTimer") {
        if (document.getElementsByClassName('mousehuntHud-huntersHorn-response')[0] != null &&
            window.getComputedStyle(document.getElementsByClassName('mousehuntHud-huntersHorn-response')[0]).display === 'block') {
            sendResponse("King's Reward");
        } else {
            let hunt_timer = document.getElementById('huntTimer');
            if (hunt_timer != null) { // Must have this check for Firefox
                sendResponse(hunt_timer.textContent);
            } else {
                sendResponse("Logged out");
            }
        }
    } else if (request.jacks_link === "show_horn_alert") {
        window.postMessage({ "jacks_message": request.jacks_link }, "*");
    }
});

window.addEventListener("message",
    event => {
        if (event.data.jacks_settings_request !== 1) {
            return;
        }
        // Can we use `mhhhOptions` from options.js here (or that save / restore function)?
        chrome.storage.sync.get({
            success_messages: true, // defaults
            error_messages: true, // defaults
            icon_timer: true, // defaults
            horn_sound: false, // defaults
            custom_sound: '', // defaults
            horn_volume: 100, // defaults
            horn_alert: false, // defaults
            horn_webalert: false, // defaults
            track_crowns: true // defaults
        },
        items => event.source.postMessage({ jacks_settings_response: 1, settings: items }, event.origin));
    },
    false
);

}());
