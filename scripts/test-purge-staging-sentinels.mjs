#!/usr/bin/env node
// scripts/test-purge-staging-sentinels.mjs — tester för purge-skriptets pura
// skyddsräckes-funktioner (samma konvention som scripts/test-check-*.sh:
// guard-skript bär eget test-skript, körs lokalt vid guard-utveckling).
//
// Kör: node scripts/test-purge-staging-sentinels.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// Testfallen kodar de historiska incidenterna: S52 (ZZ-History-fixturerna
// måste överleva en purge av ZZ-create-event-test) och S69
// (create-test+-sentineler på seed-ankarets event; seed-ankaret bär riktig
// e-post och får aldrig matchas).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  chunk,
  isExactSentinel,
  isOldEnough,
  linkGuardTrips,
  planPurge,
  validatePolicy,
} from './purge-staging-sentinels.mjs';

const REG_TARGET = {
  name: 'create-registration-sentineler',
  table: 'Anmälningar',
  filterByFormula: "AND(FIND('create-test+', {E-post}) = 1, FIND('@staging.test', {E-post}) > 0)",
  exactMatchField: 'E-post',
  exactMatchPattern:
    '^create-test\\+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@staging\\.test$',
  linkGuard: false,
};

const EVENT_TARGET = {
  name: 'create-event-sentineler',
  table: 'Eventplanering',
  filterByFormula: "{Ort} = 'ZZ-create-event-test'",
  exactMatchField: 'Ort',
  exactMatchPattern: '^ZZ-create-event-test$',
  linkGuard: true,
};

const NOW = Date.parse('2026-07-19T12:00:00.000Z');
const OLD = '2026-07-19T09:00:00.000Z'; // 3 h gammal
const FRESH = '2026-07-19T11:30:00.000Z'; // 30 min gammal
const UUID = '01234567-89ab-4cde-8f01-23456789abcd';

let failed = 0;
function t(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

// --- Exakt markör-match (skyddsräcke 3) ---

t('sentinel-e-post med UUID matchar exakt', () => {
  const rec = {
    id: 'recA',
    createdTime: OLD,
    fields: { 'E-post': `create-test+${UUID}@staging.test` },
  };
  assert.equal(isExactSentinel(rec, REG_TARGET), true);
});

t('seed-ankarets riktiga e-post matchar ALDRIG', () => {
  const rec = { id: 'recSeed', createdTime: OLD, fields: { 'E-post': 'lotta@miranon.se' } };
  assert.equal(isExactSentinel(rec, REG_TARGET), false);
});

t('nästan-sentinel (fel UUID-form) matchar inte — formel-träff utan exakt-match rörs ej', () => {
  const rec = {
    id: 'recB',
    createdTime: OLD,
    fields: { 'E-post': 'create-test+hejsan@staging.test' },
  };
  assert.equal(isExactSentinel(rec, REG_TARGET), false);
});

t('ZZ-create-event-test matchar exakt', () => {
  const rec = { id: 'recC', createdTime: OLD, fields: { Ort: 'ZZ-create-event-test' } };
  assert.equal(isExactSentinel(rec, EVENT_TARGET), true);
});

t('S52-fallet: ZZ-History-fixtur matchar ALDRIG (prefix räcker inte)', () => {
  const rec = { id: 'recHist', createdTime: OLD, fields: { Ort: 'ZZ-History' } };
  assert.equal(isExactSentinel(rec, EVENT_TARGET), false);
});

t('ZZ-create-event-test-format (Eventformat-fixturens namn) matchar ALDRIG', () => {
  const rec = { id: 'recFmt', createdTime: OLD, fields: { Ort: 'ZZ-create-event-test-format' } };
  assert.equal(isExactSentinel(rec, EVENT_TARGET), false);
});

t('saknat fält matchar inte', () => {
  const rec = { id: 'recD', createdTime: OLD, fields: {} };
  assert.equal(isExactSentinel(rec, EVENT_TARGET), false);
});

// --- Ålders-guard (skyddsräcke 2) ---

t('3 h gammal sentinel är radera-bar vid 60 min-guard', () => {
  assert.equal(isOldEnough({ createdTime: OLD }, 60, NOW), true);
});

t('30 min färsk sentinel skyddas av 60 min-guarden (in-flight-skyddet)', () => {
  assert.equal(isOldEnough({ createdTime: FRESH }, 60, NOW), false);
});

t('saknad/oparsbar createdTime ⇒ fail-safe: rör ej', () => {
  assert.equal(isOldEnough({ createdTime: undefined }, 60, NOW), false);
  assert.equal(isOldEnough({ createdTime: 'inte-ett-datum' }, 60, NOW), false);
});

// --- Länk-guard (skyddsräcke 4, namn-agnostisk) ---

t('icke-tom rec-ID-array triggar guarden oavsett fältnamn', () => {
  const rec = {
    id: 'recE',
    fields: { Ort: 'ZZ-create-event-test', 'Anmälningar (länkat fält)': ['recAAAABBBBCCCCDD'] },
  };
  assert.deepEqual(linkGuardTrips(rec), ['Anmälningar (länkat fält)']);
});

t('tomma fält och skalärer triggar inte guarden', () => {
  const rec = {
    id: 'recF',
    fields: { Ort: 'ZZ-create-event-test', Status: 'Planerat', 'Max antal platser': 70 },
  };
  assert.deepEqual(linkGuardTrips(rec), []);
});

t('sträng-array som INTE är rec-ID:n (t.ex. multiselect) triggar inte guarden', () => {
  const rec = { id: 'recG', fields: { Format: ['Dag 1', 'Dag 2'] } };
  assert.deepEqual(linkGuardTrips(rec), []);
});

// --- planPurge (helheten) ---

t('planPurge klassar radera/färsk/länkad/icke-exakt korrekt', () => {
  const records = [
    { id: 'rec1', createdTime: OLD, fields: { Ort: 'ZZ-create-event-test' } },
    { id: 'rec2', createdTime: FRESH, fields: { Ort: 'ZZ-create-event-test' } },
    {
      id: 'rec3',
      createdTime: OLD,
      fields: { Ort: 'ZZ-create-event-test', 'Anmälningar (länkat fält)': ['recAAAABBBBCCCCDD'] },
    },
    { id: 'rec4', createdTime: OLD, fields: { Ort: 'ZZ-History' } },
  ];
  const plan = planPurge(records, EVENT_TARGET, 60, NOW);
  assert.deepEqual(plan.toDelete, ['rec1']);
  assert.deepEqual(plan.skippedYoung, ['rec2']);
  assert.deepEqual(plan.skippedLinked, [{ id: 'rec3', fields: ['Anmälningar (länkat fält)'] }]);
  assert.deepEqual(plan.skippedMismatch, ['rec4']);
});

t('linkGuard: false (Anmälningar) raderar trots Event-länken — länken är by-design', () => {
  const records = [
    {
      id: 'rec5',
      createdTime: OLD,
      fields: { 'E-post': `create-test+${UUID}@staging.test`, Event: ['recAAAABBBBCCCCDD'] },
    },
  ];
  const plan = planPurge(records, REG_TARGET, 60, NOW);
  assert.deepEqual(plan.toDelete, ['rec5']);
});

// --- Bas-guard (skyddsräcke 1) ---

const VALID_POLICY = {
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
  minAgeMinutes: 60,
  requestThrottleMs: 250,
  deleteBatchSize: 10,
  targets: [REG_TARGET, EVENT_TARGET],
};

t('giltig policy passerar', () => {
  assert.equal(validatePolicy(VALID_POLICY), VALID_POLICY);
});

t('prod-bas som expectedBaseId REFUSERAS (hårda blockeringen)', () => {
  assert.throws(
    () => validatePolicy({ ...VALID_POLICY, expectedBaseId: 'app8uGPrVCVOm6LfD' }),
    /BLOCKERAD/,
  );
});

t('icke-app-formad bas refuseras', () => {
  assert.throws(
    () => validatePolicy({ ...VALID_POLICY, expectedBaseId: 'tblVE3UKWl1CKrphV' }),
    /app-formad/,
  );
});

t('tom forbiddenBaseIds refuseras — prod måste vara blockerad', () => {
  assert.throws(
    () => validatePolicy({ ...VALID_POLICY, forbiddenBaseIds: [] }),
    /forbiddenBaseIds/,
  );
});

t('minAgeMinutes < 10 refuseras (in-flight-skyddet är golv)', () => {
  assert.throws(() => validatePolicy({ ...VALID_POLICY, minAgeMinutes: 0 }), /minAgeMinutes/);
});

t('target utan exakt-mönster refuseras', () => {
  const broken = { ...VALID_POLICY, targets: [{ name: 'x', table: 'T', filterByFormula: 'f' }] };
  assert.throws(() => validatePolicy(broken), /obligatoriska/);
});

// --- chunk ---

t('chunk delar i ≤10-batchar (Airtable delete-gränsen)', () => {
  const ids = Array.from({ length: 23 }, (_, i) => `rec${i}`);
  const batches = chunk(ids, 10);
  assert.equal(batches.length, 3);
  assert.equal(batches[0].length, 10);
  assert.equal(batches[2].length, 3);
});

t('skarpa policy-filen på disk passerar validatePolicy', () => {
  const raw = JSON.parse(
    readFileSync(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
  );
  validatePolicy(raw);
});

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla purge-guard-tester gröna.');
});
