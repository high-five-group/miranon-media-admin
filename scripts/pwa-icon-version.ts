// scripts/pwa-icon-version.ts — delad versionsstämpel för PWA-manifestets
// ikon-filnamn (TASK-280). Ren modul, inget CLI-entrypoint — importeras av
// vite.config.ts och pwa-assets.config.ts, körs aldrig direkt med `node`.
//
// ═══ VARFÖR DEN FINNS ═══
// Chrome 144+ behandlar manifestets `icons`-fält som Cache-Control: immutable
// — så länge fältet ser likadant ut som senast applicerade version laddas
// ikonbilderna ALDRIG om, oavsett vad PNG-bytes faktiskt innehåller (belagt
// ur Chromiums källkod, S107 2026-08-20; Chrome-teamets blogg 2026-01-21:
// "To trigger an icon update, developers are now required to modify either
// the metadata or the icon URL."). Fixen är att filnamnen bär ett
// content-hash av källbilden.
//
// ═══ VARFÖR CONTENT-HASH OCH INTE ETT MANUELLT SUFFIX (-v2, -v3, …) ═══
// Samma cache-busting-mönster Vite redan använder för sina egna byggda
// assets (`dist/assets/*-[hash].js`) — etablerad branschstandard (Vite/
// Webpack/Rollup default), inte en lokal uppfinning. Ett manuellt suffix
// kräver att en människa KOMMER IHÅG att bumpa det vid nästa ikonbyte —
// exakt den typen av glömd-disciplin som orsakade TASK-280 (bilderna byttes,
// filnamnen glömdes). Ett hash härlett ur källbilden kan inte glömmas: ändra
// public/miranon-m-original.svg, kör generatorn om, och namnet ändras av sig
// självt. Ett identiskt sparat-om-utan-ändring-fall ger dessutom samma hash
// — ingen falsk "app update available" visas för användare när inget
// egentligen ändrats.
//
// ═══ HUR DEN ANVÄNDS ═══
// Importeras av BÅDA pwa-assets.config.ts (genererings-filnamnen via
// `assetName`) och vite.config.ts (manifestets `icons`-lista). Samma
// funktion, samma källfil → de två kan aldrig glida isär i sync, vilket är
// den återkommande felklassen "referens A uppdaterad, referens B glömd".

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Källbilden PWA-ikonerna genereras ur (pwa-assets.config.ts `images`). */
export const PWA_ICON_SOURCE_PATH = resolve(REPO_ROOT, 'public/miranon-m-original.svg');

/** Hur många hex-tecken av sha256-digesten som används i filnamnet. */
const HASH_LENGTH = 8;

/**
 * Härleder PWA-ikonernas versionsstämpel ur källbildens INNEHÅLL (sha256,
 * första 8 hex-tecknen). Deterministisk: samma källbild ger alltid samma
 * stämpel, en ändrad källbild ger alltid en annan.
 *
 * @returns {string} 8 hex-tecken, t.ex. "a1b2c3d4"
 */
export function getPwaIconVersion() {
  const bytes = readFileSync(PWA_ICON_SOURCE_PATH);
  return createHash('sha256').update(bytes).digest('hex').slice(0, HASH_LENGTH);
}
