// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginJest from 'eslint-plugin-jest';
import globals from 'globals';

export default tseslint.config(
    eslint.configs.recommended,
    // https://typescript-eslint.io/getting-started/typed-linting
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mjs']
                },
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            }
        }
    },

    {
        // This projects preferred rules
        files: ['**/*.{ts,js}'],
        rules: {
            'array-bracket-newline': ['error', 'consistent'],
            'comma-dangle': ['error', 'only-multiline'],
            'indent': ['error', 4, { SwitchCase: 1, outerIIFEBody: 'off', }],
            'no-constant-binary-expression': ['error'],
            'no-unneeded-ternary': ['error'],
            'no-var': ['warn'],
            'no-unused-vars': 'off',
            'object-curly-spacing': ['error', 'never'],
            'object-curly-newline': ['error'],
            'prefer-const': ['error'],
            'semi': ['error', 'always'],
            '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        }
    },

    // Test-specific rules
    {
        files: ['**/*.spec.ts'],
        plugins: {
            jest: pluginJest
        },
        languageOptions: {
            globals: pluginJest.environments.globals.globals
        },
        rules: {
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unused-xpressions': 'off',

            // https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/unbound-method.md
            '@typescript-eslint/unbound-method': 'off',
            'jest/unbound-method': 'error'
        }
    },

    {
        files: ['**/*.js'],
        extends: [tseslint.configs.disableTypeChecked]
    },

    // Keep ignores at the end
    {
        ignores: [
            '**/coverage/**',
            '**/dist/**',
            '**/node_modules/**',
            '**/third_party/**',
            '**/webpack/**',

            '**/webpack.*.js',
            '**/jest.config.js',
        ]
    },
);