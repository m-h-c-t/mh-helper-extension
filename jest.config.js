/*eslint-env node*/
/** @type {import('ts-jest').JestConfigWithTsJest} */

// Useful references
// https://huafu.github.io/ts-jest/user/config/
// https://github.com/bitwarden/clients
const {pathsToModuleNameMapper} = require('ts-jest');

const {compilerOptions} = require('./tsconfig.json');

module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
        prefix: "<rootDir>/",
    }),
    testEnvironment: 'jsdom',
};
