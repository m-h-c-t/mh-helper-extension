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
const dark_mode_files = [
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/giftbox.css',
        filepath: 'giftbox.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/inbox.css',
        filepath: 'inbox.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/inventory.css',
        filepath: 'inventory.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/main.css',
        filepath: 'main.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/marketplace.css',
        filepath: 'marketplace.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/messagebox.css',
        filepath: 'messagebox.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/profile.css',
        filepath: 'profile.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/scoreboard.css',
        filepath: 'scoreboard.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/shop.css',
        filepath: 'shop.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/team.css',
        filepath: 'team.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/trap.css',
        filepath: 'trap.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/treasuremap.css',
        filepath: 'treasuremap.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/camp/camp.css',
        filepath: 'camp/camp.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/camp/hud.css',
        filepath: 'camp/hud.css',
    },
    {
        url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/camp/journal.css',
        filepath: 'camp/journal.css',
    },

];

if (!fs.existsSync(dark_mode_path_prefix + 'camp')) {
    fs.mkdirSync(dark_mode_path_prefix + 'camp', {recursive: true});
}

dark_mode_files.forEach((one_file) => {
    download(one_file.url, dark_mode_path_prefix + one_file.filepath, () => {
        console.log('Downloaded ' + dark_mode_path_prefix + one_file.filepath);
    });
});

// Tsitu's Autoloader and bookmarklet files
const tsitu_path_prefix = 'dist/third_party/tsitu/';
const tsitus_files = [
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-analyzer.min.js',
        filepath: 'bm-analyzer.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-crafting.min.js',
        filepath: 'bm-crafting.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-cre.min.js',
        filepath: 'bm-cre.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-crown.min.js',
        filepath: 'bm-crown.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-map.min.js',
        filepath: 'bm-map.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-menu.min.js',
        filepath: 'bm-menu.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-powers.min.js',
        filepath: 'bm-powers.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-setup-fields.min.js',
        filepath: 'bm-setup-fields.min.js',
    },
    {
        url: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-setup-items.min.js',
        filepath: 'bm-setup-items.min.js',
    },
];

if (!fs.existsSync(tsitu_path_prefix)) {
    fs.mkdirSync(tsitu_path_prefix, {recursive: true});
}

tsitus_files.forEach((one_file) => {
    download(one_file.url, tsitu_path_prefix + one_file.filepath, () => {
        console.log('Downloaded ' + tsitu_path_prefix + one_file.filepath);
    });
});
