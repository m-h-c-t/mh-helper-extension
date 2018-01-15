// Saves options to chrome.storage
function save_options() {
    var success_messages = document.getElementById('success_messages').checked;
    var error_messages = document.getElementById('error_messages').checked;
    chrome.storage.sync.set({
        success_messages: success_messages,
        error_messages: error_messages
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
        error_messages: true
    }, function(items) {
        document.getElementById('success_messages').checked = items.success_messages;
        document.getElementById('error_messages').checked = items.error_messages;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
