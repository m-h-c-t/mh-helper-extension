/* eslint-env node */
/** @type {import('@typescript-eslint/utils/dist/ts-eslint').Linter.Config} */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2017: true,
        webextensions: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // TODO: enable v6's recommended-type-checked
        'plugin:@typescript-eslint/stylistic-type-checked',
        // TODO (low priority): consider enabling strict-type-checked
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    globals: {
        $: 'readonly',
        user: 'readonly',
        lastReadJournalEntryId: 'readonly',
    },
    parserOptions: {
        project: [
            './tsconfig.eslint.json',
            './tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        'array-bracket-newline': ['error', 'consistent'],
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            functions: 'only-multiline',
        }],
        'indent': [
            'error',
            4,
            {
                SwitchCase: 1,
                outerIIFEBody: 'off',
            },
        ],
        'no-constant-binary-expression': ['error'],
        'no-unneeded-ternary': ['error'],
        'no-var': ['warn'],
        'object-curly-spacing': ['error', 'never'],
        'object-curly-newline': ['error'],
        'prefer-const': ['error'],
        'semi': ['error', 'always'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {args: 'none'},
        ],
    },
    overrides: [
        {
            files: [
                'tests/**/*.{test,spec}.js',
            ],
            env: {
                jest: true,
            },
            plugins: ['jest'],
        },
    ],
};
