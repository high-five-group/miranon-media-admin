#!/usr/bin/env node
// scripts/test-check-manifest-fields.mjs — tester för manifest-fältvakten
// (TASK-126.1, scripts/check-manifest-fields.mjs).
//
// Samma konvention som scripts/test-purge-staging-sentinels.mjs: guard-
// skriptets PURA funktioner importeras direkt (ingen sandlåda, inget riktigt
// bygge behövs) — `validateManifest`, `normalizeRoutePath` och
// `extraherRoutePaths` tar emot data som parameter i stället för att läsa
// disk, så testsviten prövar logiken isolerat.
//
// ═══ TVÅSIDIGT BEVIS PER FÄLT — INTE ETT STICKPROV ═══
// Ett grönt utfall är inget bevis (kortets "Krav på beviset"). Varje krävt
// fält testas i BÅDA riktningar: fältet borttaget/felaktigt → RÖTT, fältet
// återställt → GRÖNT. Annars vore grinden lika förenlig med en vakt som
// alltid returnerar `ok: true` utan att titta.
//
// Kör: node scripts/test-check-manifest-fields.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import {
  extraherRoutePaths,
  normalizeRoutePath,
  validateManifest,
} from './check-manifest-fields.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  OK  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  RÖD ${name}`);
    console.error(`      ${error.message}`);
  }
}

const ROUTE_PATHS = new Set(['/', '/hem', '/event', '/event/skapa', '/anmalan/ny', '/personer']);

/** Giltigt manifest — baslinjen alla mutationstester utgår ifrån. */
function giltigtManifest() {
  return {
    name: 'Miranon Media Admin',
    short_name: 'Miranon',
    id: '/',
    scope: '/',
    description: 'Adminverktyget för Miranon Media.',
    lang: 'sv',
    start_url: '/',
    display: 'standalone',
    categories: ['business', 'productivity'],
    launch_handler: { client_mode: 'focus-existing' },
    shortcuts: [
      { name: 'Skapa nytt event', url: '/event/skapa' },
      { name: 'Ny anmälan', url: '/anmalan/ny' },
      { name: 'Personer', url: '/personer' },
    ],
    icons: [],
  };
}

// ═══ Baslinjen: GRÖNT ═══
test('giltigt manifest → GRÖNT (ok:true, noll fel)', () => {
  const { ok, errors } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true, `förväntade ok:true, fick fel: ${errors.join('; ')}`);
  assert.deepEqual(errors, []);
});

// ═══ id — stabil identitet (AC #1) ═══
test('id saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.id;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes("'id'")),
    'förväntade ett fel om id',
  );
});
test('id tom sträng → RÖTT', () => {
  const m = giltigtManifest();
  m.id = '';
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
});
test('id återställt → GRÖNT', () => {
  const m = giltigtManifest();
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ scope — stabil identitet (AC #1) ═══
test('scope saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.scope;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("'scope'")));
});
test('scope återställt → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ description — svensk beskrivning (AC #1) ═══
test('description saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.description;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("'description'")));
});
test('description whitespace-only → RÖTT', () => {
  const m = giltigtManifest();
  m.description = '   ';
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
});
test('description återställd → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ categories (AC #1) ═══
test('categories saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.categories;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("'categories'")));
});
test('categories tom lista → RÖTT', () => {
  const m = giltigtManifest();
  m.categories = [];
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
});
test('categories återställd → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ launch_handler.client_mode — fokusera-befintligt-fönster (AC #1) ═══
test('launch_handler saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.launch_handler;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('launch_handler')));
});
test('launch_handler.client_mode fel värde (auto) → RÖTT', () => {
  const m = giltigtManifest();
  m.launch_handler = { client_mode: 'auto' };
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
});
test('launch_handler.client_mode som array innehållande focus-existing → GRÖNT', () => {
  const m = giltigtManifest();
  m.launch_handler = { client_mode: ['navigate-existing', 'focus-existing'] };
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});
test('launch_handler återställd → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ shortcuts — antal 2–3 (AC #2) ═══
test('shortcuts saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.shortcuts;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("'shortcuts'")));
});
test('shortcuts 1 post → RÖTT (för få)', () => {
  const m = giltigtManifest();
  m.shortcuts = [{ name: 'Event', url: '/event' }];
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('2–3')));
});
test('shortcuts 4 poster → RÖTT (för många)', () => {
  const m = giltigtManifest();
  m.shortcuts = [
    { name: 'Event', url: '/event' },
    { name: 'Skapa nytt event', url: '/event/skapa' },
    { name: 'Ny anmälan', url: '/anmalan/ny' },
    { name: 'Personer', url: '/personer' },
  ];
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
});
test('shortcuts 2 poster → GRÖNT (nedre gränsen)', () => {
  const m = giltigtManifest();
  m.shortcuts = [
    { name: 'Skapa nytt event', url: '/event/skapa' },
    { name: 'Ny anmälan', url: '/anmalan/ny' },
  ];
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});
test('shortcuts återställda (3 poster) → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ shortcut.name / shortcut.url (AC #2) ═══
test('shortcut utan name → RÖTT', () => {
  const m = giltigtManifest();
  delete m.shortcuts[0].name;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('shortcuts[0].name')));
});
test('shortcut utan url → RÖTT', () => {
  const m = giltigtManifest();
  delete m.shortcuts[0].url;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('shortcuts[0].url')));
});
test('shortcut name/url återställda → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ shortcut.url mot BEFINTLIGA routes (AC #2) — kärnan i korsläsningen ═══
test('shortcut pekar på obefintlig route → RÖTT', () => {
  const m = giltigtManifest();
  m.shortcuts[0].url = '/hittar-inte-denna-route';
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('pekar på en route som inte finns')));
});
test('shortcut pekar på befintlig route igen → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});
test('shortcut mot index-route utan snedstreck-krav (/event vs /event/) → GRÖNT', () => {
  const m = giltigtManifest();
  m.shortcuts[2].url = '/personer'; // ROUTE_PATHS bär redan normaliserad '/personer'
  const { ok } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});
test('routePaths utelämnad (routeTree.gen.ts saknas) → ingen krasch, url-krysskoll hoppas över', () => {
  const { ok, errors } = validateManifest(giltigtManifest(), {});
  assert.equal(ok, true, `förväntade ok:true utan routePaths, fick: ${errors.join('; ')}`);
});

// ═══ normalizeRoutePath ═══
test('normalizeRoutePath: roten förblir "/"', () => {
  assert.equal(normalizeRoutePath('/'), '/');
});
test('normalizeRoutePath: index-route tappar efterföljande snedstreck', () => {
  assert.equal(normalizeRoutePath('/event/'), '/event');
});
test('normalizeRoutePath: redan normaliserad path oförändrad', () => {
  assert.equal(normalizeRoutePath('/event/skapa'), '/event/skapa');
});

// ═══ extraherRoutePaths — mot en minimal routeTree.gen.ts-liknande fixture ═══
test('extraherRoutePaths plockar och normaliserar fullPath-fälten', () => {
  const fixture = `
    declare module '@tanstack/react-router' {
      interface FileRoutesByPath {
        '/': { fullPath: '/' }
        '/_authenticated/event': { fullPath: '/event/' }
        '/_authenticated/event/skapa': { fullPath: '/event/skapa' }
      }
    }
  `;
  const paths = extraherRoutePaths(fixture);
  assert.ok(paths.has('/'));
  assert.ok(paths.has('/event'), 'index-routens fullPath ska normaliseras till /event');
  assert.ok(paths.has('/event/skapa'));
  assert.equal(paths.size, 3);
});
test('extraherRoutePaths på källa utan fullPath-fält → tom mängd (ingen krasch)', () => {
  const paths = extraherRoutePaths('inga träffar här');
  assert.equal(paths.size, 0);
});

console.log(`\n${passed} gröna, ${failed} röda av ${passed + failed} tester.`);
if (failed > 0) {
  process.exit(1);
}
