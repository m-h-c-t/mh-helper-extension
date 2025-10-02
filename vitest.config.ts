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
        ]
    },
});
