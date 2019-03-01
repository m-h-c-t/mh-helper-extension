// Saves options to chrome.storage
let mhhhOptions = [ // `let` scope to avoid adding to window while still being global.
    {name: 'success_messages', p: 'checked', default: true},
    {name: 'error_messages', p: 'checked', default: true},
    {name: 'debug_logging', p: 'checked', default: false},
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
function save_options() {
    let currentOptions = mhhhOptions
        .map(opt => ({name: opt.name, val: document.getElementById(opt.name)[opt.p]}))
        .reduce((acc, obj) => (acc[obj.name] = obj.val, acc), {});
    // Trim the custom sound (can this instead be done when defocusing after user data entry?)
    currentOptions.custom_sound = currentOptions.custom_sound.trim();

    chrome.storage.sync.set(currentOptions, () => {
        document.getElementById('save_status').style.visibility = "visible";
        setTimeout(() => document.getElementById('save_status').style.visibility = "hidden", 2000);
    });

    // Reload MH pages to take effect now
    chrome.tabs.query(
        {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
        tabs => tabs.forEach(tab => chrome.tabs.reload(tab.id))
    );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default values where available.
    let defaultOptions = mhhhOptions
      .filter(prop => prop.default !== undefined)
      .reduce((acc, prop) => (acc[prop.name] = prop.default, acc), {});
    chrome.storage.sync.get(defaultOptions, items => {
        mhhhOptions.forEach(prop => document.getElementById(prop.name)[prop.p] = items[prop.name]);
        document.getElementById('horn_volume_output')['value'] = items['horn_volume'];
        document.getElementById('tsitu_loader_offset_output')['value'] = items['tsitu_loader_offset'];
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

// Volume
function update_range_output() {
    document.querySelector("output[for=" + this.id).value = this.value;
}

document.querySelectorAll('.input_range').forEach(
    item => item.addEventListener('input', update_range_output)
);

// Play sound -- TODO: find a way to play files locally
function play_my_sound() {
    let file_path = document.querySelector("#custom_sound").value.trim();
    if (!file_path) {
        file_path = chrome.extension.getURL('sounds/bell.mp3');
    }
    let mySound = new Audio(file_path);
    mySound.volume = document.getElementById('horn_volume').value / 100;
    mySound.play();
}
document.querySelector("#play_sound").addEventListener('click', play_my_sound);
