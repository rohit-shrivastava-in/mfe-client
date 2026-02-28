# react-app � React 19 Micro-Frontend

Scaffolded with Vite, then modified to work as a single-spa micro-frontend.

**Scaffold command used:**
```bash
npm create vite@latest react-app -- --template react-ts
```

---

## Changes Made After Vite Scaffolding

---

### CHANGED FILE: `package.json`

**Added to `dependencies`:**
```json
"single-spa": "^6.0.3",
"single-spa-react": "^6.0.2"
```
> **Why:** `single-spa-react` wraps the raw single-spa lifecycle functions
> (`bootstrap`, `mount`, `unmount`) and handles root React DOM rendering/unmounting.
> Exporting these three named functions is required by single-spa.

**Added script `build:mfe`:**
```json
"build:mfe": "vite build --config vite.config.mfe.ts"
```
> **Why:** The default `vite build` command uses `vite.config.ts`, which builds
> a normal SPA (with `index.html`). single-spa needs a lib-mode bundle with no
> `index.html`. The MFE config performs that build.

**Renamed `dev`  `start`:**
```json
"start": "vite"   // was "dev": "vite"
```
> **Why:** The monorepo root's `npm-run-all` script references `start:*` uniformly
> across workspaces. Renaming `dev` to `start` keeps the naming consistent with
> the Angular MFE's `start:mfe` script.

---

### CHANGED FILE: `vite.config.ts`

**Added dev server settings:**
```ts
server: {
  port: 3000,
  cors: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type',
  },
},
```
> **Why port 3000:** Vite default is 5173. Using 3000 to avoid conflict with
> Angular's port 4200 and the shell's port 9000. root-config hard-codes
> `http://localhost:3000/src/single-spa.tsx` as the dev-mode URL.
>
> **Why cors headers:** root-config at port 9000 dynamically imports React's
> single-spa.tsx from port 3000. Browsers block cross-origin module imports
> without explicit CORS headers.

**Added `exclude` to React plugin:**
```ts
react({
  exclude: [/single-spa\.tsx?$/],
})
```
> **Why:** Vite's React plugin automatically injects React Fast Refresh (HMR)
> guard code at the top of every `.tsx` file. That injected code calls
> `window.$RefreshSig$` which is only defined when Vite's HMR preamble has been
> loaded into the page � which only happens when Vite itself serves `index.html`.
>
> When root-config (a different server) cross-origin imports `single-spa.tsx`,
> the HMR preamble is never injected, so `$RefreshSig$ is not defined` is thrown.
>
> Excluding `single-spa.tsx` from the React plugin prevents that injection into
> the MFE entry file.

---

### NEW FILE: `vite.config.mfe.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Replace Node.js globals that React and other packages reference but that
  // are not available in the browser when bundled as an ESM library.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },

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
        entryFileNames: '[name].js',       // no hash
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
```

> **Why a separate config for MFE production build:**
> The default `vite.config.ts` build creates a full SPA with `index.html`.
> single-spa loads the React app as a standalone ES module � not an SPA. Vite's
> `build.lib` mode creates a plain JavaScript module with no HTML entry point.
>
> **Why `entryFileNames: '[name].js'` (no hash):**
> root-config's `main.ts` hard-codes the production path as
> `/react-app/single-spa.js`. A hashed filename would break that path on every
> rebuild.
>
> **Why `define: { 'process.env.NODE_ENV': ... }`:**
> React (and many other npm packages) guard development-only code with
> `if (process.env.NODE_ENV !== 'production')`. `process` is a Node.js global
> that does not exist in the browser. Vite's application build replaces it
> automatically, but `build.lib` (library) mode does not. Without the `define`
> block the browser throws `ReferenceError: process is not defined` when the
> bundle is loaded by single-spa.

---

### NEW FILE: `src/single-spa.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import App from './App';

// Let TypeScript infer the type from singleSpaReact — avoids AppProps generics mismatch.
const lifecycles = singleSpaReact({
  React,
  ReactDOMClient: ReactDOM,
  rootComponent: App,
  errorBoundary(err: Error): React.ReactElement {
    return React.createElement(
      'div',
      { style: { padding: '2rem', color: 'crimson' } },
      React.createElement('h3', null, 'React MFE Error'),
      React.createElement('pre', null, err.message),
    );
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
```

> **Why `single-spa-react` instead of manual lifecycles:**
> `single-spa-react` handles React 18+ concurrent root creation (`createRoot`),
> the `domElement` prop wiring, and strict-mode compatibility automatically.
> Manual implementation would require duplicating that logic.
>
> **Why `React.createElement` in `errorBoundary` instead of JSX:**
> When this file is excluded from the React Fast Refresh plugin (see
> `vite.config.ts` change above), the Babel JSX transform is still applied, but
> TypeScript occasionally flags JSX inside certain callback positions. Using
> `React.createElement` directly avoids both the type error and any ambiguity
> about JSX transform availability.
>
> **Why no generic argument on `singleSpaReact()`:**
> `singleSpaReact<AppProps>()` would require all single-spa injected props
> (`name`, `singleSpa`, etc.) to satisfy `AppProps`. Since `App` does not declare
> those props, adding a generic causes a TypeScript error. Omitting the generic
> lets TypeScript infer the correct types.

---

### CHANGED FILE: `src/App.tsx`

Replaced the Vite default counter template with an MFE-specific counter:

```tsx
import { useState } from 'react';
import './App.css';

function App(): JSX.Element {
  const [count, setCount] = useState(0);

  return (
    <div className="mfe-container">
      <h1 className="title">React 19 Micro-Frontend</h1>
      <p className="subtitle">
        Loaded via single-spa &middot;{' '}
        <code>localStorage.app_version = "react"</code>
      </p>
      <div className="card">
        <p>Click count: <strong>{count}</strong></p>
        <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      </div>
    </div>
  );
}

export default App;
```

> **Why replace the default template:** The Vite default App imports the Vite
> logo SVG and React logo SVG which are not needed in an MFE context. Keeping
> them would increase bundle size. Replaced with a minimal demo matching the
> Angular MFE so both apps look consistent when toggled in the shell.
