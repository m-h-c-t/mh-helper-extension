// JS script available only within the pop-up html pages (popup.html & popup2.html)
/**
 * Query the open tabs and locate the MH tabs. Passes the first result to the callback, along with the invoking button.
 * @param {string} button_pressed the HTML id of the pressed button, to be forwarded to callback
 * @param {Function} callback A function that expects the MH page's tab ID and possibly the button that invoked the call
 * @param {boolean} [silent] if true, errors will not be displayed to the user.
 */
function findOpenMHTab(button_pressed, callback, silent) {
    chrome.tabs.query({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']}, tabs => {
        if (tabs.length > 0) {
            callback(tabs[0].id, button_pressed);
        }
        else if (!silent) {
            displayErrorPopup("Please navigate to MouseHunt page first.");
        }
    });
}

/**
 * Forward the pressed button to the content script on the identified tab.
 * (Horn button clicks also activate the MH page.)
 * @param {number} tab_id The tab ID of the MH page
 * @param {string} button_pressed The HTML element ID of the button that was clicked
 */
function sendMessageToScript(tab_id, button_pressed) {
    // Switch to MH tab if needed.
    let needsMHPageActive = ['horn', 'tsitu_loader', 'mhmh', 'ryonn'];
    if (needsMHPageActive.includes(button_pressed)) {
        chrome.tabs.update(tab_id, {'active': true});
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab_id, {jacks_link: button_pressed});
}

document.addEventListener('DOMContentLoaded', () => {
    let version_element = document.getElementById("version");
    if (version_element) {
        version_element.innerText = ' v' + chrome.runtime.getManifest().version;
    }
    findOpenMHTab("huntTimer", updateHuntTimer, true);

    // Send specific clicks to the content script for handling and/or additional forwarding.
    ['mhmh', 'userhistory', 'ryonn', 'horn', 'tsitu_loader'].forEach(id => {
        let button_element = document.getElementById(id);
        if (button_element) {
            button_element.addEventListener('click', () => findOpenMHTab(id, sendMessageToScript));
        }
    });
});

/**
 * Query the MH page and display the time remaining until the next horn.
 * @param {number} tab The tab id of the MH page
 * @param {HTMLElement} [huntTimerField] The div element corresponding to the horn countdown timer.
 */
function updateHuntTimerField(tab, huntTimerField) {
    chrome.tabs.sendMessage(tab, {jacks_link: "huntTimer"}, response => {
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

/**
 * Schedule updates of the hunt timer field every second
 * @param {number} tab The tab id of the MH page
 * @param {string} button_pressed The element ID of the associated button that invoked this call
 */
function updateHuntTimer(tab, button_pressed) {
    let huntTimerField = document.getElementById("huntTimer");
    updateHuntTimerField(tab, huntTimerField); // Fire now
    setInterval(updateHuntTimerField, 1000, tab, huntTimerField); // Continue firing each second
}

/**
 * Display the associated message
 * @param {string} message The message to display
 */
function displayErrorPopup(message) {
    let error_popup = document.getElementById('error_popup');
    error_popup.innerText = message;
    error_popup.style.display = 'block';
    setTimeout(() => error_popup.style.display = 'none', 2000);
}

var options_button = document.getElementById('options_button');
if (options_button !== null) {
    options_button.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage();
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
}
