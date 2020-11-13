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
        'no-unused-vars': [
            'error',
            { args: 'none' },
        ]
    },
};
