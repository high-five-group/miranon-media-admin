#!/usr/bin/env node
// scripts/test-hermetik-tackning.mjs — tester för det shardade hermetik-
// självtestets täckningskontroll (TASK-366 / N6: scripts/lib/hermetik-tackning.mjs,
// scripts/hermetik-tackning.mjs, samt `--shard`-tolkningen i
// scripts/hermetik-sjalvtest.mjs).
//
// Samma konvention som scripts/test-review-loop.mjs och sina syskon: rena
// funktioner importeras direkt (sektion A–C, F), CLI-lagret prövas via
// spawnSync (sektion D–E).
//
// ═══ VARFÖR SVITEN FINNS, OCH VARFÖR DEN ÄR TVÅSIDIG ═══
// Täckningskontrollen är det enda som gör ett TREDELAT hermetik-bevis till ett
// bevis igen. En kontroll som bara mätts i sitt gröna läge är exakt den sorts
// skydd som "ser ut att finnas" — samma felklass som motiverade själva
// hermetik-självtestets negativa kontroll. Varje invariant prövas därför i BÅDA
// riktningar: ett fall som ska hålla OCH ett minimalt muterat fall som ska
// fälla, med kontrastgruppen så nära det röda fallet som möjligt.
//
// ═══ DEN BÄRANDE KONTRASTEN: B3 MOT C1 ═══
// Båda har TVÅ rapporter. B3 är en matris som krympts korrekt (nämnaren följde
// med, summan går ihop) och MÅSTE vara grön — annars falsklarmar kontrollen på
// varje legitim omkonfigurering. C1 är en skärva som föll bort ur en matris på
// tre (nämnaren stod kvar, summan blev för liten) och MÅSTE fälla. Det är
// skillnaden mellan att vakta TÄCKNING och att vakta TOPOLOGI, och den är hela
// poängen med hur kontrollen är skriven.
//
// Kör: node scripts/test-hermetik-tackning.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsaShard } from './hermetik-sjalvtest.mjs';
import {
  bedomTackning,
  byggTackningsrapport,
  parsaTackningsrapport,
  TACKNING_SCHEMA_VERSION,
} from './lib/hermetik-tackning.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(REPO, 'scripts', 'hermetik-tackning.mjs');

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

const tmp = mkdtempSync(join(tmpdir(), 'test-hermetik-tackning-'));

/* ─────────────────────────────  Fixturer  ───────────────────────────── */

/** En giltig skärv-rapport, parsad form (som bedomTackning tar emot). */
function skarva(shardIndex, shardTotal, provade, listat = 524) {
  return {
    schemaVersion: TACKNING_SCHEMA_VERSION,
    shardIndex,
    shardTotal,
    provade,
    listat,
    projekt: 'acceptance',
    filter: [],
    kalla: `hermetik-tackning-${shardIndex}.json`,
  };
}

/** Skriver rapportfiler i en ny katalog och returnerar dess sökväg. */
function katalogMed(rapporter, { underkatalogPerFil = false, extraFiler = {} } = {}) {
  const dir = mkdtempSync(join(tmp, 'kat-'));
  for (const r of rapporter) {
    const namn = `hermetik-tackning-${r.shardIndex}.json`;
    const mal = underkatalogPerFil ? join(dir, `hermetik-tackning-${r.shardIndex}`) : dir;
    if (underkatalogPerFil) mkdirSync(mal, { recursive: true });
    const { kalla: _kalla, ...utanKalla } = r;
    writeFileSync(join(mal, namn), `${JSON.stringify(utanKalla, null, 2)}\n`, 'utf8');
  }
  for (const [namn, innehall] of Object.entries(extraFiler)) {
    writeFileSync(join(dir, namn), innehall, 'utf8');
  }
  return dir;
}

function korCli(args) {
  const r = spawnSync('node', [CLI, ...args], { encoding: 'utf8', cwd: REPO });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

/* ═══════════════  A. parsaTackningsrapport — formvalidering  ═══════════════ */

console.log('\nA. parsaTackningsrapport');

test('A1 en välformad rapport parsas och bär sin källa', () => {
  const raw = JSON.stringify(
    byggTackningsrapport({
      shardIndex: 2,
      shardTotal: 3,
      provade: 175,
      listat: 524,
      projekt: 'acceptance',
      filter: [],
    }),
  );
  const { rapport, fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.equal(fel, null);
  assert.equal(rapport.shardIndex, 2);
  assert.equal(rapport.provade, 175);
  assert.equal(rapport.kalla, 'fil.json');
});

test('A2 icke-JSON avvisas (fail-closed, räknas ALDRIG som noll)', () => {
  const { rapport, fel } = parsaTackningsrapport('{ trasig', 'fil.json');
  assert.equal(rapport, null);
  assert.match(fel, /inte giltig JSON/);
});

test('A3 en array som rotvärde avvisas', () => {
  const { fel } = parsaTackningsrapport('[]', 'fil.json');
  assert.match(fel, /inte ett objekt/);
});

test('A4 null som rotvärde avvisas (typeof null === "object")', () => {
  const { fel } = parsaTackningsrapport('null', 'fil.json');
  assert.match(fel, /inte ett objekt/);
});

test('A5 okänd schemaVersion avvisas', () => {
  const raw = JSON.stringify({ ...skarva(1, 1, 524), schemaVersion: '9.9' });
  const { fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.match(fel, /schemaVersion '9\.9' känns inte igen/);
});

test('A6 provade som sträng avvisas (ingen tyst Number-tvång)', () => {
  const raw = JSON.stringify({ ...skarva(1, 1, 524), provade: '524' });
  const { fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.match(fel, /'provade'/);
});

test('A7 negativt provade avvisas', () => {
  const raw = JSON.stringify({ ...skarva(1, 1, 0), provade: -1 });
  const { fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.match(fel, /'provade'/);
});

test('A8 provade: 0 är GILTIG form (Playwright tillåter en tom shard)', () => {
  const raw = JSON.stringify(skarva(3, 3, 0));
  const { rapport, fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.equal(fel, null, 'formvalideringen ska inte döma täckning — det gör bedomTackning');
  assert.equal(rapport.provade, 0);
});

test('A9 shardIndex utanför 1..shardTotal avvisas', () => {
  const raw = JSON.stringify({ ...skarva(1, 3, 100), shardIndex: 4 });
  const { fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.match(fel, /utanför 1\.\.3/);
});

test('A10 shardIndex 0 avvisas (nedre gränsen, motsatt riktning mot A9)', () => {
  const raw = JSON.stringify({ ...skarva(1, 3, 100), shardIndex: 0 });
  const { fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.match(fel, /shardIndex 0 ligger utanför 1\.\.3/);
});

test('A11 shardTotal 0 avvisas', () => {
  const raw = JSON.stringify({ ...skarva(1, 1, 0), shardTotal: 0 });
  const { fel } = parsaTackningsrapport(raw, 'fil.json');
  assert.match(fel, /shardTotal/);
});

test('A12 saknat listat-fält avvisas', () => {
  const { listat: _listat, ...utan } = skarva(1, 1, 524);
  const { fel } = parsaTackningsrapport(JSON.stringify(utan), 'fil.json');
  assert.match(fel, /'listat'/);
});

/* ═══════════  B. bedomTackning — GRÖNT (kontrastgruppen)  ═══════════ */

console.log('\nB. bedomTackning — de fall som MÅSTE hålla');

test('B1 tre skärvor vars summa är klassens listade antal håller', () => {
  const dom = bedomTackning([skarva(1, 3, 175), skarva(2, 3, 175), skarva(3, 3, 174)]);
  assert.equal(dom.hallbart, true, JSON.stringify(dom.avvikelser));
  assert.equal(dom.summa, 524);
  assert.equal(dom.listat, 524);
  assert.equal(dom.shardTotal, 3);
});

test('B2 en ENDA skärva 1/1 (urval-ytan och den lokala körningen) håller', () => {
  const dom = bedomTackning([skarva(1, 1, 524)]);
  assert.equal(dom.hallbart, true, JSON.stringify(dom.avvikelser));
  assert.equal(dom.summa, 524);
});

test('B3 en KRYMPT matris där nämnaren följde med håller — täckningen är oskadd', () => {
  // Kontrastgruppen till C1: samma ANTAL rapporter (två), motsatt utfall.
  // Skulle detta fälla hade kontrollen vaktat topologi i stället för täckning,
  // och falsklarmat på varje legitim omkonfigurering av matrisen.
  const dom = bedomTackning([skarva(1, 2, 262), skarva(2, 2, 262)]);
  assert.equal(dom.hallbart, true, JSON.stringify(dom.avvikelser));
  assert.equal(dom.summa, 524);
  assert.equal(dom.shardTotal, 2);
});

test('B4 en TOM skärva fäller inte täckningen när summan ändå går ihop', () => {
  // Playwright undantar uttryckligen `--shard`-läget från sin "no tests found"-
  // fällning (runner/index.js), så en tom shard är per design inget fel. Den
  // enskilda skärvans egen tomhetsspärr är en ANNAN dom och rörs inte här.
  const dom = bedomTackning([skarva(1, 3, 262), skarva(2, 3, 262), skarva(3, 3, 0)]);
  assert.equal(dom.hallbart, true, JSON.stringify(dom.avvikelser));
});

/* ═══════════  C. bedomTackning — RÖTT (varje invariant muterad)  ═══════════ */

console.log('\nC. bedomTackning — de fall som MÅSTE fälla');

test('C1 EN SKÄRVA BORTTAGEN ur en matris på tre fäller (AC #4)', () => {
  // Kärnfallet: nämnaren står kvar på 3, bara två rapporter kom fram.
  const dom = bedomTackning([skarva(1, 3, 175), skarva(2, 3, 175)]);
  assert.equal(dom.hallbart, false);
  assert.equal(dom.summa, 350);
  const text = dom.avvikelser.join('\n');
  assert.match(text, /skärva 3 av 3 SAKNAS/, text);
  assert.match(text, /summan av skärvornas prövade tester är 350/, text);
});

test('C2 rätt antal skärvor men för LITEN summa fäller (filter matchade fel)', () => {
  const dom = bedomTackning([skarva(1, 3, 175), skarva(2, 3, 175), skarva(3, 3, 3)]);
  assert.equal(dom.hallbart, false);
  const text = dom.avvikelser.join('\n');
  assert.match(text, /är 353, men klassen listar 524/, text);
  assert.match(text, /FÄRRE/, text);
  assert.doesNotMatch(text, /SAKNAS/, 'ingen skärva saknas här — skälet ska vara summan');
});

test('C3 för STOR summa fäller också (dubbelräkning, shard som inte filtrerade)', () => {
  const dom = bedomTackning([skarva(1, 3, 524), skarva(2, 3, 524), skarva(3, 3, 524)]);
  assert.equal(dom.hallbart, false);
  assert.match(dom.avvikelser.join('\n'), /FLER/);
});

test('C4 NOLL rapporter fäller (fail-closed på tomhet)', () => {
  const dom = bedomTackning([]);
  assert.equal(dom.hallbart, false);
  assert.match(dom.avvikelser.join('\n'), /noll täckningsrapporter/);
  assert.equal(dom.summa, 0);
});

test('C5 inbördes olika shardTotal fäller', () => {
  const dom = bedomTackning([skarva(1, 3, 175), skarva(2, 2, 349)]);
  assert.equal(dom.hallbart, false);
  assert.match(dom.avvikelser.join('\n'), /OLIKA shardTotal \(2, 3\)/);
});

test('C6 inbördes olika listat fäller (skärvorna såg inte samma träd)', () => {
  const dom = bedomTackning([skarva(1, 2, 262, 524), skarva(2, 2, 262, 530)]);
  assert.equal(dom.hallbart, false);
  assert.match(dom.avvikelser.join('\n'), /OLIKA listat antal \(524, 530\)/);
});

test('C7 listat: 0 fäller även när summan trivialt går ihop', () => {
  const dom = bedomTackning([skarva(1, 1, 0, 0)]);
  assert.equal(dom.hallbart, false);
  assert.match(dom.avvikelser.join('\n'), /listar NOLL tester/);
});

test('C8 dubblerat skärv-index fäller (kan dölja att en annan saknas)', () => {
  const dom = bedomTackning([skarva(1, 3, 175), skarva(1, 3, 175), skarva(2, 3, 174)]);
  assert.equal(dom.hallbart, false);
  const text = dom.avvikelser.join('\n');
  assert.match(text, /index 1 rapporterades FLERA gånger/, text);
  assert.match(text, /skärva 3 av 3 SAKNAS/, text);
});

/* ═══════════════════════  D. CLI — hela vägen  ═══════════════════════ */

console.log('\nD. CLI (scripts/hermetik-tackning.mjs)');

const TRE = [skarva(1, 3, 175), skarva(2, 3, 175), skarva(3, 3, 174)];

test('D1 tre kompletta rapporter ger exit 0', () => {
  const r = korCli([`--katalog=${katalogMed(TRE)}`]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /TÄCKNINGEN HÅLLER/);
  assert.match(r.stdout, /summa 524 · listat 524/);
});

test('D2 SAMMA katalog minus en rapportfil ger exit 1 (AC #4, CLI-nivå)', () => {
  // Minimal mutation av D1: exakt en fil borta, allt annat identiskt.
  const r = korCli([`--katalog=${katalogMed(TRE.slice(0, 2))}`]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /TÄCKNINGEN HÅLLER INTE/);
  assert.match(r.stderr, /skärva 3 av 3 SAKNAS/);
});

test('D3 en tom katalog ger exit 1, inte exit 0', () => {
  const r = korCli([`--katalog=${katalogMed([])}`]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /noll täckningsrapporter/);
});

test('D4 utan --katalog ger exit 2 (CLI-fel, skilt från täckningsbrott)', () => {
  const r = korCli([]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /--katalog=<dir> krävs/);
});

test('D5 en obefintlig katalog ger exit 2', () => {
  const r = korCli([`--katalog=${join(tmp, 'finns-inte-alls')}`]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
});

test('D6 en FIL som --katalog ger exit 2, inte en krasch', () => {
  const fil = join(tmp, 'inte-en-katalog.txt');
  writeFileSync(fil, 'x', 'utf8');
  const r = korCli([`--katalog=${fil}`]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /inte en katalog/);
});

test('D7 en TRASIG rapportfil fäller — räknas aldrig tyst som noll', () => {
  const dir = katalogMed(TRE.slice(0, 2), {
    extraFiler: { 'hermetik-tackning-3.json': '{ inte json' },
  });
  const r = korCli([`--katalog=${dir}`]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /inte giltig JSON/);
});

test('D8 rapporter i EGNA undermappar hittas (download-artifact utan merge-multiple)', () => {
  const r = korCli([`--katalog=${katalogMed(TRE, { underkatalogPerFil: true })}`]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /3 rapportfil\(er\)/);
});

test('D9 filer som inte matchar rapportmönstret ignoreras', () => {
  const dir = katalogMed(TRE, {
    extraFiler: { 'README.md': '# inte en rapport', 'tackning.json': '{ trasig men fel namn' },
  });
  const r = korCli([`--katalog=${dir}`]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('D10 --json ger parsbar utdata i BÅDA utfallen', () => {
  const gron = korCli([`--katalog=${katalogMed(TRE)}`, '--json']);
  assert.equal(gron.status, 0, gron.stderr);
  const g = JSON.parse(gron.stdout);
  assert.equal(g.hallbart, true);
  assert.equal(g.summa, 524);
  assert.equal(g.skarvor.length, 3);

  const rod = korCli([`--katalog=${katalogMed(TRE.slice(0, 2))}`, '--json']);
  assert.equal(rod.status, 1, rod.stderr);
  const rr = JSON.parse(rod.stdout);
  assert.equal(rr.hallbart, false);
  assert.equal(rr.summa, 350);
  assert.ok(rr.avvikelser.length > 0);
});

/* ═════════════  E. parsaShard (scripts/hermetik-sjalvtest.mjs)  ═════════════ */

console.log('\nE. parsaShard');

test('E1 utan --shard blir det no-op-skärvan 1/1', () => {
  const r = parsaShard(null);
  assert.deepEqual([r.shardIndex, r.shardTotal, r.fel], [1, 1, null]);
});

test('E2 "2/3" tolkas', () => {
  const r = parsaShard('2/3');
  assert.deepEqual([r.shardIndex, r.shardTotal, r.fel], [2, 3, null]);
});

test('E3 "0/3" avvisas', () => {
  assert.match(parsaShard('0/3').fel, /I måste ligga i 1\.\.3/);
});

test('E4 "4/3" avvisas', () => {
  assert.match(parsaShard('4/3').fel, /I måste ligga i 1\.\.3/);
});

test('E5 "2/0" avvisas', () => {
  assert.match(parsaShard('2/0').fel, /N måste vara >= 1/);
});

test('E6 skräpvärde avvisas i stället för att tyst ignoreras', () => {
  // Ett tyst ignorerat shard-argument hade kört HELA klassen i varje skärva:
  // tre gånger arbetet och en summa på 3×listat.
  assert.match(parsaShard('abc').fel, /väntad form I\/N/);
  assert.match(parsaShard('2/3/4').fel, /väntad form I\/N/);
  assert.match(parsaShard('').fel, /väntad form I\/N/);
});

/* ═════════════════  F. byggTackningsrapport  ═════════════════ */

console.log('\nF. byggTackningsrapport');

test('F1 bygger en rapport som dess egen parser accepterar (rundtur)', () => {
  const r = byggTackningsrapport({
    shardIndex: 1,
    shardTotal: 3,
    provade: 175,
    listat: 524,
    projekt: 'acceptance',
    filter: ['acceptance/x.test.ts'],
  });
  const { rapport, fel } = parsaTackningsrapport(JSON.stringify(r), 'rundtur.json');
  assert.equal(fel, null);
  assert.deepEqual(rapport.filter, ['acceptance/x.test.ts']);
  assert.equal(rapport.schemaVersion, TACKNING_SCHEMA_VERSION);
});

test('F2 filter kopieras, inte delas (ingen aliasing mot anroparens array)', () => {
  const filter = ['a.test.ts'];
  const r = byggTackningsrapport({
    shardIndex: 1,
    shardTotal: 1,
    provade: 1,
    listat: 1,
    projekt: 'acceptance',
    filter,
  });
  filter.push('b.test.ts');
  assert.deepEqual(r.filter, ['a.test.ts']);
});

rmSync(tmp, { recursive: true, force: true });

console.log(`\n${passed} gröna, ${failed} röda.`);
process.exit(failed > 0 ? 1 : 0);
