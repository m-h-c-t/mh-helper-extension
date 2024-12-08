const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const RemoteDownloadFileWebpackPlugin = require('./RemoteDownloadFileWebpackPlugin.js');

const srcScripts = path.resolve(__dirname, '../src/scripts/');
const outpath = path.resolve(__dirname, '../dist/');

module.exports = {
    entry: {
        background: path.join(srcScripts, 'background.js'),
        content: path.join(srcScripts, 'content.js'),
        main: path.join(srcScripts, 'main.js'),
        options: path.join(srcScripts, 'options.js'),
        popup: path.join(srcScripts, 'popup.js'),
        theme: path.join(srcScripts, 'theme.js'),
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
        plugins: [new TsconfigPathsPlugin()]
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
        new RemoteDownloadFileWebpackPlugin([
            {
                urlPrefix:'https://raw.githubusercontent.com/MHCommunity/mh-dark-mode/main/css/',
                pathPrefix: 'third_party/potatosalad/css/',
                files: [
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
                ],
            },
            {
                urlPrefix: 'https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/',
                pathPrefix: 'third_party/tsitu/',
                files: [
                    'bm-analyzer.min.js',
                    'bm-crafting.min.js',
                    'bm-cre.min.js',
                    'bm-crown.min.js',
                    'bm-map.min.js',
                    'bm-menu.min.js',
                    'bm-powers.min.js',
                    'bm-setup-fields.min.js',
                    'bm-setup-items.min.js',
                ],
            },
        ])
    ],
};
