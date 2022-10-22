// Useful: https://huafu.github.io/ts-jest/user/config/
const {pathsToModuleNameMapper} = require('ts-jest');

const {compilerOptions} = require('./tsconfig.json');

module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
        prefix: "<rootDir>/",
    }),
};
