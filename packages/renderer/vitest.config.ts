import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    environmentMatchGlobs: [
      ['**/src/**/*.test.tsx', 'jsdom'],
    ],
  },
  resolve: {
    conditions: ['module', 'browser', 'import', 'default'],
  },
});