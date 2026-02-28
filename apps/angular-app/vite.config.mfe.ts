/**
 * Vite config used for the Angular MICRO-FRONTEND build/serve.
 *
 * DEV:  `npm run start:mfe`  → vite server at :4201, Analog plugin compiles
 *       Angular templates on-the-fly. Root-config imports
 *       http://localhost:4201/src/single-spa.ts directly.
 *
 * PROD: `npm run build:mfe`  → ESM bundle at dist/angular-app/single-spa.js
 */
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    // Compiles Angular templates, decorators, and the Angular compiler pipeline.
    // Point to tsconfig.app.json (not the library tsconfig that @analogjs looks for by default).
    angular({ tsconfig: './tsconfig.app.json' }),
  ],

  server: {
    port: 4201,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/single-spa.ts'),
      name: 'AngularMfe',
      formats: ['es'],
      fileName: 'single-spa',
    },
    outDir: resolve(__dirname, '../../dist/angular-app'),
    emptyOutDir: true,
    rollupOptions: {
      // Bundle everything — no external deps so root-config needs no import maps.
      external: [],
      output: {
        // Force .js extension (ESM format) for consistent file naming.
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
