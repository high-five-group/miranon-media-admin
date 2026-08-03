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
  harIdentiskAspectRatio,
  normalizeRoutePath,
  parseSizes,
  readPngDimensions,
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

/**
 * Speglar de FAKTISKT genererade PNG-filernas mätta dimensioner (se
 * `npm run generate:manifest-screenshots` + `npm run verify:manifest`, mätt
 * 2026-08-03 mot den riktiga byggda dist/). Testens `screenshotDimensions`-
 * karta hålls separat från fixturens `sizes`-strängar så mutationstesterna kan
 * medvetet SÄRA dem åt (fältet säger en sak, filen en annan) utan att röra
 * disk eller ett riktigt bygge.
 */
const SCREENSHOT_DIMENSIONS = new Map([
  ['screenshots/narrow-hem.png', { width: 750, height: 1624 }],
  ['screenshots/wide-event-lista.png', { width: 2880, height: 1800 }],
]);

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
    screenshots: [
      {
        src: 'screenshots/narrow-hem.png',
        sizes: '750x1624',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Hem på mobil',
      },
      {
        src: 'screenshots/wide-event-lista.png',
        sizes: '2880x1800',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Eventlistan på desktop',
      },
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

// ═══ screenshots (TASK-126.4, AC #1) ═══

test('giltigt manifest MED screenshotDimensions → GRÖNT', () => {
  const { ok, errors } = validateManifest(giltigtManifest(), {
    routePaths: ROUTE_PATHS,
    screenshotDimensions: SCREENSHOT_DIMENSIONS,
  });
  assert.equal(ok, true, `förväntade ok:true, fick fel: ${errors.join('; ')}`);
});

test('screenshots saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.screenshots;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("'screenshots'")));
});
test('screenshots tom lista → RÖTT', () => {
  const m = giltigtManifest();
  m.screenshots = [];
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("'screenshots'")));
});
test('screenshots återställda → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

test('screenshot utan src → RÖTT', () => {
  const m = giltigtManifest();
  delete m.screenshots[0].src;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('screenshots[0].src')));
});
test('screenshot utan type → RÖTT', () => {
  const m = giltigtManifest();
  delete m.screenshots[0].type;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('screenshots[0].type')));
});

// ═══ form_factor — måste vara EXAKT 'narrow'/'wide' ═══
test('screenshot.form_factor saknas → RÖTT', () => {
  const m = giltigtManifest();
  delete m.screenshots[0].form_factor;
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('form_factor')));
});
test("screenshot.form_factor fel värde ('mobile') → RÖTT", () => {
  const m = giltigtManifest();
  m.screenshots[0].form_factor = 'mobile';
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('form_factor')));
});
test('form_factor återställt → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ minst en narrow + en wide (kortets AC #1-kärna) ═══
test('endast narrow-poster (ingen wide) → RÖTT', () => {
  const m = giltigtManifest();
  m.screenshots = [m.screenshots[0]]; // bara narrow-posten kvar
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("form_factor 'wide'")));
});
test('endast wide-poster (ingen narrow) → RÖTT', () => {
  const m = giltigtManifest();
  m.screenshots = [m.screenshots[1]]; // bara wide-posten kvar
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("form_factor 'narrow'")));
});
test('både narrow och wide återställda → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ sizes-format (AC #1) ═══
test("screenshot.sizes fel format ('750px x 1624px') → RÖTT", () => {
  const m = giltigtManifest();
  m.screenshots[0].sizes = '750px x 1624px';
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('screenshots[0].sizes')));
});
test('sizes återställt → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), { routePaths: ROUTE_PATHS });
  assert.equal(ok, true);
});

// ═══ sizes MOT den faktiska byggda PNG-filen — kärnan i tvåsidigheten ═══
// Utan detta kryss vore ett handskrivet 'sizes'-värde ord mot ord — grinden
// skulle aldrig upptäcka att fältet och filen sagt olika saker.
test('sizes matchar INTE den uppmätta filens dimensioner → RÖTT', () => {
  const m = giltigtManifest();
  m.screenshots[0].sizes = '1000x2000'; // filen är faktiskt 750x1624
  const { ok, errors } = validateManifest(m, {
    routePaths: ROUTE_PATHS,
    screenshotDimensions: SCREENSHOT_DIMENSIONS,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('matchar inte den faktiskt byggda')));
});
test('sizes matchar filen igen → GRÖNT', () => {
  const { ok } = validateManifest(giltigtManifest(), {
    routePaths: ROUTE_PATHS,
    screenshotDimensions: SCREENSHOT_DIMENSIONS,
  });
  assert.equal(ok, true);
});
test('src pekar på en fil som inte finns bland de uppmätta (byggd fil saknas) → RÖTT', () => {
  const m = giltigtManifest();
  m.screenshots[0].src = 'screenshots/finns-inte.png';
  const { ok, errors } = validateManifest(m, {
    routePaths: ROUTE_PATHS,
    screenshotDimensions: SCREENSHOT_DIMENSIONS,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('hittades inte som byggd PNG-fil')));
});
test('screenshotDimensions utelämnad → disk-krysskollen hoppas över (ingen krasch)', () => {
  const m = giltigtManifest();
  m.screenshots[0].sizes = '1000x2000'; // skulle fällt OM screenshotDimensions funnits
  const { ok, errors } = validateManifest(m, { routePaths: ROUTE_PATHS });
  assert.equal(
    ok,
    true,
    `förväntade ok:true utan screenshotDimensions, fick: ${errors.join('; ')}`,
  );
});

// ═══ identisk aspect ratio INOM samma form_factor (kortets AC #1-ordval) ═══
test('två narrow-poster med OLIKA aspect ratio → RÖTT', () => {
  const m = giltigtManifest();
  const dims = new Map(SCREENSHOT_DIMENSIONS);
  m.screenshots.push({
    src: 'screenshots/narrow-annan.png',
    sizes: '400x1000', // annan ratio än 750x1624
    type: 'image/png',
    form_factor: 'narrow',
    label: 'En annan stående vy',
  });
  dims.set('screenshots/narrow-annan.png', { width: 400, height: 1000 });
  const { ok, errors } = validateManifest(m, {
    routePaths: ROUTE_PATHS,
    screenshotDimensions: dims,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('olika aspect ratio')));
});
test('två narrow-poster med IDENTISK aspect ratio (skalad) → GRÖNT', () => {
  const m = giltigtManifest();
  const dims = new Map(SCREENSHOT_DIMENSIONS);
  // 375x812 är exakt halva 750x1624 — samma ratio, olika absolut storlek.
  m.screenshots.push({
    src: 'screenshots/narrow-1x.png',
    sizes: '375x812',
    type: 'image/png',
    form_factor: 'narrow',
    label: 'Samma vy i 1x',
  });
  dims.set('screenshots/narrow-1x.png', { width: 375, height: 812 });
  const { ok, errors } = validateManifest(m, {
    routePaths: ROUTE_PATHS,
    screenshotDimensions: dims,
  });
  assert.equal(ok, true, `förväntade ok:true (identisk ratio), fick: ${errors.join('; ')}`);
});

// ═══ parseSizes ═══
test('parseSizes: giltig sträng → {width,height}', () => {
  assert.deepEqual(parseSizes('750x1624'), { width: 750, height: 1624 });
});
test('parseSizes: versal X ("750X1624") → giltig ändå', () => {
  assert.deepEqual(parseSizes('750X1624'), { width: 750, height: 1624 });
});
test('parseSizes: fel format → undefined', () => {
  assert.equal(parseSizes('750px'), undefined);
});
test('parseSizes: icke-sträng → undefined', () => {
  assert.equal(parseSizes(750), undefined);
});
test('parseSizes: nollbredd → undefined', () => {
  assert.equal(parseSizes('0x1624'), undefined);
});

// ═══ harIdentiskAspectRatio ═══
test('harIdentiskAspectRatio: identiska proportioner (skalade) → true', () => {
  assert.equal(
    harIdentiskAspectRatio({ width: 750, height: 1624 }, { width: 375, height: 812 }),
    true,
  );
});
test('harIdentiskAspectRatio: olika proportioner → false', () => {
  assert.equal(
    harIdentiskAspectRatio({ width: 750, height: 1624 }, { width: 400, height: 1000 }),
    false,
  );
});

// ═══ readPngDimensions — mot en handskriven minimal PNG-header ═══
/**
 * Bygger en MINIMAL giltig PNG-header (signatur + IHDR-chunk med angiven
 * bredd/höjd). Resten av filen (IDAT/IEND) behövs inte — funktionen läser
 * bara de första 24 byten.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Buffer}
 */
function byggPngHeader(width, height) {
  const buffer = Buffer.alloc(24);
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  buffer.writeUInt32BE(13, 8); // IHDR-datalängd (irrelevant för läsningen, men PNG-korrekt)
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}
test('readPngDimensions: giltig PNG-header → korrekta dimensioner', () => {
  assert.deepEqual(readPngDimensions(byggPngHeader(750, 1624)), { width: 750, height: 1624 });
});
test('readPngDimensions: fel signatur (inte en PNG) → undefined', () => {
  const buffer = byggPngHeader(750, 1624);
  buffer[0] = 0x00; // förstör signaturens första byte
  assert.equal(readPngDimensions(buffer), undefined);
});
test('readPngDimensions: för kort buffer → undefined (ingen krasch)', () => {
  assert.equal(readPngDimensions(Buffer.alloc(10)), undefined);
});
test('readPngDimensions: chunk-typ är inte IHDR → undefined', () => {
  const buffer = byggPngHeader(750, 1624);
  buffer.write('IDAT', 12, 'ascii');
  assert.equal(readPngDimensions(buffer), undefined);
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
