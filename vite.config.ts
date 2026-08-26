import { readFileSync } from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { getPwaIconVersion } from './scripts/pwa-icon-version.ts';
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

  // PWA-ikonernas versionsstämpel (TASK-280) — se scripts/pwa-icon-version.mjs
  // och kommentaren vid `icons:` nedan för det fulla skälet.
  const iconVersion = getPwaIconVersion();

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
        // ADR-047 § Amendering 2026-08-13 (TASK-199-uppföljning). Utan detta
        // fält låg pluginet i sitt default 'prompt'-läge, vars hela
        // omladdningsväg hänger på workbox-windows `waiting`-event — som
        // ALDRIG kan fyra hos oss, eftersom src/sw.ts anropar skipWaiting()
        // i sin install-handler. Följden var att appen kunde köra gammal kod
        // obegränsat länge (research task-199 § 3.2).
        //
        // 'autoUpdate' byter KLIENTGREN i vite-plugin-pwas register.js från
        // `waiting` till `activated` — händelsen vår skipWaiting() garanterar.
        // Mätt: fältet rör INTE vår handskrivna sw.ts. registerType används på
        // exakt tre ställen i node_modules/vite-plugin-pwa/dist/index.js: rad
        // 800 (default), rad 169 (ersätter __SW_AUTO_UPDATE__ i klientkoden —
        // den enda som gäller oss) och rad 874, som sätter workbox.skipWaiting
        // men bara när injectRegister är 'auto'/null; vi har false, och
        // workbox.* gäller ändå bara generateSW-strategin, inte injectManifest.
        //
        // Omladdningen sker INTE automatiskt: src/lib/app-uppdatering.ts
        // skickar en egen onNeedReload som överstyr pluginets default
        // window.location.reload(). Beslutet ligger hos användaren (Marcus,
        // S105) — en tvångsomladdning kan slänga bort inmatning mitt i ett
        // formulär.
        registerType: 'autoUpdate',
        injectManifest: {
          // offline.html måste in i precache — förutsättning för ADR-047 B2.
          // webp tillagt 2026-08-03 (S96): ursprungligen login-vyns
          // porträttbild. Kommentaren rättad TASK-224 (2026-08-26): bilden
          // BYTTE hemvist när login-vyn tappade sin bild — den bor i dag som
          // Forberedelseskärmens fönsterfyllande bakgrundsfoto i stället
          // (`public/roger-och-lotta.webp`, `Forberedelseskarm.tsx`,
          // `task-273.6`). Nu, som då, finns EXAKT en webp-asset i `public/`
          // (grep-verifierat) — utan ändelsen i mönstret hamnar den UTANFÖR
          // precachen och laddas över nätet vid varje besök i stället för ur
          // appens egen cache. Mätt, inte antaget: mönstret bar tidigare
          // varken webp eller jpg, så vilket bildformat som helst utöver
          // png/svg hade fallit utanför tyst.
          globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
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
          // Vit, inte guld (Marcus-beslut 2026-08-06, S96): färgen målar det
          // installerade fönstrets namnlist, och guldet (#d4960a) ramade in
          // en app vars egen bakgrund är vit.
          //
          // FÄLTET FÅR INTE UTELÄMNAS. Mätt vid detta bygge: utan raden
          // injicerar vite-plugin-pwa sin EGEN default — `theme_color:
          // "#42b883"` (Vue-grönt, node_modules/vite-plugin-pwa/dist/
          // index.js:854) — så en utelämning ger inte "ingen färg" utan
          // grön namnlist. Manifest-formatet saknar dessutom ljus/mörk-
          // variant; den axeln ägs av index.html:s meta-taggar, som
          // ÖVERSTYR detta värde (MDN, manifest/theme_color).
          theme_color: '#ffffff',
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
          // Skärmbilder i stående + liggande format (TASK-126.4, AC #1) — tas
          // ur appens VERKLIGA vyer via Playwright mot den hermetiska
          // fixturvärlden (npm run generate:manifest-screenshots,
          // tests/manifest-screenshots/), aldrig handbeskurna. Vyerna är
          // valda för att vara STABILA under S93:s pågående UI-arbete på
          // eventsidan (EventDetail.tsx + detail/*): Hem och Eventlistan rör
          // ingen av de filerna. `sizes` speglar den FAKTISKT genererade
          // PNG-filens pixeldimensioner (viewport × deviceScaleFactor 2, se
          // spec-filerna) — mekaniskt korsläst mot den byggda dist/-filen av
          // scripts/check-manifest-fields.mjs (samma grind som AC #2/#3).
          screenshots: [
            {
              src: 'screenshots/narrow-hem.png',
              sizes: '750x1624',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Miranon Media Admin — Hem-översikten på mobil',
            },
            {
              src: 'screenshots/wide-event-lista.png',
              sizes: '2880x1800',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Miranon Media Admin — Eventlistan på desktop',
            },
          ],
          // Filnamnen bär ett content-hash av källbilden (TASK-280,
          // scripts/pwa-icon-version.mjs) — Chrome 144+ behandlar detta
          // fält som Cache-Control: immutable och laddar ALDRIG om en
          // ikonbild vars filnamn/metadata ser likadan ut som senast
          // applicerade version (Chrome-teamets blogg 2026-01-21). Samma
          // hash-funktion driver pwa-assets.config.ts:s `assetName`, så de
          // två kan aldrig glida isär. ÄNDRA ALDRIG namnen för hand.
          icons: [
            {
              src: `pwa-192x192-${iconVersion}.png`,
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: `pwa-512x512-${iconVersion}.png`,
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: `maskable-icon-512x512-${iconVersion}.png`,
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
