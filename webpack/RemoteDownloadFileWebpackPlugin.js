const path = require('path');
const { got } = require('got-cjs');

/** @typedef {import('webpack').Compiler} Compiler */

/**
 * @typedef {Object} AssetPack
 * @property {string} urlPrefix
 * @property {string} pathPrefix
 * @property {string[]} files
 */

/**
 * @typedef {AssetPack[]} PluginOptions
 */

/**
 * Webpack plugin to download remote files.
 *
 * A rewritten version of save-remote-file-webpack-plugin since that uses a vulnerable 'download' package
 */
class RemoteDownloadFileWebpackPlugin {

    /**
     * @param {PluginOptions} options
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * @param {Compiler} compiler
     */
    apply(compiler) {
        const pluginName = this.constructor.name;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tapAsync({
                name: pluginName,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, async (unusedAssets, callback) => {
                for (const assetPack of this.options) {
                    for (const file of assetPack.files) {
                        const fileSource = `${assetPack.urlPrefix}${file}`;

                        /**
                         * @type {Buffer}
                         */
                        let data;
                        try {
                            data = await got(fileSource).buffer();
                        } catch (error) {
                            compilation.errors.push(/** @type {WebpackError} */ (error));
                        }

                        const destPath = path.join(assetPack.pathPrefix, file);
                        const { RawSource } = compiler.webpack.sources;
                        compilation.emitAsset(
                            destPath,
                            new RawSource(data)
                        );
                    }
                }

                callback();
            });
        });
    }
}

module.exports = RemoteDownloadFileWebpackPlugin;
