#!/usr/bin/env node
// scripts/test-flake-matserie.mjs — tester för mätriggens pura funktioner
// (samma konvention som scripts/test-ci-metrics.mjs: skript bär eget
// test-skript med samma namnstam; FIXTUR-DATA, kör aldrig Playwright och
// startar aldrig en dev-server).
//
// Kör: node scripts/test-flake-matserie.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// Fallen prövar de fyra egenskaper TASK-81 kräver KODADE, inte instruerade,
// och de prövar dem i BÅDA riktningar där det går att fälla:
//   AC 1  byggPlan interfolierar och kan inte producera en blockad serie
//   AC 2  normaliseraLoadavg ger null (→ "OKÄND") och ALDRIG 0 vid saknat stöd
//   AC 3  plattaUtRapport bevarar per-testresultat-data, inte bara aggregat
//   AC 5  ingen tröskel för "acceptabel flakighet" i utskriften

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  byggPlan,
  formateraSammanfattning,
  konfigFingeravtryck,
  normaliseraLoadavg,
  plattaUtRapport,
  sammanfatta,
  visaLoadavg,
} from './flake-matserie.mjs';

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

// --- AC 1: interfolieringen är kodad, blockning är inte uttryckbar ---------

t('AC1 byggPlan: 1 varv = A,B — armarna varvas, aldrig blockas', () => {
  assert.deepEqual(byggPlan(1), ['A', 'B']);
});

t('AC1 byggPlan: 5 varv ger exakt TASK-74:s form A,B,A,B,A,B,A,B,A,B', () => {
  assert.deepEqual(byggPlan(5), ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']);
});

t('AC1 byggPlan: ingen post har samma arm som sin granne — blockning omöjlig', () => {
  for (const varv of [1, 2, 3, 7, 25]) {
    const plan = byggPlan(varv);
    assert.equal(plan.length, varv * 2, `${varv} varv ska ge ${varv * 2} körningar`);
    for (let i = 1; i < plan.length; i++) {
      assert.notEqual(plan[i], plan[i - 1], `plan[${i}] == plan[${i - 1}] vid varv=${varv}`);
    }
    assert.equal(plan.filter((x) => x === 'A').length, varv, 'lika många A som varv');
    assert.equal(plan.filter((x) => x === 'B').length, varv, 'lika många B som varv');
  }
});

t('AC1 byggPlan FÄLLER på indata som inte är ett positivt heltal varv', () => {
  for (const dåligt of [0, -1, 2.5, Number.NaN, '5', null, undefined]) {
    assert.throws(() => byggPlan(dåligt), /varv måste vara ett heltal/, `${dåligt} borde kasta`);
  }
});

t('AC1 byggPlan tar INTE emot en färdig plan — API:t saknar den vägen', () => {
  // Originalet (TASK-74) tog `--plan A,B,A,B`, vilket gjorde `--plan A,A,B,B`
  // fullt möjligt. Regressionsvakt: enda parametern är antal varv (arity 1),
  // så en anropare kan välja HUR MÅNGA, aldrig i vilken ORDNING.
  assert.equal(byggPlan.length, 1, 'byggPlan ska ta exakt ett argument (varv)');
});

// --- AC 2: loadavg — OKÄND, aldrig noll ------------------------------------

t('AC2 normaliseraLoadavg: normalt utfall avrundas till 2 decimaler', () => {
  assert.equal(normaliseraLoadavg([5.5123, 4.2, 3.1]), 5.51);
  assert.equal(normaliseraLoadavg([125.0, 90.2, 60.1]), 125); // TASK-74:s lasttopp
});

t('AC2 normaliseraLoadavg: [0,0,0] (plattform utan stöd) → null, ALDRIG 0', () => {
  const v = normaliseraLoadavg([0, 0, 0]);
  assert.equal(v, null);
  assert.notEqual(v, 0, 'en nolla här läses som "vilande maskin" och gör deflateringen osann');
});

t('AC2 normaliseraLoadavg: trasig/saknad indata → null, ALDRIG 0', () => {
  for (const dåligt of [undefined, null, [], [1, 2], 'load', [Number.NaN, 1, 1], [-1, 1, 1]]) {
    const v = normaliseraLoadavg(dåligt);
    assert.equal(v, null, `${JSON.stringify(dåligt)} skulle ge null`);
    assert.notEqual(v, 0);
  }
});

t('AC2 normaliseraLoadavg: en ÄKTA låg last är inte OKÄND — 0 i 1-min men inte i 5/15', () => {
  assert.equal(normaliseraLoadavg([0, 0.01, 0.05]), 0);
});

t('AC2 visaLoadavg: null renderas "OKÄND"; noll renderas "0", inte "OKÄND"', () => {
  assert.equal(visaLoadavg(null), 'OKÄND');
  assert.equal(visaLoadavg(undefined), 'OKÄND');
  assert.equal(visaLoadavg(0), '0');
  assert.equal(visaLoadavg(53.6), '53.6');
});

// --- Fixtur: en Playwright-JSON-rapport i miniatyr -------------------------

const ESC = String.fromCharCode(27);

function mkRapport({ timeout = 30000, retries = 0, workers = 8, specs = [] } = {}) {
  return {
    config: {
      projects: [{ name: 'acceptance', timeout, retries, metadata: { actualWorkers: workers } }],
    },
    suites: [
      {
        title: 'yttre',
        specs: [],
        suites: [{ title: 'inre', specs, suites: [] }],
      },
    ],
  };
}

const mkSpec = (fil, rad, titel, results) => ({
  file: fil,
  line: rad,
  title: titel,
  tests: [{ results }],
});

// TASK-74:s faktiska felutskriftsform. B1_FEL_5S_REN är texten som den ser ut
// EFTER plattaUtRapport (ANSI strippat); B1_FEL_5S är samma text som den
// kommer ur Playwright, med ANSI-koderna kvar.
const B1_FEL_5S_REN = `expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Maillogg', level: 1 })
Timeout: 5000ms
Error: element(s) not found`;
const B1_FEL_5S = `${ESC}[31m${B1_FEL_5S_REN}${ESC}[0m`;
const B1_FEL_15S = `expect(locator).toBeVisible() failed
Locator: getByRole('heading')
Timeout: 15000ms
Error: element(s) not found`;

// --- AC 3: rådata per testresultat -----------------------------------------

t('AC3 plattaUtRapport: går ned i NÄSTLADE suites och hittar alla specs', () => {
  const r = mkRapport({
    specs: [
      mkSpec('hem.acceptance.test.ts', 437, 'AC 1 — dagar-kvar-pillen', [
        { status: 'passed', duration: 8116, retry: 0, errors: [] },
      ]),
      mkSpec('mer-maillogg.acceptance.test.ts', 77, 'fokus -> <h1>', [
        { status: 'failed', duration: 11409, retry: 0, errors: [{ message: B1_FEL_5S }] },
      ]),
    ],
  });
  const rader = plattaUtRapport(r);
  assert.equal(rader.length, 2);
  assert.deepEqual(
    rader.map((x) => `${x.fil}:${x.rad}`),
    ['hem.acceptance.test.ts:437', 'mer-maillogg.acceptance.test.ts:77'],
  );
});

t('AC3 plattaUtRapport: bevarar VARAKTIGHET per resultat — inte bara pass/fail', () => {
  // Poängen: pass/fail på n=10 har nästan ingen upplösning för en rat runt
  // 10 %, medan varaktigheten mäter marginalen mot budgeten kontinuerligt.
  const rader = plattaUtRapport(
    mkRapport({
      specs: [
        mkSpec('a.test.ts', 1, 'x', [{ status: 'passed', duration: 21195, retry: 0, errors: [] }]),
      ],
    }),
  );
  assert.equal(rader[0].ms, 21195);
  assert.equal(rader[0].status, 'passed');
});

t('AC3 plattaUtRapport: bevarar FELUTSKRIFTEN och strippar ANSI — formen är beviset', () => {
  const rader = plattaUtRapport(
    mkRapport({
      specs: [
        mkSpec('m.test.ts', 77, 'h1', [
          { status: 'failed', duration: 11409, retry: 0, errors: [{ message: B1_FEL_5S }] },
        ]),
      ],
    }),
  );
  assert.match(rader[0].fel[0], /Timeout: 5000ms/, 'budget-formen måste överleva till rådatan');
  assert.ok(!rader[0].fel[0].includes(ESC), 'ANSI-koder ska vara strippade');
});

t('AC3 plattaUtRapport: FLERA results på samma spec blir FLERA rader (en per observation)', () => {
  const rader = plattaUtRapport(
    mkRapport({
      specs: [
        mkSpec('f.test.ts', 10, 'flaky', [
          { status: 'failed', duration: 5001, retry: 0, errors: [{ message: B1_FEL_5S }] },
          { status: 'passed', duration: 3200, retry: 1, errors: [] },
        ]),
      ],
    }),
  );
  assert.equal(rader.length, 2, 'ett testresultat är en observation — de får inte slås ihop');
  assert.deepEqual(
    rader.map((x) => x.forsok),
    [0, 1],
  );
});

t('AC3 plattaUtRapport: tom/trasig rapport ger [] i stället för att kasta', () => {
  assert.deepEqual(plattaUtRapport({}), []);
  assert.deepEqual(plattaUtRapport(null), []);
  assert.deepEqual(plattaUtRapport({ suites: [] }), []);
});

t('konfigFingeravtryck: läser armens EFFEKTIVA config ur artefakten (TASK-74:s armkoll)', () => {
  const armA = konfigFingeravtryck(mkRapport({ timeout: 30000 }), 'acceptance');
  const armB = konfigFingeravtryck(mkRapport({ timeout: 60000 }), 'acceptance');
  assert.deepEqual(armA, { timeout: 30000, retries: 0, workers: 8 });
  assert.notEqual(armA.timeout, armB.timeout, 'skiljer de sig inte är A/B:t värdelöst');
  assert.equal(konfigFingeravtryck(mkRapport({}), 'finns-inte'), null);
});

// --- Sammanfattningen: deflaterbar rådata, redovisning utan omdöme ---------

// TASK-74:s A/B-serie i miniatyr: arm A får en lasttopp-körning som bär de
// flesta fällningarna — exakt det fall som SKA gå att deflatera i efterhand.
const KORNINGAR = [
  {
    nr: 1,
    arm: 'A',
    exit: 0,
    sekunder: 120,
    loadVidStart: 5.1,
    loadVidSlut: 40.2,
    loadGateOk: true,
    tradRent: 'rent',
    config: { timeout: 30000 },
  },
  {
    nr: 2,
    arm: 'B',
    exit: 0,
    sekunder: 125,
    loadVidStart: 5.0,
    loadVidSlut: 44.8,
    loadGateOk: true,
    tradRent: 'rent',
    config: { timeout: 60000 },
  },
  {
    nr: 3,
    arm: 'A',
    exit: 1,
    sekunder: 182,
    loadVidStart: 5.4,
    loadVidSlut: 125,
    loadGateOk: true,
    tradRent: 'rent',
    config: { timeout: 30000 },
  },
  {
    nr: 4,
    arm: 'B',
    exit: 0,
    sekunder: 130,
    loadVidStart: 5.2,
    loadVidSlut: 52.0,
    loadGateOk: true,
    tradRent: 'rent',
    config: { timeout: 60000 },
  },
];

const RESULTAT = [
  {
    korning: 1,
    arm: 'A',
    loadVidSlut: 40.2,
    fil: 'a.test.ts',
    rad: 1,
    titel: 'x',
    status: 'passed',
    ms: 8000,
    forsok: 0,
    fel: [],
  },
  {
    korning: 2,
    arm: 'B',
    loadVidSlut: 44.8,
    fil: 'a.test.ts',
    rad: 1,
    titel: 'x',
    status: 'passed',
    ms: 8100,
    forsok: 0,
    fel: [],
  },
  {
    korning: 3,
    arm: 'A',
    loadVidSlut: 125,
    fil: 'a.test.ts',
    rad: 1,
    titel: 'x',
    status: 'failed',
    ms: 5001,
    forsok: 0,
    fel: [B1_FEL_5S_REN],
  },
  {
    korning: 3,
    arm: 'A',
    loadVidSlut: 125,
    fil: 'b.test.ts',
    rad: 2,
    titel: 'y',
    status: 'failed',
    ms: 5002,
    forsok: 0,
    fel: ['Timeout: 5000ms'],
  },
  {
    korning: 4,
    arm: 'B',
    loadVidSlut: 52.0,
    fil: 'c.test.ts',
    rad: 3,
    titel: 'z',
    status: 'failed',
    ms: 15003,
    forsok: 0,
    fel: [B1_FEL_15S],
  },
];

t('sammanfatta: rater per arm räknas på TESTRESULTAT och på KÖRNINGAR var för sig', () => {
  const s = sammanfatta(KORNINGAR, RESULTAT);
  assert.equal(s.A.fallda, 2);
  assert.equal(s.A.testresultat, 3);
  assert.equal(s.A.korningarMedFallning, 1, '2 fällningar men ur EN körning — TASK-74:s poäng');
  assert.equal(s.A.korningar, 2);
  assert.equal(s.B.fallda, 1);
  assert.equal(s.B.korningarMedFallning, 1);
});

t('sammanfatta: lastspann per arm redovisas (svansen, inte bara nivån)', () => {
  const s = sammanfatta(KORNINGAR, RESULTAT);
  assert.equal(s.A.lastMax, 125, 'lasttoppen måste synas — den är hela deflateringens grund');
  assert.equal(s.B.lastMax, 52.0);
  assert.equal(s.A.lastMedel, 82.6);
});

t('AC2+AC3 deflatering UTAN OMKÖRNING: filtrera bort lasttoppen ur rådatan', () => {
  // Detta ÄR TASK-74:s efterhandsdeflatering, gjord som ett rent filter:
  // "utan körning 9 är ställningen 1 mot 1 i rat".
  const utanTopp = RESULTAT.filter((r) => r.loadVidSlut < 100);
  const körUtanTopp = KORNINGAR.filter((k) => k.loadVidSlut < 100);
  const s = sammanfatta(körUtanTopp, utanTopp);
  assert.equal(s.A.fallda, 0);
  assert.equal(s.B.fallda, 1);
  assert.equal(s.A.korningar, 1);
  assert.equal(s.B.korningar, 2);
});

t('AC2 sammanfatta: körningar med OKÄND last räknas som OKÄND, aldrig som 0 i medelvärdet', () => {
  const k = [
    { nr: 1, arm: 'A', sekunder: 100, loadVidSlut: 40, loadGateOk: true },
    { nr: 2, arm: 'A', sekunder: 100, loadVidSlut: null, loadGateOk: null },
  ];
  const s = sammanfatta(k, []);
  assert.equal(s.A.lastOkand, 1);
  assert.equal(s.A.lastMedel, 40, 'null får inte dras in i medelvärdet som en nolla');
  assert.notEqual(s.A.lastMedel, 20);
});

t('AC2 formateraSammanfattning: OKÄND syns i utskriften, ingen nolla uppfunnen', () => {
  const text = formateraSammanfattning(
    [
      {
        nr: 1,
        arm: 'A',
        exit: 0,
        sekunder: 100,
        loadVidStart: null,
        loadVidSlut: null,
        loadGateOk: null,
        tradRent: 'rent',
        config: null,
      },
    ],
    [],
  );
  assert.match(text, /load OKÄND->OKÄND/);
  assert.match(text, /gate=EJ TILLÄMPLIG \(last OKÄND\)/);
  assert.ok(!/load 0->0/.test(text), 'får aldrig rendera OKÄND last som 0');
});

t('formateraSammanfattning: bär fällningarnas FORM, inte bara antalet', () => {
  const text = formateraSammanfattning(KORNINGAR, RESULTAT);
  assert.match(text, /Timeout: 5000ms/, 'arm A:s budget-form måste synas');
  assert.match(text, /Timeout: 15000ms/, 'arm B:s budget-form måste synas');
  assert.match(text, /last\(slut\)=125/, 'fällningen ska bära sin körnings last');
});

// --- AC 5: verktyget dömer inte -------------------------------------------

t('AC5 utskriften saknar varje form av acceptabel-tröskel och varje omdöme', () => {
  const text = formateraSammanfattning(KORNINGAR, RESULTAT);
  for (const ord of [
    /acceptabel/i,
    /för flakigt/i,
    /godkänd/i,
    /underkänd/i,
    /gräns/i,
    /tröskel för/i,
  ]) {
    assert.ok(!ord.test(text.replace(/INGEN TRÖSKEL[\s\S]*$/, '')), `utskriften dömer: ${ord}`);
  }
  assert.match(text, /INGEN TRÖSKEL FÖR ACCEPTABEL FLAKIGHET FINNS I VERKTYGET/);
});

t('AC5 filhuvudet deklarerar uttryckligen att ingen tröskel är kodad', () => {
  const src = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'flake-matserie.mjs'),
    'utf8',
  );
  const huvud = src.slice(0, src.indexOf('import {'));
  assert.match(huvud, /VERKTYGET MÄTER\. DET FIXAR INTE OCH DET DÖMER INTE\./);
  assert.match(huvud, /INGEN tröskel för vad som är "acceptabel" flakighet/);
  assert.match(huvud, /`--load-gate` ser ut som en tröskel men är det INTE/);
});

t('AC1+egenskap 3: --retries=0 är kodad i källan, inte en flagga anroparen sätter', () => {
  const src = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'flake-matserie.mjs'),
    'utf8',
  );
  assert.match(src, /'--retries=0'/, 'retries=0 måste stå som literal i argv-bygget');
  assert.ok(!/arg\('retries'/.test(src), 'retries får inte gå att sätta utifrån');
  assert.ok(
    !/--plan/.test(src.replace(/\/\/[^\n]*/g, '')),
    'ingen --plan-flagga får finnas i koden',
  );
});

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla flake-matserie-tester gröna.');
});
