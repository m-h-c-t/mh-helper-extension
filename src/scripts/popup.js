import { badgeTimerExtensionMessenger } from './modules/badge-timer/badge-timer.background';

// JS script available only within the pop-up html pages (popup.html & popup2.html)
/**
 * Query the open tabs and locate the MH tabs. Passes the first result to the callback, along with the invoking button.
 * @param {Function} callback A function that expects the MH page's tab ID and possibly the button that invoked the call
 * @param {string} [button_id] the HTML id of the pressed button, to be forwarded to callback
 * @param {boolean} [silent] if true, errors will not be displayed to the user.
 */
function findOpenMHTab(callback, button_id, silent) {
    chrome.tabs.query({url: ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']}, (tabs) => {
        if (tabs.length > 0) {
            callback(tabs[0].id, button_id);
        } else if (!silent) {
            displayErrorPopup('Please navigate to MouseHunt page first.');
        }
    });
}

/**
 * Forward the pressed button to the content script on the identified tab.
 * (Horn button clicks also activate the MH page.)
 * @param {number} tab_id The tab ID of the MH page
 * @param {string} button_id The HTML element ID of the button that was clicked
 */
function sendMessageToScript(tab_id, button_id) {
    // Switch to MH tab if needed.
    const needsMHPageActive = ['tsitu_loader'];
    if (needsMHPageActive.includes(button_id)) {
        chrome.tabs.update(tab_id, {active: true});
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab_id, {mhct_link: button_id});
}

document.addEventListener('DOMContentLoaded', () => {
    const version_element = document.getElementById('version');
    if (version_element) {
        version_element.innerText = ` version: ${chrome.runtime.getManifest().version}`;
    }

    // Schedule updates of the horn timer countdown.
    const huntTimerField = document.getElementById('huntTimer');
    if (huntTimerField) {
        setInterval(async () => {
            await updateHuntTimerField(huntTimerField);
        }, 1000);
    }

    // Send specific clicks to the content script for handling and/or additional forwarding.
    ['mhmh', 'userhistory', 'ryonn', 'horn', 'tsitu_loader'].forEach((id) => {
        const button_element = document.getElementById(id);
        if (button_element) {
            button_element.addEventListener('click', () => findOpenMHTab(sendMessageToScript, id));
        }
    });

    document.querySelectorAll('.tableSwap').forEach(e => e.addEventListener('click', swapTables));
});

/**
 * Query the MH page and display the time remaining until the next horn.
 * @param {HTMLElement} [huntTimerField] The div element corresponding to the horn countdown timer.
 */
async function updateHuntTimerField(huntTimerField) {
    const timeLeft = await badgeTimerExtensionMessenger.sendMessage('getTimeLeft');
    if (timeLeft === 0) {
        huntTimerField.innerHTML = '<img src="images/horn.png" class="horn">';
    } else if (timeLeft > 0) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        huntTimerField.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/**
 * Display the associated message
 * @param {string} message The message to display
 */
function displayErrorPopup(message) {
    const error_popup = document.getElementById('error_popup');
    error_popup.innerText = message;
    error_popup.style.display = 'block';
    setTimeout(() => error_popup.style.display = 'none', 2000);
}

function swapTables() {
    const current = document.querySelector('.table-container.active');
    const next = document.querySelector('.table-container:not(.active)');

    current.classList.remove('active');
    next.classList.add('active');
}
