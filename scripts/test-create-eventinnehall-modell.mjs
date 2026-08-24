#!/usr/bin/env node
// scripts/test-create-eventinnehall-modell.mjs — tester för
// create-eventinnehall-modell.mjs:s pura guard- och planeringsfunktioner
// (samma konvention som scripts/test-create-bilagor-table.mjs: verktygsskript
// bär eget test-skript, körs lokalt vid skript-utveckling, ej CI-wirad).
//
// Kör: node scripts/test-create-eventinnehall-modell.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// HERMETISKT: importerar bara de pura funktionerna, rör aldrig fetch/nätverk,
// kräver ingen token. Utöver create-bilagor-table.mjs:s två invarianter
// (bas-guard vägrar prod; planFields mismatchar hårt, reparerar aldrig tyst)
// bevisar denna svit den NYA mekaniken detta skript lägger till mot
// föregångaren: multi-operations-ordningen (addFields mot en obefintlig
// tabell är ett guard-fel) och `linkedTableName`-upplösningen (sent bunden,
// löst via en resolver — inte en hårdkodad linkedTableId).

import assert from 'node:assert/strict';
import {
  buildCreateFieldBody,
  buildCreateTableBody,
  CONFIG,
  findTableByName,
  PROD_GODKAND_ENV_VAR,
  parseArgs,
  planFields,
  resolveTargetBaseId,
  runOperations,
  validateConfig,
} from './create-eventinnehall-modell.mjs';

let passed = 0;
let failed = 0;

// Väntande async-tester (TASK-313: runOperations är async). Synkrona tester
// beter sig EXAKT som tidigare — resultatet är då inte ett thenable och
// grenen nedan tar den gamla, direkta vägen. Async-tester köas och avvaktas
// samlat via `pendingAsync` innan sviten skriver ut sin summering, så att en
// avvisad Promise verkligen räknas som ❌ i stället för att bli en tyst
// unhandled rejection.
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
// validateConfig — bas-guarden
// ---------------------------------------------------------------------------

test('validateConfig: den skarpa CONFIG är giltig', () => {
  assert.deepEqual(validateConfig(CONFIG), CONFIG);
});

test('validateConfig: den skarpa CONFIG pekar mot staging, inte prod', () => {
  assert.equal(CONFIG.expectedBaseId, 'apphjj8Q7lkXCMsL4');
  assert.deepEqual(CONFIG.forbiddenBaseIds, ['app8uGPrVCVOm6LfD']);
});

test('validateConfig: kastar om expectedBaseId är i forbiddenBaseIds (prod-försök)', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'app8uGPrVCVOm6LfD',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
        operations: [
          { kind: 'createTable', name: 'X', fields: [{ name: 'A', type: 'singleLineText' }] },
        ],
      }),
    /BLOCKERAD/,
  );
});

test('validateConfig: kastar om forbiddenBaseIds saknas', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'apphjj8Q7lkXCMsL4',
        forbiddenBaseIds: [],
        operations: [
          { kind: 'createTable', name: 'X', fields: [{ name: 'A', type: 'singleLineText' }] },
        ],
      }),
    /forbiddenBaseIds saknas/,
  );
});

test('validateConfig: kastar på okänt operation-kind', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'apphjj8Q7lkXCMsL4',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
        operations: [
          { kind: 'deleteTable', name: 'X', fields: [{ name: 'A', type: 'singleLineText' }] },
        ],
      }),
    /okänt kind/,
  );
});

test('validateConfig: kastar på dubblettfält inom en operation', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'apphjj8Q7lkXCMsL4',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
        operations: [
          {
            kind: 'createTable',
            name: 'X',
            fields: [
              { name: 'A', type: 'singleLineText' },
              { name: 'A', type: 'number' },
            ],
          },
        ],
      }),
    /dubblettfält/,
  );
});

test('validateConfig: kastar på dubblett createTable-operation för samma tabell', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'apphjj8Q7lkXCMsL4',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
        operations: [
          { kind: 'createTable', name: 'X', fields: [{ name: 'A', type: 'singleLineText' }] },
          { kind: 'createTable', name: 'X', fields: [{ name: 'B', type: 'singleLineText' }] },
        ],
      }),
    /dubblett createTable/,
  );
});

// ---------------------------------------------------------------------------
// Operations-ordningen i den skarpa CONFIG — createTable FÖRE addFields som
// länkar till dem, och de två addFields-målen (Eventplanering/Bilagor) är
// befintliga tabeller, inte nya.
// ---------------------------------------------------------------------------

test('CONFIG.operations: Platser och Eventinnehåll skapas FÖRE Agendapunkter (som länkar båda)', () => {
  const idx = (name) =>
    CONFIG.operations.findIndex((op) => op.name === name && op.kind === 'createTable');
  assert.ok(idx('Platser') < idx('Agendapunkter'));
  assert.ok(idx('Eventinnehåll') < idx('Agendapunkter'));
});

test('CONFIG.operations: Platser skapas FÖRE Eventplanering.addFields (länkar Plats → Platser)', () => {
  const platserIdx = CONFIG.operations.findIndex(
    (op) => op.name === 'Platser' && op.kind === 'createTable',
  );
  const eventplaneringIdx = CONFIG.operations.findIndex(
    (op) => op.name === 'Eventplanering' && op.kind === 'addFields',
  );
  assert.ok(platserIdx < eventplaneringIdx);
});

test('CONFIG.operations: Eventplanering och Bilagor är addFields (befintliga tabeller), inte createTable', () => {
  const eventplanering = CONFIG.operations.find((op) => op.name === 'Eventplanering');
  const bilagor = CONFIG.operations.find((op) => op.name === 'Bilagor');
  assert.equal(eventplanering.kind, 'addFields');
  assert.equal(bilagor.kind, 'addFields');
});

test('CONFIG: Eventinnehåll.Namn är singleLineText, INTE formula (plattformsväggen, se filhuvudet)', () => {
  const eventinnehall = CONFIG.operations.find((op) => op.name === 'Eventinnehåll');
  const namn = eventinnehall.fields.find((f) => f.name === 'Namn');
  assert.equal(namn.type, 'singleLineText');
  assert.equal(namn, eventinnehall.fields[0], 'Namn måste stå FÖRST (blir primärfält)');
});

test('CONFIG: Eventplanerings (bilagetext)-fält är exakt 17 + Plats-länken = 18 fält totalt', () => {
  const eventplanering = CONFIG.operations.find((op) => op.name === 'Eventplanering');
  const bilagetextFields = eventplanering.fields.filter((f) => f.name.endsWith(' (bilagetext)'));
  assert.equal(bilagetextFields.length, 17);
  assert.equal(eventplanering.fields.length, 18);
});

test('CONFIG: Bilagetext-suffixet har ett inledande mellanslag (ADR-125 §2)', () => {
  const eventplanering = CONFIG.operations.find((op) => op.name === 'Eventplanering');
  const tid = eventplanering.fields.find((f) => f.name.startsWith('Tid ('));
  assert.equal(tid.name, 'Tid (bilagetext)');
});

// ---------------------------------------------------------------------------
// findTableByName
// ---------------------------------------------------------------------------

test('findTableByName: hittar exakt namn', () => {
  const tables = [
    { id: 'tbl1', name: 'Platser' },
    { id: 'tbl2', name: 'Eventinnehåll' },
  ];
  assert.equal(findTableByName(tables, 'Eventinnehåll').id, 'tbl2');
});

test('findTableByName: null/undefined-lista ger undefined, kastar aldrig', () => {
  assert.equal(findTableByName(undefined, 'X'), undefined);
});

// ---------------------------------------------------------------------------
// planFields — additivitets-mätningen, samma tre fall som föregångaren
// ---------------------------------------------------------------------------

const noopResolver = () => 'tblXXXXXXXXXXXXXX';

test('planFields: tom befintlig tabell → allt i toCreate, inga mismatches', () => {
  const plan = planFields({ fields: [] }, [{ name: 'A', type: 'singleLineText' }], noopResolver);
  assert.equal(plan.toCreate.length, 1);
  assert.equal(plan.mismatches.length, 0);
});

test('planFields: alla förväntade fält finns med RÄTT typ → noop', () => {
  const existing = { fields: [{ name: 'A', type: 'singleLineText', id: 'fld1' }] };
  const plan = planFields(existing, [{ name: 'A', type: 'singleLineText' }], noopResolver);
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.mismatches.length, 0);
});

test('planFields: fält med samma namn men FEL typ → mismatch, INTE toCreate (aldrig tyst reparation)', () => {
  const existing = { fields: [{ name: 'A', type: 'number', id: 'fld1' }] };
  const plan = planFields(existing, [{ name: 'A', type: 'singleLineText' }], noopResolver);
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.mismatches.length, 1);
  assert.equal(plan.mismatches[0].expectedType, 'singleLineText');
  assert.equal(plan.mismatches[0].actualType, 'number');
});

test('planFields: linkedTableId-mismatch upptäcks (fel tabell länkad)', () => {
  const existing = {
    fields: [
      {
        name: 'Plats',
        type: 'multipleRecordLinks',
        options: { linkedTableId: 'tblFEL0000000000' },
        id: 'fld1',
      },
    ],
  };
  const plan = planFields(
    existing,
    [{ name: 'Plats', type: 'multipleRecordLinks', linkedTableName: 'Platser' }],
    () => 'tblRATT000000000',
  );
  assert.equal(plan.mismatches.length, 1);
});

test('planFields: linkedTableId matchar → noop, ingen falsklarm', () => {
  const existing = {
    fields: [
      {
        name: 'Plats',
        type: 'multipleRecordLinks',
        options: { linkedTableId: 'tbl7ER0wNqAZ9ZhEq' },
        id: 'fld1',
      },
    ],
  };
  const plan = planFields(
    existing,
    [{ name: 'Plats', type: 'multipleRecordLinks', linkedTableName: 'Platser' }],
    () => 'tbl7ER0wNqAZ9ZhEq',
  );
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.mismatches.length, 0);
});

// ---------------------------------------------------------------------------
// toApiFieldPayload (via buildCreateTableBody/buildCreateFieldBody) —
// options utelämnas när tom (samma 422-fälla som föregångaren), och
// linkedTableName löses till linkedTableId sent, via resolvern.
// ---------------------------------------------------------------------------

test('buildCreateTableBody: singleLineText utan innehåll i options → options UTELÄMNAS helt', () => {
  const op = {
    name: 'X',
    description: 'd',
    fields: [{ name: 'A', type: 'singleLineText', options: {} }],
  };
  const body = buildCreateTableBody(op, noopResolver);
  assert.equal('options' in body.fields[0], false);
});

test('buildCreateFieldBody: linkedTableName löses till options.linkedTableId', () => {
  const field = {
    name: 'Eventinnehåll',
    type: 'multipleRecordLinks',
    linkedTableName: 'Eventinnehåll',
  };
  const body = buildCreateFieldBody(field, (name) =>
    name === 'Eventinnehåll' ? 'tblwqaBrkm6hJPITd' : null,
  );
  assert.equal(body.options.linkedTableId, 'tblwqaBrkm6hJPITd');
});

test('buildCreateTableBody: Eventinnehåll-tabellens Event-fält bär exakt 6 val, Typ exakt 2', () => {
  const eventinnehall = CONFIG.operations.find((op) => op.name === 'Eventinnehåll');
  const body = buildCreateTableBody(eventinnehall, noopResolver);
  const event = body.fields.find((f) => f.name === 'Event');
  const typ = body.fields.find((f) => f.name === 'Typ');
  assert.equal(event.options.choices.length, 6);
  assert.equal(typ.options.choices.length, 2);
  assert.deepEqual(
    event.options.choices.map((c) => c.name),
    [
      'Fjärrskådning',
      'Resor i medvetandet',
      'Resor i medvetandet 1',
      'Resor i medvetandet 2',
      'Resor i medvetandet 3',
      'Psionautics',
    ],
  );
});

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

test('parseArgs: --dry-run sätter dryRun', () => {
  assert.equal(parseArgs(['--dry-run']).dryRun, true);
  assert.equal(parseArgs([]).dryRun, false);
});

test('parseArgs: --bas läser värdet direkt efter flaggan; saknas flaggan är bas undefined', () => {
  assert.equal(parseArgs(['--bas', 'app8uGPrVCVOm6LfD']).bas, 'app8uGPrVCVOm6LfD');
  assert.equal(parseArgs([]).bas, undefined);
  assert.equal(parseArgs(['--dry-run']).bas, undefined);
});

// ---------------------------------------------------------------------------
// resolveTargetBaseId — prod-låset (TASK-309.9, ADR-125 §8). Bevisat i BÅDA
// riktningarna: utan miljövariabeln VÄGRAR, med den (satt till EXAKT samma
// bas-ID) går den vidare. Ren funktion — inget nätverk, ingen mock av API:t
// behövs (samma hermetiska stil som resten av denna svit).
// ---------------------------------------------------------------------------

const STAGING = CONFIG.expectedBaseId;
const PROD = 'app8uGPrVCVOm6LfD';

test('resolveTargetBaseId: ingen --bas → staging, ingen gate', () => {
  assert.equal(
    resolveTargetBaseId({ bas: undefined, stagingBaseId: STAGING, godkandEnv: undefined }),
    STAGING,
  );
});

test('resolveTargetBaseId: --bas = staging explicit → staging, ingen gate', () => {
  assert.equal(
    resolveTargetBaseId({ bas: STAGING, stagingBaseId: STAGING, godkandEnv: undefined }),
    STAGING,
  );
});

test('resolveTargetBaseId: --bas = prod UTAN miljövariabeln → VÄGRAR', () => {
  assert.throws(
    () => resolveTargetBaseId({ bas: PROD, stagingBaseId: STAGING, godkandEnv: undefined }),
    /VÄGRAR.*AIRTABLE_PROD_GODKAND_AV_MARCUS/s,
  );
});

test('resolveTargetBaseId: --bas = prod med miljövariabeln satt till ANNAN bas → VÄGRAR', () => {
  assert.throws(
    () =>
      resolveTargetBaseId({ bas: PROD, stagingBaseId: STAGING, godkandEnv: 'appNagotAnnat0000' }),
    /VÄGRAR/,
  );
});

test('resolveTargetBaseId: --bas = prod MED miljövariabeln satt till EXAKT samma bas → går vidare (torrkörning tillåts fortsätta)', () => {
  assert.equal(resolveTargetBaseId({ bas: PROD, stagingBaseId: STAGING, godkandEnv: PROD }), PROD);
});

test('PROD_GODKAND_ENV_VAR: exporteras som exakt "AIRTABLE_PROD_GODKAND_AV_MARCUS"', () => {
  assert.equal(PROD_GODKAND_ENV_VAR, 'AIRTABLE_PROD_GODKAND_AV_MARCUS');
});

// ---------------------------------------------------------------------------
// runOperations — TASK-313: dry-run mot en bas där de tre NYA tabellerna
// (Platser/Eventinnehåll/Agendapunkter) INTE finns kraschade tidigare på
// tredje operationen (Agendapunkter länkar Eventinnehåll) eftersom
// dry-run-grenen för createTable aldrig trädde tableIdByName. Tvåsidigt
// test per AC #3: en TOM bas (för DETTA skript — Eventplanering/Bilagor är
// addFields-mål som per skriptets egen guard MÅSTE finnas sedan tidigare,
// de skapas aldrig här) och en HELT FYLLD bas (allt redan i synk, no-op).
// Ingen fetch, inget nätverk — createTableApi/createFieldApi är stubbar som
// KASTAR om de anropas, vilket bevisar att dry-run aldrig anropar API:t.
// ---------------------------------------------------------------------------

const failIfApiCalled = () => {
  throw new Error('createTableApi/createFieldApi anropades i dry-run — ska ALDRIG hända');
};

test('runOperations: dry-run mot tom bas (de tre nya tabellerna saknas) planerar HELA kedjan utan att kasta', async () => {
  const tables = [
    { id: 'tblEventplanering', name: 'Eventplanering', fields: [] },
    { id: 'tblBilagor', name: 'Bilagor', fields: [] },
  ];
  const result = await runOperations({
    tables,
    operations: CONFIG.operations,
    dryRun: true,
    createTableApi: failIfApiCalled,
    createFieldApi: failIfApiCalled,
  });
  assert.equal(result.anyChange, true);
  // Dry-run mutar aldrig basen — inget skapas på riktigt, listan är därför tom.
  assert.deepEqual(result.skapadeRader, []);
});

test('runOperations: dry-run mot en HELT tom bas (även Eventplanering/Bilagor saknas) kastar fortfarande — de ska aldrig skapas av skriptet', async () => {
  // Agendapunkter (tredje createTable-operationen) länkar BÅDE Eventinnehåll
  // (nyss "skapad" via det syntetiska ID:t, TASK-313-fixen) OCH Eventplanering
  // — som INTE är en createTable-operation och alltså aldrig får ett
  // syntetiskt ID. Det är korrekt: skriptet ska ALDRIG skapa Eventplanering
  // (den "förväntas existera SEDAN TIDIGARE", se guarden för addFields), så
  // ett GuardError här är rätt beteende, inte en regression.
  await assert.rejects(
    () =>
      runOperations({
        tables: [],
        operations: CONFIG.operations,
        dryRun: true,
        createTableApi: failIfApiCalled,
        createFieldApi: failIfApiCalled,
      }),
    /länkad tabell "Eventplanering" hittades inte/,
  );
});

test('runOperations: dry-run mot fylld bas (allt redan i synk) är en ren no-op, kastar aldrig', async () => {
  const idFor = (name) => `tbl${name.replace(/[^a-zA-Z0-9]/g, '')}`;
  const resolver = (name) => idFor(name);
  const tablesByName = new Map();
  for (const op of CONFIG.operations) {
    if (op.kind === 'createTable') {
      const body = buildCreateTableBody(op, resolver);
      tablesByName.set(op.name, {
        id: idFor(op.name),
        name: op.name,
        fields: body.fields.map((f, i) => ({
          id: `fld${i}`,
          name: f.name,
          type: f.type,
          options: f.options,
        })),
      });
    }
  }
  for (const op of CONFIG.operations) {
    if (op.kind === 'addFields') {
      const existing = tablesByName.get(op.name) ?? {
        id: idFor(op.name),
        name: op.name,
        fields: [],
      };
      const newFields = op.fields
        .map((f) => buildCreateFieldBody(f, resolver))
        .map((f, i) => ({ id: `afld${i}`, name: f.name, type: f.type, options: f.options }));
      existing.fields = [...existing.fields, ...newFields];
      tablesByName.set(op.name, existing);
    }
  }

  const result = await runOperations({
    tables: [...tablesByName.values()],
    operations: CONFIG.operations,
    dryRun: true,
    createTableApi: failIfApiCalled,
    createFieldApi: failIfApiCalled,
  });
  assert.equal(result.anyChange, false, 'allt redan i synk — inget att planera');
  assert.deepEqual(result.skapadeRader, []);
});

test('runOperations: skarpt läge (dryRun: false) trär tableIdByName från API-svaret — Agendapunkter kan länka nyskapad Eventinnehåll', async () => {
  const createdTables = [];
  const result = await runOperations({
    tables: [
      { id: 'tblEventplanering', name: 'Eventplanering', fields: [] },
      { id: 'tblBilagor', name: 'Bilagor', fields: [] },
    ],
    operations: CONFIG.operations,
    dryRun: false,
    createTableApi: async (body) => {
      createdTables.push(body.name);
      const id = `tblSKAPAD${createdTables.length}`;
      return {
        id,
        name: body.name,
        fields: body.fields.map((f, i) => ({ id: `fld${i}`, name: f.name, type: f.type })),
      };
    },
    createFieldApi: async (_tableId, body) => ({ id: 'fldNY', name: body.name, type: body.type }),
  });
  assert.deepEqual(createdTables, ['Platser', 'Eventinnehåll', 'Agendapunkter']);
  assert.equal(result.anyChange, true);
});

// ---------------------------------------------------------------------------

await Promise.all(pendingAsync);
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
