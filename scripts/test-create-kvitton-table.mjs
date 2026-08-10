#!/usr/bin/env node
// scripts/test-create-kvitton-table.mjs — tester för create-kvitton-table.mjs:s
// pura guard- och planeringsfunktioner (samma konvention som
// scripts/test-create-bilagor-table.mjs: verktygsskript bär eget test-skript,
// körs lokalt vid skript-utveckling).
//
// Kör: node scripts/test-create-kvitton-table.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// HERMETISKT: importerar bara de pura funktionerna, rör aldrig fetch/nätverk,
// kräver ingen token.
//
// INTE WIRAD I ci.yml (medvetet, samma precedent som
// test-create-bilagor-table.mjs § filhuvud, TASK-82).

import assert from 'node:assert/strict';
import {
  buildCreateFieldBody,
  buildCreateTableBody,
  CONFIG,
  findTableByName,
  parseArgs,
  planFields,
  validateConfig,
} from './create-kvitton-table.mjs';

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
// validateConfig — bas-guarden
// ---------------------------------------------------------------------------

test('validateConfig: den skarpa CONFIG är giltig', () => {
  assert.deepEqual(validateConfig(CONFIG), CONFIG);
});

test('validateConfig: den skarpa CONFIG pekar mot staging, inte prod', () => {
  assert.equal(CONFIG.expectedBaseId, 'apphjj8Q7lkXCMsL4');
  assert.ok(!CONFIG.forbiddenBaseIds.includes(CONFIG.expectedBaseId));
});

test('validateConfig: prod-basen är hårt blockerad i forbiddenBaseIds', () => {
  assert.ok(CONFIG.forbiddenBaseIds.includes('app8uGPrVCVOm6LfD'));
});

test('validateConfig: kastar om expectedBaseId = forbidden (prod-inversionen)', () => {
  assert.throws(
    () =>
      validateConfig({
        ...CONFIG,
        expectedBaseId: 'app8uGPrVCVOm6LfD',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
      }),
    /BLOCKERAD/,
  );
});

test('validateConfig: kastar utan forbiddenBaseIds', () => {
  assert.throws(() => validateConfig({ ...CONFIG, forbiddenBaseIds: [] }), /forbiddenBaseIds/);
});

test('validateConfig: kastar på icke app-formad expectedBaseId', () => {
  assert.throws(() => validateConfig({ ...CONFIG, expectedBaseId: 'inte-en-bas' }), /app-formad/);
});

test('validateConfig: kastar på tom fields-lista (Airtable kräver minst ett fält)', () => {
  assert.throws(() => validateConfig({ ...CONFIG, fields: [] }), /minst ett fält/);
});

test('validateConfig: kastar på dubblettfält-namn', () => {
  const dubblett = [...CONFIG.fields, CONFIG.fields[0]];
  assert.throws(() => validateConfig({ ...CONFIG, fields: dubblett }), /dubblettfält/);
});

test('validateConfig: kastar om ett fält saknar options-objekt', () => {
  const trasig = [{ name: 'X', type: 'singleLineText' }];
  assert.throws(() => validateConfig({ ...CONFIG, fields: trasig }), /options/);
});

test('validateConfig: alla TOLV fälten (Kvitton-tabellens fullständiga fältset, live-verifierat mot MCP-skapelsen) är namngivna', () => {
  const forvantade = [
    'Kvittonummer',
    'Löpnummer',
    'År',
    'Anmälan',
    'Betalning',
    'Belopp',
    'Betalsätt',
    'Kundnamn',
    'Event',
    'Skickad',
    'Lagringsnyckel',
    'Notering',
  ].sort();
  assert.equal(CONFIG.fields.length, 12);
  assert.deepEqual(CONFIG.fields.map((f) => f.name).sort(), forvantade);
});

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

test('parseArgs: default är inte dry-run', () => {
  assert.equal(parseArgs([]).dryRun, false);
});

test('parseArgs: --dry-run sätter dryRun', () => {
  assert.equal(parseArgs(['--dry-run']).dryRun, true);
});

// ---------------------------------------------------------------------------
// findTableByName
// ---------------------------------------------------------------------------

test('findTableByName: hittar exakt namn-match', () => {
  const tables = [
    { id: 'tbl1', name: 'Personer' },
    { id: 'tbl2', name: 'Kvitton' },
  ];
  assert.equal(findTableByName(tables, 'Kvitton').id, 'tbl2');
});

test('findTableByName: undefined om ingen träff', () => {
  const tables = [{ id: 'tbl1', name: 'Personer' }];
  assert.equal(findTableByName(tables, 'Kvitton'), undefined);
});

test('findTableByName: case-sensitive (matchar INTE "kvitton")', () => {
  const tables = [{ id: 'tbl1', name: 'kvitton' }];
  assert.equal(findTableByName(tables, 'Kvitton'), undefined);
});

test('findTableByName: tom lista ger undefined, kastar inte', () => {
  assert.equal(findTableByName([], 'Kvitton'), undefined);
  assert.equal(findTableByName(undefined, 'Kvitton'), undefined);
});

// ---------------------------------------------------------------------------
// planFields — additivitets-mätningen i pur form
// ---------------------------------------------------------------------------

test('planFields: tabell utan matchande fält ⇒ alla i toCreate, inga mismatches', () => {
  const plan = planFields({ fields: [] }, CONFIG.fields);
  assert.equal(plan.toCreate.length, CONFIG.fields.length);
  assert.equal(plan.mismatches.length, 0);
});

test('planFields: alla fält redan present med rätt typ ⇒ noop (matchar det MCP-skapade schemat)', () => {
  const existingTable = {
    fields: CONFIG.fields.map((f) => ({ name: f.name, type: f.type })),
  };
  const plan = planFields(existingTable, CONFIG.fields);
  assert.deepEqual(plan.toCreate, []);
  assert.deepEqual(plan.mismatches, []);
});

test('planFields: ett saknat fält bland flera redan present ⇒ endast det i toCreate', () => {
  const [forst, ...resten] = CONFIG.fields;
  const existingTable = { fields: resten.map((f) => ({ name: f.name, type: f.type })) };
  const plan = planFields(existingTable, CONFIG.fields);
  assert.equal(plan.toCreate.length, 1);
  assert.equal(plan.toCreate[0].name, forst.name);
  assert.equal(plan.mismatches.length, 0);
});

test('planFields: fält med samma namn men FEL typ ⇒ mismatch, INTE toCreate (rör aldrig ett befintligt fält)', () => {
  const existingTable = {
    fields: [{ name: CONFIG.fields[0].name, type: 'multilineText' }],
  };
  const plan = planFields(existingTable, [CONFIG.fields[0]]);
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.mismatches.length, 1);
  assert.equal(plan.mismatches[0].name, CONFIG.fields[0].name);
  assert.equal(plan.mismatches[0].actualType, 'multilineText');
  assert.equal(plan.mismatches[0].expectedType, CONFIG.fields[0].type);
});

test('planFields: EXTRA fält på den befintliga tabellen ignoreras helt (additivt, rör aldrig annat)', () => {
  const existingTable = {
    fields: [
      ...CONFIG.fields.map((f) => ({ name: f.name, type: f.type })),
      { name: 'Ett Främmande Fält Ingen Bad Om', type: 'checkbox' },
    ],
  };
  const plan = planFields(existingTable, CONFIG.fields);
  assert.deepEqual(plan.toCreate, []);
  assert.deepEqual(plan.mismatches, []);
});

// ---------------------------------------------------------------------------
// buildCreateTableBody / buildCreateFieldBody — request-formen
// ---------------------------------------------------------------------------

test('buildCreateTableBody: Kvittonummer är FÖRSTA fältet (blir primärfältet i Airtable)', () => {
  const body = buildCreateTableBody(CONFIG);
  assert.equal(body.fields[0].name, 'Kvittonummer');
});

test('buildCreateTableBody: samtliga CONFIG.fields ingår', () => {
  const body = buildCreateTableBody(CONFIG);
  assert.equal(body.fields.length, CONFIG.fields.length);
  assert.ok(!body.fields.some((f) => f.type === 'createdTime'));
});

test('buildCreateTableBody: name/description matchar CONFIG', () => {
  const body = buildCreateTableBody(CONFIG);
  assert.equal(body.name, CONFIG.table.name);
  assert.equal(body.description, CONFIG.table.description);
});

test('buildCreateTableBody: Anmälan-fältet pekar på Anmälningar (tbloOcrppVoyrHbrq)', () => {
  const body = buildCreateTableBody(CONFIG);
  const anmalan = body.fields.find((f) => f.name === 'Anmälan');
  assert.equal(anmalan.type, 'multipleRecordLinks');
  assert.equal(anmalan.options.linkedTableId, 'tbloOcrppVoyrHbrq');
});

test('buildCreateTableBody: Event-fältet pekar på Eventplanering (tblVE3UKWl1CKrphV)', () => {
  const body = buildCreateTableBody(CONFIG);
  const event = body.fields.find((f) => f.name === 'Event');
  assert.equal(event.type, 'multipleRecordLinks');
  assert.equal(event.options.linkedTableId, 'tblVE3UKWl1CKrphV');
});

test('buildCreateTableBody: Betalning-fältet bär EXAKT de två betalningarna appen redan känner', () => {
  const body = buildCreateTableBody(CONFIG);
  const betalning = body.fields.find((f) => f.name === 'Betalning');
  assert.deepEqual(
    betalning.options.choices.map((c) => c.name),
    ['Anmälningsavgift', 'Slutbetalning'],
  );
});

test('buildCreateTableBody: Betalsätt-fältet bär EXAKT de tre betalsätten (Marcus-beslut a)', () => {
  const body = buildCreateTableBody(CONFIG);
  const betalsatt = body.fields.find((f) => f.name === 'Betalsätt');
  assert.deepEqual(
    betalsatt.options.choices.map((c) => c.name),
    ['Swish', 'Bankgiro', 'Plusgiro'],
  );
});

test('buildCreateFieldBody: fält MED options (t.ex. number) behåller nyckeln', () => {
  const field = CONFIG.fields.find((f) => f.name === 'Löpnummer');
  const body = buildCreateFieldBody(field);
  assert.deepEqual(Object.keys(body).sort(), ['description', 'name', 'options', 'type']);
  assert.equal(body.name, field.name);
  assert.equal(body.type, field.type);
});

test('buildCreateFieldBody: fält med TOMT options ({}) UTELÄMNAR nyckeln helt (den skarpa 422:an, se create-bilagor-table.mjs)', () => {
  const field = CONFIG.fields.find((f) => f.name === 'Kvittonummer');
  const body = buildCreateFieldBody(field);
  assert.deepEqual(Object.keys(body).sort(), ['description', 'name', 'type']);
  assert.equal('options' in body, false);
});

// ---------------------------------------------------------------------------
// Sammanfattning
// ---------------------------------------------------------------------------

console.log(`\n${passed} gröna, ${failed} röda (${passed + failed} totalt)`);
process.exit(failed === 0 ? 0 : 1);
