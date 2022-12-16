const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const SaveRemoteFilePlugin = require('save-remote-file-webpack-plugin');

const srcScripts = path.resolve(__dirname, '../src/scripts/');
const outpath = path.resolve(__dirname, '../dist/');

module.exports = {
    entry: {
        background: path.join(srcScripts, 'background.js'),
        content: path.join(srcScripts, 'content.js'),
        main: path.join(srcScripts, 'main.js'),
        options: path.join(srcScripts, 'options.js'),
        popup: path.join(srcScripts, 'popup.js'),
    },
    output: {
        path: outpath,
        filename: 'scripts/[name].js',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    transpileOnly: true,
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    plugins: [
        // Typescript type check and lint on separate process
        new ForkTsCheckerWebpackPlugin(),
        // Move assets to dist/
        new CopyPlugin({
            patterns: [
                {
                    from: './',
                    to: outpath,
                    globOptions: {
                        ignore: ['**/scripts'],
                    },
                    context: 'src/',
                },
            ],
        }),
        new SaveRemoteFilePlugin([
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/giftbox.css',
                filepath: 'third_party/potatosalad/css/giftbox.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/inbox.css',
                filepath: 'third_party/potatosalad/css/inbox.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/inventory.css',
                filepath: 'third_party/potatosalad/css/inventory.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/main.css',
                filepath: 'third_party/potatosalad/css/main.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/marketplace.css',
                filepath: 'third_party/potatosalad/css/marketplace.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/messagebox.css',
                filepath: 'third_party/potatosalad/css/messagebox.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/profile.css',
                filepath: 'third_party/potatosalad/css/profile.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/scoreboard.css',
                filepath: 'third_party/potatosalad/css/scoreboard.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/shop.css',
                filepath: 'third_party/potatosalad/css/shop.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/team.css',
                filepath: 'third_party/potatosalad/css/team.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/trap.css',
                filepath: 'third_party/potatosalad/css/trap.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/treasuremap.css',
                filepath: 'third_party/potatosalad/css/treasuremap.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/camp/camp.css',
                filepath: 'third_party/potatosalad/css/camp/camp.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/camp/hud.css',
                filepath: 'third_party/potatosalad/css/camp/hud.css',
                hash: false,
            },
            {
                url: 'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/camp/journal.css',
                filepath: 'third_party/potatosalad/css/camp/journal.css',
                hash: false,
            },
        ]),
    ],
};
