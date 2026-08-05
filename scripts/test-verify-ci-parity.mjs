#!/usr/bin/env node
// scripts/test-verify-ci-parity.mjs — självtest för scripts/verify-ci-parity.mjs.
//
// Per ADR-039 § lesson→grind (L43): en grind är inte en grind förrän dess
// fyrning bevisas — och för PARITETS-delen specifikt (den mekanism som ska
// fånga när ci.yml/ci-suite.yml driftar ifrån .ci-parity-policy.json) krävs
// TVÅSIDIGT bevis, inte bara att den är grön i dag.
//
// Tre lager:
//   1. RENA FUNKTIONER (T1–T21) — verifieraJobbmangd, verifieraSuiteInput-
//      Invarianter, losUttryck/hittaOhanteradeUttryck, losStegEnv,
//      klassificeraSteg, extraheraGrupp — prövade mot syntetiska fixturer,
//      inte mot det riktiga trädet. Snabbt, deterministiskt.
//   2. LEVANDE REGRESSION (T22–T23) — `--list` mot det RIKTIGA repots
//      ci.yml/ci-suite.yml. Om policyn driftar ifrån verkligheten (ny jobb,
//      ändrad suite-input) fäller detta fallet — det är den egentliga
//      "bevaka att paritets-grinden fortsätter fånga framtida drift"-delen.
//   3. TVÅSIDIGT BEVIS PÅ HELA CLI:T (T24–T27) — en sandlåda med kopior av
//      de tre verkliga filerna (policy + ci.yml + ci-suite.yml + skriptet
//      självt), muterade en och en, för att bevisa att preflighten FAKTISKT
//      stoppar hela körningen (EXIT_PARITY_BROKEN) — inte bara att den pura
//      funktionen returnerar ett fel-objekt ingen läser.
//
// Kör: node scripts/test-verify-ci-parity.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extraheraGrupp,
  hittaOhanteradeUttryck,
  klassificeraSteg,
  losStegEnv,
  losUttryck,
  verifieraJobbmangd,
  verifieraSuiteInputInvarianter,
} from './verify-ci-parity.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// GH Actions-uttryck som LITERALER — enda källan, återanvända nedan via
// konkatenering i stället för att upprepa raw `${{ … }}`-text i varje
// fixtur. Biome läser annars varje sådan sträng som ett misstänkt
// mall-literal-stavfel (lint/suspicious/noTemplateCurlyInString); det är en
// falsk positiv HÄR — strängarna representerar GH Actions-syntax med
// avsikt, inte ett bortglömt template-literal.
// biome-ignore lint/suspicious/noTemplateCurlyInString: literal GH Actions-uttryck, inte ett mall-literal-misstag.
const UTTRYCK_ACCEPTANCE = '${{ inputs.acceptance_selection }}';
// biome-ignore lint/suspicious/noTemplateCurlyInString: literal GH Actions-uttryck, inte ett mall-literal-misstag.
const UTTRYCK_SECRET_FOO = '${{ secrets.FOO }}';
// biome-ignore lint/suspicious/noTemplateCurlyInString: literal GH Actions-uttryck, inte ett mall-literal-misstag.
const UTTRYCK_SECRET_BAR = '${{ secrets.BAR }}';
// biome-ignore lint/suspicious/noTemplateCurlyInString: literal GH Actions-uttryck, inte ett mall-literal-misstag.
const UTTRYCK_SECRET_NYTT = '${{ secrets.NYTT_SECRET }}';

let pass = 0;
let fail = 0;

function report(namn, vantat, faktiskt) {
  const ok = JSON.stringify(vantat) === JSON.stringify(faktiskt);
  if (ok) {
    pass += 1;
    console.log(`  ✅ ${namn}`);
  } else {
    fail += 1;
    console.log(`  ❌ ${namn}`);
    console.log(`     förväntat: ${JSON.stringify(vantat)}`);
    console.log(`     faktiskt:  ${JSON.stringify(faktiskt)}`);
  }
}

/* ── 1. Rena funktioner ──────────────────────────────────────────────── */

console.log('\n▶ verifieraJobbmangd');
{
  const kanda = { a: 'x', b: 'y' };
  report(
    'T1 matchande mängder → 0 fel',
    0,
    verifieraJobbmangd({ jobs: { a: {}, b: {} } }, kanda, 'test.yml').length,
  );
  report(
    'T2 ny jobb i filen, okänd för policyn → 1 fel',
    1,
    verifieraJobbmangd({ jobs: { a: {}, b: {}, c: {} } }, kanda, 'test.yml').length,
  );
  report(
    'T3 policy-post utan motsvarande jobb (stale) → 1 fel',
    1,
    verifieraJobbmangd({ jobs: { a: {} } }, kanda, 'test.yml').length,
  );
  report(
    'T4 tomma jobs → alla policy-poster stale (2 fel)',
    2,
    verifieraJobbmangd({ jobs: {} }, kanda, 'test.yml').length,
  );
}

console.log('\n▶ verifieraSuiteInputInvarianter');
{
  const inv = [{ job: 'suite', input: 'run_staging', mustBeLiteral: false, why: 'x' }];
  report(
    'T5 literal false → 0 fel',
    0,
    verifieraSuiteInputInvarianter({ jobs: { suite: { with: { run_staging: false } } } }, inv)
      .length,
  );
  report(
    'T6 literal true → 1 fel (drift — purge/staging skulle instansieras)',
    1,
    verifieraSuiteInputInvarianter({ jobs: { suite: { with: { run_staging: true } } } }, inv)
      .length,
  );
  report(
    'T7 saknad input → 1 fel (fail-closed, undefined !== false)',
    1,
    verifieraSuiteInputInvarianter({ jobs: { suite: { with: {} } } }, inv).length,
  );
  report(
    'T8 saknat with-block helt → 1 fel',
    1,
    verifieraSuiteInputInvarianter({ jobs: { suite: {} } }, inv).length,
  );
}

console.log('\n▶ losUttryck / hittaOhanteradeUttryck');
{
  const sub = { [UTTRYCK_ACCEPTANCE]: '' };
  report(
    'T9 känt uttryck substitueras bort helt',
    [],
    hittaOhanteradeUttryck(losUttryck(`X${UTTRYCK_ACCEPTANCE}Y`, sub)),
  );
  report(
    'T10 okänt uttryck överlever substitutionen',
    [UTTRYCK_SECRET_FOO],
    hittaOhanteradeUttryck(losUttryck(`run: ${UTTRYCK_SECRET_FOO}`, sub)),
  );
  report('T11 ingen förekomst → tom lista', [], hittaOhanteradeUttryck('plain text utan uttryck'));
  report(
    'T12 blandat — känt substitueras, okänt kvarstår',
    [UTTRYCK_SECRET_BAR],
    hittaOhanteradeUttryck(losUttryck(`${UTTRYCK_ACCEPTANCE} ${UTTRYCK_SECRET_BAR}`, sub)),
  );
}

console.log('\n▶ losStegEnv');
{
  const sub = { [UTTRYCK_ACCEPTANCE]: '' };
  report(
    'T13 känt env-uttryck → resolved env, 0 ohanterade',
    { env: { ACCEPTANCE_URVAL: '' }, ohanterade: [] },
    losStegEnv({ env: { ACCEPTANCE_URVAL: UTTRYCK_ACCEPTANCE } }, sub),
  );
  report(
    'T14 okänt env-uttryck (t.ex. ett nytt secret) → 1 ohanterad rad',
    1,
    losStegEnv({ env: { TOKEN: UTTRYCK_SECRET_NYTT } }, sub).ohanterade.length,
  );
  report('T15 inget env-block → tomt resultat', { env: {}, ohanterade: [] }, losStegEnv({}, sub));
}

console.log('\n▶ klassificeraSteg');
{
  const policy = {
    stepClassification: { infra: ['Checkout'], coveredByCheckDocs: ['X'] },
    specialSteps: { 'Install shellcheck (pinned v0.11.0)': {} },
  };
  report('T16 infra-namn → infra (hoppas)', 'infra', klassificeraSteg('Checkout', policy));
  report(
    'T17 covered-namn → covered (check:docs har redan kört den)',
    'covered',
    klassificeraSteg('X', policy),
  );
  report(
    'T18 special-namn → special (version-assert/hybrid)',
    'special',
    klassificeraSteg('Install shellcheck (pinned v0.11.0)', policy),
  );
  report(
    'T19 OKÄNT namn → derive (default är KÖR, inte hoppa — nya CI-steg täcks automatiskt)',
    'derive',
    klassificeraSteg('Ett splitter nytt CI-steg som inte fanns i går', policy),
  );
}

console.log('\n▶ extraheraGrupp');
{
  const fel1 = [];
  report(
    'T20 matchande regex → extraherad grupp, inget fel bokfört',
    '0.11.0',
    extraheraGrupp('SC_VERSION="v0.11.0"', 'SC_VERSION="v?([0-9.]+)"', fel1),
  );
  report('T20b inga fel vid lyckad extraktion', 0, fel1.length);
  const fel2 = [];
  report(
    'T21 ingen träff → null + fel bokfört (steget har ändrat form)',
    null,
    extraheraGrupp('inget att hitta här', 'SC_VERSION="v?([0-9.]+)"', fel2),
  );
  report('T21b exakt 1 fel vid utebliven träff', 1, fel2.length);
}

/* ── 2. Levande regression mot det riktiga repot ────────────────────── */

console.log('\n▶ Integration — --list mot det RIKTIGA repots ci.yml/ci-suite.yml');
{
  const res = spawnSync('node', ['scripts/verify-ci-parity.mjs', '--list'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  report(
    'T22 --list mot verkliga workflow-filerna → exit 0 (policyn matchar verkligheten just nu)',
    0,
    res.status,
  );
  report(
    'T23 preflight-OK-raden skrevs ut',
    true,
    res.stdout.includes(
      'Paritets-preflight: jobbmängden + suite-input-invarianterna matchar policyn',
    ),
  );
}

/* ── 3. Tvåsidigt bevis på hela CLI:t — muterad sandlåda ────────────── */
//
// Sandlådan är en KOPIA av de tre relevanta filerna (aldrig det riktiga
// trädet): .ci-parity-policy.json, ci.yml, ci-suite.yml och skriptet självt.
// node_modules symlänkas (aldrig kopieras — samma disciplin som repots
// övriga sandlåde-testsviter). Skriptet härleder REPO ur sin EGEN plats
// (import.meta.url), så att köra kopian ur sandlådan bevisar att
// preflighten stoppar HELA CLI:t — inte bara att en pur funktion returnerar
// ett fel-objekt.

function byggSandlada() {
  const dir = mkdtempSync(join(os.tmpdir(), 'test-verify-ci-parity-'));
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  cpSync(
    join(REPO, 'scripts', 'verify-ci-parity.mjs'),
    join(dir, 'scripts', 'verify-ci-parity.mjs'),
  );
  cpSync(join(REPO, '.ci-parity-policy.json'), join(dir, '.ci-parity-policy.json'));
  cpSync(join(REPO, '.github', 'workflows', 'ci.yml'), join(dir, '.github', 'workflows', 'ci.yml'));
  cpSync(
    join(REPO, '.github', 'workflows', 'ci-suite.yml'),
    join(dir, '.github', 'workflows', 'ci-suite.yml'),
  );
  symlinkSync(join(REPO, 'node_modules'), join(dir, 'node_modules'));
  return dir;
}

function korSandlada(dir) {
  return spawnSync('node', ['scripts/verify-ci-parity.mjs', '--list'], {
    cwd: dir,
    encoding: 'utf8',
  });
}

console.log('\n▶ Tvåsidigt bevis — CLI:t stoppar (EXIT_PARITY_BROKEN) på trasig paritet');
{
  // G1 — oförändrad kopia: grönt (bevisar sandlådan i sig är korrekt riggad,
  // annars vore röd-fallen nedan förenliga med en trasig sandlåda snarare
  // än med den mekanism som faktiskt prövas).
  const g1dir = byggSandlada();
  try {
    const res = korSandlada(g1dir);
    report('G1 oförändrad sandlåda → exit 0', 0, res.status);
  } finally {
    rmSync(g1dir, { recursive: true, force: true });
  }

  // R1 — en HELT NY jobb tillagd i ci.yml, okänd för policyn.
  const r1dir = byggSandlada();
  try {
    const ciPath = join(r1dir, '.github', 'workflows', 'ci.yml');
    const original = readFileSync(ciPath, 'utf-8');
    assert.ok(
      original.includes('\njobs:\n'),
      'fixturen förväntas ha en jobs:-rad att mutera efter',
    );
    const muterad = original.replace(
      '\njobs:\n',
      '\njobs:\n  ett-splitter-nytt-jobb-ingen-kanner-till:\n    runs-on: ubuntu-latest\n    steps: []\n',
    );
    assert.notEqual(muterad, original, 'mutationen måste faktiskt ha ändrat filen');
    writeFileSync(ciPath, muterad);
    const res = korSandlada(r1dir);
    report('R1 ny okänd jobb i ci.yml → exit 2 (EXIT_PARITY_BROKEN)', 2, res.status);
    report(
      'R1b felmeddelandet nämner den nya jobben',
      true,
      res.stderr.includes('ett-splitter-nytt-jobb-ingen-kanner-till'),
    );
  } finally {
    rmSync(r1dir, { recursive: true, force: true });
  }

  // R2 — run_staging vrids från literalt false till true (skulle tysta
  // staging/purge-uteslutningen om den inte fångades).
  const r2dir = byggSandlada();
  try {
    const ciPath = join(r2dir, '.github', 'workflows', 'ci.yml');
    const original = readFileSync(ciPath, 'utf-8');
    assert.ok(
      /^ {6}run_staging: false$/m.test(original),
      'fixturen förväntas bära den exakta with-raden',
    );
    const muterad = original.replace(/^ {6}run_staging: false$/m, '      run_staging: true');
    assert.notEqual(muterad, original, 'mutationen måste faktiskt ha ändrat filen');
    writeFileSync(ciPath, muterad);
    const res = korSandlada(r2dir);
    report('R2 run_staging vridet till true → exit 2 (EXIT_PARITY_BROKEN)', 2, res.status);
    report('R2b felmeddelandet nämner run_staging', true, res.stderr.includes('run_staging'));
  } finally {
    rmSync(r2dir, { recursive: true, force: true });
  }

  // R3 — en jobb TAS BORT ur ci-suite.yml (policyn blir stale på den posten).
  const r3dir = byggSandlada();
  try {
    const ciSuitePath = join(r3dir, '.github', 'workflows', 'ci-suite.yml');
    const original = readFileSync(ciSuitePath, 'utf-8');
    assert.ok(
      original.includes('\n  webblasarbeteende:\n'),
      'fixturen förväntas ha jobbet att ta bort',
    );
    // Ta bort jobbet genom att klippa från dess rubrik till nästa jobb-rubrik
    // på samma indent-nivå ("  a11y:").
    const start = original.indexOf('\n  webblasarbeteende:\n');
    const slut = original.indexOf('\n  a11y:\n', start);
    assert.ok(
      start !== -1 && slut !== -1 && slut > start,
      'fixturens jobb-gränser hittades inte — spegla om testet mot filens faktiska form',
    );
    const muterad = original.slice(0, start) + original.slice(slut);
    assert.notEqual(muterad, original, 'mutationen måste faktiskt ha ändrat filen');
    writeFileSync(ciSuitePath, muterad);
    const res = korSandlada(r3dir);
    report('R3 jobb borttaget ur ci-suite.yml → exit 2 (EXIT_PARITY_BROKEN)', 2, res.status);
    report(
      'R3b felmeddelandet nämner det borttagna jobbet',
      true,
      res.stderr.includes('webblasarbeteende'),
    );
  } finally {
    rmSync(r3dir, { recursive: true, force: true });
  }
}

/* ── Sammanfattning ──────────────────────────────────────────────────── */

console.log(`\n${pass} gröna, ${fail} röda.`);
process.exit(fail > 0 ? 1 : 0);
