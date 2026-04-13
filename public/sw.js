/*
 * [GA] Service worker-skelett — Fas 0.
 *
 * Registreras från src/main.tsx. Utökas med Workbox i Fas 5
 * (cache-first för app-shell/bilder/fonts, network-first för API med
 * networkTimeoutSeconds: 3, offline-fallback).
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Placeholder fetch-handler — ingen caching i Fas 0, bara genomsläpp.
self.addEventListener('fetch', () => {
  // no-op, Workbox läggs på i Fas 5
});
