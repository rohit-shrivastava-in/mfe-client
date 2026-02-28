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