/// <reference lib="webworker" />
/*
 * Service worker — Workbox-baserad (Fas 5, ADR-047 B1/B2).
 *
 * Porterad från Fas 0-skelettet i public/sw.js (git-historiken bevarar
 * skelettet). Registreras via vite-plugin-pwa (virtual:pwa-register i
 * src/main.tsx); precache-manifestet injiceras vid build (injectManifest).
 */

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// Build-assets precachas (cache-first by design i Workbox precache).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Skelettets semantik bevaras: ny SW aktiveras direkt och tar över öppna
// klienter (ändrad update-strategi är ett separat framtida beslut).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// SPA-navigationer serveras ur precachat index.html (ADR-047 B2) —
// normalfallet offline är att det cachade skalet renderas.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Offline-fallback vid cache-miss på dokument-requests (ADR-047 B2).
// Fas 8: Background Sync (offline-mutationskö) byggs ovanpå denna SW —
// defer per ADR-019, trigger-kriterier i den ADR:n.
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const fallback = await matchPrecache('/offline.html');
    if (fallback) {
      return fallback;
    }
  }
  return Response.error();
});
