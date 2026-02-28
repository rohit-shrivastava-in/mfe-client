import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Root-config shell — hosts single-spa orchestration on port 9000.
 *
 * In DEV, micro-frontends are imported cross-origin directly from their Vite
 * dev servers (React :3000, Angular :4201).  Both dev servers set
 * Access-Control-Allow-Origin: * so dynamic import() works fine.
 *
 * In PROD, all apps are built into dist/ and served from one static server.
 */
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  server: {
    port: 9000,
    cors: true,
  },
  build: {
    // Root-config builds INTO dist/ so that MFE sub-folders sit alongside it.
    outDir: resolve(__dirname, '../../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
  },
});
