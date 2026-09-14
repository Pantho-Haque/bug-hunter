import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    projects: [
      'packages/*',
    ],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/dist/**', '**/node_modules/**'],
  },
});