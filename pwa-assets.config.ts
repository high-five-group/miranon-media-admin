import { defineConfig } from '@vite-pwa/assets-generator/config';
import { getPwaIconVersion } from './scripts/pwa-icon-version.ts';

/**
 * PWA-ikon-generering ur public/miranon-m-original.svg (ADR-047 B4).
 * Kör: npx pwa-assets-generator  (läser denna config)
 *
 * Etablerad Session 16 K5b efter Marcus-fynd (kapad maskable + kvantiserad
 * 192:a). Avvikelser från minimal-2023-preseten, med skäl:
 *
 * - `assetName` (TASK-280, S107 2026-08-20): filnamnen bär ett 8-tecken
 *   content-hash av källbilden (scripts/pwa-icon-version.mjs,
 *   `pwa-192x192-<hash>.png` / `maskable-icon-512x512-<hash>.png`) i stället
 *   för det Chrome 144+ nu behandlar som Cache-Control: immutable —
 *   Chrome-teamets blogg 2026-01-21: "To trigger an icon update, developers
 *   are now required to modify either the metadata or the icon URL." Samma
 *   hash-funktion importeras av vite.config.ts, så manifestets icons-lista
 *   och de faktiskt genererade filerna kan aldrig glida isär. ÄNDRA ALDRIG
 *   filnamnet för hand — regenerera i stället (se nedan) så hashen alltid
 *   matchar källbildens FAKTISKA innehåll.
 *
 * - `png: { compressionLevel: 9 }` UTAN `quality`: generatorns default
 *   (`quality: 60`) aktiverar sharps palett-kvantisering → 13 distinkta
 *   färger i 192:an i stället för ~450 (uppmätt K5b-diagnos) — taggiga
 *   diagonaler. Utan quality blir PNG:n lossless RGBA med full antialias.
 * - `maskable.padding: 0.55` (default 0.3): safe zone är en CIRKEL —
 *   kantvisa extents räcker inte, hörn-radien styr.
 *
 *   OMRÄKNAT S107 (2026-08-19) när källan byttes till Roger & Lottas
 *   riktiga M. Den gamla siffran 0.45 hörde till parallellogram-formen
 *   och är INTE överförbar: M:et har annan bbox och annan viewBox.
 *
 *   MÄTT, inte räknat. Ett första försök att härleda paddingen analytiskt
 *   (ur M:ets käll-hörnradie 85,82 i en 130-viewBox) gav 0,2273 — och var
 *   FEL med faktor två. Generatorns padding-semantik är inte den antagna
 *   linjära skalningen av innehållet. Rätt metod var att generera och mäta
 *   den faktiska pixel-bboxen i utfilen:
 *
 *     padding 0.45 → bbox 270×258 → kvot 0,912  ✗ (kravet är ≤ 0,9)
 *     padding 0.55 → bbox 220×212 → kvot 0,746  ✓
 *     padding 0.62 → bbox 187×179 → kvot 0,632  ✓ men märket blir smått
 *
 *   0.55 valdes: klarar kravet med marginal och håller märket på 220 px i
 *   en 512-ikon. Notera att gamla 0.45 hade fällt kravet med den nya
 *   källan — knappt, men fällt.
 *
 *   ÄNDRAS PADDINGEN: generera om och mät bboxen i utfilen. Härled den
 *   inte.
 * - `transparent.sizes` utan 64 + utan favicons-generering: browser-
 *   favicon wiras i index.html från public/favicon/ (den runda
 *   vit-bakgrunds-varianten, Marcus-beslut K5b) — generatorns
 *   favicon.ico-spår används inte.
 * - `apple.sizes: []`: apple-touch-icon serveras från public/favicon/
 *   (rund + vit bakgrund) i stället för genererad full-bleed.
 */
const iconVersion = getPwaIconVersion();

export default defineConfig({
  images: ['public/miranon-m-original.svg'],
  preset: {
    transparent: { sizes: [192, 512], padding: 0.05 },
    maskable: {
      sizes: [512],
      padding: 0.55,
      resizeOptions: { fit: 'contain', background: '#ffffff' },
    },
    apple: { sizes: [] },
    png: { compressionLevel: 9 },
    // Versionerade filnamn (TASK-280) — se skäl i kommentaren ovan.
    assetName: (type, size) => {
      switch (type) {
        case 'transparent':
          return `pwa-${size.width}x${size.height}-${iconVersion}.png`;
        case 'maskable':
          return `maskable-icon-${size.width}x${size.height}-${iconVersion}.png`;
        case 'apple':
          return `apple-touch-icon-${size.width}x${size.height}-${iconVersion}.png`;
        default:
          return `${type}-${size.width}x${size.height}-${iconVersion}.png`;
      }
    },
  },
});
