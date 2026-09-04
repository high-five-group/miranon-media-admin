#!/usr/bin/env node
// scripts/test-review-loop.mjs — tester för rundtaks-loopen
// (TASK-173.5: scripts/lib/review-loop.mjs + scripts/review-loop-beslut.mjs).
//
// Samma konvention som scripts/test-review-policy.mjs och
// scripts/test-review-risk-sektion.mjs: de PURA funktionerna importeras direkt
// (sektion A–D), och ett sista lager prövar CLI:ts exit-koder via spawnSync
// (sektion E–G) — annars vore pure-function-testerna förenliga med en CLI som
// alltid returnerar 0.
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT ═══
// Varje regel prövas i BÅDA riktningar: brytet → RÖTT/avvikande, den rättade
// formen → GRÖNT. De två invarianter där ett ensidigt test hade varit vakuöst
// får explicita KONTRAST-par:
//   - AC #1 (runda 2 blockerar endast på error): ETT och SAMMA warning-fynd
//     körs i runda 1 (ska blockera) och runda 2 (ska INTE blockera). Ett test
//     som bara visade runda 2 hade varit förenligt med en implementation som
//     aldrig blockerar alls.
//   - AC #4 (självgodkänner aldrig vid tak): samma utlåtande vid tak med och
//     utan öppna fynd — utan dem SKA det konvergera. Ett test som bara visade
//     eskalering hade varit förenligt med en implementation som alltid
//     eskalerar.
//
// ═══ TRUSTED-REF-EGENSKAPEN PRÖVAS MOT ETT RIKTIGT TEMP-REPO ═══
// Sektion F bygger ett engångs-git-repo, committar en policy till dess `main`,
// skriver sedan en ANNAN policy i arbetsträdet, och bevisar att
// `lasLoopPolicyUrRef` läser den COMMITTADE — inte den i arbetsträdet. Det är
// ADR-105 beslut 7:s tillitsmodell uttryckt som ett test, inte som prosa; samma
// "riktigt temp-repo i stället för mock"-disciplin som test-review-policy.mjs
// använder för `git show`.
//
// Kör: node scripts/test-review-loop.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  beslutaNastaSteg,
  klassaFynd,
  LOOP_POLICY_FIL,
  LOOP_POLICY_VERSION,
  oppenhetsTroskel,
  parsaLoopPolicy,
  renderaBeslut,
  troskelForRunda,
} from './lib/review-loop.mjs';
import { BESLUT_EXITKOD, lasLoopPolicyUrRef, TRUSTED_REF } from './review-loop-beslut.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI_NAMN = 'review-loop-beslut.mjs';
const CLI = join(REPO, 'scripts', CLI_NAMN);
const REPO_POLICY = join(REPO, LOOP_POLICY_FIL);

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

/** Repots EGEN loop-policy — testerna prövar den formen, inte bara en syntetisk. */
function repoPolicy() {
  const { ok, policy, errors } = parsaLoopPolicy(JSON.parse(readFileSync(REPO_POLICY, 'utf8')));
  assert.ok(ok, `repots ${LOOP_POLICY_FIL} validerar inte: ${errors.join('; ')}`);
  return policy;
}

/** En minimal, schema-giltig loop-policy — override:as per test. */
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

function giltigPolicy(overrides = {}) {
  const { ok, policy: p, errors } = parsaLoopPolicy(policy(overrides));
  assert.ok(ok, `fixtur-policyn validerar inte: ${errors.join('; ')}`);
  return p;
}

/** Ett fynd. */
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

/** Ett minimalt, schema-giltigt utlåtande (samma form som 173.3:s svit). */
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

function beslut(uOverrides = {}, pOverrides = {}, foregaendeSha = null) {
  return beslutaNastaSteg({
    utlatande: utlatande(uOverrides),
    policy: giltigPolicy(pOverrides),
    foregaendeSha,
  });
}

/* ════════════════════════════════════════════════════════════════════
   A. parsaLoopPolicy() — fail-closed i båda riktningar
   ════════════════════════════════════════════════════════════════════ */
console.log('\nA. parsaLoopPolicy — config-validering\n');

test('A1 en välformad policy validerar', () => {
  const { ok, policy: p } = parsaLoopPolicy(policy());
  assert.equal(ok, true);
  assert.equal(p.tak, 2);
});

test('A2 repots egen .review-loop-policy.json validerar mot schemat', () => {
  const p = repoPolicy();
  assert.equal(p.version, LOOP_POLICY_VERSION);
  assert.ok(p.tak >= 1);
});

test('A3 repots policy bär tak 2 (ADR-105 beslut 4:s startvärde)', () => {
  assert.equal(repoPolicy().tak, 2);
});

test('A4 repots policy blockerar på error i runda 2 (AC #1)', () => {
  assert.equal(troskelForRunda(repoPolicy(), 2), 'error');
});

test('A5 repots policy blockerar bredare i runda 1 än i runda 2 (kontrast till A4)', () => {
  const p = repoPolicy();
  assert.equal(troskelForRunda(p, 1), 'warning');
  assert.notEqual(troskelForRunda(p, 1), troskelForRunda(p, 2));
});

test('A6 okänd version FÄLLER (z.literal, ingen tolkning som dagens form)', () => {
  const { ok, errors } = parsaLoopPolicy(policy({ version: 2 }));
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.startsWith('version')),
    errors.join('; '),
  );
});

test('A7 blockeringstroskel kortare än tak FÄLLER', () => {
  const { ok, errors } = parsaLoopPolicy(policy({ tak: 3 }));
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes('blockeringstroskel')),
    errors.join('; '),
  );
});

test('A8 blockeringstroskel längre än tak FÄLLER (kontrast till A7)', () => {
  const { ok } = parsaLoopPolicy(policy({ blockeringstroskel: ['warning', 'error', 'error'] }));
  assert.equal(ok, false);
});

test('A9 tak 3 MED tre trösklar validerar (kontrast till A7/A8)', () => {
  const { ok } = parsaLoopPolicy(
    policy({ tak: 3, blockeringstroskel: ['info', 'warning', 'error'] }),
  );
  assert.equal(ok, true);
});

test('A10 okänd severity i blockeringstroskel FÄLLER', () => {
  const { ok } = parsaLoopPolicy(policy({ blockeringstroskel: ['warning', 'kritisk'] }));
  assert.equal(ok, false);
});

test('A11 tak 0 FÄLLER (positivt heltal krävs)', () => {
  const { ok } = parsaLoopPolicy(policy({ tak: 0, blockeringstroskel: [] }));
  assert.equal(ok, false);
});

test('A12 okänt fält FÄLLER (strictObject — inget tyst strippas)', () => {
  const { ok, errors } = parsaLoopPolicy({ ...policy(), takk: 5 });
  assert.equal(ok, false);
  assert.ok(errors.length > 0);
});

test("A13 eskaleraVidAction: ['auto-fix'] FÄLLER — då finns ingen fix-väg kvar", () => {
  const { ok, errors } = parsaLoopPolicy(policy({ eskaleraVidAction: ['auto-fix', 'ask-user'] }));
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes('eskaleraVidAction')),
    errors.join('; '),
  );
});

test('A14 tom eskaleraVidRisk validerar (giltig konfig: inget risk-stopp)', () => {
  assert.equal(parsaLoopPolicy(policy({ eskaleraVidRisk: [] })).ok, true);
});

test('A15 _readme accepteras och påverkar inget beslut', () => {
  const { ok, policy: p } = parsaLoopPolicy({ _readme: ['x'], ...policy() });
  assert.equal(ok, true);
  assert.equal(p.tak, 2);
});

test('A16 granskaDiffSedanForegaendeRunda som sträng FÄLLER', () => {
  assert.equal(parsaLoopPolicy(policy({ granskaDiffSedanForegaendeRunda: 'ja' })).ok, false);
});

/* ════════════════════════════════════════════════════════════════════
   B. troskelForRunda / oppenhetsTroskel / klassaFynd
   ════════════════════════════════════════════════════════════════════ */
console.log('\nB. trösklar och fynd-klassning\n');

test('B1 troskelForRunda: runda 1 → warning, runda 2 → error', () => {
  const p = giltigPolicy();
  assert.equal(troskelForRunda(p, 1), 'warning');
  assert.equal(troskelForRunda(p, 2), 'error');
});

test('B2 troskelForRunda: runda ÖVER listans längd får sista (smalaste) tröskeln', () => {
  assert.equal(troskelForRunda(giltigPolicy(), 7), 'error');
});

test('B3 troskelForRunda: runda 0/negativ klampas till första tröskeln', () => {
  const p = giltigPolicy();
  assert.equal(troskelForRunda(p, 0), 'warning');
  assert.equal(troskelForRunda(p, -3), 'warning');
});

test('B4 oppenhetsTroskel = den BREDASTE tröskeln i listan (härledd, ej egen ratt)', () => {
  assert.equal(oppenhetsTroskel(giltigPolicy()), 'warning');
  assert.equal(
    oppenhetsTroskel(giltigPolicy({ tak: 3, blockeringstroskel: ['info', 'warning', 'error'] })),
    'info',
  );
});

test('B5 klassaFynd runda 1: warning BLOCKERAR', () => {
  const k = klassaFynd(
    utlatande({ runda: 1, fynd: [fynd('warning', 'auto-fix')] }),
    giltigPolicy(),
  );
  assert.equal(k.blockerande.length, 1);
});

test('B6 klassaFynd runda 2: SAMMA warning blockerar INTE (AC #1, kontrast till B5)', () => {
  const k = klassaFynd(
    utlatande({ runda: 2, fynd: [fynd('warning', 'auto-fix')] }),
    giltigPolicy(),
  );
  assert.equal(k.blockerande.length, 0);
});

test('B7 klassaFynd runda 2: error blockerar (kontrast till B6)', () => {
  const k = klassaFynd(utlatande({ runda: 2, fynd: [fynd('error', 'auto-fix')] }), giltigPolicy());
  assert.equal(k.blockerande.length, 1);
});

test('B8 info/auto-fix är varken blockerande eller öppet', () => {
  const k = klassaFynd(utlatande({ fynd: [fynd('info', 'auto-fix')] }), giltigPolicy());
  assert.equal(k.blockerande.length, 0);
  assert.equal(k.oppna.length, 0);
});

test('B9 info/ask-user är ÖPPET trots låg severity (granskaren kunde inte avgöra)', () => {
  const k = klassaFynd(utlatande({ fynd: [fynd('info', 'ask-user')] }), giltigPolicy());
  assert.equal(k.oppna.length, 1);
  assert.equal(k.tillMarcus.length, 1);
});

test('B10 warning/auto-fix är öppet i runda 2 även om det inte blockerar', () => {
  const k = klassaFynd(
    utlatande({ runda: 2, fynd: [fynd('warning', 'auto-fix')] }),
    giltigPolicy(),
  );
  assert.equal(k.blockerande.length, 0);
  assert.equal(k.oppna.length, 1);
});

test('B11 routing: auto-fix → tillBygg, ask-user → tillMarcus, aldrig båda', () => {
  const k = klassaFynd(
    utlatande({ fynd: [fynd('error', 'auto-fix'), fynd('error', 'ask-user')] }),
    giltigPolicy(),
  );
  assert.equal(k.tillBygg.length, 1);
  assert.equal(k.tillMarcus.length, 1);
  assert.equal(k.tillBygg[0].action, 'auto-fix');
  assert.equal(k.tillMarcus[0].action, 'ask-user');
});

/* ════════════════════════════════════════════════════════════════════
   C. beslutaNastaSteg() — prioritetsordning och AC-täckning
   ════════════════════════════════════════════════════════════════════ */
console.log('\nC. beslutaNastaSteg — prioritetsordning\n');

test('C1 inga fynd, låg risk, runda 1 → konvergerad, armering tillåten', () => {
  const b = beslut();
  assert.equal(b.beslut, 'konvergerad');
  assert.equal(b.armeringTillaten, true);
});

test('C2 error i runda 1 → ny-runda (runda < tak)', () => {
  const b = beslut({ fynd: [fynd('error', 'auto-fix')] });
  assert.equal(b.beslut, 'ny-runda');
  assert.equal(b.nastaRunda, 2);
  assert.equal(b.armeringTillaten, false);
});

test('C3 ny-runda bär diffBas = denna rundas granskadSha (konvergensregeln)', () => {
  const b = beslut({ granskadSha: 'deadbee', fynd: [fynd('error', 'auto-fix')] });
  assert.equal(b.diffBas, 'deadbee');
  assert.equal(b.nastaTroskel, 'error');
});

test('C4 granskaDiffSedanForegaendeRunda: false → diffBas null (full omgranskning)', () => {
  const b = beslut(
    { fynd: [fynd('error', 'auto-fix')] },
    { granskaDiffSedanForegaendeRunda: false },
  );
  assert.equal(b.beslut, 'ny-runda');
  assert.equal(b.diffBas, null);
});

test('C5 AC #1: warning i runda 1 blockerar → ny-runda', () => {
  assert.equal(beslut({ runda: 1, fynd: [fynd('warning', 'auto-fix')] }).beslut, 'ny-runda');
});

test('C6 AC #1: SAMMA warning i runda 2 stoppar inte loopen — men taket eskalerar det öppna fyndet', () => {
  const b = beslut({ runda: 2, fynd: [fynd('warning', 'auto-fix')] });
  assert.equal(b.blockerande.length, 0, 'warning ska INTE blockera i runda 2');
  assert.equal(b.beslut, 'eskalera-tak');
  assert.equal(b.oppna.length, 1);
});

test('C7 AC #4: tak nått UTAN öppna fynd → konvergerad (kontrast till C6)', () => {
  const b = beslut({ runda: 2, fynd: [fynd('info', 'auto-fix')] });
  assert.equal(b.beslut, 'konvergerad');
  assert.equal(b.armeringTillaten, true);
});

test('C8 AC #2/#4: tak nått med error → eskalera-tak, ALDRIG en tredje runda', () => {
  const b = beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] });
  assert.equal(b.beslut, 'eskalera-tak');
  assert.equal(b.nastaRunda, null, 'ingen tredje runda får schemaläggas');
  assert.equal(b.armeringTillaten, false, 'grinden självgodkänner aldrig vid tak');
});

test('C9 AC #3: ask-user i runda 1 eskalerar direkt — inte en ny runda', () => {
  const b = beslut({ runda: 1, fynd: [fynd('error', 'ask-user')] });
  assert.equal(b.beslut, 'eskalera-ask-user');
  assert.equal(b.nastaRunda, null);
});

test('C10 AC #3: ask-user i runda 2 eskalerar också (oavsett runda)', () => {
  assert.equal(beslut({ runda: 2, fynd: [fynd('info', 'ask-user')] }).beslut, 'eskalera-ask-user');
});

test('C11 ADR-105 beslut 5: risk hog eskalerar även utan ett enda fynd', () => {
  const b = beslut({ risk: { niva: 'hog', motivering: 'Ror auth.' } });
  assert.equal(b.beslut, 'eskalera-risk');
  assert.equal(b.armeringTillaten, false);
});

test('C12 risk medel eskalerar INTE med repots policy (kontrast till C11)', () => {
  assert.equal(beslut({ risk: { niva: 'medel', motivering: 'Medel.' } }).beslut, 'konvergerad');
});

test('C13 risk medel eskalerar NÄR policyn säger det (config styr, inte koden)', () => {
  const b = beslut(
    { risk: { niva: 'medel', motivering: 'Medel.' } },
    { eskaleraVidRisk: ['medel', 'hog'] },
  );
  assert.equal(b.beslut, 'eskalera-risk');
});

test('C14 prioritet: risk hog slår ask-user som rapporterat skäl', () => {
  const b = beslut({
    risk: { niva: 'hog', motivering: 'Hog.' },
    fynd: [fynd('error', 'ask-user')],
  });
  assert.equal(b.beslut, 'eskalera-risk');
});

test('C15 prioritet: ask-user slår tak som rapporterat skäl', () => {
  const b = beslut({ runda: 2, fynd: [fynd('error', 'ask-user')] });
  assert.equal(b.beslut, 'eskalera-ask-user');
});

test('C16 prioritet: ask-user slår ny-runda (blockerande error finns också)', () => {
  const b = beslut({ runda: 1, fynd: [fynd('error', 'auto-fix'), fynd('info', 'ask-user')] });
  assert.equal(b.beslut, 'eskalera-ask-user');
});

test('C17 NO_CHANGE: runda 2 mot samma SHA som runda 1 → eskalera-ingen-andring', () => {
  const b = beslut({ runda: 2, granskadSha: 'abc1234' }, {}, 'abc1234');
  assert.equal(b.beslut, 'eskalera-ingen-andring');
  assert.equal(b.armeringTillaten, false);
});

test('C18 NO_CHANGE: runda 2 mot NY SHA konvergerar (kontrast till C17)', () => {
  const b = beslut({ runda: 2, granskadSha: 'nysha99' }, {}, 'abc1234');
  assert.equal(b.beslut, 'konvergerad');
});

test('C19 NO_CHANGE gäller inte runda 1 (ingen föregående runda finns)', () => {
  assert.equal(beslut({ runda: 1, granskadSha: 'abc1234' }, {}, 'abc1234').beslut, 'konvergerad');
});

test('C20 utan foregaendeSha i runda 2: kontrollen hoppas över SYNLIGT, som varning', () => {
  const b = beslut({ runda: 2 });
  assert.equal(b.beslut, 'konvergerad');
  assert.ok(
    b.varningar.some((v) => v.includes('pushats')),
    b.varningar.join('; '),
  );
});

test('C21 runda 1 utan foregaendeSha ger INGEN varning (kontrast till C20)', () => {
  assert.deepEqual(beslut({ runda: 1 }).varningar, []);
});

test('C22 runda ÖVER taket behandlas som tak nått + varning (fail-closed)', () => {
  const b = beslut({ runda: 5, fynd: [fynd('error', 'auto-fix')] });
  assert.equal(b.beslut, 'eskalera-tak');
  assert.ok(
    b.varningar.some((v) => v.includes('ÖVER taket')),
    b.varningar.join('; '),
  );
});

test('C23 tak 3: error i runda 2 ger ny-runda 3 (taket är config-drivet, inte hårdkodat)', () => {
  const b = beslut(
    { runda: 2, fynd: [fynd('error', 'auto-fix')] },
    { tak: 3, blockeringstroskel: ['warning', 'error', 'error'] },
  );
  assert.equal(b.beslut, 'ny-runda');
  assert.equal(b.nastaRunda, 3);
});

test('C24 determinism: samma indata ⇒ djupt lika beslut', () => {
  const a = beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] });
  const b = beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] });
  assert.deepEqual(a, b);
});

test('C25 determinism-KONTRAST: annan runda ⇒ annat beslut (C24 ej vakuöst)', () => {
  const r1 = beslut({ runda: 1, fynd: [fynd('error', 'auto-fix')] });
  const r2 = beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] });
  assert.notEqual(r1.beslut, r2.beslut);
});

test('C26 bunt-PR (kortId null) ger ett fullständigt beslut — fynden är kort-oberoende', () => {
  const b = beslut({ kortId: null, acProvning: [], fynd: [fynd('error', 'ask-user')] });
  assert.equal(b.kortId, null);
  assert.equal(b.beslut, 'eskalera-ask-user');
  assert.equal(b.oppna.length, 1);
});

/* ════════════════════════════════════════════════════════════════════
   D. renderaBeslut() — eskaleringsformen
   ════════════════════════════════════════════════════════════════════ */
console.log('\nD. renderaBeslut — STOPPA-OCH-FRÅGA-formen\n');

test('D1 eskalering renderar MARKERINGSBARA kryssrutor (AC #2)', () => {
  const text = renderaBeslut(beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] }));
  assert.match(text, /- \[ \] \*\*1\.\*\*/);
  assert.match(text, /STOPPA-OCH-FRÅGA/);
});

test('D2 konvergens renderar INGA kryssrutor (kontrast till D1)', () => {
  const text = renderaBeslut(beslut());
  assert.ok(!text.includes('- [ ]'), 'konvergens ska inte be Marcus om ett beslut');
});

test('D3 eskalering listar varje öppet fynd', () => {
  const text = renderaBeslut(
    beslut({ runda: 2, fynd: [fynd('error', 'auto-fix'), fynd('warning', 'auto-fix')] }),
  );
  assert.match(text, /- \[ \] \*\*1\.\*\*/);
  assert.match(text, /- \[ \] \*\*2\.\*\*/);
});

test('D4 eskalering bär de tre besluts-alternativen till Marcus', () => {
  const text = renderaBeslut(beslut({ risk: { niva: 'hog', motivering: 'Hog.' } }));
  assert.match(text, /Armera PR:en som den är/);
  assert.match(text, /Rätta de markerade fynden först/);
  assert.match(text, /Något annat/);
});

test('D5 eskalering säger uttryckligen att grinden inte självgodkänner (AC #4)', () => {
  const text = renderaBeslut(beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] }));
  assert.match(text, /självgodkänner aldrig/);
});

test('D6 ny-runda renderar FÄRSK KONTEXT-kravet och rundnumret (ADR-105 beslut 2)', () => {
  const text = renderaBeslut(beslut({ fynd: [fynd('error', 'auto-fix')] }));
  assert.match(text, /FÄRSK kontext/);
  assert.match(text, /`runda: 2`/);
});

test('D7 ny-runda renderar konvergensregeln med diff-basen', () => {
  const text = renderaBeslut(beslut({ granskadSha: 'deadbee', fynd: [fynd('error', 'auto-fix')] }));
  assert.match(text, /Konvergensregeln/);
  assert.match(text, /deadbee/);
});

test('D8 ny-runda med konvergensregeln AV säger det i stället (kontrast till D7)', () => {
  const text = renderaBeslut(
    beslut({ fynd: [fynd('error', 'auto-fix')] }, { granskaDiffSedanForegaendeRunda: false }),
  );
  assert.match(text, /granska hela PR-diffen på nytt/);
});

test('D9 ny-runda listar bygg-agentens rättningslista (AC #3)', () => {
  const text = renderaBeslut(beslut({ fynd: [fynd('error', 'auto-fix')] }));
  assert.match(text, /### Till bygg-agenten \(1\)/);
});

test('D10 en pipe i fynd-beskrivningen escapas via cell() — ingen egen regex', () => {
  const text = renderaBeslut(
    beslut({ runda: 2, fynd: [fynd('error', 'auto-fix', { beskrivning: 'a|b' })] }),
  );
  assert.ok(text.includes('a\\|b'), 'pipe ska escapas av den delade cell()');
});

test('D11 en radbrytning i beskrivningen bryter inte listformatet', () => {
  const text = renderaBeslut(
    beslut({ runda: 2, fynd: [fynd('error', 'auto-fix', { beskrivning: 'rad1\nrad2' })] }),
  );
  assert.ok(!text.includes('rad1\nrad2'), 'radbrytningen ska normaliseras av cell()');
  assert.ok(text.includes('rad1<br>rad2'));
});

test('D12 plats renderas som kodcell när den finns', () => {
  const text = renderaBeslut(
    beslut({
      runda: 2,
      fynd: [fynd('error', 'auto-fix', { plats: { fil: 'src/a.ts', rad: 42 } })],
    }),
  );
  assert.match(text, /`src\/a\.ts:42`/);
});

test('D13 varningar renderas synligt', () => {
  const text = renderaBeslut(beslut({ runda: 5, fynd: [fynd('error', 'auto-fix')] }));
  assert.match(text, /\*\*Varningar:\*\*/);
});

test('D14 determinism: samma beslut ⇒ byte-identisk text', () => {
  const b = beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] });
  assert.equal(renderaBeslut(b), renderaBeslut(b));
});

test('D15 determinism-KONTRAST: annat beslut ⇒ annan text (D14 ej vakuöst)', () => {
  assert.notEqual(
    renderaBeslut(beslut({ runda: 2, fynd: [fynd('error', 'auto-fix')] })),
    renderaBeslut(beslut()),
  );
});

test('D16 konvergerad med info-fynd bokför dem utan att kräva åtgärd', () => {
  const text = renderaBeslut(beslut({ fynd: [fynd('info', 'auto-fix')] }));
  assert.match(text, /Bokfört utan att stoppa \(1\)/);
  assert.match(text, /ingen rättnings-order/);
});

test('D17 rubriken bär rundan, taket och PR-numret', () => {
  const text = renderaBeslut(beslut({ prNummer: 999, runda: 2 }));
  assert.match(text, /PR #999/);
  assert.match(text, /runda 2\/2/);
});

/* ════════════════════════════════════════════════════════════════════
   E. CLI — exit-koder (pure-testerna ovan är förenliga med en CLI som
      alltid returnerar 0; detta lager utesluter det)
   ════════════════════════════════════════════════════════════════════ */
console.log('\nE. CLI — exit-koder\n');

const tmp = mkdtempSync(join(tmpdir(), 'test-review-loop-'));
const LOKAL_POLICY = join(tmp, 'loop-policy.json');
writeFileSync(LOKAL_POLICY, JSON.stringify(policy()));

// TASK-173.6: CLI:t appendar sedan en instrumenteringsrad per lyckat beslut
// (scripts/lib/review-metrics.mjs). --metrik-fil styr den bort från REPOTS
// RIKTIGA logg (docs/reference/review-instrumentering.jsonl) till en
// engångsfil här — annars skulle var och en av sektion E:s ~19 CLI-anrop
// (körda direkt mot detta repo, `cwd: REPO`) skriva en rad i det riktiga
// spårade repot vid varje testkörning. Instrumenteringens EGET beteende
// (radform, append-inte-skriv-över, tyst vid malformat indata) testas i
// scripts/test-review-metrics.mjs — inte här.
const METRIK_TMP = join(tmp, 'metrics.jsonl');

function skrivUtlatande(namn, overrides = {}) {
  const p = join(tmp, namn);
  writeFileSync(p, JSON.stringify(utlatande(overrides)));
  return p;
}

function korCli(args) {
  return spawnSync('node', [CLI, ...args, '--metrik-fil', METRIK_TMP], {
    cwd: REPO,
    encoding: 'utf8',
  });
}

test('E1 konvergerad → exit 0', () => {
  const r = korCli([skrivUtlatande('konv.json'), '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /KONVERGERAD/);
});

test('E2 ny runda → exit 10', () => {
  const p = skrivUtlatande('nyrunda.json', { fynd: [fynd('error', 'auto-fix')] });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 10);
  assert.match(r.stdout, /NY RUNDA/);
});

test('E3 tak nått med error → exit 20', () => {
  const p = skrivUtlatande('tak.json', { runda: 2, fynd: [fynd('error', 'auto-fix')] });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 20);
  assert.match(r.stdout, /rundtaket nått/);
});

test('E4 risk hog → exit 20', () => {
  const p = skrivUtlatande('hog.json', { risk: { niva: 'hog', motivering: 'Ror auth.' } });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 20);
  assert.match(r.stdout, /HÖG risk/);
});

test('E5 ask-user → exit 20', () => {
  const p = skrivUtlatande('ask.json', { fynd: [fynd('info', 'ask-user')] });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 20);
  assert.match(r.stdout, /Marcus beslut/);
});

test('E6 --foregaende-sha lika → exit 20 (ingen ändring mellan rundorna)', () => {
  const p = skrivUtlatande('same.json', { runda: 2, granskadSha: 'abc1234' });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY, '--foregaende-sha', 'abc1234']);
  assert.equal(r.status, 20);
  assert.match(r.stdout, /ingen ändring mellan rundorna/);
});

test('E7 --foregaende-sha olika → exit 0 (kontrast till E6)', () => {
  const p = skrivUtlatande('diff.json', { runda: 2, granskadSha: 'nysha99' });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY, '--foregaende-sha', 'abc1234']);
  assert.equal(r.status, 0);
});

test('E8 exitkod-tabellen täcker VARJE beslut modulen kan returnera', () => {
  const alla = [
    'konvergerad',
    'ny-runda',
    'eskalera-tak',
    'eskalera-risk',
    'eskalera-ask-user',
    'eskalera-ingen-andring',
  ];
  for (const b of alla) {
    assert.ok(BESLUT_EXITKOD[b] !== undefined, `beslut '${b}' saknar exitkod`);
  }
  assert.equal(Object.keys(BESLUT_EXITKOD).length, alla.length);
});

test('E9 malformat JSON → exit 1, ingen gissning', () => {
  const p = join(tmp, 'trasig.json');
  writeFileSync(p, '{ inte json');
  const r = korCli([p, '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 1);
});

test('E10 schema-ogiltigt utlåtande → exit 1 (okänd severity)', () => {
  const p = join(tmp, 'ogiltig.json');
  writeFileSync(p, JSON.stringify(utlatande({ fynd: [fynd('kritisk', 'auto-fix')] })));
  const r = korCli([p, '--policy-fil', LOKAL_POLICY]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /validerar INTE mot schemat/);
});

test('E11 utlåtande som bryter en superRefine-invariant → exit 1', () => {
  const p = join(tmp, 'invariant.json');
  writeFileSync(p, JSON.stringify(utlatande({ intentKalla: 'pr-text', intentKonfidens: 'hog' })));
  assert.equal(korCli([p, '--policy-fil', LOKAL_POLICY]).status, 1);
});

test('E12 inget argument → exit 2', () => {
  assert.equal(korCli([]).status, 2);
});

test('E13 okänt argument → exit 2', () => {
  assert.equal(korCli([skrivUtlatande('a.json'), '--force']).status, 2);
});

test('E14 --foregaende-sha utan värde → exit 2', () => {
  assert.equal(korCli([skrivUtlatande('b.json'), '--foregaende-sha']).status, 2);
});

test('E15 två filargument → exit 2', () => {
  assert.equal(korCli([skrivUtlatande('c.json'), skrivUtlatande('d.json')]).status, 2);
});

test('E16 ogiltig --policy-fil → exit 64 (POLICYFEL, fail-closed)', () => {
  const dalig = join(tmp, 'dalig-policy.json');
  writeFileSync(dalig, JSON.stringify(policy({ version: 99 })));
  const r = korCli([skrivUtlatande('e.json'), '--policy-fil', dalig]);
  assert.equal(r.status, 64);
  assert.match(r.stderr, /POLICYFEL/);
});

test('E17 saknad --policy-fil → exit 64', () => {
  const r = korCli([skrivUtlatande('f.json'), '--policy-fil', join(tmp, 'finns-inte.json')]);
  assert.equal(r.status, 64);
});

test('E18 --json ger parsbar utdata med beslut och exitkod-konsekvens', () => {
  const p = skrivUtlatande('json.json', { runda: 2, fynd: [fynd('error', 'auto-fix')] });
  const r = korCli([p, '--policy-fil', LOKAL_POLICY, '--json']);
  const data = JSON.parse(r.stdout);
  assert.equal(data.beslut, 'eskalera-tak');
  assert.equal(r.status, BESLUT_EXITKOD[data.beslut]);
});

test('E19 --policy-fil flaggas SYNLIGT som svagare läge än trusted ref', () => {
  const r = korCli([skrivUtlatande('svag.json'), '--policy-fil', LOKAL_POLICY, '--json']);
  assert.match(JSON.parse(r.stdout).policyKalla, /SVAGARE LÄGE/);
});

/* ════════════════════════════════════════════════════════════════════
   F. Trusted ref — policyn läses ur den COMMITTADE origin/main-versionen,
      aldrig ur arbetsträdet (ADR-105 beslut 7).

      Formen är 173.2:s precedent (scripts/test-review-policy.mjs § E,
      byggCliRepo/korCli): CLI + lib kopieras till ett engångs-repo med en
      ÄKTA refs/remotes/origin/main, och CLI:t körs DÄR — så den SKARPA
      vägen (utan --policy-fil) prövas fullt ut, oberoende av om filen
      hunnit landa i det riktiga repots main.
   ════════════════════════════════════════════════════════════════════ */
console.log('\nF. trusted ref — committad origin/main slår arbetsträdet\n');

const repoTmp = mkdtempSync(join(tmpdir(), 'test-review-loop-repo-'));

function git(cwd, args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

/**
 * Bygger ett engångs-repo där `origin/main` bär `mainPolicy` och arbetsträdet
 * (efter commit på en annan gren) bär `arbetstradPolicy` — angripar-modellen:
 * en PR-gren som försöker mildra sin egen granskning.
 */
function byggRepo(namn, mainPolicy, arbetstradPolicy = null) {
  const p = join(repoTmp, namn);
  spawnSync('git', ['init', '-q', '-b', 'main', p], { encoding: 'utf8' });
  git(p, ['config', 'user.email', 'test@example.com']);
  git(p, ['config', 'user.name', 'Test']);
  writeFileSync(
    join(p, LOOP_POLICY_FIL),
    typeof mainPolicy === 'string' ? mainPolicy : JSON.stringify(mainPolicy),
  );
  git(p, ['add', LOOP_POLICY_FIL]);
  git(p, ['commit', '-q', '-m', 'policy i main']);
  git(p, ['update-ref', `refs/remotes/${TRUSTED_REF}`, 'refs/heads/main']);
  if (arbetstradPolicy !== null) {
    git(p, ['checkout', '-q', '-b', 'pr-gren']);
    writeFileSync(join(p, LOOP_POLICY_FIL), JSON.stringify(arbetstradPolicy));
    git(p, ['add', LOOP_POLICY_FIL]);
    git(p, ['commit', '-q', '-m', 'mildra policyn pa grenen']);
  }
  return p;
}

/** Kopierar CLI + dess libbar till repot så CLI:t härleder det som sitt eget. */
function byggCliRepo(namn, mainPolicy, arbetstradPolicy = null) {
  const p = byggRepo(namn, mainPolicy, arbetstradPolicy);
  mkdirSync(join(p, 'scripts', 'lib'), { recursive: true });
  copyFileSync(join(REPO, 'scripts', 'review-loop-beslut.mjs'), join(p, 'scripts', CLI_NAMN));
  for (const lib of [
    'review-loop.mjs',
    'review-risk-sektion.mjs',
    'review-utlatande.mjs',
    'review-metrics.mjs',
  ]) {
    copyFileSync(join(REPO, 'scripts', 'lib', lib), join(p, 'scripts', 'lib', lib));
  }
  symlinkSync(join(REPO, 'node_modules'), join(p, 'node_modules'));
  return p;
}

function korCliI(repoPath, args) {
  return spawnSync('node', [join(repoPath, 'scripts', CLI_NAMN), ...args], {
    cwd: repoPath,
    encoding: 'utf8',
  });
}

const SVAG_POLICY = policy({ tak: 9, blockeringstroskel: Array(9).fill('error') });

test('F1 committad origin/main-policy läses, med sin SHA', () => {
  const r = lasLoopPolicyUrRef(byggRepo('las', policy({ tak: 2 })));
  assert.equal(r.ok, true, r.errors.join('; '));
  assert.equal(r.policy.tak, 2);
  assert.match(r.sha, /^[0-9a-f]{40}$/);
});

test('F2 en OCOMMITTAD mildring i arbetsträdet påverkar INTE läsningen', () => {
  const p = byggRepo('ocommittad', policy({ tak: 2 }));
  writeFileSync(join(p, LOOP_POLICY_FIL), JSON.stringify(SVAG_POLICY));
  assert.equal(lasLoopPolicyUrRef(p).policy.tak, 2, 'arbetsträdets tak 9 fick aldrig läcka in');
});

test('F3 en COMMITTAD mildring på PR-grenen påverkar INTE heller läsningen', () => {
  const p = byggRepo('pr-gren', policy({ tak: 2 }), SVAG_POLICY);
  assert.equal(lasLoopPolicyUrRef(p).policy.tak, 2, 'PR-grenens tak 9 fick aldrig läcka in');
});

test('F4 KONTRAST: landar mildringen i main SYNS den (F2/F3 ej vakuösa)', () => {
  assert.equal(lasLoopPolicyUrRef(byggRepo('landad', SVAG_POLICY)).policy.tak, 9);
});

test('F5 okänd ref → ok:false med skäl och sha=null (fail-closed, ingen default)', () => {
  const r = lasLoopPolicyUrRef(byggRepo('okand', policy()), 'refs/heads/finns-inte');
  assert.equal(r.ok, false);
  assert.equal(r.policy, null);
  assert.equal(r.sha, null);
  assert.ok(r.errors.length > 0);
});

test('F6 ref utan policyfilen → ok:false', () => {
  const p = join(repoTmp, 'utan-fil');
  spawnSync('git', ['init', '-q', '-b', 'main', p], { encoding: 'utf8' });
  git(p, ['config', 'user.email', 't@e.com']);
  git(p, ['config', 'user.name', 'T']);
  writeFileSync(join(p, 'a.txt'), 'x');
  git(p, ['add', 'a.txt']);
  git(p, ['commit', '-q', '-m', 'x']);
  git(p, ['update-ref', `refs/remotes/${TRUSTED_REF}`, 'refs/heads/main']);
  assert.equal(lasLoopPolicyUrRef(p).ok, false);
});

test('F7 committad men trasig policy → ok:false (fail-closed, inte en delmängd)', () => {
  const r = lasLoopPolicyUrRef(byggRepo('trasig', '{ trasig'));
  assert.equal(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.includes('giltig JSON')),
    r.errors.join('; '),
  );
});

test('F8 SKARPA VÄGEN: CLI utan --policy-fil läser origin/main och rapporterar dess SHA', () => {
  const p = byggCliRepo('cli-skarp', policy({ tak: 2 }), SVAG_POLICY);
  const u = join(p, 'u.json');
  writeFileSync(u, JSON.stringify(utlatande({ runda: 2, fynd: [fynd('error', 'auto-fix')] })));
  const r = korCliI(p, [u, '--json']);
  assert.equal(r.status, 20, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.match(data.policyKalla, new RegExp(`^${TRUSTED_REF} @ [0-9a-f]{7,}`));
  assert.equal(data.tak, 2, 'CLI:t läste PR-grenens tak — trusted-ref-egenskapen är bruten');
});

test('F9 KONTRAST: med mildringen i main hade SAMMA utlåtande gett ny-runda (F8 ej vakuöst)', () => {
  const p = byggCliRepo('cli-mildrad', SVAG_POLICY);
  const u = join(p, 'u.json');
  writeFileSync(u, JSON.stringify(utlatande({ runda: 2, fynd: [fynd('error', 'auto-fix')] })));
  const r = korCliI(p, [u]);
  assert.equal(r.status, 10, r.stderr);
});

test('F10 SKARPA VÄGEN fail-closed: trasig policy i main → exit 64, inget beslut', () => {
  const p = byggCliRepo('cli-trasig', '{ inte json');
  const u = join(p, 'u.json');
  writeFileSync(u, JSON.stringify(utlatande()));
  const r = korCliI(p, [u]);
  assert.equal(r.status, 64, `väntade 64, fick ${r.status}: ${r.stderr}`);
  assert.match(r.stderr, /POLICYFEL/);
});

test('F11 SKARPA VÄGEN fail-closed: policyfilen saknas i main → exit 64', () => {
  const p = join(repoTmp, 'cli-utan-fil');
  spawnSync('git', ['init', '-q', '-b', 'main', p], { encoding: 'utf8' });
  git(p, ['config', 'user.email', 't@e.com']);
  git(p, ['config', 'user.name', 'T']);
  mkdirSync(join(p, 'scripts', 'lib'), { recursive: true });
  copyFileSync(join(REPO, 'scripts', 'review-loop-beslut.mjs'), join(p, 'scripts', CLI_NAMN));
  for (const lib of [
    'review-loop.mjs',
    'review-risk-sektion.mjs',
    'review-utlatande.mjs',
    'review-metrics.mjs',
  ]) {
    copyFileSync(join(REPO, 'scripts', 'lib', lib), join(p, 'scripts', 'lib', lib));
  }
  symlinkSync(join(REPO, 'node_modules'), join(p, 'node_modules'));
  git(p, ['add', '-A']);
  git(p, ['commit', '-q', '-m', 'utan policy']);
  git(p, ['update-ref', `refs/remotes/${TRUSTED_REF}`, 'refs/heads/main']);
  const u = join(p, 'u.json');
  writeFileSync(u, JSON.stringify(utlatande()));
  assert.equal(korCliI(p, [u]).status, 64);
});

/* ════════════════════════════════════════════════════════════════════
   G. Bakåtkompatibilitet mot 173.1-formade utlåtanden
   ════════════════════════════════════════════════════════════════════ */
console.log('\nG. bakåtkompatibilitet\n');

test('G1 ett 173.1-format utlåtande UTAN policySha/policyRegler ger ett beslut', () => {
  const gammalt = utlatande();
  delete gammalt.policySha;
  delete gammalt.policyRegler;
  const p = join(tmp, 'gammalt.json');
  writeFileSync(p, JSON.stringify(gammalt));
  const r = korCli([p, '--policy-fil', LOKAL_POLICY, '--json']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).beslut, 'konvergerad');
});

test('G2 loopen konsumerar ALLTID valideraUtlatande(...).data, aldrig rå JSON', () => {
  const gammalt = utlatande({ fynd: [fynd('error', 'auto-fix')] });
  delete gammalt.policySha;
  delete gammalt.policyRegler;
  const p = join(tmp, 'gammalt2.json');
  writeFileSync(p, JSON.stringify(gammalt));
  assert.equal(korCli([p, '--policy-fil', LOKAL_POLICY]).status, 10);
});

test('G3 ett fynd med OGILTIG action fail-closed:as till ask-user av schemat → eskalering', () => {
  const u = utlatande({ fynd: [fynd('error', 'approve')] });
  const p = join(tmp, 'failclosed.json');
  writeFileSync(p, JSON.stringify(u));
  const r = korCli([p, '--policy-fil', LOKAL_POLICY, '--json']);
  assert.equal(r.status, 20, r.stderr);
  assert.equal(JSON.parse(r.stdout).beslut, 'eskalera-ask-user');
});

rmSync(tmp, { recursive: true, force: true });
rmSync(repoTmp, { recursive: true, force: true });

console.log(`\n${passed} gröna, ${failed} röda.`);
process.exit(failed === 0 ? 0 : 1);
