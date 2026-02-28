# root-config � single-spa Shell Application

Created entirely by hand (no CLI). Acts as the host page that loads and
orchestrates the Angular and React micro-frontends.

---

## All Files in This App Are New

---

### NEW FILE: `package.json`

```json
{
  "name": "root-config",
  "private": true,
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "single-spa": "^6.0.3"
  },
  "devDependencies": {
    "typescript": "~5.9.2",
    "vite": "^6.2.0"
  }
}
```

> **Why `single-spa` as runtime dependency:** `main.ts` calls
> `registerApplication` and `start()` from `single-spa`. These APIs are needed
> at runtime in the browser, not just at build time.
>
> **Why Vite 6 (not the Vite 8 beta used by react-app):** root-config requires
> stable Vite APIs for both dev server and production HTML-mode build. Vite 8 is
> used only in the react-app where it was pulled in transitively.
>
> **Why same TypeScript `~5.9.2` as Angular app:** Consistency across the
> monorepo. `import.meta.env` types from `vite/client` require TypeScript 5.x.

---

### NEW FILE: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

> **Why `"types": ["vite/client"]`:**
> `main.ts` uses `import.meta.env.DEV` to switch between dev and production
> MFE URLs. Without `"types": ["vite/client"]`, TypeScript does not know that
> `import.meta.env` exists and reports:
> `TS2339: Property 'env' does not exist on type 'ImportMeta'`
>
> **Why `"moduleResolution": "bundler"`:**
> Matches Vite's module resolution behaviour. Without it TypeScript may
> incorrectly report unresolvable imports that Vite handles fine.

---

### NEW FILE: `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  server: {
    port: 9000,
    cors: true,
  },
  build: {
    outDir: resolve(__dirname, '../../dist'),
    emptyOutDir: true,
  },
});
```

> **Why `root: resolve(__dirname, 'src')`:**
> Vite's `root` is the directory that contains `index.html`. Placing `index.html`
> inside `src/` keeps source files together. Setting `root` to `src/` tells Vite
> where to find it.
>
> **Why port 9000:**
> Avoids conflict with Angular dev server (4200), Angular MFE dev server (4201),
> and the React MFE dev server (3000).
>
> **Why `outDir: '../../dist'` (monorepo `dist/` root):**
> A single `dist/` folder at the workspace root serves all three apps together.
> root-config's `index.html` goes to `dist/index.html`, Angular goes to
> `dist/angular-app/single-spa.js`, React to `dist/react-app/single-spa.js`.
> One folder can be served with `npx serve dist` or any static server.
>
> **Why `emptyOutDir: true`:**
> Ensures a clean build by removing stale files from `dist/` before each build.
> This must run FIRST in the monorepo build order (before Angular and React)
> so that it does not delete the MFE bundles those builds produce.

---

### NEW FILE: `src/index.html`

Full contents:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MFE Shell</title>

  <!-- React Fast Refresh preamble fix -->
  <script>
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
  </script>
</head>
<body>
  <nav class="shell-nav">
    <button onclick="switchApp('react')">Load React MFE</button>
    <button onclick="switchApp('angular')">Load Angular MFE</button>
  </nav>

  <div id="single-spa-application:react-app"></div>
  <div id="single-spa-application:angular-app"></div>

  <script type="module" src="./main.ts"></script>

  <script>
    function switchApp(name) {
      localStorage.setItem('app_version', name);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }
  </script>

  <style>
    /* ... nav and mount-point styles ... */
  </style>
</body>
</html>
```

**Section: React Fast Refresh preamble `<script>` block**
```html
<script>
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
</script>
```
> **Why this is required:**
> In development, Vite's React plugin (`@vitejs/plugin-react`) injects Fast
> Refresh guard code at the top of every `.tsx` file. That code looks like:
> ```js
> if (!window.__vite_plugin_react_preamble_installed__) throw new Error(...)
> $RefreshSig$ = createSignatureFunctionForTransform();
> ```
> This guard is safe when Vite's own dev server serves `index.html`, because Vite
> also injects the preamble script (which defines `$RefreshReg$` and `$RefreshSig$`)
> into every page it serves.
>
> But root-config is a completely different server. When root-config's `main.ts`
> calls `import('http://localhost:3000/src/single-spa.tsx')`, the browser fetches
> that module from the React Vite server without ever loading React's `index.html`.
> The preamble is therefore never installed, and the guard throws.
>
> **Why a classic `<script>` tag and not a module script:**
> The fix must define the globals BEFORE the ES module graph evaluates. ES modules
> (`type="module"`) are always deferred � they run after the HTML document is parsed.
> Classic `<script>` tags run synchronously as the parser encounters them. By
> placing this classic script in `<head>`, the globals are set before `main.ts`
> (or any module it imports) executes.
>
> Setting `window.__vite_plugin_react_preamble_installed__ = true` inside
> `single-spa.tsx` does NOT work: ES modules evaluate dependencies first (bottom-up),
> so `App.tsx` runs before the module body of `single-spa.tsx` finishes.

**Section: mount-point `<div>` elements**
```html
<div id="single-spa-application:react-app"></div>
<div id="single-spa-application:angular-app"></div>
```
> **Why these IDs:** single-spa creates a DOM container for each registered
> application using the pattern `single-spa-application:<name>`. Providing
> them in HTML avoids a race condition where mount() fires before the container
> exists.

**Section: `switchApp` function**
```js
function switchApp(name) {
  localStorage.setItem('app_version', name);
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}
```
> **Why `dispatchEvent(new PopStateEvent(...))`:**
> single-spa listens for `popstate` events to re-evaluate which applications
> should be active. Without firing this event, single-spa does not check
> `activeWhen` again after `localStorage` changes, so the new app does not mount.

---

### NEW FILE: `src/main.ts`

```ts
import { registerApplication, start, LifeCycles } from 'single-spa';

const isDev = import.meta.env.DEV;

const REACT_URL   = isDev
  ? 'http://localhost:3000/src/single-spa.tsx'
  : '/react-app/single-spa.js';

const ANGULAR_URL = isDev
  ? 'http://localhost:4201/src/single-spa.ts'
  : '/angular-app/single-spa.js';

// Resolved once at startup — MFE switching requires a page reload.
type AppVersion = 'react' | 'angular';
const appVersion: AppVersion =
  (localStorage.getItem('app_version') as AppVersion) ?? 'react';

// Persist the default so the value is always present in localStorage.
if (!localStorage.getItem('app_version')) {
  localStorage.setItem('app_version', 'react');
}

async function loadReact(): Promise<LifeCycles> {
  return import(/* @vite-ignore */ REACT_URL);
}

async function loadAngular(): Promise<LifeCycles> {
  return import(/* @vite-ignore */ ANGULAR_URL);
}

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

start({ urlRerouteOnly: true });
```

> **Why `import.meta.env.DEV` for URL switching:**
> Dev and production use different URLs. Dev mode imports TypeScript source files
> directly from Vite dev servers (port 3000 / 4201). Production imports compiled
> `.js` bundles from relative paths under `dist/`.
>
> **Why `/* @vite-ignore */` on dynamic imports:**
> Vite analyses dynamic `import()` calls at build time. When the import path is
> a variable (not a string literal), Vite logs a warning:
> `Could not auto-determine entry point from dynamic import`.
> The `@vite-ignore` comment suppresses that warning.
>
> **Why `LifeCycles` type import:**
> Annotating the return type of `loadReact` / `loadAngular` as `Promise<LifeCycles>`
> gives TypeScript full type coverage on bootstrap/mount/unmount and catches
> mis-typed loader functions at compile time.
>
> **Why `appVersion` is a `const` (not a function):**
> The active MFE is decided once when the page loads based on `localStorage`.
> Switching apps requires setting `localStorage.app_version` and reloading the
> page. Making it a function would re-read localStorage on every single-spa
> routing tick, which is unnecessary and misleading.
>
> **Why `activeWhen: () => appVersion === 'react'` (function, not path):**
> single-spa's `activeWhen` can accept a path prefix string or a function that
> returns a boolean. This app uses `localStorage` instead of the URL path to select
> the active MFE, so a path prefix cannot be used. A function is required.
>
> **Why `start({ urlRerouteOnly: true })`:
> This option tells single-spa not to trigger a re-evaluation on every popstate
> event that changes a hash or search param � only on actual page navigation.
> Since the app uses `localStorage` (not URL paths) for routing, this prevents
> unnecessary re-evaluations on unrelated browser history events.
