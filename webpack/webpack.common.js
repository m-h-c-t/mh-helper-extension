const path = require('path');
const srcScripts = '../src/scripts/';
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const outpath = path.resolve(__dirname, '../dist/');

module.exports = {
    entry: {
        background: path.join(__dirname, srcScripts, 'background.js'),
        content: path.join(__dirname, srcScripts, 'content.js'),
        main: path.join(__dirname, srcScripts, 'main.js'),
        options: path.join(__dirname, srcScripts, 'options.js'),
        popup: path.join(__dirname, srcScripts, 'popup.js'),
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
    ],
};
