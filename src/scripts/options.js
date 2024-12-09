function qs$(a, b) {
    if ( typeof a === 'string') {
        return document.querySelector(a);
    }
    if ( a === null ) { return null; }
    return a.querySelector(b);
}

function qsa$(a, b) {
    if ( typeof a === 'string') {
        return document.querySelectorAll(a);
    }
    if ( a === null ) { return []; }
    return a.querySelectorAll(b);
}

let currentSettings = {};

function onUserSettingsReceived(settings) {
    const checkboxes = qsa$('[data-setting-type="bool"]');
    const onCheckboxChange = ev => {
        const checkbox = ev.target;
        const name = checkbox.dataset.settingName || '';
        currentSettings[name] = checkbox.checked;

        synchronizeDOM();
    };
    for (const checkbox of checkboxes) {
        const name = checkbox.dataset.settingName || '';
        checkbox.checked = settings[name] === true;
        checkbox.addEventListener('change', onCheckboxChange);
    }

    const onValueChange = ev => {
        const input = ev.target;
        const name = input.dataset.settingName || '';
        currentSettings[name] = input.value;
    };
    qsa$('[data-setting-type="value"]').forEach(function(elem) {
        elem.value = settings[elem.dataset.settingName];
        elem.addEventListener('change', onValueChange);
    });

    synchronizeDOM();
}

function synchronizeDOM() {
    qsa$('[data-hidden-until]').forEach(elem => {
        const name = elem.dataset.hiddenUntil;
        const checkbox = document.querySelector(`input[data-setting-name="${name}"]`);
        if (checkbox.checked) {
            elem.classList.remove('hidden');
        } else {
            elem.classList.add('hidden');
        }
    });

    qsa$('input[type="range"]').forEach(function(elem) {
        const output = document.querySelector(`output[for="${elem.id}"`);
        if (output) {
            output.value = elem.value;
        }
    });
}

// Click "Save" -> store the extension's settings in chrome.storage.
document.getElementById('save').addEventListener('click', () => {
    chrome.runtime.sendMessage({what: 'userSettings', value: currentSettings});
    const save_button = document.getElementById('save');
    save_button.innerText = "Saved! (Refreshing MH Page)";
    save_button.classList.remove("btn-primary");
    save_button.classList.add("btn-success");
    setTimeout(() => {
        save_button.innerText = "Save";
        save_button.classList.remove("btn-success");
        save_button.classList.add("btn-primary");
    }, 2000);

    // Reload all open MH pages to apply these settings.
    chrome.tabs.query(
        {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
        tabs => tabs.forEach(tab => chrome.tabs.reload(tab.id))
    );
});

// Echo the value of range controls to an output div.
qsa$('input[type="range"]').forEach(
    item => item.addEventListener('input', () => {
        const output = document.querySelector(`output[for="${item.id}"`);
        if (output) {
            output.value = item.value;
        }
    })
);

// Attach audio handler for the horn sound alert button.
// TODO: Update settings page to allow selecting a local file, rather than only choosing a remote URL.
qs$("#play_sound").addEventListener('click', () => {
    let file_path = document.querySelector("#custom_sound").value.trim();
    if (!file_path) {
        file_path = chrome.runtime.getURL('sounds/bell.mp3');
    }
    const mySound = new Audio(file_path);
    mySound.volume = document.getElementById('horn_volume').value / 100;
    mySound.play();
});

// if firefox, hide background option from alert-type select
if (navigator.userAgent.includes('Firefox')) {
    qs$('#alert-type').querySelector('option[value="background"]').style.display = 'none';
}

chrome.runtime.sendMessage({what: 'userSettings'}, result => {
    currentSettings = result;
    onUserSettingsReceived(result);
});
