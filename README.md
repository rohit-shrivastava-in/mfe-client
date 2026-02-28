# mfe-client — Monorepo Micro-Frontend

Angular 21 + React 19 + single-spa 6, orchestrated from a Vite shell.

---

## How the Monorepo Was Created

### Step 1 — Scaffold each app via CLI

```bash
# Angular 21 app
ng new angular-app --routing=false --style=css --skip-git --skip-install --no-interactive

# React 19 app
npm create vite@latest react-app --template react-ts

# root-config (no CLI — created manually)
mkdir apps/root-config
```

### Step 2 — Create the monorepo root

The monorepo root was created manually. No CLI tool generates this.

---

## NEW FILE: `package.json` (monorepo root)

```json
{
  "name": "mfe-client",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev":                   "npm-run-all --parallel dev:angular dev:react dev:root",
    "dev:root":              "npm run start --workspace=apps/root-config",
    "dev:react":             "npm run start --workspace=apps/react-app",
    "dev:angular":           "npm run start:mfe --workspace=apps/angular-app",
    "dev:angular:standalone":"npm run start --workspace=apps/angular-app",
    "dev:react:standalone":  "npm run start --workspace=apps/react-app",
    "build":                 "npm run build:root && npm run build:angular && npm run build:react",
    "build:root":            "npm run build --workspace=apps/root-config",
    "build:angular":         "npm run build:mfe --workspace=apps/angular-app",
    "build:react":           "npm run build:mfe --workspace=apps/react-app",
    "preview":               "npx serve dist -p 9000"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
```

**Why `workspaces`:** Lets a single `npm install` from the root install
dependencies for all three apps. Packages shared between apps are hoisted to
`node_modules/` at the root, reducing disk usage.

**Why `build` order is `root  angular  react`:** root-config's Vite build
has `emptyOutDir: true`, which wipes the entire `dist/` folder. If Angular or
React MFE builds ran first, their output would be deleted. Running root-config
first clears the folder, then MFE builds deposit their bundles into it.

**Why `npm-run-all`:** npm does not natively support `--parallel` for workspaces.
`npm-run-all --parallel` starts all three dev servers at once in a single terminal.

---

## NEW FILE: `.npmrc`

```
legacy-peer-deps=true
```

**Why:** `@analogjs/vite-plugin-angular` has peer dependency version constraints
that conflict with Angular 21. Without this flag, `npm install` fails with peer
dependency errors. `legacy-peer-deps=true` tells npm to use the older resolution
algorithm that ignores those conflicts.

---

## Dev Servers

| Server | URL | Started by |
|--------|-----|-----------|
| root-config | http://localhost:9000 | `npm run dev:root` |
| react-app | http://localhost:3000 | `npm run dev:react` |
| angular-app (MFE) | http://localhost:4201 | `npm run dev:angular` |

Start all at once:
```bash
npm install    # once
npm run dev
```

## Production Build  `dist/`

```bash
npm run build
# Outputs:
# dist/index.html
# dist/assets/index-[hash].js
# dist/angular-app/single-spa.js
# dist/react-app/single-spa.js
# dist/react-app/single-spa.css
```

Serve:
```bash
npm run preview     # npx serve dist -p 9000
```

## Switching MFEs

```js
localStorage.setItem('app_version', 'react')    // default
localStorage.setItem('app_version', 'angular')
// reload the page
```

The shell nav buttons do this automatically.
