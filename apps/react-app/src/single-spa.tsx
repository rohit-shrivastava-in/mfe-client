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

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;

