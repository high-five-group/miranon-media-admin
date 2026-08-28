#!/usr/bin/env node
// scripts/test-review-backstopp.mjs — tester för CI-backstoppen
// (TASK-173.4: scripts/lib/review-backstopp.mjs + scripts/review-backstopp.mjs).
//
// Samma konvention som syskonen scripts/test-review-risk-sektion.mjs och
// scripts/test-review-loop.mjs: de PURA funktionerna importeras direkt
// (sektion A–C), och ett CLI-lager prövar exit-koderna via spawnSync
// (sektion D–E) — annars vore pure-function-testerna förenliga med ett CLI
// som alltid returnerar 0.
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT ═══
// Varje invariant prövas i BÅDA riktningar: brytet → FÄLLER med rätt kod,
// den rättade formen → SLÄPPER. Ett ensidigt "saknad sektion fälls" vore
// vakuöst — en implementation som alltid fäller hade också "bevisat" det.
//
// ═══ SEKTION C ÄR KOPPLINGS-TESTET, INTE EN DUBBLETT ═══
// Backstoppen PARSAR den text 173.3:s rendrerare SKRIVER. De två sitter i
// olika moduler och kan drifta isär utan att någondera sviten märker det.
// Sektion C stänger den fogen: den bygger ett zod-VALIDERAT utlåtande, kör
// det genom den ÄKTA `byggSektion()` och kräver att backstoppen accepterar
// resultatet — för alla tre risknivåer. Ändrar någon rendrerarens meta-rad
// eller fotnot fälls sektion C, inte produktionen.
//
// ═══ SEKTION E: FAKE `gh` PÅ PATH ═══
// Samma disciplin som test-review-risk-sektion.mjs sektion F: CLI:t körs som
// riktig subprocess mot en FAKE `gh`-binär först i PATH, så hela kedjan
// (merge_group-ref → PR-nummer → gh-hämtning → verdikt → exit-kod) täcks
// utan nätverk eller gh-konto. KONTRAST-fallet (fake gh som fallerar → exit
// 3, aldrig 0) ingår — utan det vore det positiva fallet vakuöst.
//
// Kör: node scripts/test-review-backstopp.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsaMergeGroupRef, provaPrKropp, VERDIKT } from './lib/review-backstopp.mjs';
import { byggSektion, MARKER_END, MARKER_START } from './lib/review-risk-sektion.mjs';
import { valideraUtlatande } from './lib/review-utlatande.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(REPO, 'scripts', 'review-backstopp.mjs');
const FIXTUR_MED = join(REPO, 'tests', 'fixtures', 'review-backstopp', 'pr-2031-med-sektion.txt');
const FIXTUR_UTAN = join(REPO, 'tests', 'fixtures', 'review-backstopp', 'pr-2031-utan-sektion.txt');

/** Fixturens sanna identitet — PR #2031:s faktiska head vid granskningen
 * (`gh pr view 2031 --json headRefOid`, 2026-08-28). Fixturen är PR-kroppen
 * VERBATIM från en riktigt granskad PR, inte en syntetisk konstruktion. */
const FIXTUR_PR = 2031;
const FIXTUR_HEAD = 'd11a2f205c4cece5cbaa1abe5847addd35558ff9';

let passed = 0;
let failed = 0;
const fel = [];

function test(namn, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    fel.push(`${namn}\n    ${err.message.split('\n').join('\n    ')}`);
  }
}

function kor(args, options = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', ...options });
}

/** Bygger ett minimalt men SCHEMA-GILTIGT utlåtande (går genom zod). */
function utlatande(overrides = {}) {
  const raw = {
    schemaVersion: '1.0',
    kortId: 'TASK-173.4',
    prNummer: 4242,
    granskadSha: 'abc1234def5678',
    runda: 1,
    intentKalla: 'kort',
    intentKonfidens: 'hog',
    acProvning: [],
    fynd: [],
    risk: { niva: 'lag', motivering: 'Ingen funktionell ändring.' },
    ...overrides,
  };
  const res = valideraUtlatande(raw);
  assert.equal(res.ok, true, `testets eget utlåtande validerade inte: ${res.errors.join('; ')}`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEKTION A — provaPrKropp: den GRÖNA riktningen
// ═══════════════════════════════════════════════════════════════════════════

test('A1: verklig PR-kropp med giltig sektion SLÄPPER', () => {
  const kropp = readFileSync(FIXTUR_MED, 'utf8');
  const v = provaPrKropp({ kropp, prNummer: FIXTUR_PR, headSha: FIXTUR_HEAD });
  assert.equal(v.ok, true, `väntade ok, fick ${v.kod}: ${v.skal}`);
  assert.equal(v.kod, VERDIKT.OK);
  assert.equal(v.sektion.niva, 'lag');
  assert.equal(v.sektion.runda, 1);
  assert.equal(v.sektion.granskadSha, FIXTUR_HEAD);
  assert.equal(v.sektion.schemaVersion, '1.0');
});

test('A2: sektionen får stå MITT i en kropp med annat innehåll runt omkring', () => {
  const kropp = `# Rubrik\n\nProsa före.\n\n${byggSektion(utlatande())}\n\nProsa efter.\n`;
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.ok, true, `väntade ok, fick ${v.kod}: ${v.skal}`);
});

test('A3: head-SHA längre än granskadSha (prefix-match) SLÄPPER', () => {
  const kropp = byggSektion(utlatande({ granskadSha: 'abc1234' }));
  const v = provaPrKropp({
    kropp,
    prNummer: 4242,
    headSha: 'abc1234def567890123456789012345678901234',
  });
  assert.equal(v.ok, true, `väntade ok, fick ${v.kod}: ${v.skal}`);
});

test('A4: SHA-jämförelsen är skiftlägesokänslig', () => {
  const kropp = byggSektion(utlatande({ granskadSha: 'ABC1234DEF5678' }));
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.ok, true, `väntade ok, fick ${v.kod}: ${v.skal}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// SEKTION B — provaPrKropp: varje FÄLLANDE invariant, med sin egen kod
// ═══════════════════════════════════════════════════════════════════════════

test('B1: verklig PR-kropp UTAN sektion fälls som SAKNAS', () => {
  const kropp = readFileSync(FIXTUR_UTAN, 'utf8');
  const v = provaPrKropp({ kropp, prNummer: FIXTUR_PR, headSha: FIXTUR_HEAD });
  assert.equal(v.ok, false);
  assert.equal(v.kod, VERDIKT.SAKNAS);
  assert.ok(v.atgard.length > 0, 'ett fällande verdikt måste bära en åtgärd');
});

test('B2: tom kropp fälls som SAKNAS', () => {
  for (const kropp of ['', null, undefined]) {
    const v = provaPrKropp({ kropp, prNummer: 1, headSha: 'abc1234' });
    assert.equal(v.ok, false);
    assert.equal(v.kod, VERDIKT.SAKNAS);
  }
});

test('B3: bara STARTmarkör fälls som KORRUPTA_MARKORER', () => {
  const v = provaPrKropp({
    kropp: `text\n${MARKER_START}\n## Riskbedömning\n`,
    prNummer: 1,
    headSha: 'abc1234',
  });
  assert.equal(v.kod, VERDIKT.KORRUPTA_MARKORER);
});

test('B4: bara SLUTmarkör fälls som KORRUPTA_MARKORER', () => {
  const v = provaPrKropp({ kropp: `text\n${MARKER_END}\n`, prNummer: 1, headSha: 'abc1234' });
  assert.equal(v.kod, VERDIKT.KORRUPTA_MARKORER);
});

test('B5: markörer i FEL ORDNING fälls som KORRUPTA_MARKORER', () => {
  const v = provaPrKropp({
    kropp: `${MARKER_END}\ninnehåll\n${MARKER_START}`,
    prNummer: 1,
    headSha: 'abc1234',
  });
  assert.equal(v.kod, VERDIKT.KORRUPTA_MARKORER);
});

test('B6: TVÅ markörpar fälls som KORRUPTA_MARKORER', () => {
  const s = byggSektion(utlatande());
  const v = provaPrKropp({ kropp: `${s}\n\n${s}`, prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.kod, VERDIKT.KORRUPTA_MARKORER);
});

test('B7: markörer med tom insida fälls som OPARSBAR_RUBRIK', () => {
  const v = provaPrKropp({
    kropp: `${MARKER_START}\n${MARKER_END}`,
    prNummer: 1,
    headSha: 'abc1234',
  });
  assert.equal(v.kod, VERDIKT.OPARSBAR_RUBRIK);
});

test('B8: handskriven prosa mellan markörerna fälls som OPARSBAR_RUBRIK', () => {
  const v = provaPrKropp({
    kropp: `${MARKER_START}\n## Riskbedömning\n\nRisken är låg, litar på mig.\n${MARKER_END}`,
    prNummer: 1,
    headSha: 'abc1234',
  });
  assert.equal(v.kod, VERDIKT.OPARSBAR_RUBRIK);
});

test('B9: OKÄND risketikett fälls som OKAND_NIVA', () => {
  const kropp = byggSektion(utlatande()).replace('🟢 LÅG', '🟣 OKÄND');
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.kod, VERDIKT.OKAND_NIVA);
});

test('B10: borttagen fotnot fälls som OPARSBAR_FOTNOT', () => {
  const kropp = byggSektion(utlatande()).replace(/<sub>Genererat av review-agent[^\n]*\n?/, '');
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.kod, VERDIKT.OPARSBAR_FOTNOT);
});

test('B11: sektion renderad för en ANNAN PR fälls som FEL_PR', () => {
  const kropp = byggSektion(utlatande({ prNummer: 9999 }));
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.kod, VERDIKT.FEL_PR);
});

test('B12: sektion från en TIDIGARE commit fälls som STALE', () => {
  const kropp = byggSektion(utlatande({ granskadSha: 'aaaaaaa1111111' }));
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'bbbbbbb2222222' });
  assert.equal(v.kod, VERDIKT.STALE);
});

test('B13: KONTRAST till B12 — samma kropp mot RÄTT head SLÄPPER', () => {
  const kropp = byggSektion(utlatande({ granskadSha: 'aaaaaaa1111111' }));
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'aaaaaaa1111111' });
  assert.equal(v.ok, true, `väntade ok, fick ${v.kod}: ${v.skal}`);
});

test('B14: för KORT granskadSha (< 7 tecken) fälls som STALE även vid prefix-träff', () => {
  const kropp = byggSektion(utlatande()).replace('`abc1234def5678`', '`abc12`');
  const v = provaPrKropp({ kropp, prNummer: 4242, headSha: 'abc12345678' });
  assert.equal(v.kod, VERDIKT.STALE);
});

test('B15: verklig fixtur mot FEL head fälls som STALE (inte tyst godkänd)', () => {
  const kropp = readFileSync(FIXTUR_MED, 'utf8');
  const v = provaPrKropp({
    kropp,
    prNummer: FIXTUR_PR,
    headSha: '0000000000000000000000000000000000000000',
  });
  assert.equal(v.kod, VERDIKT.STALE);
});

test('B16: verklig fixtur mot FEL PR-nummer fälls som FEL_PR', () => {
  const kropp = readFileSync(FIXTUR_MED, 'utf8');
  const v = provaPrKropp({ kropp, prNummer: 1234, headSha: FIXTUR_HEAD });
  assert.equal(v.kod, VERDIKT.FEL_PR);
});

test('B17: varje fällande verdikt bär kod, skäl OCH åtgärd — aldrig tyst', () => {
  const fallande = [
    provaPrKropp({ kropp: '', prNummer: 1, headSha: 'abc1234' }),
    provaPrKropp({ kropp: MARKER_START, prNummer: 1, headSha: 'abc1234' }),
    provaPrKropp({
      kropp: `${MARKER_START}\n${MARKER_END}`,
      prNummer: 1,
      headSha: 'abc1234',
    }),
    provaPrKropp({ kropp: byggSektion(utlatande({ prNummer: 1 })), prNummer: 2, headSha: 'x' }),
  ];
  for (const v of fallande) {
    assert.equal(v.ok, false);
    assert.ok(typeof v.kod === 'string' && v.kod.length > 0);
    assert.ok(typeof v.skal === 'string' && v.skal.length > 0);
    assert.ok(typeof v.atgard === 'string' && v.atgard.length > 0);
    assert.equal(v.sektion, null);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEKTION C — KOPPLINGEN rendrerare ⇄ backstopp (drift-vakten)
// ═══════════════════════════════════════════════════════════════════════════

test('C1: alla tre risknivåer renderade av den ÄKTA rendreraren accepteras', () => {
  for (const niva of ['lag', 'medel', 'hog']) {
    const u = utlatande({ risk: { niva, motivering: 'Motivering.' } });
    const v = provaPrKropp({ kropp: byggSektion(u), prNummer: 4242, headSha: 'abc1234def5678' });
    assert.equal(v.ok, true, `nivå '${niva}' avvisades: ${v.kod} — ${v.skal}`);
    assert.equal(v.sektion.niva, niva, `nivå '${niva}' lästes tillbaka som '${v.sektion.niva}'`);
  }
});

test('C2: HÖG risk fälls INTE av backstoppen (armeringsregeln är Marcus, inte grindens)', () => {
  const u = utlatande({ risk: { niva: 'hog', motivering: 'Rör prod-vägen.' } });
  const v = provaPrKropp({ kropp: byggSektion(u), prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.ok, true, `hög risk fälldes av backstoppen: ${v.kod}`);
});

test('C3: ett 173.1-format utan policySha/policyRegler accepteras', () => {
  // Bakåtkompatibilitet: zods .default() fyller fälten, rendreraren utelämnar
  // fotnoten, och backstoppen får ändå en läsbar sektion.
  const u = utlatande();
  assert.equal(u.policySha, null);
  assert.deepEqual(u.policyRegler, []);
  const v = provaPrKropp({ kropp: byggSektion(u), prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.ok, true, `utan policy-fält avvisades: ${v.kod} — ${v.skal}`);
});

test('C4: fynd med pipe-tecken och radbrytningar bryter inte parsningen', () => {
  const u = utlatande({
    runda: 2,
    fynd: [
      {
        beskrivning: 'Rad ett\nRad två | med pipe',
        severity: 'warning',
        action: 'ask-user',
        plats: { fil: 'src/a.ts', rad: 12 },
        bevis: [
          {
            kommando: 'git log --oneline | grep foo',
            utdrag: '',
            exitkod: 0,
            runIdEllerSha: 'abc1234def5678',
          },
        ],
      },
    ],
  });
  const v = provaPrKropp({ kropp: byggSektion(u), prNummer: 4242, headSha: 'abc1234def5678' });
  assert.equal(v.ok, true, `fynd med metatecken avvisades: ${v.kod} — ${v.skal}`);
  assert.equal(v.sektion.runda, 2);
});

// ═══════════════════════════════════════════════════════════════════════════
// SEKTION D — parsaMergeGroupRef
// ═══════════════════════════════════════════════════════════════════════════

test('D1: verkliga kö-refer (mätta 2026-08-28) parsas', () => {
  const verkliga = [
    ['refs/heads/gh-readonly-queue/main/pr-2033-7a0a2a46d910d221233f5774e9d084e95af4e35d', 2033],
    ['gh-readonly-queue/main/pr-2019-c9920e4047fe8f849e06be25a15d9081b3f6f3bc', 2019],
    ['refs/heads/gh-readonly-queue/main/pr-1-0000000000000000000000000000000000000000', 1],
  ];
  for (const [ref, vantat] of verkliga) {
    const r = parsaMergeGroupRef(ref);
    assert.equal(r.ok, true, `ref '${ref}' parsades inte: ${r.fel}`);
    assert.equal(r.prNummer, vantat);
  }
});

test('D2: främmande ref-former fälls FAIL-CLOSED (aldrig gissat PR-nummer)', () => {
  const trasiga = [
    '',
    null,
    undefined,
    'refs/heads/main',
    'refs/heads/feat/nagot-pr-123-abcdef1',
    'gh-readonly-queue/main/pr-abc-1234567',
    'gh-readonly-queue/main/pr-2033',
    'gh-readonly-queue/main/pr-2033-xyz',
    'gh-readonly-queue/main/sub/pr-2033-abcdef1234567',
  ];
  for (const ref of trasiga) {
    const r = parsaMergeGroupRef(ref);
    assert.equal(r.ok, false, `ref '${ref}' borde ha fällts men gav ${r.prNummer}`);
    assert.equal(r.prNummer, null);
    assert.ok(r.fel.length > 0);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEKTION E — CLI:ts exit-koder (offline-läget)
// ═══════════════════════════════════════════════════════════════════════════

test('E1: giltig sektion ⇒ exit 0', () => {
  const r = kor(['--pr', String(FIXTUR_PR), '--head-sha', FIXTUR_HEAD, '--kropp-fil', FIXTUR_MED]);
  assert.equal(r.status, 0, `exit ${r.status}: ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /✅ Review-backstopp/);
});

test('E2: saknad sektion ⇒ exit 1 (grinden FÄLLER)', () => {
  const r = kor(['--pr', String(FIXTUR_PR), '--head-sha', FIXTUR_HEAD, '--kropp-fil', FIXTUR_UTAN]);
  assert.equal(r.status, 1, `exit ${r.status}: ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /FÄLLER/);
  assert.match(r.stdout, /saknas/);
});

test('E3: --json ger maskinläsbart verdikt i BÅDA riktningar', () => {
  const gron = kor([
    '--pr',
    String(FIXTUR_PR),
    '--head-sha',
    FIXTUR_HEAD,
    '--kropp-fil',
    FIXTUR_MED,
    '--json',
  ]);
  assert.equal(gron.status, 0);
  const g = JSON.parse(gron.stdout);
  assert.equal(g.ok, true);
  assert.equal(g.kod, 'ok');
  assert.equal(g.prNummer, FIXTUR_PR);

  const rod = kor([
    '--pr',
    String(FIXTUR_PR),
    '--head-sha',
    FIXTUR_HEAD,
    '--kropp-fil',
    FIXTUR_UTAN,
    '--json',
  ]);
  assert.equal(rod.status, 1);
  const d = JSON.parse(rod.stdout);
  assert.equal(d.ok, false);
  assert.equal(d.kod, 'saknas');
});

test('E4: felaktig CLI-användning ⇒ exit 2 (aldrig 0, aldrig 1)', () => {
  const fall = [
    [],
    ['--pr'],
    ['--pr', 'noll', '--head-sha', 'abc1234', '--kropp-fil', FIXTUR_MED],
    ['--pr', '1', '--head-sha', 'abc1234'],
    ['--pr', '1', '--kropp-fil', FIXTUR_MED],
    ['--merge-group-ref', 'refs/heads/main'],
    ['--merge-group-ref', 'gh-readonly-queue/main/pr-1-abcdef1', '--pr', '1'],
    ['positional'],
  ];
  for (const args of fall) {
    const r = kor(args);
    assert.equal(r.status, 2, `args ${JSON.stringify(args)} gav exit ${r.status}`);
  }
});

test('E5: oläsbar --kropp-fil ⇒ exit 3 (I/O), inte 1', () => {
  const r = kor(['--pr', '1', '--head-sha', 'abc1234', '--kropp-fil', '/finns/inte/alls.txt']);
  assert.equal(r.status, 3, `exit ${r.status}: ${r.stdout}${r.stderr}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// SEKTION F — hela kedjan mot en FAKE `gh` på PATH
// ═══════════════════════════════════════════════════════════════════════════

function medFakeGh(skript, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'review-backstopp-gh-'));
  try {
    const bin = join(dir, 'gh');
    writeFileSync(bin, skript, 'utf8');
    chmodSync(bin, 0o755);
    fn({ dir, env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}` } });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('F1: merge_group-ref → PR-nummer → gh-hämtning → exit 0 på giltig sektion', () => {
  const kropp = readFileSync(FIXTUR_MED, 'utf8');
  const svar = JSON.stringify({ body: kropp, headRefOid: FIXTUR_HEAD });
  medFakeGh(`#!/bin/sh\ncat <<'GHEOF'\n${svar}\nGHEOF\n`, ({ env }) => {
    const r = kor(
      [
        '--merge-group-ref',
        `refs/heads/gh-readonly-queue/main/pr-${FIXTUR_PR}-${'a'.repeat(40)}`,
        '--json',
      ],
      { env },
    );
    assert.equal(r.status, 0, `exit ${r.status}: ${r.stdout}${r.stderr}`);
    const d = JSON.parse(r.stdout);
    assert.equal(d.prNummer, FIXTUR_PR);
    assert.equal(d.headSha, FIXTUR_HEAD);
    assert.equal(d.ok, true);
  });
});

test('F2: samma kedja, kropp UTAN sektion ⇒ exit 1', () => {
  const kropp = readFileSync(FIXTUR_UTAN, 'utf8');
  const svar = JSON.stringify({ body: kropp, headRefOid: FIXTUR_HEAD });
  medFakeGh(`#!/bin/sh\ncat <<'GHEOF'\n${svar}\nGHEOF\n`, ({ env }) => {
    const r = kor(
      ['--merge-group-ref', `gh-readonly-queue/main/pr-${FIXTUR_PR}-${'b'.repeat(40)}`],
      { env },
    );
    assert.equal(r.status, 1, `exit ${r.status}: ${r.stdout}${r.stderr}`);
  });
});

test('F3: KONTRAST — fake gh som FALLERAR ⇒ exit 3, aldrig 0', () => {
  medFakeGh(
    '#!/bin/sh\necho "gh: could not resolve to a PullRequest" 1>&2\nexit 1\n',
    ({ env }) => {
      const r = kor(['--pr', '4242'], { env });
      assert.equal(r.status, 3, `exit ${r.status}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, /Kunde inte hämta PR/);
    },
  );
});

test('F4: KONTRAST — fake gh som ger SKRÄP-JSON ⇒ exit 3, aldrig 0', () => {
  medFakeGh('#!/bin/sh\necho "inte json"\n', ({ env }) => {
    const r = kor(['--pr', '4242'], { env });
    assert.equal(r.status, 3, `exit ${r.status}: ${r.stdout}${r.stderr}`);
  });
});

test('F5: KONTRAST — gh-svar utan headRefOid ⇒ exit 3 (gissar aldrig head)', () => {
  medFakeGh(`#!/bin/sh\necho '{"body":"tomt"}'\n`, ({ env }) => {
    const r = kor(['--pr', '4242'], { env });
    assert.equal(r.status, 3, `exit ${r.status}: ${r.stdout}${r.stderr}`);
  });
});

test('F6: PATH-riggen är INTE vakuös — fake gh anropas faktiskt', () => {
  const dir = mkdtempSync(join(tmpdir(), 'review-backstopp-spar-'));
  try {
    mkdirSync(join(dir, 'bin'), { recursive: true });
    const spar = join(dir, 'anropad.txt');
    const bin = join(dir, 'bin', 'gh');
    writeFileSync(bin, `#!/bin/sh\necho "$@" > ${spar}\necho '{"body":"","headRefOid":"x"}'\n`);
    chmodSync(bin, 0o755);
    const env = { ...process.env, PATH: `${join(dir, 'bin')}${delimiter}${process.env.PATH}` };
    kor(['--pr', '4242'], { env });
    const argrad = readFileSync(spar, 'utf8');
    assert.match(argrad, /pr view 4242/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ═══════════════════════════════════════════════════════════════════════════

process.stdout.write(`\nreview-backstopp: ${passed} gröna, ${failed} röda\n`);
if (failed > 0) {
  process.stdout.write('\nRÖDA:\n');
  for (const f of fel) process.stdout.write(`  ✗ ${f}\n`);
  process.exit(1);
}
process.exit(0);
