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

  return {
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
        manifest: {
          name: 'Miranon Media Admin',
          short_name: 'Miranon',
          lang: 'sv',
          start_url: '/',
          display: 'standalone',
          theme_color: '#d4960a',
          background_color: '#ffffff',
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
