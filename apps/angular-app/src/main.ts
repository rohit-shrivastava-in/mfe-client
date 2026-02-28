import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// When NOT running inside single-spa, bootstrap normally (standalone dev mode).
// The single-spa lifecycles are exported from main.single-spa.ts (separate entry).
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
