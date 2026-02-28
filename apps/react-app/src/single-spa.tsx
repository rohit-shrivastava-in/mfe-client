/**
 * React 19 single-spa lifecycle entry.
 * This file is loaded by root-config via dynamic import.
 *
 * DEV  (from root-config):
 *   import('http://localhost:3000/src/single-spa.tsx')
 *   Vite transforms TSX on-the-fly and serves with CORS headers.
 *
 * PROD:
 *   import('/react-app/single-spa.js')
 *   Built by: npm run build:mfe
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';

let root: Root | undefined;
let containerEl: HTMLElement | undefined;

export async function bootstrap(): Promise<void> {
  // nothing to do — createRoot happens in mount
}

export async function mount(props: { domElement?: HTMLElement; name?: string }): Promise<void> {
  const appName = props.name ?? 'react-app';
  const id = `single-spa-application:${appName}`;

  containerEl =
    props.domElement ??
    (document.getElementById(id) as HTMLElement) ??
    (() => {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
      return el;
    })();

  root = createRoot(containerEl);
  root.render(React.createElement(App));
}

export async function unmount(): Promise<void> {
  if (root) {
    root.unmount();
    root = undefined;
  }
  containerEl = undefined;
}

