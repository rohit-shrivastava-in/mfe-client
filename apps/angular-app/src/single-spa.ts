/**
 * Angular 21 single-spa lifecycle entry.
 * Exported as an ES module — root-config dynamically imports this file.
 *
 * In dev :  Vite + @analogjs/vite-plugin-angular serves this with Angular
 *           template compilation on-the-fly (port 4201).
 * In prod:  `vite build -c vite.config.mfe.ts` bundles this to
 *           dist/angular-app/single-spa.js
 */
import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

let appRef: ApplicationRef | undefined;
let domContainer: HTMLElement | undefined;
let rootEl: HTMLElement | undefined;

export async function bootstrap(): Promise<void> {
  // Pre-create the host element and bootstrap Angular to it (detached from DOM).
  // This keeps bootstrap fast and separate from visual mounting.
  rootEl = document.createElement('app-root');
}

export async function mount(props: {
  domElement?: HTMLElement;
  name?: string;
}): Promise<void> {
  const containerSelector = `single-spa-application:${props.name ?? 'angular-app'}`;
  domContainer =
    props.domElement ??
    (document.getElementById(containerSelector) as HTMLElement) ??
    document.body;

  if (!rootEl) {
    rootEl = document.createElement('app-root');
  }

  domContainer.appendChild(rootEl);

  if (!appRef) {
    appRef = await bootstrapApplication(App, appConfig);
  }
}

export async function unmount(): Promise<void> {
  if (appRef) {
    appRef.destroy();
    appRef = undefined;
  }
  if (rootEl && rootEl.parentNode) {
    rootEl.parentNode.removeChild(rootEl);
  }
  rootEl = undefined;
  domContainer = undefined;
}
