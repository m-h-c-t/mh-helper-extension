module.exports = {
    env: {
        browser: true,
        es6: true,
        webextensions: true,
    },
    extends: "eslint:recommended",
    globals: {
        $: false,
        user: false,
        lastReadJournalEntryId: false,
    },
    parserOptions: {
        ecmaVersion: 6,
    },
    rules: {
        indent: [
            'error',
            4,
            {
                SwitchCase: 1,
                outerIIFEBody: 'off',
            },
        ],
        semi: ['error', 'always'],
        'no-var': ['warn'],
        'prefer-const': ['error'],
        'array-bracket-newline': ['error', 'consistent'],
        'comma-dangle': ['error', 'always-multiline'],
        'no-unused-vars': [
            'error',
            { args: 'none' },
        ]
    },
};
