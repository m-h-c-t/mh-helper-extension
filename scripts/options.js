// JS script available only within the embedded options.html page
let mhhhOptions = [
    {name: 'success_messages', p: 'checked', default: true},
    {name: 'error_messages', p: 'checked', default: true},
    {name: 'icon_timer', p: 'checked', default: true},
    {name: 'horn_sound', p: 'checked', default: false},
    {name: 'custom_sound', p: 'value', default: ''},
    {name: 'horn_volume', p: 'value', default: 100},
    {name: 'horn_volume_output', p: 'value'},
    {name: 'horn_alert', p: 'checked', default: false},
    {name: 'horn_webalert', p: 'checked', default: false},
    {name: 'track_crowns', p: 'checked', default: true},
    {name: 'tsitu_loader_on', p: 'checked', default: false},
    {name: 'tsitu_loader_offset', p: 'value', default: 80},
    {name: 'tsitu_loader_offset_output', p: 'value'}
];

// Click "Save" -> store the extension's settings in chrome.storage.
document.getElementById('save').addEventListener('click', () => {
    const currentOptions = mhhhOptions
        .map(opt => ({name: opt.name, val: document.getElementById(opt.name)[opt.p]}))
        .reduce((acc, obj) => (acc[obj.name] = obj.val, acc), {});
    // Trim the custom sound (can this instead be done when defocusing after user data entry?)
    currentOptions.custom_sound = currentOptions.custom_sound.trim();

    chrome.storage.sync.set(currentOptions, () => {
        document.getElementById('save_status').style.visibility = "visible";
        setTimeout(() => document.getElementById('save_status').style.visibility = "hidden", 2000);
    });

    // Reload all open MH pages to apply these settings.
    chrome.tabs.query(
        {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
        tabs => tabs.forEach(tab => chrome.tabs.reload(tab.id))
    );
});

// After loading the options page, display the last-saved settings (or defaults if unset).
document.addEventListener('DOMContentLoaded', () => {
    // Use default values where available.
    const defaultOptions = mhhhOptions
      .filter(prop => prop.default !== undefined)
      .reduce((acc, prop) => (acc[prop.name] = prop.default, acc), {});
    chrome.storage.sync.get(defaultOptions, items => {
        mhhhOptions.forEach(prop => document.getElementById(prop.name)[prop.p] = items[prop.name]);
        // Display the numeric values of the range-input sliders.
        document.getElementById('horn_volume_output').value = items.horn_volume;
        document.getElementById('tsitu_loader_offset_output').value = items.tsitu_loader_offset;
    });
});

// Echo the value of range controls to an output div.
document.querySelectorAll('.input_range').forEach(
    item => item.addEventListener('input', () => {
        const output = document.querySelector("output[for=" + item.id);
        if (output) {
            output.value = item.value;
        }
    })
);

// Attach audio handler for the horn sound alert button.
// TODO: Update settings page to allow selecting a local file, rather than only choosing a remote URL.
document.querySelector("#play_sound").addEventListener('click', () => {
    let file_path = document.querySelector("#custom_sound").value.trim();
    if (!file_path) {
        file_path = chrome.extension.getURL('sounds/bell.mp3');
    }
    const mySound = new Audio(file_path);
    mySound.volume = document.getElementById('horn_volume').value / 100;
    mySound.play();
});
