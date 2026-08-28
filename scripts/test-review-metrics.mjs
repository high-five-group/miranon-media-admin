#!/usr/bin/env node
// scripts/test-review-metrics.mjs — tester för review-grindens instrumentering
// (TASK-173.6: scripts/lib/review-metrics.mjs, scripts/review-metrics.mjs,
// scripts/review-metrics-kalibrering.mjs, samt append-tillägget i
// scripts/review-loop-beslut.mjs).
//
// Samma konvention som scripts/test-review-loop.mjs och sina syskon: rena
// funktioner importeras direkt (sektion A–F), CLI-lagren prövas via
// spawnSync (sektion G–I).
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT ═══
//   - C4/C5/C6: en trasig rad hamnar i `fel` OCH stoppar aldrig parsningen
//     av grannraderna (kontrast: giltig rad FÖRE och EFTER den trasiga).
//   - D5: grindMissPerNiva skiljer "0 körningar → rate null" från
//     "körningar finns, ingen kalibrering → rate 0" — en ren delning-med-noll
//     hade gett NaN/0 utan åtskillnad.
//   - I1 vs I2/I3: ett LYCKAT beslut loggar en rad, ett MALFORMAT utlåtande
//     eller POLICYFEL loggar ingen — samma fil, båda utfallen provade.
//   - I4: två lyckade körningar appendar TVÅ rader (inte skriver över).
//
// ═══ VARFÖR TEST-REVIEW-LOOP.MJS FICK EN MEKANISK JUSTERING, INTE EN TESTNY ═══
// review-loop-beslut.mjs:s ~19 sektion E-CLI-anrop körs direkt mot DETTA
// repo (`cwd: REPO`). Utan --metrik-fil hade var och en av dem skrivit en
// rad i repots RIKTIGA docs/reference/review-instrumentering.jsonl vid
// varje testkörning — instrumenteringens EGET beteende (den här filen)
// testar det, section E:s ~103 fall testar loop-BESLUTET och ska förbli
// opåverkade av att en ny bokföringsyta finns.
//
// Kör: node scripts/test-review-metrics.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beslutaNastaSteg, LOOP_POLICY_VERSION, parsaLoopPolicy } from './lib/review-loop.mjs';
import {
  byggKalibreringRad,
  byggKorningRad,
  METRIK_LOGG_FIL,
  METRIK_LOGG_VERSION,
  parsaLoggRader,
  renderaSummeringMarkdown,
  summera,
} from './lib/review-metrics.mjs';
import { metrikFilFor } from './review-loop-beslut.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI_METRICS = join(REPO, 'scripts', 'review-metrics.mjs');
const CLI_KALIBRERING = join(REPO, 'scripts', 'review-metrics-kalibrering.mjs');
const CLI_LOOP = join(REPO, 'scripts', 'review-loop-beslut.mjs');

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

const tmp = mkdtempSync(join(tmpdir(), 'test-review-metrics-'));

/* ─────────────────────────  Fixturer (spegel av test-review-loop.mjs)  ───────────────────────── */

function fynd(severity, action, overrides = {}) {
  return {
    beskrivning: `fynd ${severity}/${action}`,
    severity,
    action,
    plats: null,
    bevis: [],
    ...overrides,
  };
}

function utlatande(overrides = {}) {
  return {
    schemaVersion: '1.0',
    kortId: null,
    prNummer: 1234,
    granskadSha: 'abc1234',
    runda: 1,
    intentKalla: 'pr-text',
    intentKonfidens: 'lag',
    acProvning: [],
    fynd: [],
    risk: { niva: 'lag', motivering: 'Inget att invanda.' },
    policySha: null,
    policyRegler: [],
    ...overrides,
  };
}

/** RÅ policy — kan medvetet göras OGILTIG (t.ex. I3:s `version: 99`). Skriv
 * denna till disk när testet vill prova ett policyfel; validera aldrig här. */
function policy(overrides = {}) {
  return {
    version: LOOP_POLICY_VERSION,
    tak: 2,
    blockeringstroskel: ['warning', 'error'],
    eskaleraVidRisk: ['hog'],
    eskaleraVidAction: ['ask-user'],
    granskaDiffSedanForegaendeRunda: true,
    ...overrides,
  };
}

/** En GARANTERAT giltig policy — kraschar testet tidigt om fixturen själv
 * driftar från schemat, i stället för att låta ett orelaterat test rödfärgas. */
function giltigPolicy(overrides = {}) {
  const { ok, policy: p, errors } = parsaLoopPolicy(policy(overrides));
  assert.ok(ok, `fixtur-policyn validerar inte: ${errors?.join('; ')}`);
  return p;
}

function beslut(uOverrides = {}, pOverrides = {}) {
  return beslutaNastaSteg({
    utlatande: utlatande(uOverrides),
    policy: giltigPolicy(pOverrides),
    foregaendeSha: null,
  });
}

const T0 = '2026-08-28T10:00:00.000Z';

/* ════════════════════════════════════════════════════════════════════
   A. byggKorningRad — ren funktion
   ════════════════════════════════════════════════════════════════════ */
console.log('\nA. byggKorningRad\n');

test('A1 giltig utlåtande+beslut → ok:true med korrekt genererade fält', () => {
  const u = utlatande({ prNummer: 42, kortId: 'TASK-1', fynd: [fynd('error', 'auto-fix')] });
  const b = beslutaNastaSteg({ utlatande: u, policy: policy(), foregaendeSha: null });
  const r = byggKorningRad({ utlatande: u, beslut: b, tidsstampel: T0 });
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.equal(r.data.typ, 'korning');
  assert.equal(r.data.loggVersion, METRIK_LOGG_VERSION);
  assert.equal(r.data.prNummer, 42);
  assert.equal(r.data.kortId, 'TASK-1');
  assert.equal(r.data.granskadSha, 'abc1234');
  assert.equal(r.data.runda, 1);
  assert.equal(r.data.beslut, b.beslut);
  assert.equal(r.data.armeringTillaten, b.armeringTillaten);
  assert.deepEqual(r.data.risk, { niva: 'lag', motivering: 'Inget att invanda.' });
  assert.equal(r.data.blockerandeAntal, b.blockerande.length);
  assert.equal(r.data.oppnaAntal, b.oppna.length);
  assert.equal(r.data.tillByggAntal, b.tillBygg.length);
  assert.equal(r.data.tillMarcusAntal, b.tillMarcus.length);
  assert.equal(r.data.policySha, null);
  assert.equal(r.data.policyRegelAntal, 0);
});

test('A2 fyndPerSeverity räknar VARJE severity oberoende av action/klassning', () => {
  const u = utlatande({
    fynd: [
      fynd('error', 'auto-fix'),
      fynd('error', 'ask-user'),
      fynd('warning', 'auto-fix'),
      fynd('info', 'auto-fix'),
    ],
  });
  const r = byggKorningRad({ utlatande: u, beslut: beslut({ fynd: u.fynd }), tidsstampel: T0 });
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.deepEqual(r.data.fyndPerSeverity, { error: 2, warning: 1, info: 1 });
});

test('A3 policySha + policyRegler → policyRegelAntal speglar LÄNGDEN, inte ett bokat värde', () => {
  const regel = {
    id: 'r1',
    scope: { monster: ['src/**'], matchadeFiler: ['src/x.ts'] },
    kalla: 'ADR-1',
  };
  const u = utlatande({ policySha: 'deadbee', policyRegler: [regel] });
  const r = byggKorningRad({
    utlatande: u,
    beslut: beslut({ policySha: 'deadbee', policyRegler: [regel] }),
    tidsstampel: T0,
  });
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.equal(r.data.policySha, 'deadbee');
  assert.equal(r.data.policyRegelAntal, 1);
});

test('A4 tidsstampel ekar EXAKT vad anroparen gav (ingen egen klocka läses)', () => {
  const r = byggKorningRad({ utlatande: utlatande(), beslut: beslut(), tidsstampel: T0 });
  assert.equal(r.data.tidsstampel, T0);
});

test('A5 KONTRAST: ogiltig tidsstampel (inte ISO 8601) → ok:false', () => {
  const r = byggKorningRad({ utlatande: utlatande(), beslut: beslut(), tidsstampel: 'igår' });
  assert.equal(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.includes('tidsstampel')),
    r.errors.join('; '),
  );
});

/* ════════════════════════════════════════════════════════════════════
   B. byggKalibreringRad — ren funktion
   ════════════════════════════════════════════════════════════════════ */
console.log('\nB. byggKalibreringRad\n');

test('B1 giltig fullständig post → ok:true', () => {
  const r = byggKalibreringRad({
    prNummer: 99,
    kortId: 'TASK-2',
    stampladRisk: 'lag',
    fangst: 'Marcus hittade en race condition granskaren missade.',
    kalla: 'Marcus Johansson',
    tidsstampel: T0,
  });
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.equal(r.data.typ, 'kalibrering');
  assert.equal(r.data.prNummer, 99);
  assert.equal(r.data.stampladRisk, 'lag');
});

test('B2 KONTRAST tom fangst → ok:false', () => {
  const r = byggKalibreringRad({ prNummer: 1, fangst: '', kalla: 'X', tidsstampel: T0 });
  assert.equal(r.ok, false);
});

test('B3 KONTRAST tom kalla → ok:false', () => {
  const r = byggKalibreringRad({ prNummer: 1, fangst: 'x', kalla: '', tidsstampel: T0 });
  assert.equal(r.ok, false);
});

test('B4 stampladRisk null (ingen körning föregick — D0-fallet) är GILTIGT', () => {
  const r = byggKalibreringRad({
    prNummer: 1,
    fangst: 'D0-undantagen PR hade ändå en bugg.',
    kalla: 'X',
    tidsstampel: T0,
  });
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.equal(r.data.stampladRisk, null);
  assert.equal(r.data.kortId, null, 'kortId defaultar till null när den utelämnas');
});

test('B5 KONTRAST ogiltig stampladRisk-enum → ok:false', () => {
  const r = byggKalibreringRad({
    prNummer: 1,
    stampladRisk: 'kritisk',
    fangst: 'x',
    kalla: 'X',
    tidsstampel: T0,
  });
  assert.equal(r.ok, false);
});

test('B6 KONTRAST prNummer <= 0 → ok:false', () => {
  const r = byggKalibreringRad({ prNummer: 0, fangst: 'x', kalla: 'X', tidsstampel: T0 });
  assert.equal(r.ok, false);
});

/* ════════════════════════════════════════════════════════════════════
   C. parsaLoggRader — fail-soft: en trasig rad stoppar aldrig resten
   ════════════════════════════════════════════════════════════════════ */
console.log('\nC. parsaLoggRader\n');

function rad(overrides = {}) {
  return JSON.stringify({
    typ: 'korning',
    loggVersion: METRIK_LOGG_VERSION,
    tidsstampel: T0,
    prNummer: 1,
    kortId: null,
    granskadSha: 'abc1234',
    runda: 1,
    beslut: 'konvergerad',
    armeringTillaten: true,
    risk: { niva: 'lag', motivering: 'x' },
    fyndPerSeverity: { error: 0, warning: 0, info: 0 },
    blockerandeAntal: 0,
    oppnaAntal: 0,
    tillByggAntal: 0,
    tillMarcusAntal: 0,
    policySha: null,
    policyRegelAntal: 0,
    ...overrides,
  });
}

test('C1 tom text → inga rader, inga fel', () => {
  const { rader, fel } = parsaLoggRader('');
  assert.deepEqual(rader, []);
  assert.deepEqual(fel, []);
});

test('C2 en korning-rad + en kalibrering-rad, i ordning', () => {
  const kal = JSON.stringify({
    typ: 'kalibrering',
    loggVersion: METRIK_LOGG_VERSION,
    tidsstampel: T0,
    prNummer: 2,
    kortId: null,
    stampladRisk: null,
    fangst: 'x',
    kalla: 'Y',
  });
  const { rader, fel } = parsaLoggRader(`${rad()}\n${kal}\n`);
  assert.equal(fel.length, 0);
  assert.equal(rader.length, 2);
  assert.equal(rader[0].typ, 'korning');
  assert.equal(rader[1].typ, 'kalibrering');
});

test('C3 tomma rader (trailing newline, blankrad) hoppas tyst över', () => {
  const { rader, fel } = parsaLoggRader(`${rad()}\n\n\n`);
  assert.equal(rader.length, 1);
  assert.equal(fel.length, 0);
});

test('C4 KONTRAST: en trasig JSON-rad MELLAN två giltiga stoppar INTE parsningen', () => {
  const { rader, fel } = parsaLoggRader(
    `${rad({ prNummer: 1 })}\n{ inte json\n${rad({ prNummer: 2 })}\n`,
  );
  assert.equal(rader.length, 2, 'båda giltiga raderna ska ha parsats trots den trasiga mellan dem');
  assert.equal(rader[0].prNummer, 1);
  assert.equal(rader[1].prNummer, 2);
  assert.equal(fel.length, 1);
  assert.equal(fel[0].radnummer, 2, 'radnumret ska peka på den TRASIGA raden (1-baserat)');
  assert.match(fel[0].meddelande, /ogiltig JSON/);
});

test('C5 KONTRAST: okänd typ (varken korning eller kalibrering) → fel, resten opåverkat', () => {
  const okand = JSON.stringify({ typ: 'okänd', x: 1 });
  const { rader, fel } = parsaLoggRader(`${rad()}\n${okand}\n`);
  assert.equal(rader.length, 1);
  assert.equal(fel.length, 1);
});

test('C6 KONTRAST: saknat obligatoriskt fält (prNummer) → fel med fältnamn', () => {
  const trasig = JSON.parse(rad());
  delete trasig.prNummer;
  const { rader, fel } = parsaLoggRader(JSON.stringify(trasig));
  assert.equal(rader.length, 0);
  assert.equal(fel.length, 1);
  assert.match(fel[0].meddelande, /prNummer/);
});

/* ════════════════════════════════════════════════════════════════════
   D. summera — findings-per-runda, risk-/beslutsfördelning, grind-miss-rate
   ════════════════════════════════════════════════════════════════════ */
console.log('\nD. summera\n');

function korningsrad(overrides = {}) {
  return {
    typ: 'korning',
    loggVersion: METRIK_LOGG_VERSION,
    tidsstampel: T0,
    prNummer: 1,
    kortId: null,
    granskadSha: 'abc1234',
    runda: 1,
    beslut: 'konvergerad',
    armeringTillaten: true,
    risk: { niva: 'lag', motivering: 'x' },
    fyndPerSeverity: { error: 0, warning: 0, info: 0 },
    blockerandeAntal: 0,
    oppnaAntal: 0,
    tillByggAntal: 0,
    tillMarcusAntal: 0,
    policySha: null,
    policyRegelAntal: 0,
    ...overrides,
  };
}

function kalibreringsrad(overrides = {}) {
  return {
    typ: 'kalibrering',
    loggVersion: METRIK_LOGG_VERSION,
    tidsstampel: T0,
    prNummer: 1,
    kortId: null,
    stampladRisk: null,
    fangst: 'x',
    kalla: 'Y',
    ...overrides,
  };
}

test('D1 tom lista → nollställd summering, INGEN krasch', () => {
  const s = summera([]);
  assert.equal(s.totalKorningar, 0);
  assert.equal(s.totalKalibreringar, 0);
  assert.deepEqual(s.perRunda, []);
  assert.deepEqual(s.riskFordelning, { lag: 0, medel: 0, hog: 0 });
  for (const niva of ['lag', 'medel', 'hog']) {
    assert.deepEqual(s.grindMissPerNiva[niva], { korningar: 0, kalibreringar: 0, rate: null });
  }
});

test('D2 findings-per-runda aggregerar RÄTT runda, inte alla ihop', () => {
  const s = summera([
    korningsrad({ runda: 1, fyndPerSeverity: { error: 1, warning: 0, info: 0 } }),
    korningsrad({ runda: 1, fyndPerSeverity: { error: 0, warning: 2, info: 0 } }),
    korningsrad({ runda: 2, fyndPerSeverity: { error: 0, warning: 0, info: 5 } }),
  ]);
  const r1 = s.perRunda.find((p) => p.runda === 1);
  const r2 = s.perRunda.find((p) => p.runda === 2);
  assert.equal(r1.antal, 2);
  assert.deepEqual(r1.fyndPerSeverity, { error: 1, warning: 2, info: 0 });
  assert.equal(r2.antal, 1);
  assert.deepEqual(r2.fyndPerSeverity, { error: 0, warning: 0, info: 5 });
});

test('D3 riskFordelning räknar per nivå', () => {
  const s = summera([
    korningsrad({ risk: { niva: 'lag', motivering: 'x' } }),
    korningsrad({ risk: { niva: 'lag', motivering: 'x' } }),
    korningsrad({ risk: { niva: 'hog', motivering: 'x' } }),
  ]);
  assert.deepEqual(s.riskFordelning, { lag: 2, medel: 0, hog: 1 });
});

test('D4 beslutFordelning räknar per beslutstyp', () => {
  const s = summera([
    korningsrad({ beslut: 'konvergerad' }),
    korningsrad({ beslut: 'ny-runda' }),
    korningsrad({ beslut: 'ny-runda' }),
  ]);
  assert.deepEqual(s.beslutFordelning, { konvergerad: 1, 'ny-runda': 2 });
});

test('D5 KONTRAST: rate=null (0 körningar) skiljs från rate=0 (körningar finns, 0 missar)', () => {
  const s = summera([
    korningsrad({ risk: { niva: 'lag', motivering: 'x' } }),
    korningsrad({ risk: { niva: 'lag', motivering: 'x' } }),
    kalibreringsrad({ stampladRisk: 'lag' }),
  ]);
  assert.equal(s.grindMissPerNiva.lag.korningar, 2);
  assert.equal(s.grindMissPerNiva.lag.kalibreringar, 1);
  assert.equal(s.grindMissPerNiva.lag.rate, 0.5);
  assert.equal(s.grindMissPerNiva.medel.korningar, 0, 'inga medel-körningar loggade');
  assert.equal(
    s.grindMissPerNiva.medel.rate,
    null,
    'null, INTE 0 — ingen delning-med-noll-gissning',
  );
});

test('D6 kalibreringarUtanKorning filtrerar ENDAST stampladRisk===null', () => {
  const s = summera([
    kalibreringsrad({ stampladRisk: null, prNummer: 1 }),
    kalibreringsrad({ stampladRisk: 'lag', prNummer: 2 }),
  ]);
  assert.equal(s.kalibreringarUtanKorning.length, 1);
  assert.equal(s.kalibreringarUtanKorning[0].prNummer, 1);
});

/* ════════════════════════════════════════════════════════════════════
   E. renderaSummeringMarkdown — ren rendering
   ════════════════════════════════════════════════════════════════════ */
console.log('\nE. renderaSummeringMarkdown\n');

test('E1 noll data → "ingen körning ännu"-meddelande, INGA tabellrubriker', () => {
  const text = renderaSummeringMarkdown(summera([]), { loggFil: 'x.jsonl', tidsstampel: T0 });
  assert.match(text, /FRÅN OCH MED NU/);
  assert.doesNotMatch(text, /## Findings per runda/);
});

test('E2 med data → alla fyra huvudrubriker finns', () => {
  const s = summera([korningsrad()]);
  const text = renderaSummeringMarkdown(s, { loggFil: 'x.jsonl', tidsstampel: T0 });
  for (const rubrik of [
    '## Findings per runda',
    '## Risknivå-fördelning',
    '## Beslutsfördelning',
    '## Risk-kalibrering',
  ]) {
    assert.match(
      text,
      new RegExp(rubrik.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `saknar "${rubrik}"`,
    );
  }
});

test('E3 KONTRAST: D0-sektionen finns ENDAST när kalibreringarUtanKorning är icke-tom', () => {
  const med = renderaSummeringMarkdown(
    summera([korningsrad(), kalibreringsrad({ stampladRisk: null })]),
    {
      loggFil: 'x',
      tidsstampel: T0,
    },
  );
  const utan = renderaSummeringMarkdown(summera([korningsrad()]), {
    loggFil: 'x',
    tidsstampel: T0,
  });
  assert.match(med, /D0-undantagets omprövning/);
  assert.doesNotMatch(utan, /D0-undantagets omprövning/);
});

test('E4 pipe-tecken i fangst ESCAPAS (bryter annars markdown-tabellraden)', () => {
  const s = summera([korningsrad(), kalibreringsrad({ fangst: 'X hittade | ett rör-fel' })]);
  const text = renderaSummeringMarkdown(s, { loggFil: 'x', tidsstampel: T0 });
  assert.match(text, /X hittade \\\| ett rör-fel/, 'pipe-tecknet ska vara escapat med \\|');
});

test('E5 felAntal > 0 → varningsraden nämner antalet exkluderade rader', () => {
  const text = renderaSummeringMarkdown(summera([korningsrad()]), {
    loggFil: 'x',
    tidsstampel: T0,
    felAntal: 3,
  });
  assert.match(text, /3 rad\(er\)/);
});

/* ════════════════════════════════════════════════════════════════════
   F. metrikFilFor — resolution, ren funktion (review-loop-beslut.mjs)
   ════════════════════════════════════════════════════════════════════ */
console.log('\nF. metrikFilFor\n');

test('F1 override given → returneras VERBATIM', () => {
  assert.equal(metrikFilFor('/repo', '/annan/plats.jsonl'), '/annan/plats.jsonl');
});

test('F2 ingen override → resolve(repo, METRIK_LOGG_FIL)', () => {
  assert.equal(metrikFilFor('/repo', null), resolve('/repo', METRIK_LOGG_FIL));
});

/* ════════════════════════════════════════════════════════════════════
   G. CLI — scripts/review-metrics.mjs
   ════════════════════════════════════════════════════════════════════ */
console.log('\nG. CLI review-metrics.mjs\n');

function korMetrics(args) {
  return spawnSync('node', [CLI_METRICS, ...args], { encoding: 'utf8' });
}

test('G1 saknad loggfil → exit 0, "ingen data"-meddelande', () => {
  const r = korMetrics(['--fil', join(tmp, 'finns-inte.jsonl')]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /FRÅN OCH MED NU/);
});

test('G2 fixturfil med två körningar + en kalibrering → korrekta totaler', () => {
  const p = join(tmp, 'g2.jsonl');
  writeFileSync(p, `${rad({ prNummer: 1 })}\n${rad({ prNummer: 2, runda: 2 })}\n`);
  const r = korMetrics(['--fil', p]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Totalt \*\*2\*\* granskningskörningar/);
});

test('G3 --json ger parsbar, korrekt sammanfattning', () => {
  const p = join(tmp, 'g3.jsonl');
  writeFileSync(p, `${rad()}\n`);
  const r = korMetrics(['--fil', p, '--json']);
  assert.equal(r.status, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.equal(data.sammanfattning.totalKorningar, 1);
});

test('G4 KONTRAST: en trasig rad hindrar INTE summeringen av de giltiga', () => {
  const p = join(tmp, 'g4.jsonl');
  writeFileSync(p, `${rad()}\n{ trasig\n`);
  const r = korMetrics(['--fil', p]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /1 rad\(er\)/);
  assert.match(r.stdout, /Totalt \*\*1\*\*/);
});

test('G5 okänt argument → exit 2', () => {
  assert.equal(korMetrics(['--nope']).status, 2);
});

test('G6 --fil utan värde → exit 2', () => {
  assert.equal(korMetrics(['--fil']).status, 2);
});

/* ════════════════════════════════════════════════════════════════════
   H. CLI — scripts/review-metrics-kalibrering.mjs
   ════════════════════════════════════════════════════════════════════ */
console.log('\nH. CLI review-metrics-kalibrering.mjs\n');

function korKalibrering(args) {
  return spawnSync('node', [CLI_KALIBRERING, ...args], { encoding: 'utf8' });
}

test('H1 saknad --pr → exit 1', () => {
  const r = korKalibrering(['--fangst', 'x', '--fil', join(tmp, 'h1.jsonl')]);
  assert.equal(r.status, 1);
});

test('H2 saknad --fangst → exit 1', () => {
  const r = korKalibrering(['--pr', '10', '--fil', join(tmp, 'h2.jsonl')]);
  assert.equal(r.status, 1);
});

test('H3 minimal giltig ({--pr, --fangst}) → exit 0, en rad skrivs, kalla defaultar icke-tomt', () => {
  const p = join(tmp, 'h3.jsonl');
  const r = korKalibrering(['--pr', '10', '--fangst', 'Marcus fångade X', '--fil', p]);
  assert.equal(r.status, 0, r.stderr);
  const { rader, fel } = parsaLoggRader(readFileSync(p, 'utf8'));
  assert.equal(fel.length, 0);
  assert.equal(rader.length, 1);
  assert.equal(rader[0].typ, 'kalibrering');
  assert.equal(rader[0].prNummer, 10);
  assert.equal(rader[0].stampladRisk, null);
  assert.ok(rader[0].kalla.length > 0);
});

test('H4 --kort/--risk/--kalla speglas i den skrivna raden', () => {
  const p = join(tmp, 'h4.jsonl');
  const r = korKalibrering([
    '--pr',
    '11',
    '--fangst',
    'x',
    '--kort',
    'TASK-9',
    '--risk',
    'lag',
    '--kalla',
    'Test Person',
    '--fil',
    p,
  ]);
  assert.equal(r.status, 0, r.stderr);
  const { rader } = parsaLoggRader(readFileSync(p, 'utf8'));
  assert.equal(rader[0].kortId, 'TASK-9');
  assert.equal(rader[0].stampladRisk, 'lag');
  assert.equal(rader[0].kalla, 'Test Person');
});

test('H5 ogiltigt --risk-värde → exit 2', () => {
  const r = korKalibrering([
    '--pr',
    '12',
    '--fangst',
    'x',
    '--risk',
    'kritisk',
    '--fil',
    join(tmp, 'h5.jsonl'),
  ]);
  assert.equal(r.status, 2);
});

test('H6 --pr icke-numeriskt → exit 2', () => {
  const r = korKalibrering(['--pr', 'abc', '--fangst', 'x', '--fil', join(tmp, 'h6.jsonl')]);
  assert.equal(r.status, 2);
});

test('H7 KONTRAST: två anrop APPENDAR, skriver aldrig över', () => {
  const p = join(tmp, 'h7.jsonl');
  korKalibrering(['--pr', '1', '--fangst', 'första', '--fil', p]);
  korKalibrering(['--pr', '2', '--fangst', 'andra', '--fil', p]);
  const { rader, fel } = parsaLoggRader(readFileSync(p, 'utf8'));
  assert.equal(fel.length, 0);
  assert.equal(rader.length, 2);
  assert.equal(rader[0].prNummer, 1);
  assert.equal(rader[1].prNummer, 2);
});

test('H8 okänt argument → exit 2', () => {
  assert.equal(korKalibrering(['--pr', '1', '--fangst', 'x', '--wat']).status, 2);
});

/* ════════════════════════════════════════════════════════════════════
   I. CLI — review-loop-beslut.mjs:s append-tillägg (TASK-173.6)
   ════════════════════════════════════════════════════════════════════ */
console.log('\nI. CLI review-loop-beslut.mjs — instrumenterings-append\n');

const LOKAL_POLICY = join(tmp, 'loop-policy.json');
writeFileSync(LOKAL_POLICY, JSON.stringify(policy()));

function skrivUtlatandeFil(namn, overrides = {}) {
  const p = join(tmp, namn);
  writeFileSync(p, JSON.stringify(utlatande(overrides)));
  return p;
}

function korLoop(args) {
  return spawnSync('node', [CLI_LOOP, ...args], { cwd: REPO, encoding: 'utf8' });
}

test('I1 LYCKAT beslut → exakt EN rad appendas, giltig KorningRad', () => {
  const metrikP = join(tmp, 'i1.jsonl');
  const u = skrivUtlatandeFil('i1.json', { prNummer: 555 });
  const r = korLoop([u, '--policy-fil', LOKAL_POLICY, '--metrik-fil', metrikP]);
  assert.equal(r.status, 0, r.stderr);
  const { rader, fel } = parsaLoggRader(readFileSync(metrikP, 'utf8'));
  assert.equal(fel.length, 0);
  assert.equal(rader.length, 1);
  assert.equal(rader[0].typ, 'korning');
  assert.equal(rader[0].prNummer, 555);
  assert.equal(rader[0].beslut, 'konvergerad');
});

test('I2 KONTRAST: MALFORMAT utlåtande (exit 1) → INGET loggas', () => {
  const metrikP = join(tmp, 'i2.jsonl');
  const trasig = join(tmp, 'i2-trasig.json');
  writeFileSync(trasig, '{ inte json');
  const r = korLoop([trasig, '--policy-fil', LOKAL_POLICY, '--metrik-fil', metrikP]);
  assert.equal(r.status, 1);
  assert.equal(existsSync(metrikP), false, 'ingen fil ska skapas när inget beslut fattades');
});

test('I3 KONTRAST: POLICYFEL (exit 64) → INGET loggas', () => {
  const metrikP = join(tmp, 'i3.jsonl');
  const daligPolicy = join(tmp, 'i3-dalig-policy.json');
  writeFileSync(daligPolicy, JSON.stringify(policy({ version: 99 })));
  const u = skrivUtlatandeFil('i3.json');
  const r = korLoop([u, '--policy-fil', daligPolicy, '--metrik-fil', metrikP]);
  assert.equal(r.status, 64, r.stderr);
  assert.equal(existsSync(metrikP), false);
});

test('I4 TVÅ lyckade körningar → TVÅ rader (append, aldrig skriv-över)', () => {
  const metrikP = join(tmp, 'i4.jsonl');
  const u1 = skrivUtlatandeFil('i4-r1.json', { runda: 1, fynd: [fynd('error', 'auto-fix')] });
  const r1 = korLoop([u1, '--policy-fil', LOKAL_POLICY, '--metrik-fil', metrikP]);
  assert.equal(r1.status, 10, r1.stderr);
  const u2 = skrivUtlatandeFil('i4-r2.json', { runda: 2, granskadSha: 'def5678' });
  const r2 = korLoop([u2, '--policy-fil', LOKAL_POLICY, '--metrik-fil', metrikP]);
  assert.equal(r2.status, 0, r2.stderr);
  const { rader, fel } = parsaLoggRader(readFileSync(metrikP, 'utf8'));
  assert.equal(fel.length, 0);
  assert.equal(rader.length, 2);
  assert.equal(rader[0].runda, 1);
  assert.equal(rader[1].runda, 2);
});

console.log(`\n${passed} gröna, ${failed} röda.`);
process.exit(failed > 0 ? 1 : 0);
