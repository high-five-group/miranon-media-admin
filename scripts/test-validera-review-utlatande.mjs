#!/usr/bin/env node
// scripts/test-validera-review-utlatande.mjs — tester för utlåtande-schemat
// (TASK-173.1, scripts/lib/review-utlatande.mjs +
// scripts/validera-review-utlatande.mjs).
//
// Samma konvention som scripts/test-check-manifest-fields.mjs: de PURA
// funktionerna (`valideraUtlatande`) importeras direkt — ingen sandlåda,
// ingen subprocess för själva schema-logiken.
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT — INTE ETT STICKPROV ═══
// Varje regel testas i BÅDA riktningar: brytet → RÖTT (ok:false), den
// rättade formen → GRÖNT (ok:true). `action`-fältets fail-closed-beteende
// testas SÄRSKILT tvåsidigt: en giltig klassning ska passera OFÖRÄNDRAD
// (annars vore "fail-closed" i praktiken "skriv alltid över"), och en
// saknad/ogiltig klassning ska normaliseras till 'ask-user' i stället för
// att antingen fälla hela utlåtandet eller tyst bli 'auto-fix'.
//
// Ett sista lager (CLI-nivå, spawnSync) bevisar att `main()`s exit-koder
// faktiskt matchar `valideraUtlatande()`s ok/inte-ok — annars vore
// pure-function-testerna förenliga med en CLI som alltid returnerar 0.
//
// Kör: node scripts/test-validera-review-utlatande.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { genereraJsonSchema, SCHEMA_VERSION, valideraUtlatande } from './lib/review-utlatande.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATOR_SCRIPT = join(REPO, 'scripts', 'validera-review-utlatande.mjs');
const SCHEMA_FILE = join(REPO, 'docs', 'reference', 'review-utlatande.schema.json');

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

/** En minimal, i övrigt giltig bas — varje test muterar en kopia. */
function basUtlatande(overrides = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kortId: 'TASK-173.1',
    prNummer: 4242,
    granskadSha: 'abc1234',
    runda: 1,
    intentKalla: 'kort',
    intentKonfidens: 'hog',
    acProvning: [],
    fynd: [],
    risk: { niva: 'lag', motivering: 'inga blockerande fynd' },
    ...overrides,
  };
}

function giltigtFynd(overrides = {}) {
  return {
    beskrivning: 'test-fynd',
    severity: 'warning',
    action: 'auto-fix',
    plats: null,
    bevis: [],
    ...overrides,
  };
}

// ── Grundfall: en fullt giltig utlåtande passerar ──────────────────────────

test('en fullt giltig, minimal utlåtande passerar', () => {
  const { ok, errors } = valideraUtlatande(basUtlatande());
  assert.equal(ok, true, `förväntade ok:true, fick fel: ${errors.join('; ')}`);
});

test('en fullt giltig utlåtande MED fynd och AC-prövning passerar', () => {
  const { ok, errors } = valideraUtlatande(
    basUtlatande({
      acProvning: [
        {
          nummer: 1,
          text: 'AC-text verbatim',
          bedomning: 'haller',
          motivering: 'stämmer mot diffen',
        },
      ],
      fynd: [
        giltigtFynd({
          plats: { fil: 'src/foo.tsx', rad: 12 },
          bevis: [
            {
              kommando: 'npm run typecheck',
              utdrag: '0 fel',
              exitkod: 0,
              runIdEllerSha: 'abc1234',
            },
          ],
        }),
      ],
    }),
  );
  assert.equal(ok, true, `förväntade ok:true, fick fel: ${errors.join('; ')}`);
});

// ── AC #2: action är fail-closed — INTE resten av schemat ──────────────────

test('fynd UTAN action-fält normaliseras till ask-user (fail-closed)', () => {
  const fynd = { beskrivning: 'x', severity: 'error', plats: null, bevis: [] };
  const { ok, data } = valideraUtlatande(basUtlatande({ fynd: [fynd] }));
  assert.equal(ok, true);
  assert.equal(data.fynd[0].action, 'ask-user');
});

test('fynd med OGILTIGT action-värde normaliseras till ask-user (fail-closed)', () => {
  const fynd = giltigtFynd({ action: 'approve-utan-att-fraga' });
  const { ok, data } = valideraUtlatande(basUtlatande({ fynd: [fynd] }));
  assert.equal(ok, true);
  assert.equal(data.fynd[0].action, 'ask-user');
});

test('fynd med action=null normaliseras till ask-user (fail-closed)', () => {
  const fynd = giltigtFynd({ action: null });
  const { ok, data } = valideraUtlatande(basUtlatande({ fynd: [fynd] }));
  assert.equal(ok, true);
  assert.equal(data.fynd[0].action, 'ask-user');
});

test('KONTRAST: fynd med GILTIGT action=auto-fix förblir OFÖRÄNDRAT (fail-closed skriver inte över giltiga värden)', () => {
  const fynd = giltigtFynd({ action: 'auto-fix' });
  const { data } = valideraUtlatande(basUtlatande({ fynd: [fynd] }));
  assert.equal(data.fynd[0].action, 'auto-fix');
});

test('KONTRAST: fynd med GILTIGT action=ask-user förblir OFÖRÄNDRAT', () => {
  const fynd = giltigtFynd({ action: 'ask-user' });
  const { data } = valideraUtlatande(basUtlatande({ fynd: [fynd] }));
  assert.equal(data.fynd[0].action, 'ask-user');
});

test('KONTRAST: severity saknas → HELA utlåtandet fälls (severity har INGEN fail-closed-default)', () => {
  const fynd = { beskrivning: 'x', action: 'auto-fix', plats: null, bevis: [] };
  const { ok, errors } = valideraUtlatande(basUtlatande({ fynd: [fynd] }));
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes('severity')),
    `förväntade ett severity-fel, fick: ${errors.join('; ')}`,
  );
});

// ── AC #6: PR utan kort → intentKalla=pr-text KRÄVER intentKonfidens=lag ───

test('PR utan kort: intentKalla=pr-text + intentKonfidens=lag passerar', () => {
  const { ok, errors } = valideraUtlatande(
    basUtlatande({ kortId: null, intentKalla: 'pr-text', intentKonfidens: 'lag' }),
  );
  assert.equal(ok, true, `förväntade ok:true, fick fel: ${errors.join('; ')}`);
});

test('PR utan kort: intentKalla=pr-text MEN intentKonfidens=hog fälls (får aldrig maskera lägre konfidens)', () => {
  const { ok, errors } = valideraUtlatande(
    basUtlatande({ kortId: null, intentKalla: 'pr-text', intentKonfidens: 'hog' }),
  );
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('intentKonfidens')));
});

test('kortId satt kräver intentKalla=kort — pr-text med ett kortId fälls', () => {
  const { ok, errors } = valideraUtlatande(
    basUtlatande({ kortId: 'TASK-1', intentKalla: 'pr-text', intentKonfidens: 'lag' }),
  );
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('intentKalla')));
});

// ── AC #5: kortId=null ↔ ingen AC-prövning ──────────────────────────────────

test('kortId=null MED en ifylld acProvning fälls (inget kort att pröva AC mot)', () => {
  const { ok, errors } = valideraUtlatande(
    basUtlatande({
      kortId: null,
      intentKalla: 'pr-text',
      intentKonfidens: 'lag',
      acProvning: [{ nummer: 1, text: 'x', bedomning: 'haller', motivering: 'y' }],
    }),
  );
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('acProvning')));
});

test('kortId satt MED tom acProvning är TILLÅTET (ett kort kan sakna numrerad AC)', () => {
  const { ok, errors } = valideraUtlatande(basUtlatande({ kortId: 'TASK-173', acProvning: [] }));
  assert.equal(ok, true, `förväntade ok:true, fick fel: ${errors.join('; ')}`);
});

test('fel-ställd AC flaggas via bedomning=felstalld och passerar ändå (AC #5, felflaggning ≠ fällning)', () => {
  const { ok, data } = valideraUtlatande(
    basUtlatande({
      acProvning: [
        {
          nummer: 3,
          text: 'ett AC som pekar på fel radnummer',
          bedomning: 'felstalld',
          motivering: 'raden finns inte',
        },
      ],
    }),
  );
  assert.equal(ok, true);
  assert.equal(data.acProvning[0].bedomning, 'felstalld');
});

// ── Malformering i övrigt: fälls hårt, aldrig tyst tom/partiell ────────────

test('okänt/felstavat fält på rot-nivå fälls (strictObject, inget tyst strip)', () => {
  const { ok } = valideraUtlatande({ ...basUtlatande(), sevirity: 'stavfel' });
  assert.equal(ok, false);
});

test('ogiltig risk.niva fälls', () => {
  const { ok, errors } = valideraUtlatande(
    basUtlatande({ risk: { niva: 'kritisk', motivering: 'x' } }),
  );
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('risk.niva')));
});

test('fel schemaVersion fälls (framtida brytande ändring ska synas, inte tolkas som dagens form)', () => {
  const { ok } = valideraUtlatande(basUtlatande({ schemaVersion: '0.9' }));
  assert.equal(ok, false);
});

test('helt tom input ({}) fälls med flera fel, inte en krasch', () => {
  const { ok, errors } = valideraUtlatande({});
  assert.equal(ok, false);
  assert.ok(errors.length > 3);
});

// ── genereraJsonSchema: portabel artefakt, härledd ur samma källa ──────────

test('genereraJsonSchema() producerar ett objekt med required action-fält + default ask-user', () => {
  const schema = genereraJsonSchema();
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  const fyndSchema = schema.properties.fynd.items;
  assert.equal(fyndSchema.properties.action.default, 'ask-user');
  assert.ok(fyndSchema.properties.action.enum.includes('auto-fix'));
  assert.ok(fyndSchema.properties.action.enum.includes('ask-user'));
});

// ── Drift: den COMMITTADE docs/reference/review-utlatande.schema.json ──────
// får aldrig glida ifrån den härledda källan. Regenereras med
// `npm run review:schema` (scripts/generera-review-schema.mjs) — glöms det
// efter en schemaändring fångar detta test det, i stället för att en
// framtida CI-backstop (173.4) läser en förlegad artefakt utan att veta det.

test('docs/reference/review-utlatande.schema.json matchar genereraJsonSchema() (ingen drift)', () => {
  const committed = JSON.parse(readFileSync(SCHEMA_FILE, 'utf8'));
  assert.deepEqual(
    committed,
    genereraJsonSchema(),
    'Filen är ur synk med scripts/lib/review-utlatande.mjs — kör: npm run review:schema',
  );
});

// ── CLI-nivå (spawnSync): exit-koderna matchar de rena funktionsresultaten ─
// Utan detta lagret bevisar pure-function-testerna ovan bara att LOGIKEN är
// rätt — inte att `main()` faktiskt returnerar/exit:ar med den. En CLI som
// alltid gjorde `process.exit(0)` hade varit förenlig med alla tester ovan.

const tmpDir = mkdtempSync(join(tmpdir(), 'task-173-1-cli-'));

try {
  test('CLI: giltig fil → exit 0 och "OK:" i stdout', () => {
    const filePath = join(tmpDir, 'giltig.json');
    writeFileSync(filePath, JSON.stringify(basUtlatande()));
    const result = spawnSync('node', [VALIDATOR_SCRIPT, filePath], { encoding: 'utf8' });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('OK:'), `stdout: ${result.stdout}`);
  });

  test('CLI: malformad fil (fel risk.niva) → exit 1 och "FEL:" i stderr', () => {
    const filePath = join(tmpDir, 'malformad.json');
    writeFileSync(
      filePath,
      JSON.stringify(basUtlatande({ risk: { niva: 'kritisk', motivering: 'x' } })),
    );
    const result = spawnSync('node', [VALIDATOR_SCRIPT, filePath], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('FEL:'), `stderr: ${result.stderr}`);
  });

  test('CLI: fynd utan action-fält → exit 0 (fail-closed, inte en fällning) med OBS-rad', () => {
    const filePath = join(tmpDir, 'ask-user-normaliserad.json');
    const fynd = { beskrivning: 'x', severity: 'error', plats: null, bevis: [] };
    writeFileSync(filePath, JSON.stringify(basUtlatande({ fynd: [fynd] })));
    const result = spawnSync('node', [VALIDATOR_SCRIPT, filePath], { encoding: 'utf8' });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('ask-user'), `stdout: ${result.stdout}`);
  });

  test('CLI: ogiltig JSON (trasig syntax) → exit 1', () => {
    const filePath = join(tmpDir, 'trasig.json');
    writeFileSync(filePath, '{ inte giltig json');
    const result = spawnSync('node', [VALIDATOR_SCRIPT, filePath], { encoding: 'utf8' });
    assert.equal(result.status, 1);
  });

  test('CLI: inget argument → exit 2', () => {
    const result = spawnSync('node', [VALIDATOR_SCRIPT], { encoding: 'utf8' });
    assert.equal(result.status, 2);
  });
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\n${passed} gröna, ${failed} röda.`);
process.exit(failed > 0 ? 1 : 0);
