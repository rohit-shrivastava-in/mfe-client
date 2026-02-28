# angular-app — Angular 21 Micro-Frontend

Scaffolded with Angular CLI 21, then modified to work as a single-spa micro-frontend.

**Scaffold command used:**
```bash
ng new angular-app --routing=false --style=css --skip-git --skip-install --no-interactive
```

---

## Changes Made After CLI Scaffolding

---

### CHANGED FILE: `package.json`

**Added to `dependencies`:**
```json
"single-spa": "^6.0.3"
```
> **Why:** `single-spa` exports the `LifeCycles` TypeScript type used in
> `src/single-spa.ts`. Also needed at runtime to resolve single-spa internals
> if tree-shaking does not fully eliminate the import.

**Added to `devDependencies`:**
```json
"@analogjs/vite-plugin-angular": "^1.15.0",
"@types/node": "^22.0.0",
"vite": "^6.2.0"
```
> **Why `@analogjs/vite-plugin-angular`:** Angular CLI uses its own `@angular/build`
> builder, which cannot produce an ES module library bundle suitable for single-spa.
> The Analog plugin lets Vite compile Angular templates and decorators using the
> Angular compiler, giving us a second build pipeline (`vite.config.mfe.ts`) that
> produces `single-spa.js`.
>
> **Why `vite` + `@types/node`:** Required to run the new `vite.config.mfe.ts`.

**Changed `typescript` version:**
```json
"typescript": "~5.9.2"   // was ~5.6.2 from CLI default
```
> **Why:** Angular 21's compiler requires TypeScript `>=5.9.0 <6.1.0`. The CLI
> generated `~5.6.2` which caused a hard error:
> `The Angular Compiler requires TypeScript >=5.9.0 and <6.1.0 but 5.6.3 was found`

**Added scripts:**
```json
"start":     "ng serve --port 4200",      // added --port 4200 (was just ng serve)
"start:mfe": "vite --config vite.config.mfe.ts",
"build:mfe": "vite build --config vite.config.mfe.ts",
"watch:mfe": "vite build --watch --config vite.config.mfe.ts"
```
> **Why `start:mfe`:** The Angular CLI dev server (`ng serve`) cannot serve raw
> TypeScript ES modules for cross-origin import(). The Vite dev server can.
> root-config in dev mode imports from `http://localhost:4201/src/single-spa.ts`
> — that URL is served by `vite --config vite.config.mfe.ts`.

---

### CHANGED FILE: `src/main.ts`

Added a comment only. No functional change.

```ts
// When NOT running inside single-spa, bootstrap normally (standalone dev mode).
// The single-spa lifecycles are exported from src/single-spa.ts (separate entry).
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

> **Why:** Clarifies that this file is only used by `ng serve` (standalone run).
> When root-config loads the Angular MFE it imports `single-spa.ts`, not `main.ts`.

---

### NEW FILE: `src/single-spa.ts`

This is the MFE entry point. root-config dynamically imports this file.

```ts
import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

let appRef: ApplicationRef | undefined;
let domContainer: HTMLElement | undefined;
let rootEl: HTMLElement | undefined;

export async function bootstrap(): Promise<void> {
  rootEl = document.createElement('app-root');
}

export async function mount(props: { domElement?: HTMLElement; name?: string }): Promise<void> {
  const containerSelector = `single-spa-application:${props.name ?? 'angular-app'}`;
  domContainer =
    props.domElement ??
    (document.getElementById(containerSelector) as HTMLElement) ??
    document.body;

  if (!rootEl) rootEl = document.createElement('app-root');
  domContainer.appendChild(rootEl);

  if (!appRef) appRef = await bootstrapApplication(App, appConfig);
}

export async function unmount(): Promise<void> {
  if (appRef) { appRef.destroy(); appRef = undefined; }
  if (rootEl?.parentNode) rootEl.parentNode.removeChild(rootEl);
  rootEl = undefined;
  domContainer = undefined;
}
```

> **Why three functions (`bootstrap`, `mount`, `unmount`):** single-spa requires
> every micro-frontend to export exactly these three lifecycle functions. It calls
> them in order: bootstrap once on first load, mount whenever the app should show,
> unmount whenever it should hide.
>
> **Why not use `single-spa-angular`:** The `single-spa-angular` package wraps
> these lifecycles for Angular but has not been updated for Angular 21 standalone
> and signals. Manual implementation avoids an incompatible dependency.
>
> **Why `bootstrapApplication` inside `mount` not `bootstrap`:** Angular's
> `bootstrapApplication` both creates the component and renders into DOM. Doing it
> in `mount` ensures the DOM container is already available and avoids rendering
> into detached DOM.

---

### NEW FILE: `src/main.single-spa.ts`

Re-exports from `single-spa.ts`. Not loaded at runtime.

```ts
export { bootstrap, mount, unmount } from './single-spa';
```

> **Why:** Kept as a reference shim in case any tooling expects a file named
> `main.single-spa.ts` (common convention). The actual active entry is `single-spa.ts`.

---

### CHANGED FILE: `src/app/app.ts`

Replaced the default `title` property with a signal-based counter:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly count = signal(0);

  increment(): void {
    this.count.update((c) => c + 1);
  }
}
```

> **Why:** The CLI default template uses `title = signal('angular-app')` which
> references the large boilerplate HTML. Replaced with a minimal interactive
> component to demonstrate Angular 21 signals work correctly in MFE mode.

---

### CHANGED FILE: `src/app/app.html`

Replaced the entire 400-line CLI boilerplate with:

```html
<div class="mfe-container">
  <h1 class="title">Angular 21 Micro-Frontend</h1>
  <p class="subtitle">
    Loaded via single-spa &middot;
    <code>localStorage.app_version = "angular"</code>
  </p>
  <div class="card">
    <p>Click count: <strong>{{ count() }}</strong></p>
    <button (click)="increment()">Increment</button>
  </div>
</div>
```

> **Why:** The CLI boilerplate is a placeholder that references assets and links
> not needed in an MFE. Keeping it would add unnecessary load to the MFE bundle.

---

### CHANGED FILE: `src/app/app.css`

Replaced CLI default with MFE-specific styles for `.mfe-container`, `.title`,
`.subtitle`, `.card`, and `button`.

> **Why:** Styling the MFE independently so it does not depend on global styles
> from the shell or conflict with the React MFE styles.

---

### NEW FILE: `vite.config.mfe.ts`

```ts
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    angular({ tsconfig: './tsconfig.app.json' }),
  ],
  server: {
    port: 4201,
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
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
      external: [],
      output: {
        entryFileNames: '[name].js',       // no hash
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
```

> **Why a separate Vite config instead of using angular.json:**
> Angular CLI's `@angular/build` builder produces a full SPA build (with
> `index.html`, hashed chunks). single-spa needs a plain ES module with no
> `index.html`. Vite's `build.lib` mode is designed for exactly this.
>
> **Why `tsconfig: './tsconfig.app.json'`:**
> `@analogjs/vite-plugin-angular` defaults to looking for `tsconfig.lib.prod.json`
> (a library tsconfig used by Angular libraries, not applications). That file does
> not exist in an app project. Without this option the build fails with:
> `Unable to resolve tsconfig at .../tsconfig.lib.prod.json`
>
> **Why port 4201 instead of 4200:**
> Angular CLI's `ng serve` already uses port 4200. Running both simultaneously
> (standalone + MFE dev) would cause a port conflict.
>
> **Why `cors: true` + `Access-Control-Allow-Origin: *`:**
> root-config at port 9000 does a cross-origin `import()` of
> `http://localhost:4201/src/single-spa.ts`. Browsers block cross-origin module
> requests without CORS headers. These settings allow it.
>
> **Why `entryFileNames: '[name].js'` (no hash):**
> root-config's `main.ts` hard-codes the production path as `/angular-app/single-spa.js`.
> If the filename had a hash (`single-spa-Abc123.js`) that path would break on
> every build.
