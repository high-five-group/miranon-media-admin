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
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  backoffMs,
  chunk,
  deleteRecords,
  fetchWithNetworkRetry,
  hanteradeIds,
  isAlreadyDeletedError,
  isExactSentinel,
  isOldEnough,
  isStorageObjectOldEnough,
  isTransientNetworkError,
  KASTBARA_POSTER_FIL,
  linkGuardTrips,
  parseArgs,
  parseManifest,
  planEfterKorning,
  planPurge,
  planStoragePurge,
  recordIdFormula,
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

// --- save-segment-targeten (TASK-87) ---
//
// TREDJE INSTANSEN av ADR-060:s wiring-klass: en ny sentinel-form föds med sitt
// test men får ingen target i policyn, och raderna ackumulerar i staging tills
// någon råkar titta. S52 var create-event, S69 create-registration — den här
// gången `save-segment`, med 665 rader i staging-Segment när kortet skrevs
// (räknat mot apphjj8Q7lkXCMsL4 2026-07-30, före något ändrades).
//
// DÄRFÖR LÄSES TARGETEN UR POLICYN PÅ DISK, INTE SOM EN KOPIA.
// REG_TARGET/EVENT_TARGET ovan är kopior, och det är rätt för dem: de bevisar
// att MOTORN klassar rätt. TASK-87:s fråga är en annan — bär POLICYN en target
// som fångar formen? En kopia kan aldrig svara på det. Den hade gått grön med
// en tom targets-lista, vilket är exakt felläget klassen består av.

const POLICY_PA_DISK = JSON.parse(
  readFileSync(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
);

const SEGMENT_TARGET = POLICY_PA_DISK.targets.find((x) => x.name === 'save-segment-sentineler');

/**
 * Ett VERKLIGT post-namn, avläst ur staging-Segment 2026-07-30
 * (`rec07tynH900d4wzL`, en av de 665). Det ligger här som ett AVLÄST DATUM, inte
 * som en levande referens: testerna nedan gör inga Airtable-anrop, och posten
 * får mycket gärna vara raderad av purgen när du läser detta.
 */
const VERKLIGT_SEGMENTNAMN = 'app-segment-test+51c071b1-2130-4d86-a526-030cdd834b77';

t('policyn på disk BÄR save-segment-targeten (klassens rot: den saknades helt)', () => {
  assert.ok(
    SEGMENT_TARGET,
    'targeten "save-segment-sentineler" saknas i .purge-staging-policy.json',
  );
  assert.equal(SEGMENT_TARGET.table, 'Segment');
  assert.equal(SEGMENT_TARGET.exactMatchField, 'Namn på segment');
});

t('AC#2: mönstret matchar ett VERKLIGT post-namn ur staging', () => {
  const rec = {
    id: 'recSeg1',
    createdTime: OLD,
    fields: { 'Namn på segment': VERKLIGT_SEGMENTNAMN },
  };
  assert.equal(isExactSentinel(rec, SEGMENT_TARGET), true);
});

t('mönstret matchar det save-segment-testet FAKTISKT genererar (randomUUID)', () => {
  // Samma uttryck som sentinelName() i tests/api/save-segment.staging.test.ts.
  // Bindningen till producenten är avsiktlig: byter testet form blir detta rött
  // i stället för att targeten tyst slutar fånga. 50 varv täcker UUID v4:ns
  // varians-position, som mönstret läser som vanlig hex.
  for (let i = 0; i < 50; i += 1) {
    const namn = `app-segment-test+${randomUUID()}`;
    const rec = { id: 'recSegN', createdTime: OLD, fields: { 'Namn på segment': namn } };
    assert.equal(isExactSentinel(rec, SEGMENT_TARGET), true, `matchade inte: ${namn}`);
  }
});

t('AC#3 sida A: purgen FÅNGAR en planterad sentinel', () => {
  const rec = {
    id: 'recSegA',
    createdTime: OLD,
    fields: {
      'Namn på segment': VERKLIGT_SEGMENTNAMN,
      Segmentdefinition: 'Med: deltog i Fjärrskådning (utbildning).',
      'App-segmentregel':
        '{"include":[{"kurs":"Fjärrskådning","modalitet":"Utbildning"}],"exclude":[]}',
    },
  };
  const plan = planPurge([rec], SEGMENT_TARGET, 60, NOW);
  assert.deepEqual(plan.toDelete, ['recSegA']);
});

t('AC#3 sida B: poster UTANFÖR mönstret rörs ALDRIG', () => {
  const utanfor = [
    // Ett människo-namngivet segment — formen de nio legacy-raderna bär.
    { id: 'recMan', createdTime: OLD, fields: { 'Namn på segment': 'Tidigare deltagare' } },
    // Nästan-sentinel utan UUID: träffar formeln, missar exakt-matchen (S69-formen).
    { id: 'recNara', createdTime: OLD, fields: { 'Namn på segment': 'app-segment-test+hejsan' } },
    // Suffix efter UUID:t — $-ankaret bär.
    {
      id: 'recSuffix',
      createdTime: OLD,
      fields: { 'Namn på segment': `${VERKLIGT_SEGMENTNAMN}-kopia` },
    },
    // Markören i mitten i stället för först — ^-ankaret bär. (Server-side kräver
    // formeln dessutom position 1; exakt-matchen står ensam här.)
    {
      id: 'recMitten',
      createdTime: OLD,
      fields: { 'Namn på segment': `kopia av ${VERKLIGT_SEGMENTNAMN}` },
    },
  ];
  const plan = planPurge(utanfor, SEGMENT_TARGET, 60, NOW);
  assert.deepEqual(plan.toDelete, []);
  assert.deepEqual(plan.skippedMismatch, ['recMan', 'recNara', 'recSuffix', 'recMitten']);
});

t('färsk segment-sentinel skyddas av ålders-guarden (in-flight-körning)', () => {
  const rec = {
    id: 'recFarsk',
    createdTime: FRESH,
    fields: { 'Namn på segment': VERKLIGT_SEGMENTNAMN },
  };
  const plan = planPurge([rec], SEGMENT_TARGET, 60, NOW);
  assert.deepEqual(plan.skippedYoung, ['recFarsk']);
  assert.deepEqual(plan.toDelete, []);
});

t('linkGuard: ett segment kopplat till ett Mailutskick lämnas kvar (fail-safe)', () => {
  // `Mailutskick` (fldjUIp0iqRpJWgem) är multipleRecordLinks → Bulkutskick
  // (tblWarzSse85NI1Zx), live-avläst mot staging 2026-07-30. save-segment sätter
  // aldrig fältet, så guarden är en spärr för framtiden: kopplar någon en testrad
  // till ett verkligt utskick är den inte längre skräp.
  const rec = {
    id: 'recKopplad',
    createdTime: OLD,
    fields: { 'Namn på segment': VERKLIGT_SEGMENTNAMN, Mailutskick: ['recAAAABBBBCCCCDD'] },
  };
  const plan = planPurge([rec], SEGMENT_TARGET, 60, NOW);
  assert.deepEqual(plan.skippedLinked, [{ id: 'recKopplad', fields: ['Mailutskick'] }]);
  assert.deepEqual(plan.toDelete, []);
});

t('L288-kontrollen: rad-formens objekt-fält gör INTE länk-guarden till en no-op', () => {
  // Varje Segment-rad bär `Beräkna antal i segment` (Make-webhook-knappen) som
  // ett OBJEKT {label, url}, och `Senast uppdaterad av` som ett användar-objekt.
  // Hade någon av dem trippat guarden vore targeten en no-op på precis alla 665
  // raderna — S71:s L288-fälla, där en 100 %-guard ser ut som ett skyddsräcke men
  // är en tyst broms. Formen är live-avläst 2026-07-30, inte antagen.
  const rec = {
    id: 'recKnapp',
    createdTime: OLD,
    fields: {
      'Namn på segment': VERKLIGT_SEGMENTNAMN,
      'Beräkna antal i segment': {
        label: 'Beräkna',
        url: 'https://hook.eu2.make.com/7zb62cph1ykf37pegomxshqw2tcwg2uc?recordId=rec07tynH900d4wzL',
      },
      'Senast uppdaterad av': { id: 'usr4xVlqcZ2qSOMmh', name: 'Marcus Johansson' },
      'Senast uppdaterad': '2026-07-12T18:36:42.000Z',
    },
  };
  assert.deepEqual(linkGuardTrips(rec), []);
  const plan = planPurge([rec], SEGMENT_TARGET, 60, NOW);
  assert.deepEqual(plan.toDelete, ['recKnapp']);
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

// --- [TASK-302.3] validatePolicy — storageTargets (optionell klass) ---

const UTKAST_STORAGE_TARGET = { name: 'utkast-drafts', bucket: 'bilagor', pathPrefix: 'utkast' };

t('policy UTAN storageTargets passerar oförändrat (bakåtkompatibel, optionell klass)', () => {
  assert.equal(validatePolicy(VALID_POLICY).storageTargets, undefined);
});

t('giltig storageTargets passerar', () => {
  const withStorage = { ...VALID_POLICY, storageTargets: [UTKAST_STORAGE_TARGET] };
  assert.equal(validatePolicy(withStorage), withStorage);
});

t('tom storageTargets-array refuseras — nyckeln ska tas bort helt i stället', () => {
  assert.throws(
    () => validatePolicy({ ...VALID_POLICY, storageTargets: [] }),
    /storageTargets är satt men tomt/,
  );
});

t('storageTarget utan pathPrefix refuseras', () => {
  const broken = { ...VALID_POLICY, storageTargets: [{ name: 'x', bucket: 'bilagor' }] };
  assert.throws(() => validatePolicy(broken), /obligatoriska/);
});

t('storageTarget utan bucket refuseras', () => {
  const broken = { ...VALID_POLICY, storageTargets: [{ name: 'x', pathPrefix: 'utkast' }] };
  assert.throws(() => validatePolicy(broken), /obligatoriska/);
});

t('storageTarget utan name refuseras', () => {
  const broken = { ...VALID_POLICY, storageTargets: [{ bucket: 'bilagor', pathPrefix: 'utkast' }] };
  assert.throws(() => validatePolicy(broken), /obligatoriska/);
});

t('policyn på disk BÄR utkast-storageTargeten (.purge-staging-policy.json, TASK-302.3)', () => {
  const onDisk = JSON.parse(
    readFileSync(new URL('../.purge-staging-policy.json', import.meta.url)),
  );
  assert.ok(Array.isArray(onDisk.storageTargets) && onDisk.storageTargets.length > 0);
  const target = onDisk.storageTargets.find((s) => s.name === 'utkast-drafts');
  assert.ok(target, 'utkast-drafts-targeten saknas i .purge-staging-policy.json');
  assert.equal(target.bucket, 'bilagor');
  assert.equal(target.pathPrefix, 'utkast');
});

// --- [TASK-302.3] isStorageObjectOldEnough / planStoragePurge ---

t('3 h gammalt Storage-objekt är radera-bart vid 60 min-guard', () => {
  const entry = { path: 'utkast/recX/kvitto.pdf', updatedAt: OLD };
  assert.equal(isStorageObjectOldEnough(entry, 60, NOW), true);
});

t('30 min färskt Storage-objekt skyddas av 60 min-guarden (in-flight-skyddet)', () => {
  const entry = { path: 'utkast/recX/kvitto.pdf', updatedAt: FRESH };
  assert.equal(isStorageObjectOldEnough(entry, 60, NOW), false);
});

t('saknad/oparsbar updatedAt ⇒ fail-safe: rör ej (samma riktning som isOldEnough)', () => {
  assert.equal(isStorageObjectOldEnough({ path: 'x', updatedAt: null }, 60, NOW), false);
  assert.equal(
    isStorageObjectOldEnough({ path: 'x', updatedAt: 'inte-ett-datum' }, 60, NOW),
    false,
  );
});

t('planStoragePurge klassar gammalt/färskt korrekt, och BARA det', () => {
  const entries = [
    { path: 'utkast/recA/bilaga.pdf', updatedAt: OLD },
    { path: 'utkast/recB/kvitto.pdf', updatedAt: FRESH },
  ];
  const plan = planStoragePurge(entries, 60, NOW);
  assert.deepEqual(plan.toDelete, ['utkast/recA/bilaga.pdf']);
  assert.deepEqual(plan.skippedYoung, ['utkast/recB/kvitto.pdf']);
});

t('planStoragePurge på en tom lista ger en tom plan (inget att purga är inget fel)', () => {
  const plan = planStoragePurge([], 60, NOW);
  assert.deepEqual(plan.toDelete, []);
  assert.deepEqual(plan.skippedYoung, []);
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

// --- idempotens mot samtidiga purges (TASK-76) ---
//
// Racet: listSentinels() och deleteRecords() är två faser. Två samtidiga
// purges ser samma sentinel, båda kör DELETE, den som kommer sist får 404.
// Observerat tre gånger 2026-07-28 (#390 vs #391, #394 vs #390, nightly vs
// post-merge) — i varje par föll exakt EN. En DELETE av en redan raderad post
// har uppnått sitt mål och ska räknas som succé.
//
// FELKROPPARNA NEDAN ÄR LIVE-MÄTTA mot staging (apphjj8Q7lkXCMsL4,
// 2026-07-29) med den skarpa least-privilege-PAT:en. Inget muterades — alla
// rec-ID:n var fabricerade och existerade aldrig.

const BODY_RECORD_NOT_FOUND = (id) =>
  JSON.stringify({
    error: { type: 'NOT_FOUND', message: `Could not find a record with ID "${id}".` },
  });

// Mätt svar för BÅDE okänd tabell, okänd bas och prod-basen utan scope.
const BODY_MODEL_NOT_FOUND = JSON.stringify({
  error: {
    type: 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND',
    message:
      'Invalid permissions, or the requested model was not found. Check that both your user ' +
      'and your token have the required permissions, and that the model names and/or ids are correct.',
  },
});

const ID_A = 'recAAAABBBBCCCCDD';
const ID_B = 'recEEEEFFFFGGGGHH';
const ID_C = 'recIIIIJJJJKKKKLL';

t('redan raderad post: 404 NOT_FOUND som namnger en post VI bad om ⇒ succé', () => {
  assert.equal(isAlreadyDeletedError(404, BODY_RECORD_NOT_FOUND(ID_A), [ID_A, ID_B]), true);
});

// --- NEGATIVT SELF-TEST (AC #3): fixen får inte vara fail-open ---

t('NEGATIVT: 403 för fel bas/fel tabell fäller fortfarande (mätt felform)', () => {
  assert.equal(isAlreadyDeletedError(403, BODY_MODEL_NOT_FOUND, [ID_A]), false);
});

t(
  'NEGATIVT: 404 med samma kropp men fel statuskod-klass fäller — status måste vara exakt 404',
  () => {
    assert.equal(isAlreadyDeletedError(500, BODY_RECORD_NOT_FOUND(ID_A), [ID_A]), false);
    assert.equal(isAlreadyDeletedError(422, BODY_RECORD_NOT_FOUND(ID_A), [ID_A]), false);
  },
);

t('NEGATIVT: bas-nivåns {"error":"NOT_FOUND"} (STRÄNG, inte objekt) fäller', () => {
  // Airtables dokumenterade form när själva BASEN inte hittas. Vår
  // least-privilege-PAT ger i dag 403 för det fallet (mätt), men en bredare
  // token kan ge denna 404 — och då ska den fälla, inte sväljas.
  assert.equal(isAlreadyDeletedError(404, JSON.stringify({ error: 'NOT_FOUND' }), [ID_A]), false);
});

t('NEGATIVT: 404 som namnger en post vi ALDRIG bad om fäller (det är inte vårt race)', () => {
  assert.equal(isAlreadyDeletedError(404, BODY_RECORD_NOT_FOUND(ID_C), [ID_A, ID_B]), false);
});

t('NEGATIVT: 404 med rätt type men utan rec-ID i meddelandet fäller', () => {
  const body = JSON.stringify({
    error: { type: 'NOT_FOUND', message: 'Could not find what you are looking for' },
  });
  assert.equal(isAlreadyDeletedError(404, body, [ID_A]), false);
});

t('NEGATIVT: TABLE_NOT_FOUND med 404 fäller — fel tabell är aldrig "redan raderad"', () => {
  const body = JSON.stringify({
    error: { type: 'TABLE_NOT_FOUND', message: `Could not find a record with ID "${ID_A}".` },
  });
  assert.equal(isAlreadyDeletedError(404, body, [ID_A]), false);
});

t('NEGATIVT: oparsbar eller tom kropp fäller (fail-closed default)', () => {
  assert.equal(isAlreadyDeletedError(404, 'inte json', [ID_A]), false);
  assert.equal(isAlreadyDeletedError(404, '', [ID_A]), false);
  assert.equal(isAlreadyDeletedError(404, undefined, [ID_A]), false);
});

t('NEGATIVT: tom lista av begärda id:n kan aldrig ge succé', () => {
  assert.equal(isAlreadyDeletedError(404, BODY_RECORD_NOT_FOUND(ID_A), []), false);
  assert.equal(isAlreadyDeletedError(404, BODY_RECORD_NOT_FOUND(ID_A), undefined), false);
});

// Mekanismen, inte bara klassificeringen: att deleteRecords FAKTISKT tar om
// batchen post för post och överlever racet. Samma form som nätverks-retryns
// mekanism-tester (TASK-50) — mockad fetch, räknade anrop.

const DELETE_TARGET = { name: 'test', table: 'Eventplanering' };

function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

/** Mocka fetch och svara per anrop utifrån vilka records[] som begärdes. */
function mockFetch(handler) {
  const calls = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const ids = url.searchParams.getAll('records[]');
    calls.push(ids);
    return handler(ids, calls.length);
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = orig;
    },
  };
}

const okDelete = (ids) =>
  fakeResponse(200, JSON.stringify({ records: ids.map((id) => ({ id, deleted: true })) }));

await tAsync('RACET: batch-404 tas om post för post — jobbet överlever, inget kastas', async () => {
  const m = mockFetch((ids, n) => {
    if (n === 1) return fakeResponse(404, BODY_RECORD_NOT_FOUND(ID_B)); // batchen
    if (ids[0] === ID_B) return fakeResponse(404, BODY_RECORD_NOT_FOUND(ID_B)); // redan borta
    return okDelete(ids);
  });
  try {
    const out = await deleteRecords(
      'apphjj8Q7lkXCMsL4',
      DELETE_TARGET,
      [ID_A, ID_B, ID_C],
      'tok',
      0,
      10,
    );
    assert.deepEqual(out, { deleted: 2, alreadyGone: 1 });
    assert.equal(m.calls.length, 4, 'ett batch-anrop + tre post-för-post-anrop');
    assert.deepEqual(m.calls[0], [ID_A, ID_B, ID_C]);
    assert.deepEqual(m.calls.slice(1), [[ID_A], [ID_B], [ID_C]]);
  } finally {
    m.restore();
  }
});

await tAsync('utan race: EN batch, ingen fallback — den vanliga vägen är orörd', async () => {
  const m = mockFetch((ids) => okDelete(ids));
  try {
    const out = await deleteRecords(
      'apphjj8Q7lkXCMsL4',
      DELETE_TARGET,
      [ID_A, ID_B, ID_C],
      'tok',
      0,
      10,
    );
    assert.deepEqual(out, { deleted: 3, alreadyGone: 0 });
    assert.equal(m.calls.length, 1, 'ingen fallback får ske utan race');
  } finally {
    m.restore();
  }
});

await tAsync(
  'NEGATIVT: 403 fel-bas/fel-tabell kastar — ingen fallback, jobbet fäller',
  async () => {
    const m = mockFetch(() => fakeResponse(403, BODY_MODEL_NOT_FOUND));
    try {
      await assert.rejects(
        () => deleteRecords('apphjj8Q7lkXCMsL4', DELETE_TARGET, [ID_A, ID_B], 'tok', 0, 10),
        /Airtable DELETE 403/,
      );
      assert.equal(m.calls.length, 1, 'fatalt fel får ALDRIG ge post-för-post-fallback');
    } finally {
      m.restore();
    }
  },
);

await tAsync(
  'NEGATIVT: 404 som namnger främmande post kastar — fallbacken är inte en 404-svälj',
  async () => {
    const m = mockFetch(() => fakeResponse(404, BODY_RECORD_NOT_FOUND(ID_C)));
    try {
      await assert.rejects(
        () => deleteRecords('apphjj8Q7lkXCMsL4', DELETE_TARGET, [ID_A, ID_B], 'tok', 0, 10),
        /Airtable DELETE 404/,
      );
      assert.equal(m.calls.length, 1);
    } finally {
      m.restore();
    }
  },
);

await tAsync('NEGATIVT: fatalt fel MITT I fallbacken kastar vidare', async () => {
  const m = mockFetch((ids, n) => {
    if (n === 1) return fakeResponse(404, BODY_RECORD_NOT_FOUND(ID_A)); // batchen ⇒ fallback
    if (ids[0] === ID_A) return fakeResponse(404, BODY_RECORD_NOT_FOUND(ID_A)); // redan borta
    return fakeResponse(403, BODY_MODEL_NOT_FOUND); // …och sedan ett äkta fel
  });
  try {
    await assert.rejects(
      () => deleteRecords('apphjj8Q7lkXCMsL4', DELETE_TARGET, [ID_A, ID_B], 'tok', 0, 10),
      /Airtable DELETE 403/,
    );
    assert.equal(m.calls.length, 3, 'batch + två post-för-post innan det fatala felet');
  } finally {
    m.restore();
  }
});

t('skarpa policy-filen på disk passerar validatePolicy', () => {
  const raw = JSON.parse(
    readFileSync(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
  );
  validatePolicy(raw);
});

// --- [TASK-309.3] Bilagornas skrivvägars sentinel-targets (ADR-125 § 2) ---
// Spot-checks (utkast-drafts-mönstret ovan) — bevisar att de TRE nya
// targetsen faktiskt landade i .purge-staging-policy.json med rätt tabell,
// exakt-match-fält och linkGuard-exkludering. `save-event-text`s throwaway-
// events, `save-place-standard`s Platser-rader och agendans Agendapunkter-
// rader delar ALLA prefixet `ZZ-TASK-309.3-` (data-model.md § Bilagornas
// datamodell).

function findTarget(name) {
  const raw = JSON.parse(
    readFileSync(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
  );
  return raw.targets.find((tgt) => tgt.name === name);
}

t('policyn på disk BÄR save-event-text-eventplanering-sentineler (Eventplanering, Ort)', () => {
  const target = findTarget('save-event-text-eventplanering-sentineler');
  assert.ok(
    target,
    'save-event-text-eventplanering-sentineler saknas i .purge-staging-policy.json',
  );
  assert.equal(target.table, 'Eventplanering');
  assert.equal(target.exactMatchField, 'Ort');
  assert.equal(target.linkGuard, true);
  // Plats/Agendapunkter är FÖRVÄNTADE länkar på dessa test-events (AC #1
  // sätter agendans egen kopia, AC #2 länkar Plats) — linkGuard ska inte
  // fastna på dem (samma "exkludera de konstruktions-kända länkarna"-
  // disciplin som create-event-sentineler redan tillämpar på Eventtyp).
  assert.deepEqual(target.linkGuardExcludeFields, ['Eventtyp', 'Plats', 'Agendapunkter']);
  assert.equal(isExactSentinel({ fields: { Ort: 'ZZ-TASK-309.3-plats-abc123' } }, target), true);
  assert.equal(isExactSentinel({ fields: { Ort: 'ZZ-create-event-test' } }, target), false);
});

t('policyn på disk BÄR save-place-standard-platser-sentineler (Platser, Namn)', () => {
  const target = findTarget('save-place-standard-platser-sentineler');
  assert.ok(target, 'save-place-standard-platser-sentineler saknas i .purge-staging-policy.json');
  assert.equal(target.table, 'Platser');
  assert.equal(target.exactMatchField, 'Namn');
  assert.equal(target.linkGuard, true);
  // 'Eventplanering' är Platsers auto-födda spegelfält (ADR-125 § 2) —
  // POPULERAT så fort ett event länkas, alltid, by design. Utan denna
  // exkludering skulle VARJE test-Platser-rad permanent fastna i linkGuard.
  assert.deepEqual(target.linkGuardExcludeFields, ['Eventplanering']);
  assert.equal(isExactSentinel({ fields: { Namn: 'ZZ-TASK-309.3-plats-abc123' } }, target), true);
  assert.equal(isExactSentinel({ fields: { Namn: 'Rönninge' } }, target), false);
});

// --- [TASK-309.7] Platser-ytans event-lösa "ny plats"-läge (ADR-125 § 7) ---
// Egen prefix (ZZ-TASK-309.7-, inte 309.3): läge 3 (`save-place-standard`s
// event-lösa gren) skapar Platser-rader UTAN något Eventplanering-event i
// sikte alls — en annan sentinel-klass än 309.3:s "skapad via ett
// throwaway-event"-mönster, och därför sin egen target i stället för att
// (felaktigt) återanvända 309.3:s filter.
t('policyn på disk BÄR save-place-standard-event-los-platser-sentineler (Platser, Namn)', () => {
  const target = findTarget('save-place-standard-event-los-platser-sentineler');
  assert.ok(
    target,
    'save-place-standard-event-los-platser-sentineler saknas i .purge-staging-policy.json',
  );
  assert.equal(target.table, 'Platser');
  assert.equal(target.exactMatchField, 'Namn');
  assert.equal(target.linkGuard, true);
  assert.deepEqual(target.linkGuardExcludeFields, ['Eventplanering']);
  assert.equal(isExactSentinel({ fields: { Namn: 'ZZ-TASK-309.7-plats-abc123' } }, target), true);
  assert.equal(isExactSentinel({ fields: { Namn: 'ZZ-TASK-309.3-plats-abc123' } }, target), false);
  assert.equal(isExactSentinel({ fields: { Namn: 'Rönninge' } }, target), false);
});

t('policyn på disk BÄR save-event-text-agendapunkter-sentineler (Agendapunkter, Text)', () => {
  const target = findTarget('save-event-text-agendapunkter-sentineler');
  assert.ok(target, 'save-event-text-agendapunkter-sentineler saknas i .purge-staging-policy.json');
  assert.equal(target.table, 'Agendapunkter');
  assert.equal(target.exactMatchField, 'Text');
  // linkGuard: false — Event/Eventinnehåll är FÖRVÄNTADE, obligatoriska
  // länkar på VARJE Agendapunkter-rad (ADR-125 § 2: "hör till EXAKT EN
  // förälder") — true hade gjort linkGuard fail-open för hela tabellen
  // (varje rad skulle träffas, ingen rad skulle någonsin purgas).
  assert.equal(target.linkGuard, false);
  assert.equal(isExactSentinel({ fields: { Text: 'ZZ-TASK-309.3-rad-1' } }, target), true);
  assert.equal(isExactSentinel({ fields: { Text: 'Miranon Media' } }, target), false);
});

// ---------------------------------------------------------------------------
// [TASK-309.15] Efter-körning-läget — ägar-manifestet
// ---------------------------------------------------------------------------

t('parseArgs: utan flagga → setup-läget, inget manifest', () => {
  assert.deepEqual(parseArgs(['node', 'x']), {
    lage: 'setup',
    dryRun: false,
    manifestFil: null,
  });
});

t('parseArgs: --efter-korning utan sökväg → default-manifestet', () => {
  const a = parseArgs(['node', 'x', '--efter-korning']);
  assert.equal(a.lage, 'efter-korning');
  assert.equal(a.manifestFil, KASTBARA_POSTER_FIL);
});

t('parseArgs: --efter-korning med sökväg → den sökvägen', () => {
  const a = parseArgs(['node', 'x', '--efter-korning', 'nagon/annan.jsonl']);
  assert.equal(a.manifestFil, 'nagon/annan.jsonl');
});

t('parseArgs: --efter-korning --dry-run tar INTE flaggan som sökväg', () => {
  const a = parseArgs(['node', 'x', '--efter-korning', '--dry-run']);
  assert.equal(a.manifestFil, KASTBARA_POSTER_FIL);
  assert.equal(a.dryRun, true);
});

/**
 * DRIFT-VAKTEN. Manifestets sökväg finns på TVÅ ställen — skrivaren är
 * TypeScript i Playwright-processen, läsaren är detta Node-script, och de kan
 * inte dela modul. Går de isär läser purgen en tom fil och rapporterar "inget
 * att städa" utan att något ser fel ut: frånvaro presenterad som data, repots
 * egen återkommande felklass. Därför korsläses de här.
 */
t('KASTBARA_POSTER_FIL är IDENTISK med tests/support/kastbara-poster.ts', () => {
  const ts = readFileSync(new URL('../tests/support/kastbara-poster.ts', import.meta.url), 'utf8');
  const m = /export const KASTBARA_POSTER_FIL = '([^']+)'/.exec(ts);
  assert.ok(m, 'hittade ingen KASTBARA_POSTER_FIL-deklaration i tests/support/kastbara-poster.ts');
  assert.equal(m[1], KASTBARA_POSTER_FIL);
});

t('parseManifest: giltiga rader ger ID-mängd + beskrivningar', () => {
  const { ids, vad, ogiltiga } = parseManifest(
    `${JSON.stringify({ id: 'recAAAAAAAAAAAAAA', vad: 'create-event/allow' })}\n` +
      `${JSON.stringify({ id: 'recBBBBBBBBBBBBBB', vad: 'update-event' })}\n`,
  );
  assert.deepEqual([...ids].sort(), ['recAAAAAAAAAAAAAA', 'recBBBBBBBBBBBBBB']);
  assert.equal(vad.get('recAAAAAAAAAAAAAA'), 'create-event/allow');
  assert.deepEqual(ogiltiga, []);
});

t('parseManifest: tomma rader ignoreras helt (append-only-filens svans)', () => {
  const { ids, ogiltiga } = parseManifest(
    `\n${JSON.stringify({ id: 'recAAAAAAAAAAAAAA', vad: 'x' })}\n\n\n`,
  );
  assert.equal(ids.size, 1);
  assert.deepEqual(ogiltiga, []);
});

t('parseManifest: dubblett slås ihop, FÖRSTA beskrivningen behålls', () => {
  const { ids, vad } = parseManifest(
    `${JSON.stringify({ id: 'recAAAAAAAAAAAAAA', vad: 'forsta' })}\n` +
      `${JSON.stringify({ id: 'recAAAAAAAAAAAAAA', vad: 'andra' })}\n`,
  );
  assert.equal(ids.size, 1);
  assert.equal(vad.get('recAAAAAAAAAAAAAA'), 'forsta');
});

t('parseManifest: trasig JSON blir OGILTIG rad — rapporteras, raderar inget', () => {
  const { ids, ogiltiga } = parseManifest('{inte-json\n');
  assert.equal(ids.size, 0);
  assert.equal(ogiltiga.length, 1);
});

t('parseManifest: icke-rec-formad id blir OGILTIG rad (fail-closed)', () => {
  const { ids, ogiltiga } = parseManifest(
    `${JSON.stringify({ id: 'tblAAAAAAAAAAAAA', vad: 'fel-typ' })}\n` +
      `${JSON.stringify({ id: '../../etc/passwd', vad: 'illvillig' })}\n` +
      `${JSON.stringify({ vad: 'saknar id' })}\n`,
  );
  assert.equal(ids.size, 0);
  assert.equal(ogiltiga.length, 3);
});

const AGD = 'recOWNED00000001';
const FRAMMANDE = 'recFOREIGN000001';

t('planEfterKorning: ÄGD exakt sentinel raderas — även 30 min FÄRSK', () => {
  // Ålders-guarden är ERSATT av ägarskapet i detta läge. En färsk rad som står
  // i körningens EGET manifest är per konstruktion inte någon annans
  // in-flight-rad, och det är hela poängen: setup-purgens 60-minutersgräns är
  // just det som gör att raden annars ligger kvar och syns i eventväljaren.
  const plan = planEfterKorning(
    [{ id: AGD, createdTime: FRESH, fields: { Ort: 'ZZ-create-event-test' } }],
    EVENT_TARGET,
    new Set([AGD]),
    NOW,
  );
  assert.deepEqual(plan.toDelete, [AGD]);
});

t('planEfterKorning: FRÄMMANDE rad rörs ALDRIG, hur exakt den än matchar', () => {
  // Den bärande riktningen: en samtidig LOKAL körnings rad matchar formeln och
  // mönstret perfekt, men står inte i CI:s manifest. Skulle den raderas vore
  // efter-körning-läget farligare än det fönster det stänger.
  const plan = planEfterKorning(
    [
      { id: AGD, createdTime: OLD, fields: { Ort: 'ZZ-create-event-test' } },
      { id: FRAMMANDE, createdTime: OLD, fields: { Ort: 'ZZ-create-event-test' } },
    ],
    EVENT_TARGET,
    new Set([AGD]),
    NOW,
  );
  assert.deepEqual(plan.toDelete, [AGD]);
  assert.equal(plan.toDelete.includes(FRAMMANDE), false);
});

t('planEfterKorning: ägd rad utanför exakt-mönstret raderas INTE', () => {
  const plan = planEfterKorning(
    [{ id: AGD, createdTime: OLD, fields: { Ort: 'ZZ-History Ort' } }],
    EVENT_TARGET,
    new Set([AGD]),
    NOW,
  );
  assert.deepEqual(plan.toDelete, []);
  assert.deepEqual(plan.skippedMismatch, [AGD]);
});

t('planEfterKorning: länk-guarden gäller oförändrat även för ägda rader', () => {
  const plan = planEfterKorning(
    [
      {
        id: AGD,
        createdTime: OLD,
        fields: { Ort: 'ZZ-create-event-test', 'Anmälningar (länkat fält)': ['recZZZZZZZZZZZZZZ'] },
      },
    ],
    EVENT_TARGET,
    new Set([AGD]),
    NOW,
  );
  assert.deepEqual(plan.toDelete, []);
  assert.equal(plan.skippedLinked.length, 1);
});

t('planEfterKorning: oläsbar createdTime ⇒ fail-safe, ägd rad rörs ändå INTE', () => {
  const plan = planEfterKorning(
    [{ id: AGD, fields: { Ort: 'ZZ-create-event-test' } }],
    EVENT_TARGET,
    new Set([AGD]),
    NOW,
  );
  assert.deepEqual(plan.toDelete, []);
  assert.deepEqual(plan.skippedYoung, [AGD]);
});

t('hanteradeIds: samlar VARJE id ett plan rörde vid, oavsett utfall', () => {
  const plan = {
    toDelete: ['rec1'],
    skippedYoung: ['rec2'],
    skippedMismatch: ['rec3'],
    skippedLinked: [{ id: 'rec4', fields: ['X'] }],
  };
  assert.deepEqual(hanteradeIds(plan).sort(), ['rec1', 'rec2', 'rec3', 'rec4']);
});

t('recordIdFormula: bygger en OR över exakt de givna ID:na', () => {
  assert.equal(
    recordIdFormula(['recAAAAAAAAAAAAAA', 'recBBBBBBBBBBBBBB']),
    "OR(RECORD_ID()='recAAAAAAAAAAAAAA',RECORD_ID()='recBBBBBBBBBBBBBB')",
  );
});

// --- [TASK-309.15] update-event-uppdaterad-targeten (den permanenta läckan) ---
//
// KLASSENS ROT: update-event.staging.test.ts döper om sitt sentinel-event och
// återställer i `finally`. Faller `finally` matchar raden VARKEN
// create-event-sentinelernas formel eller mönster, och blir opurgbar för
// alltid. MÄTT i staging 2026-08-24: två rader, 26,9 och 32,3 dygn gamla —
// medan varje ANNAN kastbar familj var yngre än 2,4 h.
t('policyn på disk BÄR update-event-uppdaterad-sentineler (Eventplanering, Ort)', () => {
  const target = findTarget('update-event-uppdaterad-sentineler');
  assert.ok(target, 'update-event-uppdaterad-sentineler saknas i .purge-staging-policy.json');
  assert.equal(target.table, 'Eventplanering');
  assert.equal(target.exactMatchField, 'Ort');
  assert.equal(target.linkGuard, true);
  assert.deepEqual(target.linkGuardExcludeFields, ['Eventtyp']);
});

t('AC sida A: den uppdaterade orten FÅNGAS av den nya targeten', () => {
  const target = findTarget('update-event-uppdaterad-sentineler');
  assert.equal(
    isExactSentinel({ fields: { Ort: 'ZZ-create-event-test-uppdaterad' } }, target),
    true,
  );
});

t('AC sida B: targeten är SMAL — rör varken basorten eller fixturerna', () => {
  const target = findTarget('update-event-uppdaterad-sentineler');
  // Basorten ägs av create-event-sentineler, inte av denna target.
  assert.equal(isExactSentinel({ fields: { Ort: 'ZZ-create-event-test' } }, target), false);
  // Prefix räcker aldrig (S52-formen).
  assert.equal(
    isExactSentinel({ fields: { Ort: 'ZZ-create-event-test-uppdaterad-igen' } }, target),
    false,
  );
  // Granskningsfixturen får ALDRIG bli purge-bar (CLAUDE.md § seed:review).
  assert.equal(isExactSentinel({ fields: { Ort: 'ZZ-GRANSKNING-S103' } }, target), false);
  assert.equal(isExactSentinel({ fields: { Ort: 'Rönninge' } }, target), false);
});

t('den nya targeten gör INTE någon ANNAN targets mönster bredare', () => {
  // Omvänd riktning: create-event-sentineler får inte plötsligt fånga den
  // uppdaterade orten (den skulle då raderas av setup-purgen MITT i ett
  // pågående update-event-test, före `finally` hunnit återställa).
  assert.equal(
    isExactSentinel(
      { fields: { Ort: 'ZZ-create-event-test-uppdaterad' } },
      findTarget('create-event-sentineler'),
    ),
    false,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// [TASK-346.3] postgresTargets — betalningsdomänen och jobbmotorn i Postgres
// ═══════════════════════════════════════════════════════════════════════════

const PG_TARGET = POLICY_PA_DISK.postgresTargets?.find(
  (x) => x.name === 'task-346-betalningsdomanen-sentineler',
);

t('POLICYN PÅ DISK bär postgresTargets för betalningsdomänen', () => {
  // Samma klass-argument som TASK-87:s target-fråga ovan: en kopia av
  // targetet i denna fil hade svarat på om MOTORN klassar rätt, aldrig på
  // om policyn faktiskt BÄR posten. Utan den städas ingenting.
  assert.ok(PG_TARGET, 'postgresTargets saknar task-346-betalningsdomanen-sentineler');
  assert.equal(PG_TARGET.rpc, 'purga_testrader');
  assert.deepEqual(PG_TARGET.sentinelKolumner, {
    inbetalningar: 'ogonblicksbild_namn',
    jobb: 'skapad_av',
  });
});

/**
 * DRIFT-VAKTEN, samma form och samma skäl som KASTBARA_POSTER_FIL ovan.
 * Sentinel-mönstret finns på TVÅ ställen: som konstanten `v_sentinel` i
 * migration 20260830200100 (den som FAKTISKT raderar) och som
 * `exactMatchPattern` i policyn (den som beskriver vad som raderas). SQL och
 * JSON kan inte dela modul.
 *
 * Går de isär rapporterar purgen "0 rader raderade" medan raderna ligger kvar
 * — frånvaro presenterad som data, exakt den felklass som gör ett städverktyg
 * farligare än inget.
 */
t('postgres-sentinelmönstret är IDENTISKT med migrationens v_sentinel', () => {
  const sql = readFileSync(
    new URL(
      '../supabase/migrations/20260830200100_purga_testrader_sentineler.sql',
      import.meta.url,
    ),
    'utf8',
  );
  const m = /v_sentinel constant text := '([^']+)'/.exec(sql);
  assert.ok(m, 'hittade ingen v_sentinel-konstant i migration 20260830200100');
  assert.equal(
    m[1],
    PG_TARGET.exactMatchPattern,
    'policyns exactMatchPattern och migrationens v_sentinel har DRIFAT ISÄR',
  );
});

t('sentinelmönstret matchar de former testerna faktiskt skriver', () => {
  const re = new RegExp(PG_TARGET.exactMatchPattern);
  for (const namn of [
    `ZZ-TASK-346.3-deny-probe-${UUID}`,
    'ZZ-TASK-346.3-verifiering-A',
    'ZZ-TASK-346.3-verifiering',
    `ZZ-TASK-346.4-kvittojobb-${UUID}`,
    'ZZ-TASK-346-backfill',
  ]) {
    assert.equal(re.test(namn), true, `matchade inte: ${namn}`);
  }
});

t('sentinelmönstret rör ALDRIG riktiga namn eller andra fixturer', () => {
  const re = new RegExp(PG_TARGET.exactMatchPattern);
  for (const namn of [
    'Anna Andersson',
    'Cecilia Lund',
    '', // en tom ögonblicksbild är inte en sentinel
    'ZZ-GRANSKNING-S113', // granskningsfixturen — CLAUDE.md § seed:review
    'ZZ-create-event-test',
    'ZZ-TASK-201.5 Probe', // aktivitetsloggens egen sentinel-familj
    'ZZ-TASK-3465-hittepa', // saknar avgränsaren efter 346
    'prefix-ZZ-TASK-346.3-x', // inte ankrat i början
    'ZZ-TASK-346.3-x suffix', // blanksteg ingår inte i teckenklassen
    'ZZ-TASK-346', // markören ensam, utan avgränsare och kropp
    'ZZ-TASK-346.', // avgränsare utan kropp
  ]) {
    assert.equal(re.test(namn), false, `matchade felaktigt: "${namn}"`);
  }
});

t('validatePolicy: postgresTargets är optionellt (ingen nyckel = OK)', () => {
  assert.equal(validatePolicy(VALID_POLICY).postgresTargets, undefined);
});

t('validatePolicy: en giltig postgresTarget passerar', () => {
  const p = { ...VALID_POLICY, postgresTargets: [PG_TARGET] };
  assert.equal(validatePolicy(p), p);
});

t('validatePolicy: tomt postgresTargets fälls (ta bort nyckeln i stället)', () => {
  assert.throws(
    () => validatePolicy({ ...VALID_POLICY, postgresTargets: [] }),
    /postgresTargets är satt men tomt/,
  );
});

t('validatePolicy: postgresTarget utan rpc fälls', () => {
  assert.throws(
    () =>
      validatePolicy({
        ...VALID_POLICY,
        postgresTargets: [{ name: 'x', exactMatchPattern: '^ZZ-x$' }],
      }),
    /saknar obligatoriska fält/,
  );
});

t('validatePolicy: postgresTarget utan exactMatchPattern fälls', () => {
  assert.throws(
    () =>
      validatePolicy({ ...VALID_POLICY, postgresTargets: [{ name: 'x', rpc: 'purga_testrader' }] }),
    /saknar obligatoriska fält/,
  );
});

t('validatePolicy: ett rpc-namn som inte är en identifierare fälls', () => {
  // Namnet går rakt in i en URL-path. Ett värde som "purga; drop table" eller
  // "../rest/v1/inbetalningar" hör inte hemma där, ens om servern skulle
  // avvisa det — guarden fäller före anropet.
  for (const rpc of ['purga testrader', 'purga;drop', '../annat', 'Purga_Testrader', '1purga']) {
    assert.throws(
      () =>
        validatePolicy({
          ...VALID_POLICY,
          postgresTargets: [{ name: 'x', rpc, exactMatchPattern: '^ZZ-x$' }],
        }),
      /giltig Postgres-identifierare/,
      `rpc-namnet "${rpc}" borde ha fällts`,
    );
  }
});

t('validatePolicy: ett exactMatchPattern som inte kompilerar fälls', () => {
  assert.throws(
    () =>
      validatePolicy({
        ...VALID_POLICY,
        postgresTargets: [
          { name: 'x', rpc: 'purga_testrader', exactMatchPattern: '^ZZ-[unclosed' },
        ],
      }),
    /ogiltigt exactMatchPattern/,
  );
});

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla purge-guard-tester gröna.');
});
