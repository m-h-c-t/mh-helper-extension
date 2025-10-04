import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginVitest from 'eslint-plugin-vitest';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
    eslint.configs.recommended,
    // https://typescript-eslint.io/getting-started/typed-linting
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    stylistic.configs.customize({
        braceStyle: '1tbs',
        commaDangle: 'only-multiline',
        indent: 4,
        semi: true,
    }),
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mjs'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },
        },
    },

    {
        // This projects preferred rules
        files: ['**/*.{js,mjs,cjs,ts}'],
        plugins: {
            '@perfectionist': perfectionist,
        },
        rules: {
            'no-unused-vars': 'off',
            '@stylistic/max-statements-per-line': ['error', {max: 2}],
            '@stylistic/member-delimiter-style': ['error', {
                singleline: {
                    delimiter: 'comma',
                    requireLast: false,
                },
                multiline: {
                    delimiter: 'semi',
                }
            }],
            '@stylistic/object-curly-spacing': ['error', 'never', {
                overrides: {
                    ImportAttributes: 'always',
                    ImportDeclaration: 'always',
                }
            }],
            '@stylistic/operator-linebreak': 'off',
            '@perfectionist/sort-imports': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {args: 'none'}],
        },
    },

    // Test-specific rules
    {
        files: ['**/*.spec.ts'],
        plugins: {
            vitest: pluginVitest,
        },
        languageOptions: {
            globals: pluginVitest.environments.env.globals,
        },
        rules: {
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unused-xpressions': 'off',
            '@typescript-eslint/unbound-method': 'off',
        },
    },

    {
        files: ['**/*.js'],
        extends: [tseslint.configs.disableTypeChecked],
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
        ],
    },
);
