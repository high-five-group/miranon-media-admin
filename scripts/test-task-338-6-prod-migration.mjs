#!/usr/bin/env node
// scripts/test-task-338-6-prod-migration.mjs — tester för
// task-338-6-prod-migration.mjs:s pura guard-, plannings- och
// exekveringsfunktioner (DI-mönstret från
// scripts/test-create-eventinnehall-modell.mjs § runOperations: sido-
// effekter går via injicerade API-funktioner, aldrig riktig fetch).
//
// HERMETISKT: de flesta testerna importerar bara pura funktioner och rör
// aldrig nätverk. En liten integrationsdel (§ EXIT-KODER) spawnar skriptet
// som barnprocess för att bevisa de FAKTISKA exit-koderna — men bara för
// grenar som kastar/exitar INNAN någon fetch görs (argument-/bas-ID-fel,
// prod-guard-vägran, saknad token), så INGEN nätverkstrafik uppstår någonstans
// i denna svit. Miljön för barnprocesserna byggs explicit (aldrig
// process.env rakt av) så en lokal .env.seed/exporterad token aldrig läcker
// in och gör ett test falskt grönt.
//
// Kör: node scripts/test-task-338-6-prod-migration.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ArgError,
  BASE_ID_PATTERN,
  buildKontrolleraReport,
  chunk,
  findFieldByName,
  findTableByName,
  formatKontrolleraReport,
  GEMENSAM_CHOICE_NAME,
  GuardError,
  hasChoice,
  PROD_BASE_ID_KAND,
  PROD_GODKAND_ENV_VAR,
  parseArgs,
  planUtfor,
  resolveTargetBaseId,
  runUtfor,
  STAGING_BASE_ID,
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
// parseArgs
// ---------------------------------------------------------------------------

test('parseArgs: --kontrollera <bas-id> tolkas korrekt', () => {
  assert.deepEqual(parseArgs(['--kontrollera', STAGING_BASE_ID]), {
    mode: 'kontrollera',
    bas: STAGING_BASE_ID,
  });
});

test('parseArgs: --utfor <bas-id> tolkas korrekt', () => {
  assert.deepEqual(parseArgs(['--utfor', STAGING_BASE_ID]), {
    mode: 'utfor',
    bas: STAGING_BASE_ID,
  });
});

test('parseArgs: ingen flagga → ArgError', () => {
  assert.throws(() => parseArgs([STAGING_BASE_ID]), ArgError);
});

test('parseArgs: båda flaggorna samtidigt → ArgError', () => {
  assert.throws(
    () => parseArgs(['--kontrollera', STAGING_BASE_ID, '--utfor', STAGING_BASE_ID]),
    ArgError,
  );
});

test('parseArgs: saknat bas-ID efter flaggan → ArgError', () => {
  assert.throws(() => parseArgs(['--kontrollera']), ArgError);
});

test('parseArgs: nästa argument är en annan flagga, inte ett bas-ID → ArgError', () => {
  assert.throws(() => parseArgs(['--kontrollera', '--utfor']), ArgError);
});

test('parseArgs: fel bas-ID-FORM → ArgError (huvudkravet: exit 2 i main(), se § EXIT-KODER)', () => {
  assert.throws(() => parseArgs(['--kontrollera', 'inte-ett-bas-id']), ArgError);
  assert.throws(() => parseArgs(['--utfor', 'app123']), ArgError);
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

function bilagorTable({ medGemensam, medPlats, medPlatsnamn } = {}) {
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
    fields.push({
      id: 'fldPlatsSYN00001',
      name: 'Plats',
      type: 'multipleRecordLinks',
      options: { linkedTableId: SYNTETISK_PLATSER_TABLE.id },
    });
  }
  if (medPlatsnamn) {
    fields.push({
      id: 'fldPlatsnamnSYN01',
      name: 'Platsnamn',
      type: 'multipleLookupValues',
      options: { recordLinkFieldId: 'fldPlatsSYN00001', fieldIdInLinkedTable: 'fldNamnSYN0000001' },
    });
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
// planUtfor — de tre huvudtillstånden (idempotens / delvis / inget)
// ---------------------------------------------------------------------------

test('planUtfor: ALLT FINNS, inga legacy-rader → no-op-plan (idempotens-beviset)', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: true, medPlatsnamn: true }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const plan = planUtfor({
    tables,
    bilagorRecords: [{ id: 'r1', fields: { Namn: 'x', Räckvidd: 'Gemensam' } }],
  });
  assert.deepEqual(plan.optionAdd, { strategy: 'already-exists' });
  assert.equal(plan.platsField.strategy, 'skip');
  assert.equal(plan.platsnamnField.strategy, 'skip');
  assert.deepEqual(plan.rowsToMigrate, []);
});

test('planUtfor: DELVIS — option finns, Plats/Platsnamn saknas, legacy-rader finns → bara fälten skapas, ALLA legacy-rader migreras (ingen konsumerades av optionAdd)', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: false, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const records = [
    { id: 'r1', fields: { Namn: 'a', Räckvidd: 'Kurstyp' } },
    { id: 'r2', fields: { Namn: 'b', Räckvidd: 'Alla event' } },
  ];
  const plan = planUtfor({ tables, bilagorRecords: records });
  assert.deepEqual(plan.optionAdd, { strategy: 'already-exists' });
  assert.equal(plan.platsField.strategy, 'create');
  assert.equal(plan.platsField.body.options.linkedTableId, SYNTETISK_PLATSER_TABLE.id);
  assert.equal(plan.platsnamnField.strategy, 'create');
  assert.equal(plan.platsnamnField.bodyTemplate.fieldIdInLinkedTable, 'fldNamnSYN0000001');
  assert.deepEqual(
    plan.rowsToMigrate.map((r) => r.id),
    ['r1', 'r2'],
  );
});

test('planUtfor: INGET FINNS, legacy-rader finns → optionAdd konsumerar FÖRSTA legacy-raden, resten kvar i rowsToMigrate', () => {
  const tables = [
    bilagorTable({ medGemensam: false, medPlats: false, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const records = [
    { id: 'r1', fields: { Namn: 'a', Räckvidd: 'Kurstyp' } },
    { id: 'r2', fields: { Namn: 'b', Räckvidd: 'Alla event' } },
    { id: 'r3', fields: { Namn: 'c', Räckvidd: 'Event' } }, // orörd, inte legacy
  ];
  const plan = planUtfor({ tables, bilagorRecords: records });
  assert.deepEqual(plan.optionAdd, { strategy: 'migrate-existing-row', recordId: 'r1' });
  assert.equal(plan.platsField.strategy, 'create');
  assert.equal(plan.platsnamnField.strategy, 'create');
  assert.deepEqual(
    plan.rowsToMigrate.map((r) => r.id),
    ['r2'],
  );
  assert.equal(plan.legacyRaderTotalt, 2);
});

test('planUtfor: INGET FINNS, INGA legacy-rader men minst en annan rad → reservväg (throwaway-record)', () => {
  const tables = [
    bilagorTable({ medGemensam: false, medPlats: false, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const records = [{ id: 'r1', fields: { Namn: 'a', Räckvidd: 'Event' } }];
  const plan = planUtfor({ tables, bilagorRecords: records });
  assert.deepEqual(plan.optionAdd, { strategy: 'throwaway-record' });
  assert.deepEqual(plan.rowsToMigrate, []);
});

test('planUtfor: INGET FINNS, tabellen är HELT TOM → GuardError (ingen rad att typecasta mot)', () => {
  const tables = [
    bilagorTable({ medGemensam: false, medPlats: false, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  assert.throws(() => planUtfor({ tables, bilagorRecords: [] }), GuardError);
});

test('planUtfor: Plats-fältet finns redan → platsnamnField-planen får bodyTemplate men INTE recordLinkFieldId (trådas av runUtfor från existingId)', () => {
  const tables = [
    bilagorTable({ medGemensam: true, medPlats: true, medPlatsnamn: false }),
    SYNTETISK_PLATSER_TABLE,
  ];
  const plan = planUtfor({
    tables,
    bilagorRecords: [{ id: 'r1', fields: { Namn: 'a', Räckvidd: 'Gemensam' } }],
  });
  assert.equal(plan.platsField.strategy, 'skip');
  assert.equal(plan.platsField.existingId, 'fldPlatsSYN00001');
  assert.equal(plan.platsnamnField.strategy, 'create');
  assert.equal(plan.platsnamnField.bodyTemplate.recordLinkFieldId, undefined);
});

test('planUtfor: saknad Bilagor-tabell → GuardError', () => {
  assert.throws(
    () => planUtfor({ tables: [SYNTETISK_PLATSER_TABLE], bilagorRecords: [] }),
    GuardError,
  );
});

test('planUtfor: saknat Räckvidd-fält → GuardError', () => {
  const bilTabellUtanRackvidd = { id: 'tblX', name: 'Bilagor', fields: [] };
  assert.throws(
    () =>
      planUtfor({ tables: [bilTabellUtanRackvidd, SYNTETISK_PLATSER_TABLE], bilagorRecords: [] }),
    GuardError,
  );
});

test('planUtfor: saknat Platser.Namn-fält → GuardError', () => {
  const platserUtanNamn = { id: 'tblPY', name: 'Platser', fields: [] };
  const tables = [bilagorTable({ medGemensam: true }), platserUtanNamn];
  assert.throws(
    () =>
      planUtfor({
        tables,
        bilagorRecords: [{ id: 'r1', fields: { Namn: 'a', Räckvidd: 'Gemensam' } }],
      }),
    GuardError,
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
// runUtfor — exekvering mot injicerade API-stubbar (DI, inget nätverk)
// ---------------------------------------------------------------------------

function callCounter() {
  const anrop = [];
  return {
    anrop,
    patchRackvidd: async (ids) => {
      anrop.push({ typ: 'patch', ids });
    },
    createThrowawayAndDelete: async () => {
      anrop.push({ typ: 'throwaway' });
    },
    createField: async (body) => {
      anrop.push({ typ: 'createField', body });
      return { id: `fld-${body.name}-NY` };
    },
  };
}

test('runUtfor: no-op-plan (allt finns) → INGET API-anrop görs alls (0 skrivningar, idempotens-beviset)', async () => {
  const api = callCounter();
  const plan = {
    optionAdd: { strategy: 'already-exists' },
    platsField: { strategy: 'skip', existingId: 'fldGammal' },
    platsnamnField: { strategy: 'skip' },
    rowsToMigrate: [],
  };
  const { skrivningar } = await runUtfor(plan, api);
  assert.deepEqual(skrivningar, {
    optionAdd: 0,
    platsField: 0,
    platsnamnField: 0,
    radMigrering: 0,
  });
  assert.deepEqual(api.anrop, []);
});

test('runUtfor: migrate-existing-row + skapa båda fälten + migrera resten → korrekt anropssekvens och trådad recordLinkFieldId', async () => {
  const api = callCounter();
  const plan = {
    optionAdd: { strategy: 'migrate-existing-row', recordId: 'recFörst' },
    platsField: {
      strategy: 'create',
      body: {
        name: 'Plats',
        type: 'multipleRecordLinks',
        options: { linkedTableId: 'tblPlatser' },
      },
    },
    platsnamnField: {
      strategy: 'create',
      bodyTemplate: {
        name: 'Platsnamn',
        type: 'multipleLookupValues',
        fieldIdInLinkedTable: 'fldNamn',
      },
    },
    rowsToMigrate: [{ id: 'recAndra' }, { id: 'recTredje' }],
  };
  const { skrivningar, logg } = await runUtfor(plan, api);
  assert.equal(skrivningar.optionAdd, 1);
  assert.equal(skrivningar.platsField, 1);
  assert.equal(skrivningar.platsnamnField, 1);
  assert.equal(skrivningar.radMigrering, 2);
  assert.equal(api.anrop[0].typ, 'patch');
  assert.deepEqual(api.anrop[0].ids, ['recFörst']);
  assert.equal(api.anrop[1].typ, 'createField');
  assert.equal(api.anrop[1].body.name, 'Plats');
  assert.equal(api.anrop[2].typ, 'createField');
  assert.equal(api.anrop[2].body.name, 'Platsnamn');
  // KRITISKT: platsnamnField.body måste bära DEN NYSKAPADE Plats-fältets id (fld-Plats-NY), inte något gammalt.
  assert.equal(api.anrop[2].body.recordLinkFieldId, 'fld-Plats-NY');
  assert.equal(api.anrop[3].typ, 'patch');
  assert.deepEqual(api.anrop[3].ids, ['recAndra', 'recTredje']);
  assert.ok(logg.some((r) => r.includes('migrerade')));
});

test('runUtfor: Plats-fältet finns REDAN → platsnamnField-skapelsen använder existingId, INTE en ny createField-retur', async () => {
  const api = callCounter();
  const plan = {
    optionAdd: { strategy: 'already-exists' },
    platsField: { strategy: 'skip', existingId: 'fldPlatsGammal123' },
    platsnamnField: {
      strategy: 'create',
      bodyTemplate: {
        name: 'Platsnamn',
        type: 'multipleLookupValues',
        fieldIdInLinkedTable: 'fldNamn',
      },
    },
    rowsToMigrate: [],
  };
  const { skrivningar } = await runUtfor(plan, api);
  assert.equal(skrivningar.platsField, 0);
  assert.equal(skrivningar.platsnamnField, 1);
  assert.equal(api.anrop[0].typ, 'createField');
  assert.equal(api.anrop[0].body.recordLinkFieldId, 'fldPlatsGammal123');
});

test('runUtfor: throwaway-record-strategin anropar createThrowawayAndDelete, räknas som 2 skrivningar', async () => {
  const api = callCounter();
  const plan = {
    optionAdd: { strategy: 'throwaway-record' },
    platsField: { strategy: 'skip', existingId: 'fldX' },
    platsnamnField: { strategy: 'skip' },
    rowsToMigrate: [],
  };
  const { skrivningar } = await runUtfor(plan, api);
  assert.equal(skrivningar.optionAdd, 2);
  assert.deepEqual(api.anrop, [{ typ: 'throwaway' }]);
});

test('runUtfor: radmigrering batchas om RECORD_BATCH_SIZE (10) — 25 rader → 3 patch-anrop (10/10/5)', async () => {
  const api = callCounter();
  const rowsToMigrate = Array.from({ length: 25 }, (_, i) => ({ id: `rec${i}` }));
  const plan = {
    optionAdd: { strategy: 'already-exists' },
    platsField: { strategy: 'skip', existingId: 'fldX' },
    platsnamnField: { strategy: 'skip' },
    rowsToMigrate,
  };
  const { skrivningar } = await runUtfor(plan, api);
  assert.equal(skrivningar.radMigrering, 25);
  const patchAnrop = api.anrop.filter((a) => a.typ === 'patch');
  assert.equal(patchAnrop.length, 3);
  assert.equal(patchAnrop[0].ids.length, 10);
  assert.equal(patchAnrop[1].ids.length, 10);
  assert.equal(patchAnrop[2].ids.length, 5);
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

test('EXIT-KOD: --kontrollera mot KÄND prod-bas UTAN miljövariabeln → exit 1 (prod-guard-vägran, INNAN token/nätverk)', () => {
  assert.equal(korSkript(['--kontrollera', PROD_BASE_ID_KAND]), 1);
});

test('EXIT-KOD: --utfor mot KÄND prod-bas UTAN miljövariabeln → exit 1', () => {
  assert.equal(korSkript(['--utfor', PROD_BASE_ID_KAND]), 1);
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
