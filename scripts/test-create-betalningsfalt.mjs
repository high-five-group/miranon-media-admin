#!/usr/bin/env node
// scripts/test-create-betalningsfalt.mjs — tester för
// create-betalningsfalt.mjs:s pura väg­vals-funktioner (samma konvention som
// scripts/test-create-eventinnehall-modell.mjs: verktygsskript bär eget
// test-skript, körs lokalt vid skript-utveckling, ej CI-wirad).
//
// Kör: node scripts/test-create-betalningsfalt.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// HERMETISKT: importerar bara de pura funktionerna, rör aldrig fetch/nätverk,
// kräver ingen token.
//
// INTE WIRAD I ci.yml (medvetet, samma precedent som
// scripts/test-create-eventinnehall-modell.mjs/test-create-kvitton-table.mjs/
// test-create-bilagor-table.mjs § filhuvud, TASK-82) — VERIFIERAT mot
// disk 2026-09-01: samtliga tre systerskript är listade i ci.yml:s "Test
// gatekeeper script suites"-steg som medvetet o-wirade
// ("test-create-{bilagor-table,eventinnehall-modell,kvitton-table}.mjs" —
// varje bär sin egen "INTE WIRAD (medvetet)"-kommentar). Uppdragets premiss
// att förebildens svit VORE CI-wirad höll INTE vid provning — se
// slutrapporten för divergensen; denna svit följer den FAKTISKA, verifierade
// konventionen i stället för den antagna.
//
// SCOPE: minimal svit för VÄGVALS-logiken (parseArgs/resolveTargetBaseId/
// PROD_GODKAND_ENV_VAR) plus findTableByName — den nya tabell-identifierings-
// mekanismen som --bas-vägen krävde (se create-betalningsfalt.mjs § filhuvud
// "AVVIKELSE FRÅN FÖREBILDEN, BOKFÖRD": Eventinnehåll har OLIKA tabell-ID i
// staging/prod, så ID-baserat uppslag bar inte över till prod). Duplicerar
// INTE förebildens fulla täckning av buildLookupFieldBody/
// buildFormulaFieldBody/planFields-mismatch-grenar — de är oförändrade av
// denna skiva och redan implicit skyddade av CONFIG-formen validateConfig
// kontrollerar.

import assert from 'node:assert/strict';
import {
  CONFIG,
  findTableByName,
  PROD_GODKAND_ENV_VAR,
  parseArgs,
  resolveTargetBaseId,
  validateConfig,
} from './create-betalningsfalt.mjs';

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
// validateConfig — bas-guarden + de NYA tableName-kraven (denna skivas
// tillägg: findTableByName kräver ett tableName att slå upp på, så
// validateConfig fäller nu även på ett saknat sådant, inte bara tableId).
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
        eventinnehall: {
          tableId: 't1',
          tableName: 'Eventinnehåll',
          fields: [{ name: 'A', type: 'number' }],
        },
        eventplanering: {
          tableId: 't2',
          tableName: 'Eventplanering',
          fields: [{ name: 'A', type: 'number' }],
        },
        anmalningar: {
          tableId: 't3',
          tableName: 'Anmälningar',
          egnaFält: [{ name: 'A', type: 'number' }],
          eventLänkFieldId: 'fld1',
          lookup: { name: 'L' },
          formula: { text: 'X' },
        },
      }),
    /BLOCKERAD/,
  );
});

test('validateConfig: kastar om eventinnehall.tableName saknas (NY av denna skiva)', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'apphjj8Q7lkXCMsL4',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
        eventinnehall: { tableId: 't1', fields: [{ name: 'A', type: 'number' }] },
        eventplanering: {
          tableId: 't2',
          tableName: 'Eventplanering',
          fields: [{ name: 'A', type: 'number' }],
        },
        anmalningar: {
          tableId: 't3',
          tableName: 'Anmälningar',
          egnaFält: [{ name: 'A', type: 'number' }],
          eventLänkFieldId: 'fld1',
          lookup: { name: 'L' },
          formula: { text: 'X' },
        },
      }),
    /eventinnehall\.tableName saknas/,
  );
});

test('validateConfig: kastar om anmalningar.tableName saknas (NY av denna skiva)', () => {
  assert.throws(
    () =>
      validateConfig({
        expectedBaseId: 'apphjj8Q7lkXCMsL4',
        forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],
        eventinnehall: {
          tableId: 't1',
          tableName: 'Eventinnehåll',
          fields: [{ name: 'A', type: 'number' }],
        },
        eventplanering: {
          tableId: 't2',
          tableName: 'Eventplanering',
          fields: [{ name: 'A', type: 'number' }],
        },
        anmalningar: {
          tableId: 't3',
          egnaFält: [{ name: 'A', type: 'number' }],
          eventLänkFieldId: 'fld1',
          lookup: { name: 'L' },
          formula: { text: 'X' },
        },
      }),
    /anmalningar\.tableName saknas/,
  );
});

// ---------------------------------------------------------------------------
// findTableByName — den nya, NAMN-baserade tabellidentifieringen (ersätter
// findTableById i main(), se create-betalningsfalt.mjs § filhuvud för varför:
// Eventinnehåll har OLIKA tabell-ID i staging/prod).
// ---------------------------------------------------------------------------

test('findTableByName: hittar exakt namn', () => {
  const tables = [
    { id: 'tblA', name: 'Eventinnehåll' },
    { id: 'tblB', name: 'Eventplanering' },
  ];
  assert.deepEqual(findTableByName(tables, 'Eventplanering'), {
    id: 'tblB',
    name: 'Eventplanering',
  });
});

test('findTableByName: hittar samma NAMN oavsett vilket ID tabellen har i denna bas (prod-kravet)', () => {
  // Live-verifierat 2026-09-01 (mcp__airtable__list_tables mot prod,
  // read-only): Eventinnehåll heter "Eventinnehåll" i BÅDA baserna men bär
  // OLIKA ID (staging tblwqaBrkm6hJPITd, prod tblfwqsNPSYd6o44L). Namnet är
  // den enda invarianten — detta test bevisar att uppslaget faktiskt går på
  // namnet, inte på ett hårdkodat ID.
  const prodTables = [{ id: 'tblfwqsNPSYd6o44L', name: 'Eventinnehåll' }];
  const stagingTables = [{ id: 'tblwqaBrkm6hJPITd', name: 'Eventinnehåll' }];
  assert.equal(findTableByName(prodTables, 'Eventinnehåll').id, 'tblfwqsNPSYd6o44L');
  assert.equal(findTableByName(stagingTables, 'Eventinnehåll').id, 'tblwqaBrkm6hJPITd');
});

test('findTableByName: null/undefined-lista ger undefined, kastar aldrig', () => {
  assert.equal(findTableByName(null, 'X'), undefined);
  assert.equal(findTableByName(undefined, 'X'), undefined);
});

test('findTableByName: okänt namn ger undefined', () => {
  assert.equal(findTableByName([{ id: 'tblA', name: 'Eventinnehåll' }], 'Saknas'), undefined);
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

test('parseArgs: --bas och --dry-run kan kombineras i valfri ordning', () => {
  assert.deepEqual(parseArgs(['--bas', 'appX', '--dry-run']), { dryRun: true, bas: 'appX' });
  assert.deepEqual(parseArgs(['--dry-run', '--bas', 'appX']), { dryRun: true, bas: 'appX' });
});

// ---------------------------------------------------------------------------
// resolveTargetBaseId — prod-låset (samma mönster som
// create-eventinnehall-modell.mjs, TASK-309.9/ADR-125 §8). Bevisat i BÅDA
// riktningarna: utan miljövariabeln VÄGRAR, med den (satt till EXAKT samma
// bas-ID) går den vidare. Ren funktion — inget nätverk.
// ---------------------------------------------------------------------------

const STAGING = CONFIG.expectedBaseId;
const PROD = 'app8uGPrVCVOm6LfD';

test('resolveTargetBaseId: ingen --bas → staging, ingen gate (default-beteendet, KRAV #1)', () => {
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

test('resolveTargetBaseId: --bas = prod MED miljövariabeln satt till EXAKT samma bas → släpper igenom', () => {
  assert.equal(resolveTargetBaseId({ bas: PROD, stagingBaseId: STAGING, godkandEnv: PROD }), PROD);
});

test('resolveTargetBaseId: --bas = en helt tredje, felskriven bas-ID UTAN miljövariabeln → VÄGRAR (fail-closed generellt, ingen enumererad allowlist)', () => {
  assert.throws(
    () =>
      resolveTargetBaseId({
        bas: 'appFelskrivenXYZ12',
        stagingBaseId: STAGING,
        godkandEnv: undefined,
      }),
    /VÄGRAR/,
  );
});

test('PROD_GODKAND_ENV_VAR: exporteras som exakt "AIRTABLE_PROD_GODKAND_AV_MARCUS"', () => {
  assert.equal(PROD_GODKAND_ENV_VAR, 'AIRTABLE_PROD_GODKAND_AV_MARCUS');
});

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
