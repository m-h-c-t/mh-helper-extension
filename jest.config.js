// Useful references
// https://huafu.github.io/ts-jest/user/config/
// https://github.com/bitwarden/clients
const {pathsToModuleNameMapper} = require('ts-jest');

const {compilerOptions} = require('./tsconfig.json');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    collectCoverage: true,
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
        prefix: "<rootDir>/",
    }),
    testEnvironment: 'jsdom',
};
