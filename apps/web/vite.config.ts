import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
    alias: {
      '@codequest/domain': fileURLToPath(new URL('../../packages/domain/src/index.ts', import.meta.url)),
      '@codequest/simulation': fileURLToPath(new URL('../../packages/simulation/src/index.ts', import.meta.url)),
      '@codequest/content': fileURLToPath(new URL('../../packages/content/src/index.ts', import.meta.url)),
      '@codequest/code-runner': fileURLToPath(new URL('../../packages/code-runner/src/index.ts', import.meta.url)),
      '@codequest/persistence': fileURLToPath(new URL('../../packages/persistence/src/index.ts', import.meta.url)),
      '@codequest/renderer': fileURLToPath(new URL('../../packages/renderer/src/index.ts', import.meta.url)),
      '@codequest/editor': fileURLToPath(new URL('../../packages/editor/src/index.ts', import.meta.url)),
      '@codequest/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@jitl/quickjs-wasmfile-release-sync'],
  },
});