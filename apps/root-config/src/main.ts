import { registerApplication, start, LifeCycles } from 'single-spa';

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------
const isDev = import.meta.env.DEV;

/**
 * Micro-frontend URLs
 *
 * DEV  — Each MFE runs its own Vite dev server with `server.cors: true`.
 *        Dynamic import() fetches cross-origin; Vite's live ES module
 *        transforms mean zero build-step lag. Sub-imports (react.js etc.)
 *        are resolved relative to their dev server origin automatically.
 *
 * PROD — All MFEs are built into dist/ alongside root-config so paths are
 *        same-origin relative references.
 */
const REACT_URL = isDev
  ? 'http://localhost:3000/src/single-spa.tsx'   // Vite React dev server
  : '/react-app/single-spa.js';                  // Production bundle

const ANGULAR_URL = isDev
  ? 'http://localhost:4201/src/single-spa.ts'    // Vite (Analog) Angular dev server
  : '/angular-app/single-spa.js';                // Production bundle

// ---------------------------------------------------------------------------
// Determine which app the user selected via localStorage.
// Default: 'react'. Toggle via the nav buttons in index.html or manually:
//   localStorage.setItem('app_version', 'angular')  then reload.
// ---------------------------------------------------------------------------
type AppVersion = 'react' | 'angular';
const stored = localStorage.getItem('app_version');
if (!stored) localStorage.setItem('app_version', 'react');
const appVersion: AppVersion = (stored ?? 'react') as AppVersion;

// ---------------------------------------------------------------------------
// Lazy lifecycle loaders
// ---------------------------------------------------------------------------
async function loadReact(): Promise<LifeCycles> {
  return import(/* @vite-ignore */ REACT_URL);
}

async function loadAngular(): Promise<LifeCycles> {
  return import(/* @vite-ignore */ ANGULAR_URL);
}

// ---------------------------------------------------------------------------
// Register applications — only the active one will ever mount.
// ---------------------------------------------------------------------------
registerApplication({
  name: 'react-app',
  app: loadReact,
  activeWhen: () => appVersion === 'react',
});

registerApplication({
  name: 'angular-app',
  app: loadAngular,
  activeWhen: () => appVersion === 'angular',
});

// ---------------------------------------------------------------------------
// Boot single-spa
// ---------------------------------------------------------------------------
start({ urlRerouteOnly: true });

if (isDev) {
  console.info(`[root-config] Active MFE: "${appVersion}" | mode: DEV`);
}
