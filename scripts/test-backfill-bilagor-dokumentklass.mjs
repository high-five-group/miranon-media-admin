#!/usr/bin/env node
// scripts/test-backfill-bilagor-dokumentklass.mjs — tester för
// backfill-bilagor-dokumentklass.mjs:s pura guard-/klassificerings-/
// planeringsfunktioner (samma konvention som test-create-bilagor-table.mjs:
// verktygsskript bär eget test-skript, körs lokalt vid skript-utveckling).
//
// Kör: node scripts/test-backfill-bilagor-dokumentklass.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// HERMETISKT: importerar bara de pura funktionerna, rör aldrig fetch/nätverk,
// kräver ingen token.
//
// INTE WIRAD I ci.yml — samma medvetna avgränsning som
// test-create-bilagor-table.mjs (registrerad, inte tyst utelämnad).

import assert from 'node:assert/strict';
import {
  CONFIG,
  classifyByNamn,
  DOKUMENTKLASS,
  planBackfill,
  validateBaseGuard,
} from './backfill-bilagor-dokumentklass.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`❌ ${name}`);
    console.error(`   ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// validateBaseGuard
// ---------------------------------------------------------------------------

test('validateBaseGuard: den skarpa CONFIG pekar mot staging, inte prod', () => {
  assert.equal(CONFIG.expectedBaseId, 'apphjj8Q7lkXCMsL4');
  assert.ok(!CONFIG.forbiddenBaseIds.includes(CONFIG.expectedBaseId));
});

test('validateBaseGuard: prod-basen är hårt blockerad', () => {
  assert.ok(CONFIG.forbiddenBaseIds.includes('app8uGPrVCVOm6LfD'));
});

test('validateBaseGuard: kastar om expectedBaseId = forbidden (prod-inversionen)', () => {
  assert.throws(
    () =>
      validateBaseGuard({
        expectedBaseId: 'app8uGPrVCVOm6LfD',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
      }),
    /BLOCKERAD/,
  );
});

test('validateBaseGuard: kastar utan forbiddenBaseIds', () => {
  assert.throws(
    () => validateBaseGuard({ expectedBaseId: CONFIG.expectedBaseId, forbiddenBaseIds: [] }),
    /forbiddenBaseIds/,
  );
});

test('validateBaseGuard: kastar på icke app-formad expectedBaseId', () => {
  assert.throws(
    () => validateBaseGuard({ expectedBaseId: 'inte-en-bas', forbiddenBaseIds: ['x'] }),
    /app-formad/,
  );
});

// ---------------------------------------------------------------------------
// classifyByNamn — den härledbara-regeln (AC #3)
// ---------------------------------------------------------------------------

test('classifyByNamn: mall-prefix ⇒ Event-mallad (klass B), verkligt eventnamn', () => {
  assert.equal(
    classifyByNamn('Deltagarinformation – Utbildning Skövde.pdf'),
    DOKUMENTKLASS.EVENT_MALLAD,
  );
});

test('classifyByNamn: mall-prefix ⇒ Event-mallad, test-sentinel-varianten', () => {
  assert.equal(
    classifyByNamn(
      'Deltagarinformation – ZZ-belaggning-fixtur – Utbildning – Fjärrskådning – 2025-11-20.pdf',
    ),
    DOKUMENTKLASS.EVENT_MALLAD,
  );
});

test('classifyByNamn: test-sentinel-uppladdning ⇒ Uppladdad (klass A)', () => {
  assert.equal(
    classifyByNamn('ZZ-attachment-test-758694b7-90dc-4980-bb80-855cad0b5a84.pdf'),
    DOKUMENTKLASS.UPPLADDAD,
  );
});

test('classifyByNamn: ett verkligt Lotta-filnamn (inget mall-prefix) ⇒ Uppladdad', () => {
  assert.equal(classifyByNamn('Hörlursinformation.pdf'), DOKUMENTKLASS.UPPLADDAD);
});

test('classifyByNamn: namnet MÅSTE börja med mall-prefixet — mitt-i-strängen räknas inte', () => {
  // Om prefixet dyker upp mitt i ett Lotta-valt filnamn ska det INTE
  // klassas som genererat — bara EF:ens EGET, prefix-position-genererade
  // Namn gör det.
  assert.equal(
    classifyByNamn('Kopia av Deltagarinformation – gammal.pdf'),
    DOKUMENTKLASS.UPPLADDAD,
  );
});

test('classifyByNamn: null/tomt/icke-sträng Namn ⇒ null (oklassificerbar, aldrig gissad)', () => {
  assert.equal(classifyByNamn(null), null);
  assert.equal(classifyByNamn(undefined), null);
  assert.equal(classifyByNamn(''), null);
  assert.equal(classifyByNamn(42), null);
});

// ---------------------------------------------------------------------------
// planBackfill — idempotens + oklassificerbara bokförs
// ---------------------------------------------------------------------------

test('planBackfill: rad utan Dokumentklass klassas och hamnar i updates', () => {
  const { updates, oklassificerbara } = planBackfill([
    { id: 'rec1', fields: { Namn: 'ZZ-attachment-test-x.pdf' } },
  ]);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, 'rec1');
  assert.equal(updates[0].klass, DOKUMENTKLASS.UPPLADDAD);
  assert.equal(oklassificerbara.length, 0);
});

test('planBackfill: rad med Dokumentklass REDAN satt hoppas över (idempotent skip)', () => {
  const { updates } = planBackfill([
    { id: 'rec1', fields: { Namn: 'ZZ-attachment-test-x.pdf', Dokumentklass: 'Uppladdad' } },
  ]);
  assert.deepEqual(updates, []);
});

test('planBackfill: rad utan Namn hamnar i oklassificerbara, ALDRIG i updates', () => {
  const { updates, oklassificerbara } = planBackfill([{ id: 'rec1', fields: {} }]);
  assert.deepEqual(updates, []);
  assert.equal(oklassificerbara.length, 1);
  assert.equal(oklassificerbara[0].id, 'rec1');
});

test('planBackfill: blandad batch — rätt rad i rätt lista, ingen förväxling', () => {
  const { updates, oklassificerbara } = planBackfill([
    { id: 'redan-klassad', fields: { Namn: 'x.pdf', Dokumentklass: 'Uppladdad' } },
    { id: 'klass-a', fields: { Namn: 'ZZ-attachment-test-x.pdf' } },
    { id: 'klass-b', fields: { Namn: 'Deltagarinformation – X.pdf' } },
    { id: 'ohardledbar', fields: { Namn: '' } },
  ]);
  assert.equal(updates.length, 2);
  assert.ok(updates.some((u) => u.id === 'klass-a' && u.klass === DOKUMENTKLASS.UPPLADDAD));
  assert.ok(updates.some((u) => u.id === 'klass-b' && u.klass === DOKUMENTKLASS.EVENT_MALLAD));
  assert.equal(oklassificerbara.length, 1);
  assert.equal(oklassificerbara[0].id, 'ohardledbar');
});

test('planBackfill: tom lista ⇒ tomma resultat, kastar inte', () => {
  const { updates, oklassificerbara } = planBackfill([]);
  assert.deepEqual(updates, []);
  assert.deepEqual(oklassificerbara, []);
});

// ---------------------------------------------------------------------------
// Sammanfattning
// ---------------------------------------------------------------------------

console.log(`\n${passed} gröna, ${failed} röda (${passed + failed} totalt)`);
process.exit(failed === 0 ? 0 : 1);
