/// <reference lib="webworker" />
// Custom service worker (vite-plugin-pwa injectManifest strategy).
// Handles: precache shell, runtime cache for fonts, Background Sync for tx uploads.

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache build assets (manifest injected at build time).
precacheAndRoute(self.__WB_MANIFEST);

// Google Fonts — long-lived cache.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new NetworkFirst({ cacheName: 'google-fonts-stylesheets' }),
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

// API transactions — queue writes when offline, retry later.
const bgSyncPlugin = new BackgroundSyncPlugin('tx-upload-queue', {
  maxRetentionTime: 24 * 60, // minutes
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/tx'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST',
);
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/tx'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'PUT',
);

// Message channel — app can force skipWaiting on update prompt.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
