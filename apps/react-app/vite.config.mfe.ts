/**
 * Vite config used for the React MICRO-FRONTEND production bundle.
 *
 * DEV:  Root-config imports http://localhost:3000/src/single-spa.tsx directly.
 *       Vite transforms TypeScript + JSX on-the-fly and serves with CORS.
 *       All bare imports (react, react-dom, single-spa-react) are resolved
 *       relative to localhost:3000 so they load correctly cross-origin.
 *
 * PROD: `npm run build:mfe` → ESM bundle at dist/react-app/single-spa.js
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/single-spa.tsx'),
      name: 'ReactMfe',
      formats: ['es'],
      fileName: 'single-spa',
    },
    outDir: resolve(__dirname, '../../dist/react-app'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Force .js extension for consistent file naming.
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
