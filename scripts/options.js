// Saves options to chrome.storage
function save_options() {
    var success_messages = document.getElementById('success_messages').checked;
    var error_messages = document.getElementById('error_messages').checked;
    var icon_timer = document.getElementById('icon_timer').checked;
    var horn_sound = document.getElementById('horn_sound').checked;
    var horn_alert = document.getElementById('horn_alert').checked;
    var track_crowns = document.getElementById('track_crowns').checked;
    var tsitu_loader_on = document.getElementById('tsitu_loader_on').checked;
    var tsitu_loader_offset = document.getElementById('tsitu_loader_offset').value;
    chrome.storage.sync.set({
        success_messages: success_messages,
        error_messages: error_messages,
        icon_timer: icon_timer,
        horn_sound: horn_sound,
        horn_alert: horn_alert,
        track_crowns: track_crowns,
        tsitu_loader_on: tsitu_loader_on,
        tsitu_loader_offset: tsitu_loader_offset
    }, function() {
        document.getElementById('save_status').style.visibility = "visible";
        setTimeout(function() {
            document.getElementById('save_status').style.visibility = "hidden";
        }, 2000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default values
    chrome.storage.sync.get({
        success_messages: true,
        error_messages: true,
        icon_timer: true,
        horn_sound: false,
        horn_alert: false,
        track_crowns: true,
        tsitu_loader_on: false,
        tsitu_loader_offset: 80
    }, function(items) {
        document.getElementById('success_messages').checked = items.success_messages;
        document.getElementById('error_messages').checked = items.error_messages;
        document.getElementById('icon_timer').checked = items.icon_timer;
        document.getElementById('horn_sound').checked = items.horn_sound;
        document.getElementById('horn_alert').checked = items.horn_alert;
        document.getElementById('track_crowns').checked = items.track_crowns;
        document.getElementById('tsitu_loader_on').checked = items.tsitu_loader_on;
        document.getElementById('tsitu_loader_offset').value = items.tsitu_loader_offset;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
