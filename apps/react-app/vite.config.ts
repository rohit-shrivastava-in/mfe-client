import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone React app dev server (serves index.html at http://localhost:3000).
// For micro-frontend mode, see vite.config.mfe.ts.
export default defineConfig({
  plugins: [
    react({
      // Exclude the single-spa MFE entry from Fast Refresh transforms.
      // When root-config loads this file cross-origin it bypasses index.html,
      // so the HMR preamble is never injected. Excluding it here means
      // @vitejs/plugin-react won't add the preamble check to that file at all.
      exclude: [/single-spa\.tsx?$/],
    }),
  ],
  server: {
    port: 3000,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  },
})
