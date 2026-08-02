#!/usr/bin/env node
// scripts/check-manifest-fields.mjs — mekanisk grind för app-butiks-manifestet
// (TASK-126.1, AC #1–#2).
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
 * Validerar ett parsat manifest-objekt mot AC #1 + #2. Ren funktion — tar
 * emot route-mängden som parameter så testsviten kan pröva den utan att röra
 * disk eller ett riktigt bygge.
 *
 * @param {unknown} manifest
 * @param {{ routePaths?: Set<string> }} [options]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateManifest(manifest, options = {}) {
  const errors = [];
  const routePaths = options.routePaths;

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

  const { ok, errors } = validateManifest(manifest, { routePaths });

  if (!ok) {
    console.error(`FEL: manifest.webmanifest saknar ${errors.length} krävda fält:`);
    for (const error of errors) console.error(`  - ${error}`);
    return 1;
  }

  console.log(
    `OK: ${MANIFEST_PATH} bär stabil identitet, svensk beskrivning, kategorier, ` +
      `launch_handler och ${manifest.shortcuts.length} shortcuts mot befintliga routes.`,
  );
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
