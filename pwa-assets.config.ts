import { defineConfig } from '@vite-pwa/assets-generator/config';

/**
 * PWA-ikon-generering ur public/miranon-logo.svg (ADR-047 B4).
 * Kör: npx pwa-assets-generator  (läser denna config)
 *
 * Etablerad Session 16 K5b efter Marcus-fynd (kapad maskable + kvantiserad
 * 192:a). Avvikelser från minimal-2023-preseten, med skäl:
 *
 * - `png: { compressionLevel: 9 }` UTAN `quality`: generatorns default
 *   (`quality: 60`) aktiverar sharps palett-kvantisering → 13 distinkta
 *   färger i 192:an i stället för ~450 (uppmätt K5b-diagnos) — taggiga
 *   diagonaler. Utan quality blir PNG:n lossless RGBA med full antialias.
 * - `maskable.padding: 0.45` (default 0.3): safe zone är en CIRKEL —
 *   kantvisa extents räcker inte, hörn-radien styr. Logotypens bbox i
 *   SVG:n (334×380 kring centrum) ger käll-hörnradie √(167²+190²) ≈ 253;
 *   kravet hörn-radie ≤ 0,9 × safe-zone-radien (0,4 × 512 = 204,8 px)
 *   kräver padding ≥ 0,431. 0.45 ger kvot ≈ 0,87 — synlig marginal.
 *   (Session 16 K5c efter Marcus-underkänd 0.35: tangerade cirkeln.)
 * - `transparent.sizes` utan 64 + utan favicons-generering: browser-
 *   favicon wiras i index.html från public/favicon/ (den runda
 *   vit-bakgrunds-varianten, Marcus-beslut K5b) — generatorns
 *   favicon.ico-spår används inte.
 * - `apple.sizes: []`: apple-touch-icon serveras från public/favicon/
 *   (rund + vit bakgrund) i stället för genererad full-bleed.
 */
export default defineConfig({
  images: ['public/miranon-logo.svg'],
  preset: {
    transparent: { sizes: [192, 512], padding: 0.05 },
    maskable: {
      sizes: [512],
      padding: 0.45,
      resizeOptions: { fit: 'contain', background: '#ffffff' },
    },
    apple: { sizes: [] },
    png: { compressionLevel: 9 },
  },
});
