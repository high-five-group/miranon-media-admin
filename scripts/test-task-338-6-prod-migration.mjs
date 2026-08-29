#!/usr/bin/env node
// scripts/test-task-338-6-prod-migration.mjs — tester för
// task-338-6-prod-migration.mjs:s pura guard-, plannings- och
// exekveringsfunktioner (DI-mönstret från
// scripts/test-create-eventinnehall-modell.mjs § runOperations: sido-
// effekter går via injicerade API-funktioner, aldrig riktig fetch).
//
// Uppdaterad i review-runda 2 (PR #2097) för det NYA tre-lägers-kontraktet
// (--kontrollera / --utfor-schema / --utfor-rader), den rättade Platsnamn-
// body-formen (nästlad under `options`, inte toppnivå), config-baserad
// idempotens (felkonfigurerade fält fälls, tystas inte som "redan klart"),
// fail-closed post-verifiering, och 5xx-retry-med-backoff.
//
// HERMETISKT: de flesta testerna importerar bara pura funktioner och rör
// aldrig nätverk (airtableRequest testas med injicerad fetchImpl/sleepImpl,
// aldrig riktig fetch). En liten integrationsdel (§ EXIT-KODER) spawnar
// skriptet som barnprocess för att bevisa de FAKTISKA exit-koderna — men
// bara för grenar som kastar/exitar INNAN någon fetch görs (argument-/
// bas-ID-fel, prod-guard-vägran, saknad token), så INGEN nätverkstrafik
// uppstår någonstans i denna svit. Miljön för barnprocesserna byggs explicit
// (aldrig process.env rakt av) så en lokal .env.seed/exporterad token aldrig
// läcker in och gör ett test falskt grönt.
//
// Kör: node scripts/test-task-338-6-prod-migration.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ApiError,
  ArgError,
  airtableRequest,
  BASE_ID_PATTERN,
  buildKontrolleraReport,
  buildPlatsFieldBody,
  buildPlatsnamnFieldBody,
  chunk,
  createThrowawayAndDelete,
  findFieldByName,
  findTableByName,
  formatKontrolleraReport,
  GEMENSAM_CHOICE_NAME,
  GuardError,
  hasChoice,
  PROD_BASE_ID_KAND,
  PROD_GODKAND_ENV_VAR,
  parseArgs,
  planRader,
  planSchema,
  raderKonvergerade,
  resolveTargetBaseId,
  runRader,
  runSchema,
  STAGING_BASE_ID,
  schemaKonvergerad,
} from './task-338-6-prod-migration.mjs';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_PATH = path.join(path.dirname(__filename), 'task-338-6-prod-migration.mjs');

let passed = 0;
let failed = 0;
const pendingAsync = [];

function test(name, fn) {
  let result;
  try {
    result = fn();
  } catch (err) {
    failed += 1;
    console.error(`❌ ${name}`);
    console.error(`   ${err.message}`);
    return;
  }
  if (result && typeof result.then === 'function') {
    pendingAsync.push(
      result
        .then(() => {
          passed += 1;
          console.log(`✅ ${name}`);
        })
        .catch((err) => {
          failed += 1;
          console.error(`❌ ${name}`);
          console.error(`   ${err.message}`);
        }),
    );
    return;
  }
  passed += 1;
  console.log(`✅ ${name}`);
}

// ---------------------------------------------------------------------------
// Konstanter — sanity
// ---------------------------------------------------------------------------

test('STAGING_BASE_ID/PROD_BASE_ID_KAND matchar dokumenterade bas-ID:n', () => {
  assert.equal(STAGING_BASE_ID, 'apphjj8Q7lkXCMsL4');
  assert.equal(PROD_BASE_ID_KAND, 'app8uGPrVCVOm6LfD');
});

test('PROD_GODKAND_ENV_VAR: exakt "AIRTABLE_PROD_GODKAND_AV_MARCUS" (samma namn som TASK-309.9)', () => {
  assert.equal(PROD_GODKAND_ENV_VAR, 'AIRTABLE_PROD_GODKAND_AV_MARCUS');
});

test('BASE_ID_PATTERN: accepterar giltiga app-format, avvisar allt annat', () => {
  assert.ok(BASE_ID_PATTERN.test(STAGING_BASE_ID));
  assert.ok(BASE_ID_PATTERN.test(PROD_BASE_ID_KAND));
  assert.ok(!BASE_ID_PATTERN.test('bad-id'));
  assert.ok(!BASE_ID_PATTERN.test('app123')); // för kort
  assert.ok(!BASE_ID_PATTERN.test('tblFamrna53MVf1nG')); // tabell-ID, inte bas-ID
});

// ---------------------------------------------------------------------------
// parseArgs — tre lägen
// ---------------------------------------------------------------------------

test('parseArgs: --kontrollera <bas-id> tolkas korrekt', () => {
  assert.deepEqual(parseArgs(['--kontrollera', STAGING_BASE_ID]), {
    mode: 'kontrollera',
    bas: STAGING_BASE_ID,
  });
});

test('parseArgs: --utfor-schema <bas-id> tolkas korrekt', () => {
  assert.deepEqual(parseArgs(['--utfor-schema', STAGING_BASE_ID]), {
    mode: 'utfor-schema',
    bas: STAGING_BASE_ID,
  });
});

test('parseArgs: --utfor-rader <bas-id> tolkas korrekt', () => {
  assert.deepEqual(parseArgs(['--utfor-rader', STAGING_BASE_ID]), {
    mode: 'utfor-rader',
    bas: STAGING_BASE_ID,
  });
});

test('parseArgs: ingen flagga → ArgError', () => {
  assert.throws(() => parseArgs([STAGING_BASE_ID]), ArgError);
});

test('parseArgs: två flaggor samtidigt → ArgError', () => {
  assert.throws(
    () => parseArgs(['--kontrollera', STAGING_BASE_ID, '--utfor-schema', STAGING_BASE_ID]),
    ArgError,
  );
  assert.throws(
    () => parseArgs(['--utfor-schema', STAGING_BASE_ID, '--utfor-rader', STAGING_BASE_ID]),
    ArgError,
  );
});

test('parseArgs: gamla --utfor (utan suffix) känns INTE igen — ArgError', () => {
  assert.throws(() => parseArgs(['--utfor', STAGING_BASE_ID]), ArgError);
});

test('parseArgs: saknat bas-ID efter flaggan → ArgError', () => {
  assert.throws(() => parseArgs(['--kontrollera']), ArgError);
  assert.throws(() => parseArgs(['--utfor-schema']), ArgError);
  assert.throws(() => parseArgs(['--utfor-rader']), ArgError);
});

test('parseArgs: nästa argument är en annan flagga, inte ett bas-ID → ArgError', () => {
  assert.throws(() => parseArgs(['--kontrollera', '--utfor-schema']), ArgError);
});

test('parseArgs: fel bas-ID-FORM → ArgError (huvudkravet: exit 2 i main(), se § EXIT-KODER)', () => {
  assert.throws(() => parseArgs(['--kontrollera', 'inte-ett-bas-id']), ArgError);
  assert.throws(() => parseArgs(['--utfor-schema', 'app123']), ArgError);
  assert.throws(() => parseArgs(['--utfor-rader', 'app123']), ArgError);
});

// ---------------------------------------------------------------------------
// resolveTargetBaseId — prod-låset (ADR-125 § 8). scripts/deny-prod-ref.sh
// vaktar INTE Airtable-bas-ID:n (bara Supabase-prod-refen, TASK-203) — detta
// ÄR den mekaniska spärren för detta skript, se filhuvudets § PROD-LÅSET.
// ---------------------------------------------------------------------------

test('resolveTargetBaseId: bas = staging → passerar utan gate', () => {
  assert.equal(
    resolveTargetBaseId({
      bas: STAGING_BASE_ID,
      stagingBaseId: STAGING_BASE_ID,
      godkandEnv: undefined,
    }),
    STAGING_BASE_ID,
  );
});

test('resolveTargetBaseId: bas = prod UTAN miljövariabeln → GuardError', () => {
  assert.throws(
    () =>
      resolveTargetBaseId({
        bas: PROD_BASE_ID_KAND,
        stagingBaseId: STAGING_BASE_ID,
        godkandEnv: undefined,
      }),
    GuardError,
  );
});

test('resolveTargetBaseId: bas = prod med FEL värde i miljövariabeln → GuardError', () => {
  assert.throws(
    () =>
      resolveTargetBaseId({
        bas: PROD_BASE_ID_KAND,
        stagingBaseId: STAGING_BASE_ID,
        godkandEnv: 'appNagotAnnat0000000',
      }),
    GuardError,
  );
});

test('resolveTargetBaseId: bas = prod MED miljövariabeln satt till EXAKT samma bas → passerar', () => {
  assert.equal(
    resolveTargetBaseId({
      bas: PROD_BASE_ID_KAND,
      stagingBaseId: STAGING_BASE_ID,
      godkandEnv: PROD_BASE_ID_KAND,
    }),
    PROD_BASE_ID_KAND,
  );
});

test('resolveTargetBaseId: felskrivet bas-ID (varken staging eller känd prod) kräver ÄNDÅ exakt matchande env — fail-closed generellt', () => {
  const felskrivet = 'appFelskrivetXXXXX';
  assert.throws(
    () =>
      resolveTargetBaseId({
        bas: felskrivet,
        stagingBaseId: STAGING_BASE_ID,
        godkandEnv: undefined,
      }),
    GuardError,
  );
  assert.equal(
    resolveTargetBaseId({
      bas: felskrivet,
      stagingBaseId: STAGING_BASE_ID,
      godkandEnv: felskrivet,
    }),
    felskrivet,
  );
});

// ---------------------------------------------------------------------------
// Schema-hjälpare
// ---------------------------------------------------------------------------

const SYNTETISK_PLATSER_TABLE = {
  id: 'tblPlatserSYN00001',
  name: 'Platser',
  fields: [{ id: 'fldNamnSYN0000001', name: 'Namn', type: 'singleLineText' }],
};

function bilagorTable({
  medGemensam,
  medPlats,
  platsOverride,
  medPlatsnamn,
  platsnamnOverride,
} = {}) {
  const choices = [
    { id: 'sel1', name: 'Event' },
    { id: 'sel2', name: 'Kurstyp' },
    { id: 'sel3', name: 'Alla event' },
  ];
  if (medGemensam) choices.push({ id: 'sel4', name: GEMENSAM_CHOICE_NAME });
  const fields = [
    { id: 'fldRackviddSYN01', name: 'Räckvidd', type: 'singleSelect', options: { choices } },
  ];
  if (medPlats) {
    fields.push(
      platsOverride ?? {
        id: 'fldPlatsSYN00001',
        name: 'Plats',
        type: 'multipleRecordLinks',
        options: { linkedTableId: SYNTETISK_PLATSER_TABLE.id },
      },
    );
  }
  if (medPlatsnamn) {
    fields.push(
      platsnamnOverride ?? {
        id: 'fldPlatsnamnSYN01',
        name: 'Platsnamn',
        type: 'multipleLookupValues',
        options: {
          recordLinkFieldId: 'fldPlatsSYN00001',
          fieldIdInLinkedTable: 'fldNamnSYN0000001',
        },
      },
    );
  }
  return { id: 'tblBilagorSYN00001', name: 'Bilagor', fields };
}

test('findTableByName/findFieldByName/hasChoice — grundfall', () => {
  const tables = [bilagorTable({ medGemensam: true }), SYNTETISK_PLATSER_TABLE];
  const bil = findTableByName(tables, 'Bilagor');
  assert.ok(bil);
  const rackvidd = findFieldByName(bil, 'Räckvidd');
  assert.ok(rackvidd);
  assert.equal(hasChoice(rackvidd, GEMENSAM_CHOICE_NAME), true);
  assert.equal(hasChoice(rackvidd, 'Nagot-som-inte-finns'), false);
  assert.equal(findTableByName(tables, 'FinnsInte'), undefined);
  assert.equal(findFieldByName(bil, 'FinnsInte'), undefined);
});

// ---------------------------------------------------------------------------
// buildPlatsFieldBody / buildPlatsnamnFieldBody — REVIEW-RUNDA 2, PUNKT 1
// (ERROR-fyndet): body-formen måste nästla recordLinkFieldId/
// fieldIdInLinkedTable/linkedTableId under `options`, ALDRIG toppnivå.
// ---------------------------------------------------------------------------

test('buildPlatsFieldBody: linkedTableId nästlat under options, INGET på toppnivå', () => {
  const body = buildPlatsFieldBody('tblPlatserXYZ');
  assert.equal(body.name, 'Plats');
  assert.equal(body.type, 'multipleRecordLinks');
  assert.equal(body.options.linkedTableId, 'tblPlatserXYZ');
  assert.equal(body.linkedTableId, undefined, 'linkedTableId får ALDRIG ligga på toppnivå');
  assert.deepEqual(Object.keys(body).sort(), ['description', 'name', 'options', 'type']);
});

test('buildPlatsnamnFieldBody: recordLinkFieldId OCH fieldIdInLinkedTable nästlade under options, INGET på toppnivå (ERROR-fyndets kärna)', () => {
  const body = buildPlatsnamnFieldBody('fldPlatsABC', 'fldNamnDEF');
  assert.equal(body.name, 'Platsnamn');
  assert.equal(body.type, 'multipleLookupValues');
  assert.equal(body.options.recordLinkFieldId, 'fldPlatsABC');
  assert.equal(body.options.fieldIdInLinkedTable, 'fldNamnDEF');
  assert.equal(body.recordLinkFieldId, undefined, 'recordLinkFieldId får ALDRIG ligga på toppnivå');
  assert.equal(
    body.fieldIdInLinkedTable,
    undefined,
    'fieldIdInLinkedTable får ALDRIG ligga på toppnivå',
  );
  assert.deepEqual(Object.keys(body).sort(), ['description', 'name', 'options', 'type']);
});

// ---------------------------------------------------------------------------
// buildKontrolleraReport
// ---------------------------------------------------------------------------

test('buildKontrolleraReport: räknar Räckvidd-fördelningen och att-migrera korrekt', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: true, medPlatsnamn: true }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const records = [
    { id: 'rec1', fields: { Namn: 'a', Räckvidd: 'Kurstyp' } },
    { id: 'rec2', fields: { Namn: 'b', Räckvidd: 'Alla event' } },
    { id: 'rec3', fields: { Namn: 'c', Räckvidd: 'Gemensam' } },
    { id: 'rec4', fields: { Namn: 'd', Räckvidd: 'Event' } },
    { id: 'rec5', fields: { Namn: 'e' } }, // tomt
  ];
  const report = buildKontrolleraReport({ tables, bilagorRecords: records });
  assert.equal(report.gemensamChoiceFinns, true);
  assert.equal(report.platsFieldFinns, true);
  assert.equal(report.platsnamnFieldFinns, true);
  assert.equal(report.totaltAntalRader, 5);
  assert.equal(report.attMigrera, 2);
  assert.equal(report.redanGemensam, 1);
  assert.deepEqual(report.rackviddFordelning, {
    Kurstyp: 1,
    'Alla event': 1,
    Gemensam: 1,
    Event: 1,
    '(tomt)': 1,
  });
});

test('buildKontrolleraReport: räknar föräldralösa Gemensam-rader (varken Namn eller Event-länk) — review-runda 3, punkt 2', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: true, medPlatsnamn: true }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const records = [
    { id: 'recForaldralos', fields: { Räckvidd: 'Gemensam' } }, // varken Namn eller Event — kvarleva
    {
      id: 'recRiktig1',
      fields: { Namn: 'Parkeringsbilaga.pdf', Räckvidd: 'Gemensam', Event: ['recEvent1'] },
    },
    { id: 'recRiktig2', fields: { Namn: 'Sushimeny.pdf', Räckvidd: 'Gemensam' } }, // Namn men inget Event — INTE föräldralös
    { id: 'recRiktig3', fields: { Räckvidd: 'Gemensam', Event: ['recEvent2'] } }, // Event men inget Namn — INTE föräldralös
    { id: 'recTomEventArray', fields: { Namn: '', Räckvidd: 'Gemensam', Event: [] } }, // tomt Namn OCH tom Event-array — kvarleva
  ];
  const report = buildKontrolleraReport({ tables, bilagorRecords: records });
  assert.equal(report.redanGemensam, 5);
  assert.equal(report.foraldralosaGemensamRader, 2);
});

test('buildKontrolleraReport: saknad Bilagor-tabell → GuardError', () => {
  assert.throws(
    () => buildKontrolleraReport({ tables: [SYNTETISK_PLATSER_TABLE], bilagorRecords: [] }),
    GuardError,
  );
});

test('buildKontrolleraReport: saknad Platser-tabell → GuardError', () => {
  assert.throws(
    () =>
      buildKontrolleraReport({ tables: [bilagorTable({ medGemensam: true })], bilagorRecords: [] }),
    GuardError,
  );
});

test('formatKontrolleraReport: producerar en läsbar sträng med nyckeltalen', () => {
  const tables = [bilagorTable({ medGemensam: false }), SYNTETISK_PLATSER_TABLE];
  const report = buildKontrolleraReport({
    tables,
    bilagorRecords: [{ id: 'r1', fields: { Namn: 'x', Räckvidd: 'Kurstyp' } }],
  });
  const text = formatKontrolleraReport(report, STAGING_BASE_ID);
  assert.ok(text.includes(STAGING_BASE_ID));
  assert.ok(text.includes('finns: NEJ'));
  assert.ok(text.includes('Att migrera'));
});

// ---------------------------------------------------------------------------
// planSchema — RADLÖST (rör aldrig bilagorRecords), config-baserad idempotens
// ---------------------------------------------------------------------------

test('planSchema: ALLT FINNS OCH KORREKT KONFIGURERAT → no-op-plan', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: true, medPlatsnamn: true }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const plan = planSchema({ tables });
  assert.deepEqual(plan.optionAdd, { strategy: 'already-exists' });
  assert.equal(plan.platsField.strategy, 'skip');
  assert.equal(plan.platsField.existingId, 'fldPlatsSYN00001');
  assert.equal(plan.platsnamnField.strategy, 'skip');
});

test('planSchema: INGET FINNS → allt planeras, optionAdd ALLTID throwaway-record (aldrig en riktig rad)', () => {
  const tables = [
    bilagorTable({ medGemensam: false, medPlats: false, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const plan = planSchema({ tables });
  assert.deepEqual(plan.optionAdd, { strategy: 'throwaway-record' });
  assert.equal(plan.platsField.strategy, 'create');
  assert.equal(plan.platsField.body.options.linkedTableId, SYNTETISK_PLATSER_TABLE.id);
  assert.equal(plan.platsnamnField.strategy, 'create');
  assert.equal(plan.platsnamnField.platserNamnFieldId, 'fldNamnSYN0000001');
});

test('planSchema: DELVIS — option finns, fälten saknas → bara fälten planeras', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: false, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const plan = planSchema({ tables });
  assert.deepEqual(plan.optionAdd, { strategy: 'already-exists' });
  assert.equal(plan.platsField.strategy, 'create');
  assert.equal(plan.platsnamnField.strategy, 'create');
});

test('planSchema: planeringen rör ALDRIG bilagorRecords — funktionen tar inte ens emot dem', () => {
  // Regressionsskydd mot att choice-skapelsen av misstag återkopplas till en
  // riktig rad (review-runda 2, punkt 2): planSchema()s signatur { tables }
  // har ingen plats för rader alls.
  const tables = [
    bilagorTable({ medGemensam: false, medPlats: true, medPlatsnamn: true }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const plan = planSchema({ tables });
  assert.deepEqual(plan.optionAdd, { strategy: 'throwaway-record' });
});

test('planSchema: Plats-fältet FELKONFIGURERAT (fel type) → GuardError, rör INGET', () => {
  const tables = [
    bilagorTable({
      medGemensam: true,
      medPlats: true,
      platsOverride: { id: 'fldPlatsSYN00001', name: 'Plats', type: 'singleLineText', options: {} },
      medPlatsnamn: false,
    }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planSchema({ tables }), /FELKONFIGURERAT/);
});

test('planSchema: Plats-fältet FELKONFIGURERAT (fel linkedTableId) → GuardError', () => {
  const tables = [
    bilagorTable({
      medGemensam: true,
      medPlats: true,
      platsOverride: {
        id: 'fldPlatsSYN00001',
        name: 'Plats',
        type: 'multipleRecordLinks',
        options: { linkedTableId: 'tblFELAKTIGT0000001' },
      },
      medPlatsnamn: false,
    }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planSchema({ tables }), GuardError);
});

test('planSchema: Platsnamn-fältet FELKONFIGURERAT (fel recordLinkFieldId) → GuardError', () => {
  const tables = [
    bilagorTable({
      medGemensam: true,
      medPlats: true,
      medPlatsnamn: true,
      platsnamnOverride: {
        id: 'fldPlatsnamnSYN01',
        name: 'Platsnamn',
        type: 'multipleLookupValues',
        options: {
          recordLinkFieldId: 'fldFELAKTIGT000001',
          fieldIdInLinkedTable: 'fldNamnSYN0000001',
        },
      },
    }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planSchema({ tables }), GuardError);
});

test('planSchema: Platsnamn-fältet FELKONFIGURERAT (fel fieldIdInLinkedTable) → GuardError', () => {
  const tables = [
    bilagorTable({
      medGemensam: true,
      medPlats: true,
      medPlatsnamn: true,
      platsnamnOverride: {
        id: 'fldPlatsnamnSYN01',
        name: 'Platsnamn',
        type: 'multipleLookupValues',
        options: {
          recordLinkFieldId: 'fldPlatsSYN00001',
          fieldIdInLinkedTable: 'fldFELAKTIGT000001',
        },
      },
    }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planSchema({ tables }), GuardError);
});

test('planSchema: Platsnamn-fältet FELKONFIGURERAT (fel type) → GuardError', () => {
  const tables = [
    bilagorTable({
      medGemensam: true,
      medPlats: true,
      medPlatsnamn: true,
      platsnamnOverride: {
        id: 'fldPlatsnamnSYN01',
        name: 'Platsnamn',
        type: 'singleLineText',
        options: {},
      },
    }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planSchema({ tables }), GuardError);
});

test('planSchema: Platsnamn finns men Plats saknas → inkonsistent schema, GuardError', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: false, medPlatsnamn: true }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planSchema({ tables }), /inkonsistent/);
});

test('planSchema: saknad Bilagor-tabell → GuardError', () => {
  assert.throws(() => planSchema({ tables: [SYNTETISK_PLATSER_TABLE] }), GuardError);
});

test('planSchema: saknat Räckvidd-fält → GuardError', () => {
  const bilTabellUtanRackvidd = { id: 'tblX', name: 'Bilagor', fields: [] };
  assert.throws(
    () => planSchema({ tables: [bilTabellUtanRackvidd, SYNTETISK_PLATSER_TABLE] }),
    GuardError,
  );
});

test('planSchema: saknat Platser.Namn-fält → GuardError', () => {
  const platserUtanNamn = { id: 'tblPY', name: 'Platser', fields: [] };
  const tables = [bilagorTable({ medGemensam: true }), platserUtanNamn];
  assert.throws(() => planSchema({ tables }), GuardError);
});

// ---------------------------------------------------------------------------
// schemaKonvergerad — fail-closed-beslutet (punkt 3), ren funktion
// ---------------------------------------------------------------------------

test('schemaKonvergerad: alla tre skip/already-exists → true', () => {
  assert.equal(
    schemaKonvergerad({
      optionAdd: { strategy: 'already-exists' },
      platsField: { strategy: 'skip' },
      platsnamnField: { strategy: 'skip' },
    }),
    true,
  );
});

test('schemaKonvergerad: optionAdd fortfarande throwaway-record → false', () => {
  assert.equal(
    schemaKonvergerad({
      optionAdd: { strategy: 'throwaway-record' },
      platsField: { strategy: 'skip' },
      platsnamnField: { strategy: 'skip' },
    }),
    false,
  );
});

test('schemaKonvergerad: platsField fortfarande create → false', () => {
  assert.equal(
    schemaKonvergerad({
      optionAdd: { strategy: 'already-exists' },
      platsField: { strategy: 'create' },
      platsnamnField: { strategy: 'skip' },
    }),
    false,
  );
});

test('schemaKonvergerad: platsnamnField fortfarande create → false', () => {
  assert.equal(
    schemaKonvergerad({
      optionAdd: { strategy: 'already-exists' },
      platsField: { strategy: 'skip' },
      platsnamnField: { strategy: 'create' },
    }),
    false,
  );
});

// ---------------------------------------------------------------------------
// chunk
// ---------------------------------------------------------------------------

test('chunk: delar i batchar om N, sista batchen kan vara kortare', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([1, 2, 3, 4], 2), [
    [1, 2],
    [3, 4],
  ]);
  assert.deepEqual(chunk([], 10), []);
  assert.deepEqual(chunk([1], 10), [[1]]);
});

// ---------------------------------------------------------------------------
// planRader — kräver att choicen redan finns
// ---------------------------------------------------------------------------

test('planRader: choicen finns, legacy-rader finns → alla legacy-rader planeras', () => {
  const tables = [bilagorTable({ medGemensam: true }), SYNTETISK_PLATSER_TABLE];
  const records = [
    { id: 'r1', fields: { Namn: 'a', Räckvidd: 'Kurstyp' } },
    { id: 'r2', fields: { Namn: 'b', Räckvidd: 'Alla event' } },
    { id: 'r3', fields: { Namn: 'c', Räckvidd: 'Event' } },
  ];
  const plan = planRader({ tables, bilagorRecords: records });
  assert.deepEqual(
    plan.rowsToMigrate.map((r) => r.id),
    ['r1', 'r2'],
  );
});

test('planRader: choicen finns, INGA legacy-rader → tom plan', () => {
  const tables = [bilagorTable({ medGemensam: true }), SYNTETISK_PLATSER_TABLE];
  const records = [{ id: 'r1', fields: { Namn: 'a', Räckvidd: 'Gemensam' } }];
  const plan = planRader({ tables, bilagorRecords: records });
  assert.deepEqual(plan.rowsToMigrate, []);
});

test('planRader: choicen SAKNAS → GuardError som pekar på --utfor-schema', () => {
  const tables = [bilagorTable({ medGemensam: false }), SYNTETISK_PLATSER_TABLE];
  const records = [{ id: 'r1', fields: { Namn: 'a', Räckvidd: 'Kurstyp' } }];
  assert.throws(() => planRader({ tables, bilagorRecords: records }), /--utfor-schema/);
});

test('planRader: saknad Bilagor-tabell → GuardError', () => {
  assert.throws(
    () => planRader({ tables: [SYNTETISK_PLATSER_TABLE], bilagorRecords: [] }),
    GuardError,
  );
});

// ---------------------------------------------------------------------------
// raderKonvergerade — fail-closed-beslutet (punkt 3), ren funktion
// ---------------------------------------------------------------------------

test('raderKonvergerade: 0 kvar → true', () => {
  assert.equal(raderKonvergerade(0), true);
});

test('raderKonvergerade: >0 kvar → false', () => {
  assert.equal(raderKonvergerade(1), false);
  assert.equal(raderKonvergerade(6), false);
});

// ---------------------------------------------------------------------------
// runSchema — exekvering mot injicerade API-stubbar (DI, inget nätverk)
// ---------------------------------------------------------------------------

function schemaApiCounter() {
  const anrop = [];
  return {
    anrop,
    createThrowawayAndDelete: async () => {
      anrop.push({ typ: 'throwaway' });
    },
    createField: async (body) => {
      anrop.push({ typ: 'createField', body });
      return { id: `fld-${body.name}-NY` };
    },
  };
}

test('runSchema: no-op-plan (allt finns) → INGET API-anrop görs alls (idempotens-beviset)', async () => {
  const api = schemaApiCounter();
  const plan = {
    optionAdd: { strategy: 'already-exists' },
    platsField: { strategy: 'skip', existingId: 'fldGammal' },
    platsnamnField: { strategy: 'skip' },
  };
  const { skrivningar } = await runSchema(plan, api);
  assert.deepEqual(skrivningar, { optionAdd: 0, platsField: 0, platsnamnField: 0 });
  assert.deepEqual(api.anrop, []);
});

test('runSchema: throwaway-record + skapa båda fälten → korrekt sekvens, Platsnamn-body bär den NYSKAPADE Plats-fältets id via buildPlatsnamnFieldBody', async () => {
  const api = schemaApiCounter();
  const plan = {
    optionAdd: { strategy: 'throwaway-record' },
    platsField: { strategy: 'create', body: buildPlatsFieldBody('tblPlatserXYZ') },
    platsnamnField: { strategy: 'create', platserNamnFieldId: 'fldNamnXYZ' },
  };
  const { skrivningar, platsFieldId } = await runSchema(plan, api);
  assert.equal(skrivningar.optionAdd, 2);
  assert.equal(skrivningar.platsField, 1);
  assert.equal(skrivningar.platsnamnField, 1);
  assert.equal(api.anrop[0].typ, 'throwaway');
  assert.equal(api.anrop[1].typ, 'createField');
  assert.equal(api.anrop[1].body.name, 'Plats');
  assert.equal(api.anrop[2].typ, 'createField');
  assert.equal(api.anrop[2].body.name, 'Platsnamn');
  // KRITISKT (samma fynd som § buildPlatsnamnFieldBody-testerna): nästlat
  // under options, och bär den NYSKAPADE Plats-fältets id.
  assert.equal(api.anrop[2].body.options.recordLinkFieldId, 'fld-Plats-NY');
  assert.equal(api.anrop[2].body.recordLinkFieldId, undefined);
  assert.equal(platsFieldId, 'fld-Plats-NY');
});

test('runSchema: Plats-fältet finns REDAN → platsnamnField-skapelsen använder existingId, INTE en ny createField-retur', async () => {
  const api = schemaApiCounter();
  const plan = {
    optionAdd: { strategy: 'already-exists' },
    platsField: { strategy: 'skip', existingId: 'fldPlatsGammal123' },
    platsnamnField: { strategy: 'create', platserNamnFieldId: 'fldNamnXYZ' },
  };
  const { skrivningar, platsFieldId } = await runSchema(plan, api);
  assert.equal(skrivningar.platsField, 0);
  assert.equal(skrivningar.platsnamnField, 1);
  assert.equal(api.anrop[0].typ, 'createField');
  assert.equal(api.anrop[0].body.options.recordLinkFieldId, 'fldPlatsGammal123');
  assert.equal(platsFieldId, 'fldPlatsGammal123');
});

test('runSchema: rör ALDRIG en Bilagor-rad — api-objektet har ingen patchRackvidd alls', async () => {
  // Regressionsskydd (review-runda 2, punkt 2): runSchemas api-kontrakt
  // saknar patchRackvidd helt — det finns strukturellt ingen väg för
  // schema-exekveringen att skriva till en riktig rad.
  const api = schemaApiCounter();
  assert.equal('patchRackvidd' in api, false);
  const plan = {
    optionAdd: { strategy: 'throwaway-record' },
    platsField: { strategy: 'skip', existingId: 'fldX' },
    platsnamnField: { strategy: 'skip' },
  };
  await runSchema(plan, api);
  assert.deepEqual(api.anrop, [{ typ: 'throwaway' }]);
});

// ---------------------------------------------------------------------------
// runRader — exekvering mot injicerade API-stubbar
// ---------------------------------------------------------------------------

function raderApiCounter() {
  const anrop = [];
  return {
    anrop,
    patchRackvidd: async (ids) => {
      anrop.push({ typ: 'patch', ids });
    },
  };
}

test('runRader: tom plan → inget API-anrop', async () => {
  const api = raderApiCounter();
  const { skrivningar } = await runRader({ rowsToMigrate: [] }, api);
  assert.equal(skrivningar.radMigrering, 0);
  assert.deepEqual(api.anrop, []);
});

test('runRader: batchar om RECORD_BATCH_SIZE (10) — 25 rader → 3 patch-anrop (10/10/5)', async () => {
  const api = raderApiCounter();
  const rowsToMigrate = Array.from({ length: 25 }, (_, i) => ({ id: `rec${i}` }));
  const { skrivningar } = await runRader({ rowsToMigrate }, api);
  assert.equal(skrivningar.radMigrering, 25);
  assert.equal(api.anrop.length, 3);
  assert.equal(api.anrop[0].ids.length, 10);
  assert.equal(api.anrop[1].ids.length, 10);
  assert.equal(api.anrop[2].ids.length, 5);
});

// ---------------------------------------------------------------------------
// airtableRequest — retry-med-backoff (REVIEW-RUNDA 2, PUNKT 5). Injicerad
// fetchImpl/sleepImpl, INGEN riktig fetch, INGEN riktig väntan.
// ---------------------------------------------------------------------------

function fakeRes(status, jsonBody) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => jsonBody,
    text: async () => `status ${status}`,
  };
}

test('airtableRequest: 200 direkt → returnerar JSON, ingen retry', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    return fakeRes(200, { ok: true });
  };
  const result = await airtableRequest(
    'https://x',
    'tok',
    {},
    { fetchImpl: fetchStub, sleepImpl: async () => {} },
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 1);
});

test('airtableRequest: 429 väntar 30000ms och försöker EN gång till (oförändrat beteende)', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    return calls === 1 ? fakeRes(429) : fakeRes(200, { ok: true });
  };
  const sleeps = [];
  const result = await airtableRequest(
    'https://x',
    'tok',
    {},
    {
      fetchImpl: fetchStub,
      sleepImpl: async (ms) => sleeps.push(ms),
    },
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [30_000]);
});

test('airtableRequest: 5xx retries upp till 2 gånger med exponentiell backoff (1000ms, 2000ms), sedan lyckas', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    return calls <= 2 ? fakeRes(503) : fakeRes(200, { ok: true });
  };
  const sleeps = [];
  const result = await airtableRequest(
    'https://x',
    'tok',
    {},
    {
      fetchImpl: fetchStub,
      sleepImpl: async (ms) => sleeps.push(ms),
    },
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [1000, 2000]);
});

test('airtableRequest: 5xx en TREDJE gång (efter 2 retries uttömda) → kastar ApiError, totalt 3 försök', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    return fakeRes(500);
  };
  await assert.rejects(
    () =>
      airtableRequest('https://x', 'tok', {}, { fetchImpl: fetchStub, sleepImpl: async () => {} }),
    ApiError,
  );
  assert.equal(calls, 3); // 1 ursprungligt försök + 2 retries
});

test('airtableRequest: 4xx (icke-429) kastar DIREKT, ingen retry alls', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    return fakeRes(404);
  };
  await assert.rejects(
    () =>
      airtableRequest('https://x', 'tok', {}, { fetchImpl: fetchStub, sleepImpl: async () => {} }),
    ApiError,
  );
  assert.equal(calls, 1);
});

// ---------------------------------------------------------------------------
// createThrowawayAndDelete — REVIEW-RUNDA 3, PUNKT 2: ID:t måste loggas
// FÖRE DELETE-försöket (kvarleva-spårbarhet), och en DELETE-miss måste kasta
// ett fel som BÄR ID:t (aldrig ett tyst svalt fel). Loggningen fångas via
// INJICERAD logImpl (samma DI-mönster som fetchImpl/sleepImpl) — INTE via
// global console.log-monkeypatch: flera async-tester i denna svit startar
// synkront och interfolieras (se test()-hjälparens § filhuvud), så en delad
// mutabel console.log hade racat mellan test-instanser.
// ---------------------------------------------------------------------------

test('createThrowawayAndDelete: loggar record-id FÖRE DELETE-försöket lyckas', async () => {
  let deleteAnropad = false;
  const loggat = [];
  const fetchStub = async (_url, opts) => {
    if (opts.method === 'POST') return fakeRes(200, { records: [{ id: 'recKASTBAR123' }] });
    if (opts.method === 'DELETE') {
      deleteAnropad = true;
      return fakeRes(200, { records: [{ id: 'recKASTBAR123' }] });
    }
    throw new Error(`oväntad metod: ${opts.method}`);
  };
  await createThrowawayAndDelete('appXXX', 'tblXXX', 'tok', {
    fetchImpl: fetchStub,
    sleepImpl: async () => {},
    logImpl: (msg) => loggat.push(String(msg)),
  });
  assert.ok(deleteAnropad, 'DELETE måste faktiskt anropas');
  assert.ok(
    loggat.some((r) => r.includes('recKASTBAR123')),
    'record-id:t måste vara loggat',
  );
});

test('createThrowawayAndDelete: DELETE misslyckas → ApiError BÄR ID:t, och ID:t var loggat INNAN felet (kvarleva spårbar i båda riktningar)', async () => {
  const loggat = [];
  const fetchStub = async (_url, opts) => {
    if (opts.method === 'POST') return fakeRes(200, { records: [{ id: 'recKVARLEVA99' }] });
    if (opts.method === 'DELETE') return fakeRes(404); // 4xx: airtableRequest kastar direkt, ingen retry
    throw new Error(`oväntad metod: ${opts.method}`);
  };
  await assert.rejects(
    () =>
      createThrowawayAndDelete('appXXX', 'tblXXX', 'tok', {
        fetchImpl: fetchStub,
        sleepImpl: async () => {},
        logImpl: (msg) => loggat.push(String(msg)),
      }),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.ok(err.message.includes('recKVARLEVA99'), 'felmeddelandet måste bära ID:t');
      assert.ok(
        err.message.includes('KVARLEVA'),
        'felmeddelandet måste flagga att det är en kvarleva',
      );
      return true;
    },
  );
  assert.ok(
    loggat.some((r) => r.includes('recKVARLEVA99')),
    'ID:t måste ha loggats FÖRE DELETE-felet, inte bara finnas i felmeddelandet',
  );
});

test('createThrowawayAndDelete: inget record-id i POST-svaret → ApiError, DELETE anropas ALDRIG', async () => {
  let deleteAnropad = false;
  const fetchStub = async (_url, opts) => {
    if (opts.method === 'POST') return fakeRes(200, { records: [] }); // inget id
    deleteAnropad = true;
    return fakeRes(200, {});
  };
  await assert.rejects(
    () =>
      createThrowawayAndDelete('appXXX', 'tblXXX', 'tok', {
        fetchImpl: fetchStub,
        sleepImpl: async () => {},
        logImpl: () => {},
      }),
    ApiError,
  );
  assert.equal(deleteAnropad, false);
});

// ---------------------------------------------------------------------------
// § EXIT-KODER — barnprocess-integrationstest, ENDAST grenar som exitar FÖRE
// någon fetch (argument-/bas-ID-fel, prod-guard, saknad token). Miljön byggs
// explicit (aldrig process.env rakt av) så en lokal .env.seed/exporterad
// token aldrig läcker in.
// ---------------------------------------------------------------------------

const REN_MILJO = { PATH: process.env.PATH ?? '' }; // ingen AIRTABLE_*, ingen PROD_GODKAND

function korSkript(argv, env = REN_MILJO) {
  try {
    execFileSync(process.execPath, [SCRIPT_PATH, ...argv], {
      env,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return 0;
  } catch (err) {
    // execFileSync kastar vid icke-noll exit; err.status bär koden.
    return err.status;
  }
}

test('EXIT-KOD: fel bas-ID-form → exit 2 (uppdragets explicita testkrav)', () => {
  assert.equal(korSkript(['--kontrollera', 'inte-ett-bas-id']), 2);
});

test('EXIT-KOD: ingen flagga alls → exit 2', () => {
  assert.equal(korSkript([STAGING_BASE_ID]), 2);
});

test('EXIT-KOD: --utfor-schema mot KÄND prod-bas UTAN miljövariabeln → exit 1 (prod-guard-vägran, INNAN token/nätverk)', () => {
  assert.equal(korSkript(['--utfor-schema', PROD_BASE_ID_KAND]), 1);
});

test('EXIT-KOD: --utfor-rader mot KÄND prod-bas UTAN miljövariabeln → exit 1', () => {
  assert.equal(korSkript(['--utfor-rader', PROD_BASE_ID_KAND]), 1);
});

test('EXIT-KOD: --kontrollera mot KÄND prod-bas UTAN miljövariabeln → exit 1', () => {
  assert.equal(korSkript(['--kontrollera', PROD_BASE_ID_KAND]), 1);
});

test('EXIT-KOD: --kontrollera mot prod MED FEL värde i miljövariabeln → exit 1 (typa-för-att-bekräfta kräver EXAKT match)', () => {
  assert.equal(
    korSkript(['--kontrollera', PROD_BASE_ID_KAND], {
      ...REN_MILJO,
      [PROD_GODKAND_ENV_VAR]: 'appFelaktigtVarde00',
    }),
    1,
  );
});

test('EXIT-KOD: --kontrollera mot staging UTAN AIRTABLE_SCHEMA_TOKEN → exit 3 (token saknas, INNAN nätverk)', () => {
  assert.equal(korSkript(['--kontrollera', STAGING_BASE_ID]), 3);
});

test('EXIT-KOD: --kontrollera mot staging med SCHEMA_TOKEN men UTAN STAGING_AIRTABLE_TOKEN → exit 3', () => {
  assert.equal(
    korSkript(['--kontrollera', STAGING_BASE_ID], { ...REN_MILJO, AIRTABLE_SCHEMA_TOKEN: 'dummy' }),
    3,
  );
});

test('EXIT-KOD: --utfor-schema mot staging utan token → exit 3 (samma guard-ordning som --kontrollera)', () => {
  assert.equal(korSkript(['--utfor-schema', STAGING_BASE_ID]), 3);
});

test('EXIT-KOD: --utfor-rader mot staging utan token → exit 3', () => {
  assert.equal(korSkript(['--utfor-rader', STAGING_BASE_ID]), 3);
});

test('EXIT-KOD (§ premiss-pass-beviset): --kontrollera mot KÄND prod-bas, agent-liknande anrop utan GO → VÄGRAS mekaniskt av skriptets EGNA guard (deny-prod-ref.sh täcker inte Airtable-bas-ID, se filhuvudets § PROD-LÅSET)', () => {
  // Detta ÄR det skarpa beviset uppdraget efterfrågade — producerat av rätt
  // mekanism (skriptets egen resolveTargetBaseId), inte av
  // scripts/deny-prod-ref.sh (som bevisligen INTE matchar Airtable-ID:n,
  // se .prod-ref-policy.conf — endast Supabase-refen "lvjsfnphlauldxqlncpl").
  // Ingen nätverkstrafik uppstod: exit 1 kommer FÖRE någon fetch i main().
  const kod = korSkript(['--kontrollera', PROD_BASE_ID_KAND]);
  assert.equal(kod, 1, 'skriptets egen prod-guard måste fälla INNAN någon nätverksanrop görs');
});

// ---------------------------------------------------------------------------
// Summering
// ---------------------------------------------------------------------------

await Promise.all(pendingAsync);
console.log('');
console.log(`${passed} gröna, ${failed} röda`);
process.exit(failed > 0 ? 1 : 0);
