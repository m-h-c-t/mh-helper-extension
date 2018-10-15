function findOpenMHTab(button_pressed, callback, silent) {
    chrome.tabs.query({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']}, function(tabs) {
        if (tabs.length > 0) {
            callback(tabs[0].id, button_pressed);
        }
        else if (!silent) {
            displayErrorPopup("Please navigate to MouseHunt page first.");
        }
    });
}

function sendMessageToScript(tab_id, button_pressed) {
    // Switch to mh tab
    if (button_pressed === "horn") {
        chrome.tabs.update(tab_id, {'active': true});
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab_id, {jacks_link: button_pressed}, function (response) {});
}

document.addEventListener('DOMContentLoaded', function() {
    let version_element = document.getElementById("version");
    if (version_element) {
        version_element.innerText = ' v' + chrome.runtime.getManifest().version;
    }
    findOpenMHTab("huntTimer", updateHuntTimer, true);

    let buttons = [
        'mhmh',
        'userhistory',
        'ryonn',
        'horn',
        'tsitu_loader'
    ];
    buttons.forEach(function(id) {
        let button_element = document.getElementById(id);
        if (!button_element) {
            return;
        }
        button_element.addEventListener('click', function() {
            findOpenMHTab(id, sendMessageToScript);
        });
    });
});

function updateHuntTimerField(tab, huntTimerField) {
    chrome.tabs.sendMessage(tab, {jacks_link: "huntTimer"}, function (response) {
        if (huntTimerField === null) {
            return;
        }
        if (response === "Ready!") {
            huntTimerField.innerHTML = '<img src="images/horn.png" class="horn">';
        } else {
            huntTimerField.textContent = response;
        }
    });
}

function updateHuntTimer(tab, button_pressed) {
    let huntTimerField = document.getElementById("huntTimer");
    updateHuntTimerField(tab, huntTimerField); // Fire now
    setInterval(updateHuntTimerField, 1000, tab, huntTimerField); // Continue firing each second
}

function displayErrorPopup(message) {
    let error_popup = document.getElementById('error_popup');
    error_popup.innerText = message;
    error_popup.style.display = 'block';
    setTimeout(function() {
        error_popup.style.display = 'none';
    }, 2000);
}

var options_button = document.getElementById('options_button');
if (options_button !== null) {
    options_button.addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage();
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
}
