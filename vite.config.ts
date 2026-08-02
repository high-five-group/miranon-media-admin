import { readFileSync } from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { assertModeCoherent } from './src/lib/env-coherence';

// TanStack Router plugin (Fas 2 K2 — återinförd post-Fas-0-borttagning).
// Plugin ligger FÖRE react() per TanStack-rekommendation.
//
// [GA] Fas 7: security headers-plugin med CSP-nonce läggs till här.

export default defineConfig(({ mode }) => {
  // ADR-061 Pelare 2.5 (yta C — build/serve config-tid, defense-in-depth): fäll
  // `vite`/`vite build` vid config-tid om bindningen är inkoherent. loadEnv fångar
  // BÅDE .env-fil-fel OCH process.env-injektion av fel ref → tidigast möjliga punkt
  // (build-artefakten valideras, inte bara runtime). Samma rena regel som
  // src/env.ts-runtime-grinden — ingen logik-duplicering (ADR-061 Erratum).
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  assertModeCoherent(mode, env.VITE_SUPABASE_URL ?? '');

  // Appversionen ur paketmanifestet (task-4.2 B-NYTT2): en enda källa —
  // versionsraden på Hem läser __APP_VERSION__, aldrig ett hårdkodat värde.
  // fs-läsning i stället för json-import → oberoende av tsconfig-flaggor.
  const { version } = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
    version: string;
  };

  return {
    define: { __APP_VERSION__: JSON.stringify(version) },
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      // PWA per ADR-047: injectManifest kompilerar src/sw.ts → dist/sw.js
      // (samma scope som Fas 0-skelettet). Registrering sker explicit i
      // src/main.tsx via virtual:pwa-register (injectRegister: false).
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectRegister: false,
        injectManifest: {
          // offline.html måste in i precache — förutsättning för ADR-047 B2.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
        // Manifest per ADR-047 B4. Färger ur design-tokens:
        // theme = --mm-primary (--p-gold-500), background = --mm-bg (--p-neutral-0).
        //
        // TASK-126.1 (app-butiks-känsla): id + scope, description, categories,
        // launch_handler och shortcuts kompletterar den rika installations-
        // dialogen. Verifierat mekaniskt av scripts/check-manifest-fields.mjs
        // mot den byggda dist/manifest.webmanifest (se npm run verify:manifest).
        manifest: {
          name: 'Miranon Media Admin',
          short_name: 'Miranon',
          // Stabil identitet (AC #1): `id` gör app-identiteten oberoende av
          // ev. framtida query-parametrar på start_url (t.ex. install-
          // tracking) — utan explicit id räknar OS:et annars en ändrad
          // start_url som en NY app. `scope` matchar hela SPA:t under roten.
          id: '/',
          scope: '/',
          description:
            'Adminverktyget för Miranon Media — event, anmälningar och personer samlat på ett ställe.',
          lang: 'sv',
          start_url: '/',
          display: 'standalone',
          theme_color: '#d4960a',
          background_color: '#ffffff',
          // W3C manifest-kategorier (github.com/w3c/manifest/wiki/Categories):
          // adminverktyg för en verksamhet — närmast 'business'/'productivity'.
          categories: ['business', 'productivity'],
          // Fokusera-befintligt-fönster (AC #1, användarberättelse 7): ett
          // klick på en app-länk fokuserar redan öppet fönster i stället för
          // att öppna ett till.
          launch_handler: { client_mode: 'focus-existing' },
          // 2–3 genvägar mot BEFINTLIGA routes (AC #2) — de vanligaste
          // handlingarna ur appens nuvarande tabb-/route-struktur
          // (src/routeTree.gen.ts, TabBar.tsx). Mekaniskt korsläst mot
          // registrerade routes av scripts/check-manifest-fields.mjs.
          shortcuts: [
            {
              name: 'Skapa nytt event',
              short_name: 'Nytt event',
              description: 'Starta ett nytt event direkt från appikonen.',
              url: '/event/skapa',
            },
            {
              name: 'Ny anmälan',
              short_name: 'Anmälan',
              description: 'Lägg till en anmälan utan att först öppna ett event.',
              url: '/anmalan/ny',
            },
            {
              name: 'Personer',
              description: 'Hoppa direkt till personregistret.',
              url: '/personer',
            },
          ],
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
