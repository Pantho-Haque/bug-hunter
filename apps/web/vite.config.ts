import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
    alias: [
      {
        find: '@codequest/code-runner/worker',
        replacement: fileURLToPath(new URL('../../packages/code-runner/src/worker.ts', import.meta.url)),
      },
      { find: '@codequest/domain', replacement: fileURLToPath(new URL('../../packages/domain/src/index.ts', import.meta.url)) },
      { find: '@codequest/simulation', replacement: fileURLToPath(new URL('../../packages/simulation/src/index.ts', import.meta.url)) },
      { find: '@codequest/content', replacement: fileURLToPath(new URL('../../packages/content/src/index.ts', import.meta.url)) },
      { find: '@codequest/code-runner', replacement: fileURLToPath(new URL('../../packages/code-runner/src/index.ts', import.meta.url)) },
      { find: '@codequest/persistence', replacement: fileURLToPath(new URL('../../packages/persistence/src/index.ts', import.meta.url)) },
      { find: '@codequest/renderer', replacement: fileURLToPath(new URL('../../packages/renderer/src/index.ts', import.meta.url)) },
      { find: '@codequest/editor', replacement: fileURLToPath(new URL('../../packages/editor/src/index.ts', import.meta.url)) },
      { find: '@codequest/ui', replacement: fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)) },
    ],
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@jitl/quickjs-wasmfile-release-sync'],
  },
});
