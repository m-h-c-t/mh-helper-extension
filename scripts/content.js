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
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);


// Handles messages from popup
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (["userhistory", "mhmh", "tsitu_map", "ryonn", "horn", "tsitu_cre", "tsitu_setup"].indexOf(request.jacks_link) !== -1) {
        var file_link = '';
        if (request.jacks_link == "tsitu_cre") {
            file_link = chrome.extension.getURL('third_party/tsitus/crebookmarklet.min.js');
        } else if (request.jacks_link == "tsitu_setup") {
            file_link = chrome.extension.getURL('third_party/tsitus/setupbookmarklet.min.js');
        }
        // Forwards messages from popup to main script
        window.postMessage({ "jacks_message": request.jacks_link, "file_link": file_link }, "*");
    } else if (request.jacks_link === "huntTimer") {
        var hunt_timer = document.getElementById('huntTimer');
        if (hunt_timer != null) { // Must have this check for Firefox
            sendResponse(hunt_timer.textContent);
        }
    }
});

window.addEventListener("message",
    function(event) {
        if (event.data.jacks_settings_request !== 1) {
            return;
        }

        if (event.data.get_options === "messages") {
            chrome.storage.sync.get({
                success_messages: true, // defaults
                error_messages: true // defaults
            }, function (items) {
                event.source.postMessage(
                    {
                        jacks_settings_response: 1,
                        get_options: "messages",
                        settings: items
                    },
                    event.origin);
            });
        }
    },
    false
);
