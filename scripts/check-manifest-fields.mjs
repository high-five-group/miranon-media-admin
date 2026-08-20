#!/usr/bin/env node
// scripts/check-manifest-fields.mjs — mekanisk grind för app-butiks-manifestet
// (TASK-126.1, AC #1–#2 + TASK-126.4, AC #1).
//
// ═══ VAD DEN PRÖVAR ═══
// Att den BYGGDA `dist/manifest.webmanifest` bär alla fält som ger den rika
// installationsdialogen i stället för Chromes anonyma infobar:
//   · stabil identitet — `id` + `scope` (icke-tomma strängar)
//   · `description` på svenska (icke-tom sträng)
//   · `categories` — minst en kategori
//   · `launch_handler.client_mode` innehåller `focus-existing`
//   · `shortcuts` — 2–3 poster, var och en med `name` + `url`, och `url`
//     pekar på en BEFINTLIG route (korsläst mot `src/routeTree.gen.ts`,
//     TanStack Routers genererade fullPath-lista — samma sanningskälla
//     routern själv navigerar mot).
//   · `screenshots` (TASK-126.4) — minst en post med `form_factor: 'narrow'`
//     och minst en med `'wide'`, var och en med giltig `sizes`
//     ('BREDDxHÖJD'), och `sizes` MÅSTE matcha den faktiskt byggda PNG-
//     filens verkliga pixeldimensioner (läst ur filens egen IHDR-header,
//     inte litat på som text). Flera poster inom SAMMA form_factor måste
//     dessutom dela identisk aspect ratio (kortets AC #1-formulering).
//   · `icons` (TASK-280) — minst en 192x192 och en 512x512 (`purpose`
//     'any'/ospecificerad) samt en 512x512 med `purpose: 'maskable'`, och
//     VARJE `src` måste (a) INTE vara någon av de gamla, oversionerade
//     filnamnen (Chrome 144+ behandlar `icons` som Cache-Control:
//     immutable — samma filnamn som senast = ingen omladdning, se
//     scripts/pwa-icon-version.ts) och (b) faktiskt existera som byggd
//     PNG-fil i dist/ med pixeldimensioner som matchar deklarerad `sizes`.
//     Grinden är medvetet INTE hash-format-specifik (inget krav på exakt
//     8 hex-tecken) — det skulle koppla grinden till dagens
//     versioneringsimplementation. Den fångar den FAKTISKA regressionen
//     kortet fixar: en återgång till exakt de gamla, cache-frusna namnen.
//
// ═══ VARFÖR HÄR OCH INTE I preview-skarven (tests/preview/) ═══
// PRD-textens ordval ("preview-skarven som redan bygger appen och granskar
// bundlen") beskriver `npm run test:preview:staging`
// (build:staging → verify:staging-bundle → Playwright-projektet
// `staging-preview`). Den kedjan är, verifierat mot samtliga
// `.github/workflows/*.yml`, ALDRIG anropad av CI — noll träffar på
// "test:preview:staging", "staging-preview" eller "verify:staging-bundle" i
// någon workflow. Den är ett LOKALT verifieringsverktyg
// (docs/reference/staging-verifiering-runbook.md, rubrik: "i lokal
// browser"), inte en CI-grind. Ett fält-krav som bara prövas där skulle
// alltså aldrig fälla automatiskt på en PR — DoD #3 ("CI grön per jobb")
// skulle vara sant av fel skäl: jobbet skulle aldrig KÖRA.
//
// Manifestfälten är dessutom mode-oberoende (samma oavsett prod/staging-läge)
// och kräver INGET nätverk — de uppstår redan i den vanliga `npm run build`
// som körs OVILLKORLIGT i CI-jobbet "Pure + Build" (ci-suite.yml, `test-fast`)
// på varje PR. Den grinden är alltså den kortaste vägen till en mekanisk,
// automatiskt körande "faller rött om ett fält saknas" — vilket är AC #3:s
// FUNKTIONELLA krav. Se PR-beskrivningen för fullständig divergensnot.
//
// TASK-126.4 ÄRVDE SAMMA FELAKTIGA PREMISS (registrerat som TASK-130): dess
// AC #3 sade ordagrant "Preview-skarven verifierar screenshots-fälten" — samma
// obefintliga CI-koppling. AC #3:s TEXT ÄR RÄTTAD (backlog-CLI:t) till att
// namnge DENNA grind i stället: ci-suite.yml Pure+Build är den stående
// hemvisten för mekaniska manifest-/bundle-grindar, beslutat av
// orkestreraren 2026-08-03 (TASK-130 § Implementation Notes) — 126.4 bygger
// därför ingen parallell grind, den utökar denna.
//
// ═══ TVÅSIDIGT BEVIS ═══
// scripts/test-check-manifest-fields.mjs importerar `validateManifest`
// direkt (ingen sandlåda, inget riktigt bygge behövs) och bevisar per fält:
// saknas fältet → RÖTT; fältet återställt → GRÖNT.
//
// Kör: node scripts/check-manifest-fields.mjs (efter `npm run build`)

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = resolve(REPO, 'dist/manifest.webmanifest');
const ROUTE_TREE_PATH = resolve(REPO, 'src/routeTree.gen.ts');

const MIN_SHORTCUTS = 2;
const MAX_SHORTCUTS = 3;
const REQUIRED_LAUNCH_HANDLER_MODE = 'focus-existing';
const REQUIRED_FORM_FACTORS = /** @type {const} */ (['narrow', 'wide']);

// TASK-280: de exakta filnamnen Chrome 144+ redan sett och cachat som
// "senast applicerad version" — en `icons[].src` som återgår till NÅGOT av
// dessa vore den precisa regressionen kortet fixade (immutable-cachningen
// slår till igen, ikonbytet blir osynligt för användaren).
const LEGACY_ICON_SRCS = /** @type {const} */ ([
  'pwa-192x192.png',
  'pwa-512x512.png',
  'maskable-icon-512x512.png',
]);

/** PNG-signaturen (8 byte) enligt spec — samma 8 byte i varje giltig PNG-fil. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Läser en PNG-fils faktiska pixeldimensioner direkt ur IHDR-chunken —
 * ingen bildavkodning, bara PNG-spec-headern (signaturens 8 byte, sedan
 * 4-byte chunk-längd, 4-byte chunk-typ "IHDR", sedan bredd + höjd som
 * big-endian uint32). Samma teknik som `file`/`sips` använder, utan att dra
 * in ett bildbibliotek för fyra tal.
 *
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number } | undefined}
 */
export function readPngDimensions(buffer) {
  if (buffer.length < 24) return undefined;
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (buffer[i] !== PNG_SIGNATURE[i]) return undefined;
  }
  // IHDR-chunken börjar direkt efter signaturen (byte 8): 4-byte längd + 4-byte
  // typ ("IHDR") + data. Bredd = byte 16–19, höjd = byte 20–23 (big-endian).
  const chunkType = buffer.toString('ascii', 12, 16);
  if (chunkType !== 'IHDR') return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * Tolkar manifestets `sizes`-strängform ('BREDDxHÖJD', case-insensitive x).
 *
 * @param {unknown} sizes
 * @returns {{ width: number, height: number } | undefined}
 */
export function parseSizes(sizes) {
  if (typeof sizes !== 'string') return undefined;
  const match = /^(\d+)x(\d+)$/i.exec(sizes.trim());
  if (!match) return undefined;
  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (width <= 0 || height <= 0) return undefined;
  return { width, height };
}

/**
 * Jämför två dimensioner för IDENTISK aspect ratio via korsmultiplikation —
 * inga flyttal, inga avrundningsfel (`a.w/a.h === b.w/b.h` skrivet utan
 * division).
 *
 * @param {{ width: number, height: number }} a
 * @param {{ width: number, height: number }} b
 * @returns {boolean}
 */
export function harIdentiskAspectRatio(a, b) {
  return a.width * b.height === b.width * a.height;
}

/**
 * Normaliserar en route-path för jämförelse: TanStack Routers `fullPath` för
 * index-routes har efterföljande snedstreck ('/event/'), medan manifestets
 * shortcut-url:er och `<Link to>` skrivs utan ('/event'). Roten ('/') är
 * undantaget — den behåller sitt enda snedstreck.
 *
 * @param {string} path
 * @returns {string}
 */
export function normalizeRoutePath(path) {
  if (path === '/') return '/';
  return path.replace(/\/$/, '');
}

/**
 * Extraherar mängden registrerade route-paths ur TanStack Routers genererade
 * `routeTree.gen.ts` (`fullPath: '...'`-fälten i `declare module
 * '@tanstack/react-router'`-blocket — samma fält routern själv använder för
 * navigering, se `FileRoutesByPath`).
 *
 * @param {string} routeTreeSource
 * @returns {Set<string>}
 */
export function extraherRoutePaths(routeTreeSource) {
  const paths = new Set();
  const regex = /fullPath:\s*'([^']*)'/g;
  for (const match of routeTreeSource.matchAll(regex)) {
    paths.add(normalizeRoutePath(match[1]));
  }
  return paths;
}

/**
 * Validerar ett parsat manifest-objekt mot TASK-126.1 AC #1–#2, TASK-126.4
 * AC #1 (screenshots) samt TASK-280 AC #3 (icons). Ren funktion — tar emot
 * route-mängden OCH de uppmätta bild-dimensionerna som parametrar så
 * testsviten kan pröva den utan att röra disk eller ett riktigt bygge.
 *
 * @param {unknown} manifest
 * @param {{ routePaths?: Set<string>, screenshotDimensions?: Map<string, { width: number, height: number }>, iconDimensions?: Map<string, { width: number, height: number }> }} [options]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateManifest(manifest, options = {}) {
  const errors = [];
  const routePaths = options.routePaths;
  const screenshotDimensions = options.screenshotDimensions;
  const iconDimensions = options.iconDimensions;

  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    return { ok: false, errors: ['manifestet är inte ett JSON-objekt'] };
  }

  const m = /** @type {Record<string, unknown>} */ (manifest);

  const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

  if (!nonEmptyString(m.id)) {
    errors.push("'id' saknas eller är tom — stabil identitet krävs (AC #1)");
  }
  if (!nonEmptyString(m.scope)) {
    errors.push("'scope' saknas eller är tom — stabil identitet krävs (AC #1)");
  }
  if (!nonEmptyString(m.description)) {
    errors.push("'description' saknas eller är tom — svensk beskrivning krävs (AC #1)");
  }
  if (!Array.isArray(m.categories) || m.categories.length === 0) {
    errors.push("'categories' saknas eller är tom (AC #1)");
  }

  const clientMode =
    m.launch_handler && typeof m.launch_handler === 'object'
      ? /** @type {Record<string, unknown>} */ (m.launch_handler).client_mode
      : undefined;
  const clientModes = Array.isArray(clientMode) ? clientMode : [clientMode];
  if (!clientModes.includes(REQUIRED_LAUNCH_HANDLER_MODE)) {
    errors.push(
      `'launch_handler.client_mode' saknar '${REQUIRED_LAUNCH_HANDLER_MODE}' — ` +
        'fokusera-befintligt-fönster-beteendet krävs (AC #1)',
    );
  }

  if (!Array.isArray(m.shortcuts)) {
    errors.push("'shortcuts' saknas eller är inte en lista (AC #2)");
  } else {
    if (m.shortcuts.length < MIN_SHORTCUTS || m.shortcuts.length > MAX_SHORTCUTS) {
      errors.push(
        `'shortcuts' har ${m.shortcuts.length} poster — kräver ${MIN_SHORTCUTS}–${MAX_SHORTCUTS} (AC #2)`,
      );
    }
    m.shortcuts.forEach((shortcut, index) => {
      if (typeof shortcut !== 'object' || shortcut === null) {
        errors.push(`shortcuts[${index}] är inte ett objekt (AC #2)`);
        return;
      }
      const s = /** @type {Record<string, unknown>} */ (shortcut);
      if (!nonEmptyString(s.name)) {
        errors.push(`shortcuts[${index}].name saknas eller är tom (AC #2)`);
      }
      if (!nonEmptyString(s.url)) {
        errors.push(`shortcuts[${index}].url saknas eller är tom (AC #2)`);
      } else if (routePaths && !routePaths.has(normalizeRoutePath(String(s.url)))) {
        errors.push(
          `shortcuts[${index}].url ('${s.url}') pekar på en route som inte finns i ` +
            'src/routeTree.gen.ts — genvägar ska peka på BEFINTLIGA routes (AC #2)',
        );
      }
    });
  }

  // ═══ screenshots (TASK-126.4, AC #1) ═══
  if (!Array.isArray(m.screenshots) || m.screenshots.length === 0) {
    errors.push(
      "'screenshots' saknas eller är tom — minst en stående (narrow) och en " +
        'liggande (wide) krävs (TASK-126.4 AC #1)',
    );
  } else {
    /** @type {Record<'narrow' | 'wide', Array<{ index: number, width: number, height: number }>>} */
    const perFormFactor = { narrow: [], wide: [] };

    m.screenshots.forEach((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        errors.push(`screenshots[${index}] är inte ett objekt (AC #1)`);
        return;
      }
      const s = /** @type {Record<string, unknown>} */ (entry);

      if (!nonEmptyString(s.src)) {
        errors.push(`screenshots[${index}].src saknas eller är tom (AC #1)`);
      }
      if (!nonEmptyString(s.type)) {
        errors.push(`screenshots[${index}].type saknas eller är tom (AC #1)`);
      }
      if (s.form_factor !== 'narrow' && s.form_factor !== 'wide') {
        errors.push(
          `screenshots[${index}].form_factor måste vara 'narrow' eller 'wide', fick ` +
            `${JSON.stringify(s.form_factor)} (AC #1)`,
        );
      }

      const declared = parseSizes(s.sizes);
      if (!declared) {
        errors.push(
          `screenshots[${index}].sizes saknas eller har fel format — förväntat 'BREDDxHÖJD' ` +
            `(AC #1), fick ${JSON.stringify(s.sizes)}`,
        );
      }

      if (declared && screenshotDimensions && nonEmptyString(s.src)) {
        const actual = screenshotDimensions.get(String(s.src));
        if (!actual) {
          errors.push(
            `screenshots[${index}].src ('${s.src}') hittades inte som byggd PNG-fil i dist/ ` +
              '(AC #1/#2 — reproducerbar generering ska producera denna fil)',
          );
        } else if (actual.width !== declared.width || actual.height !== declared.height) {
          errors.push(
            `screenshots[${index}].sizes ('${s.sizes}') matchar inte den faktiskt byggda ` +
              `bildens dimensioner (${actual.width}x${actual.height}) (AC #1)`,
          );
        }
      }

      if (declared && (s.form_factor === 'narrow' || s.form_factor === 'wide')) {
        perFormFactor[s.form_factor].push({ index, ...declared });
      }
    });

    for (const formFactor of REQUIRED_FORM_FACTORS) {
      if (perFormFactor[formFactor].length === 0) {
        errors.push(
          `ingen skärmbild med form_factor '${formFactor}' — minst en krävs per format (AC #1)`,
        );
      }
    }

    for (const formFactor of REQUIRED_FORM_FACTORS) {
      const entries = perFormFactor[formFactor];
      for (let i = 1; i < entries.length; i += 1) {
        if (!harIdentiskAspectRatio(entries[0], entries[i])) {
          errors.push(
            `screenshots med form_factor '${formFactor}' har olika aspect ratio: ` +
              `[${entries[0].index}] ${entries[0].width}x${entries[0].height} vs ` +
              `[${entries[i].index}] ${entries[i].width}x${entries[i].height} — ` +
              'kräver identisk ratio inom respektive format (AC #1)',
          );
        }
      }
    }
  }

  // ═══ icons (TASK-280, AC #3) ═══
  if (!Array.isArray(m.icons) || m.icons.length === 0) {
    errors.push("'icons' saknas eller är tom (TASK-280 AC #3)");
  } else {
    /** @type {{ any192: boolean, any512: boolean, maskable512: boolean }} */
    const seen = { any192: false, any512: false, maskable512: false };

    m.icons.forEach((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        errors.push(`icons[${index}] är inte ett objekt (TASK-280 AC #3)`);
        return;
      }
      const i = /** @type {Record<string, unknown>} */ (entry);

      if (!nonEmptyString(i.src)) {
        errors.push(`icons[${index}].src saknas eller är tom (TASK-280 AC #3)`);
        return;
      }
      const src = String(i.src);

      if (LEGACY_ICON_SRCS.includes(/** @type {(typeof LEGACY_ICON_SRCS)[number]} */ (src))) {
        errors.push(
          `icons[${index}].src ('${src}') är ett OVERSIONERAT filnamn — Chrome 144+ ` +
            'behandlar detta som Cache-Control: immutable och laddar aldrig om bilden ' +
            '(TASK-280 AC #3). Filnamnet måste bära en versionsstämpel.',
        );
      }

      if (!nonEmptyString(i.type)) {
        errors.push(`icons[${index}].type saknas eller är tom (TASK-280 AC #3)`);
      }

      const declared = parseSizes(i.sizes);
      if (!declared) {
        errors.push(
          `icons[${index}].sizes saknas eller har fel format — förväntat 'BREDDxHÖJD' ` +
            `(TASK-280 AC #3), fick ${JSON.stringify(i.sizes)}`,
        );
      }

      if (declared && iconDimensions) {
        const actual = iconDimensions.get(src);
        if (!actual) {
          errors.push(
            `icons[${index}].src ('${src}') hittades inte som byggd PNG-fil i dist/ ` +
              '(TASK-280 AC #1/#3 — reproducerbar generering ska producera denna fil)',
          );
        } else if (actual.width !== declared.width || actual.height !== declared.height) {
          errors.push(
            `icons[${index}].sizes ('${i.sizes}') matchar inte den faktiskt byggda ` +
              `bildens dimensioner (${actual.width}x${actual.height}) (TASK-280 AC #3)`,
          );
        }
      }

      if (declared?.width === 192 && declared.height === 192 && i.purpose === undefined) {
        seen.any192 = true;
      }
      if (declared?.width === 512 && declared.height === 512 && i.purpose === undefined) {
        seen.any512 = true;
      }
      if (declared?.width === 512 && declared.height === 512 && i.purpose === 'maskable') {
        seen.maskable512 = true;
      }
    });

    if (!seen.any192) {
      errors.push("ingen icons-post med sizes '192x192' utan 'purpose' (TASK-280 AC #3)");
    }
    if (!seen.any512) {
      errors.push("ingen icons-post med sizes '512x512' utan 'purpose' (TASK-280 AC #3)");
    }
    if (!seen.maskable512) {
      errors.push("ingen icons-post med sizes '512x512' och purpose 'maskable' (TASK-280 AC #3)");
    }
  }

  return { ok: errors.length === 0, errors };
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`FEL: ${MANIFEST_PATH} saknas — bygg först: npm run build`);
    return 1;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    console.error(`FEL: kunde inte tolka ${MANIFEST_PATH} som JSON: ${error.message}`);
    return 1;
  }

  let routePaths;
  if (existsSync(ROUTE_TREE_PATH)) {
    routePaths = extraherRoutePaths(readFileSync(ROUTE_TREE_PATH, 'utf8'));
  } else {
    console.warn(
      `VARNING: ${ROUTE_TREE_PATH} saknas — shortcuts.url korsläses inte mot registrerade ` +
        'routes (kör `npm run build` eller `npx tsr generate` för fullständig kontroll).',
    );
  }

  // TASK-126.4: läs varje deklarerad screenshots[].src RELATIVT dist/ (samma
  // rot som manifest.webmanifest självt bor i — manifestets fält-URL:er
  // upplöses mot manifestets egen plats) och mät den FAKTISKA PNG-filens
  // pixeldimensioner. Ett saknat/oläsbart src ger helt enkelt ingen post i
  // kartan — validateManifest() rapporterar då "hittades inte som byggd
  // PNG-fil" i stället för att krascha här.
  /** @type {Map<string, { width: number, height: number }>} */
  const screenshotDimensions = new Map();
  if (Array.isArray(manifest?.screenshots)) {
    for (const entry of manifest.screenshots) {
      const src = entry && typeof entry === 'object' ? entry.src : undefined;
      if (typeof src !== 'string' || src.trim().length === 0) continue;
      const filePath = resolve(dirname(MANIFEST_PATH), src);
      if (!existsSync(filePath)) continue;
      const dims = readPngDimensions(readFileSync(filePath));
      if (dims) screenshotDimensions.set(src, dims);
    }
  }

  // TASK-280: samma mönster som screenshots ovan, men för icons[].src —
  // mäter den faktiska byggda PNG-filens pixeldimensioner RELATIVT dist/.
  /** @type {Map<string, { width: number, height: number }>} */
  const iconDimensions = new Map();
  if (Array.isArray(manifest?.icons)) {
    for (const entry of manifest.icons) {
      const src = entry && typeof entry === 'object' ? entry.src : undefined;
      if (typeof src !== 'string' || src.trim().length === 0) continue;
      const filePath = resolve(dirname(MANIFEST_PATH), src);
      if (!existsSync(filePath)) continue;
      const dims = readPngDimensions(readFileSync(filePath));
      if (dims) iconDimensions.set(src, dims);
    }
  }

  const { ok, errors } = validateManifest(manifest, {
    routePaths,
    screenshotDimensions,
    iconDimensions,
  });

  if (!ok) {
    console.error(`FEL: manifest.webmanifest saknar ${errors.length} krävda fält:`);
    for (const error of errors) console.error(`  - ${error}`);
    return 1;
  }

  console.log(
    `OK: ${MANIFEST_PATH} bär stabil identitet, svensk beskrivning, kategorier, ` +
      `launch_handler, ${manifest.shortcuts.length} shortcuts mot befintliga routes, ` +
      `${manifest.screenshots.length} skärmbilder (narrow+wide) med verifierade dimensioner, och ` +
      `${manifest.icons.length} ikoner med versionerade, verifierade filnamn.`,
  );
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
