// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginJest from 'eslint-plugin-jest';

export default tseslint.config(
    {
        ignores: ['**/*.js']
    },
    eslint.configs.recommended,

    // https://typescript-eslint.io/getting-started/typed-linting
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    // https://typescript-eslint.io/packages/parser#allowdefaultproject
                    allowDefaultProject: ['*.?(m)js'],
                },
                tsconfigRootDir: import.meta.dirname,
            }
        }
    },

    // Rules
    {
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
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
    }
);