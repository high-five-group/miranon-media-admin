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
  backoffMs,
  chunk,
  fetchWithNetworkRetry,
  isExactSentinel,
  isOldEnough,
  isTransientNetworkError,
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
  linkGuardExcludeFields: ['Eventtyp'],
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

/** Asynkron variant — retry-mekanismen måste awaitas för att kunna räknas. */
async function tAsync(name, fn) {
  try {
    await fn();
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

t(
  'S71-fyndet: Eventtyp-länken (konstruktions-obligatorisk, ADR-066 b5) exkluderas — sentineln raderas',
  () => {
    const rec = {
      id: 'recH',
      createdTime: OLD,
      fields: { Ort: 'ZZ-create-event-test', Eventtyp: ['recclDd7hUQsfxoVs'] },
    };
    assert.deepEqual(linkGuardTrips(rec, ['Eventtyp']), []);
    const plan = planPurge([rec], EVENT_TARGET, 60, NOW);
    assert.deepEqual(plan.toDelete, ['recH']);
  },
);

t('Eventtyp-exkluderingen är SMAL: verklig data-länk bredvid Eventtyp skippar fortfarande', () => {
  const rec = {
    id: 'recI',
    createdTime: OLD,
    fields: {
      Ort: 'ZZ-create-event-test',
      Eventtyp: ['recclDd7hUQsfxoVs'],
      'Anmälningar (länkat fält)': ['recAAAABBBBCCCCDD'],
    },
  };
  const plan = planPurge([rec], EVENT_TARGET, 60, NOW);
  assert.deepEqual(plan.skippedLinked, [{ id: 'recI', fields: ['Anmälningar (länkat fält)'] }]);
  assert.deepEqual(plan.toDelete, []);
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

// --- nätverksrobusthet (TASK-50) ---
//
// Incidenten: 2026-07-25 18:47:15 dog purge-jobbet på `TypeError: fetch
// failed` 1,5 s in, vid FÖRSTA listanropet. Ett transient nätverksfel fällde
// hela CI-körningen via paraply-checken. 429 hade retry sedan tidigare;
// nätverkslagret hade ingenting.

t('TypeError från fetch klassas som transient', () => {
  assert.equal(isTransientNetworkError(new TypeError('fetch failed')), true);
});

t('ApiError (HTTP-fel med statuskod) är INTE transient — får aldrig retry:as', () => {
  // En 422 från Airtable betyder att anropet är fel, inte att nätet vek sig.
  // Retry på den vore att köra samma trasiga anrop tre gånger.
  assert.equal(isTransientNetworkError(new Error('Airtable GET 422: ...')), false);
});

t('godtyckligt fel är inte transient (fail-closed default)', () => {
  assert.equal(isTransientNetworkError(new RangeError('nope')), false);
  assert.equal(isTransientNetworkError('inte ens ett fel'), false);
  assert.equal(isTransientNetworkError(null), false);
});

t('backoff är exponentiell och börjar på 1 s', () => {
  assert.equal(backoffMs(1), 1000);
  assert.equal(backoffMs(2), 2000);
  assert.equal(backoffMs(3), 4000);
});

t('backoff-summan håller sig långt under jobbets timeout-minutes: 5', () => {
  // Tre försök = två väntor (1 s + 2 s). Med throttle och API-tid kvar är
  // marginalen till 5 min stor — retryn får aldrig bli det som fäller jobbet.
  const total = backoffMs(1) + backoffMs(2);
  assert.equal(total, 3000);
  assert.ok(total < 60_000, 'backoff-summan ska vara försumbar mot timeouten');
});

// Mekanismen, inte bara klassificeringen: att retryn FAKTISKT sker.
// Pura tester ovan bevisar att TypeError klassas rätt — de bevisar inte att
// funktionen försöker om. Dessa gör det, mot en mockad fetch.

await tAsync('nätverksfel läks: andra försöket lyckas, anropet returnerar svaret', async () => {
  const orig = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('fetch failed');
    return { ok: true, status: 200 };
  };
  try {
    const res = await fetchWithNetworkRetry('https://x.invalid', 'tok', {});
    assert.equal(res.status, 200);
    assert.equal(calls, 2, 'ska ha gjort exakt två anrop');
  } finally {
    globalThis.fetch = orig;
  }
});

await tAsync('ihållande nätverksfel ger upp efter tre försök och kastar', async () => {
  const orig = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new TypeError('fetch failed');
  };
  try {
    await assert.rejects(() => fetchWithNetworkRetry('https://x.invalid', 'tok', {}), TypeError);
    assert.equal(calls, 3, 'ska ha gjort exakt tre anrop');
  } finally {
    globalThis.fetch = orig;
  }
});

await tAsync('HTTP-fel retry:as ALDRIG — ett anrop, svaret returneras orört', async () => {
  const orig = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: false, status: 422 };
  };
  try {
    const res = await fetchWithNetworkRetry('https://x.invalid', 'tok', {});
    assert.equal(res.status, 422);
    assert.equal(calls, 1, 'HTTP-fel är inte transient — exakt ett anrop');
  } finally {
    globalThis.fetch = orig;
  }
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
