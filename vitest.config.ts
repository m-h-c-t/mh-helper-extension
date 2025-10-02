import {configDefaults, defineConfig} from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsConfigPaths()],
    test: {
        globals: true,
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    globals: true,
                    include: ['tests/scripts/**/*.{test,spec}.{js,ts,tsx}'],
                    exclude: [...configDefaults.exclude],
                },
            },
            {
                extends: true,
                test: {
                    name: 'e2e',
                    environment: 'happy-dom',
                    include: ['tests/e2e/**/*.{test,spec}.{js,ts,tsx}'],
                    testTimeout: 60000,
                    setupFiles: [
                        './tests/e2e/util/setup-env.ts'
                    ],
                    environmentOptions: {
                        'happyDOM': {
                            url: 'https://www.mousehuntgame.com/',
                        }
                    }
                },
            }
        ]
    },
});
