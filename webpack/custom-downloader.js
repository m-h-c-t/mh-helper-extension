// credit to https://stackoverflow.com/a/62603539
const https = require('https');
const fs = require('fs');

const download = (url, dest, callback) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
        // noinspection JSUnresolvedFunction
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            callback();
        });
    });
};

// PotatoSalad Dark Mode files
const dark_mode_path_prefix = 'dist/third_party/potatosalad/css/';
const dark_mode_url_prefix = 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/';
const dark_mode_files = [
    'giftbox.css',
    'inbox.css',
    'inventory.css',
    'main.css',
    'marketplace.css',
    'messagebox.css',
    'profile.css',
    'scoreboard.css',
    'shop.css',
    'team.css',
    'trap.css',
    'treasuremap.css',
    'camp/camp.css',
    'camp/hud.css',
    'camp/journal.css',
];

if (!fs.existsSync(dark_mode_path_prefix + 'camp')) {
    fs.mkdirSync(dark_mode_path_prefix + 'camp', {recursive: true});
}

dark_mode_files.forEach((one_file) => {
    download(dark_mode_url_prefix + one_file.url, dark_mode_path_prefix + one_file.filepath, () => {
        console.log('Downloaded ' + dark_mode_path_prefix + one_file.filepath);
    });
});

// Tsitu's Autoloader and bookmarklet files
const tsitu_path_prefix = 'dist/third_party/tsitu/';
const tsitu_url_prefix = 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/';
const tsitus_files = [
    'bm-analyzer.min.js',
    'bm-crafting.min.js',
    'bm-cre.min.js',
    'bm-crown.min.js',
    'bm-map.min.js',
    'bm-menu.min.js',
    'bm-powers.min.js',
    'bm-setup-fields.min.js',
    'bm-setup-items.min.js',
];

if (!fs.existsSync(tsitu_path_prefix)) {
    fs.mkdirSync(tsitu_path_prefix, {recursive: true});
}

tsitus_files.forEach((one_file) => {
    download(tsitu_url_prefix + one_file.url, tsitu_path_prefix + one_file.filepath, () => {
        console.log('Downloaded ' + tsitu_path_prefix + one_file.filepath);
    });
});
