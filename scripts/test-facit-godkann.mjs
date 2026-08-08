#!/usr/bin/env node
// scripts/test-facit-godkann.mjs — tester för scripts/facit-godkann.mjs
// (ADR-104 § Beslut 2, TASK-167). Samma konvention som
// scripts/test-seed-review-fixture.mjs: pura funktioner testas direkt,
// main() testas end-to-end mot en hermetisk /tmp-sandlåda (ingen påverkan
// på det verkliga repots facit-manifest).
//
// Kör: node scripts/test-facit-godkann.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// TVÅSIDIGT (AC #1): varje felväg (okänt pass, redan satt fält utan
// --ersatt, tomt citat, trasig undantags-form, trasig JSON, saknad/
// ofullständig policy) prövas BÅDE i sitt röda OCH sitt gröna läge — ett
// skript som bara bevisats skriva rätt är inte bevisat, det kan vara blint
// för sina egna felvägar (samma L43-disciplin som scripts/test-check-facit.sh).

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lasPolicy, main, parseArgs, renderHelp, tillampaGodkannande } from './facit-godkann.mjs';

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

// ===========================================================================
// parseArgs
// ===========================================================================

t('parseArgs: minimal giltigt anrop', () => {
  const args = parseArgs(['--pass', 's93-hallplats-prototyp', '--citat', 'Jag är nöjd.']);
  assert.equal(args.pass, 's93-hallplats-prototyp');
  assert.equal(args.citat, 'Jag är nöjd.');
  assert.equal(args.ersatt, false);
  assert.deepEqual(args.undantag, []);
});

t('parseArgs: --ersatt sätter flaggan', () => {
  const args = parseArgs(['--pass', 'x', '--citat', 'y', '--ersatt']);
  assert.equal(args.ersatt, true);
});

t('parseArgs: ett --undantag/--skal-par', () => {
  const args = parseArgs([
    '--pass',
    'x',
    '--citat',
    'y',
    '--undantag',
    'atgarder',
    '--skal',
    'Facit är körande prototyp.',
  ]);
  assert.deepEqual(args.undantag, [{ yta: 'atgarder', skal: 'Facit är körande prototyp.' }]);
});

t('parseArgs: flera --undantag/--skal-par upprepningsbara', () => {
  const args = parseArgs([
    '--pass',
    'x',
    '--citat',
    'y',
    '--undantag',
    'a',
    '--skal',
    'skäl a',
    '--undantag',
    'b',
    '--skal',
    'skäl b',
  ]);
  assert.deepEqual(args.undantag, [
    { yta: 'a', skal: 'skäl a' },
    { yta: 'b', skal: 'skäl b' },
  ]);
});

t('parseArgs: saknat --pass kastar', () => {
  assert.throws(() => parseArgs(['--citat', 'y']), /--pass/);
});

t('parseArgs: saknat --citat kastar', () => {
  assert.throws(() => parseArgs(['--pass', 'x']), /--citat/);
});

t('parseArgs: tomt --citat (whitespace) kastar', () => {
  assert.throws(() => parseArgs(['--pass', 'x', '--citat', '   ']), /--citat/);
});

t('parseArgs: okänd flagga kastar', () => {
  assert.throws(() => parseArgs(['--pass', 'x', '--citat', 'y', '--okand']), /Okänd flagga/);
});

t('parseArgs: --undantag utan matchande --skal kastar', () => {
  assert.throws(
    () => parseArgs(['--pass', 'x', '--citat', 'y', '--undantag', 'a', '--annat', 'b']),
    /--skal/,
  );
});

t('parseArgs: --undantag med tomt yta-namn kastar', () => {
  assert.throws(
    () => parseArgs(['--pass', 'x', '--citat', 'y', '--undantag', '', '--skal', 'skäl']),
    /yta-namn/,
  );
});

t('parseArgs: --undantag med tomt skäl kastar', () => {
  assert.throws(
    () => parseArgs(['--pass', 'x', '--citat', 'y', '--undantag', 'a', '--skal', '  ']),
    /skal/,
  );
});

// ===========================================================================
// tillampaGodkannande — PUR funktion
// ===========================================================================

const NU = new Date('2026-08-08T10:00:00.000Z');
const BAS_MANIFEST = {
  prototyp: 's93-test',
  last: '2026-08-06',
  lasning: 'Lås som facit.',
  godkand: null,
  ytor: [{ yta: 'x', bilder: [], kallor: ['src/x.tsx'] }],
};

t('tillampaGodkannande: godkand null -> stämplar korrekt schema', () => {
  const args = { pass: 'p', citat: 'Jag är nöjd.', ersatt: false, undantag: [] };
  const resultat = tillampaGodkannande(BAS_MANIFEST, args, { sha: 'abc1234', nu: NU });
  assert.deepEqual(resultat.godkand, {
    av: 'marcus',
    datum: '2026-08-08',
    citat: 'Jag är nöjd.',
    sha: 'abc1234',
  });
});

t('tillampaGodkannande: övriga fält lämnas orörda', () => {
  const args = { pass: 'p', citat: 'y', ersatt: false, undantag: [] };
  const resultat = tillampaGodkannande(BAS_MANIFEST, args, { sha: 'abc1234', nu: NU });
  assert.equal(resultat.prototyp, BAS_MANIFEST.prototyp);
  assert.equal(resultat.last, BAS_MANIFEST.last);
  assert.equal(resultat.lasning, BAS_MANIFEST.lasning);
  assert.deepEqual(resultat.ytor, BAS_MANIFEST.ytor);
});

t('tillampaGodkannande: undantag inkluderas när angivet', () => {
  const args = {
    pass: 'p',
    citat: 'y',
    ersatt: false,
    undantag: [{ yta: 'atgarder', skal: 'körande prototyp' }],
  };
  const resultat = tillampaGodkannande(BAS_MANIFEST, args, { sha: 'abc1234', nu: NU });
  assert.deepEqual(resultat.godkand.undantag, [{ yta: 'atgarder', skal: 'körande prototyp' }]);
});

t('tillampaGodkannande: inget undantag-nyckel när tomt', () => {
  const args = { pass: 'p', citat: 'y', ersatt: false, undantag: [] };
  const resultat = tillampaGodkannande(BAS_MANIFEST, args, { sha: 'abc1234', nu: NU });
  assert.equal('undantag' in resultat.godkand, false);
});

t('tillampaGodkannande: redan satt UTAN --ersatt kastar', () => {
  const godkant = {
    ...BAS_MANIFEST,
    godkand: { av: 'marcus', datum: '2026-08-01', citat: 'x', sha: 'zzz' },
  };
  const args = { pass: 'p', citat: 'y', ersatt: false, undantag: [] };
  assert.throws(() => tillampaGodkannande(godkant, args, { sha: 'abc', nu: NU }), /redan satt/);
});

t('tillampaGodkannande: redan satt MED --ersatt skriver över', () => {
  const godkant = {
    ...BAS_MANIFEST,
    godkand: { av: 'marcus', datum: '2026-08-01', citat: 'gammal', sha: 'zzz' },
  };
  const args = { pass: 'p', citat: 'ny motivering', ersatt: true, undantag: [] };
  const resultat = tillampaGodkannande(godkant, args, { sha: 'nysha', nu: NU });
  assert.equal(resultat.godkand.citat, 'ny motivering');
  assert.equal(resultat.godkand.sha, 'nysha');
});

t('tillampaGodkannande: manifest som inte är ett objekt kastar', () => {
  const args = { pass: 'p', citat: 'y', ersatt: false, undantag: [] };
  assert.throws(() => tillampaGodkannande(['inte', 'ett', 'objekt'], args, { sha: 'x' }), /objekt/);
  assert.throws(() => tillampaGodkannande(null, args, { sha: 'x' }), /objekt/);
});

t('tillampaGodkannande: saknad sha kastar', () => {
  const args = { pass: 'p', citat: 'y', ersatt: false, undantag: [] };
  assert.throws(() => tillampaGodkannande(BAS_MANIFEST, args, { sha: '', nu: NU }), /sha/);
});

// ===========================================================================
// lasPolicy
// ===========================================================================

const POLICY_SANDBOX = mkdtempSync(join(tmpdir(), 'facit-godkann-policy-'));
t('lasPolicy: läser citerade FACIT_-nycklar', () => {
  const p = join(POLICY_SANDBOX, '.facit-policy.conf');
  writeFileSync(
    p,
    [
      '# kommentar ska ignoreras',
      'FACIT_BILAGE_ROT="tasks/sessions/bilagor"',
      'FACIT_MANIFEST_NAMN="facit.json"',
      'FACIT_PROTO_SOKVAG="src"',
    ].join('\n'),
  );
  const varden = lasPolicy(p);
  assert.equal(varden.FACIT_BILAGE_ROT, 'tasks/sessions/bilagor');
  assert.equal(varden.FACIT_MANIFEST_NAMN, 'facit.json');
  assert.equal(varden.FACIT_PROTO_SOKVAG, 'src');
});

t('lasPolicy: den SKARPA .facit-policy.conf har de nycklar skriptet kräver', () => {
  const varden = lasPolicy(new URL('../.facit-policy.conf', import.meta.url).pathname);
  assert.ok(varden.FACIT_BILAGE_ROT, 'FACIT_BILAGE_ROT måste finnas i den skarpa policyn');
  assert.ok(varden.FACIT_MANIFEST_NAMN, 'FACIT_MANIFEST_NAMN måste finnas i den skarpa policyn');
});
rmSync(POLICY_SANDBOX, { recursive: true, force: true });

// ===========================================================================
// main() — end-to-end mot en hermetisk /tmp-sandlåda, ETT äkta git-repo
// (resolveMainSha kräver `git rev-parse`). Rör ALDRIG det verkliga repot.
// ===========================================================================

const SANDBOX = mkdtempSync(join(tmpdir(), 'facit-godkann-main-'));
const BILAGE_ROT = join(SANDBOX, 'bilagor');
const PASS_DIR = join(BILAGE_ROT, 'test-pass');
const MANIFEST_PATH = join(PASS_DIR, 'facit.json');

function skrivFixturPolicy() {
  writeFileSync(
    join(SANDBOX, '.facit-policy.conf'),
    'FACIT_BILAGE_ROT="bilagor"\nFACIT_MANIFEST_NAMN="facit.json"\n',
  );
}

function nollstallManifest() {
  mkdirSync(PASS_DIR, { recursive: true });
  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(
      {
        prototyp: 'test-pass',
        last: '2026-08-06',
        lasning: 'Lås som facit.',
        godkand: null,
        ytor: [{ yta: 'x', bilder: [], kallor: ['src/x.tsx'] }],
      },
      null,
      2,
    )}\n`,
  );
}

(() => {
  skrivFixturPolicy();
  nollstallManifest();
  execFileSync('git', ['init', '-q'], { cwd: SANDBOX });
  execFileSync('git', ['config', 'user.email', 'test@test.invalid'], { cwd: SANDBOX });
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: SANDBOX });
  execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: SANDBOX });
})();

// korMain — fångar console-utdata + exitCode, återställer process.exitCode
// efteråt så ett rött testfall inte smittar testskriptets EGEN exitkod.
function korMain(argv) {
  const foreExitCode = process.exitCode;
  process.exitCode = undefined;
  const consoleLog = console.log;
  const consoleErr = console.error;
  const loggat = [];
  const felloggat = [];
  console.log = (...a) => loggat.push(a.join(' '));
  console.error = (...a) => felloggat.push(a.join(' '));
  let kod;
  try {
    main(argv, { repoRoot: SANDBOX });
    kod = process.exitCode ?? 0;
  } finally {
    console.log = consoleLog;
    console.error = consoleErr;
    process.exitCode = foreExitCode;
  }
  return { kod, loggat, felloggat };
}

// ===========================================================================
// Hjälp/no-arg — Marcus-tilläggskrav 2026-08-08: skriptet är HANS yta, och
// no-arg-utskriften är hans PRIMÄRA dokumentation, inte en bekvämlighet.
// ===========================================================================

t('renderHelp: innehåller en färdig copy/paste-!-exempelrad', () => {
  const hjalp = renderHelp(SANDBOX);
  assert.match(hjalp, /! npm run facit:godkann -- --pass test-pass --citat/);
});

t('renderHelp: listar kända pass ur den FAKTISKA bilage-roten', () => {
  const hjalp = renderHelp(SANDBOX);
  assert.match(hjalp, /Kända pass.*test-pass/s);
});

t('renderHelp: visar undantags-formens exempel', () => {
  const hjalp = renderHelp(SANDBOX);
  assert.match(hjalp, /--undantag <yta-namn> --skal/);
});

t('renderHelp: kraschar inte när policyn saknas (best-effort)', () => {
  const utanPolicy = mkdtempSync(join(tmpdir(), 'facit-godkann-helpnopolicy-'));
  assert.doesNotThrow(() => renderHelp(utanPolicy));
  rmSync(utanPolicy, { recursive: true, force: true });
});

t('main: INGA argument -> hjälp visas, exit 0 (inte ett fel)', () => {
  nollstallManifest();
  const fore = readFileSync(MANIFEST_PATH, 'utf8');
  const { kod, loggat } = korMain([]);
  assert.equal(kod, 0);
  assert.ok(loggat.some((r) => r.includes('npm run facit:godkann')));
  assert.equal(readFileSync(MANIFEST_PATH, 'utf8'), fore, 'hjälp-vägen rör aldrig filen');
});

t('main: --help -> hjälp visas, exit 0', () => {
  const { kod, loggat } = korMain(['--help']);
  assert.equal(kod, 0);
  assert.ok(loggat.some((r) => r.includes('Flaggor:')));
});

t('main: -h -> hjälp visas, exit 0', () => {
  const { kod, loggat } = korMain(['-h']);
  assert.equal(kod, 0);
  assert.ok(loggat.some((r) => r.includes('Flaggor:')));
});

t('main: --pass med --help inblandat -> hjälp vinner, exit 0 (kortcirkuit)', () => {
  const { kod, loggat } = korMain(['--pass', 'test-pass', '--help']);
  assert.equal(kod, 0);
  assert.ok(loggat.some((r) => r.includes('Flaggor:')));
});

t('main: EN flagga men ofullständigt (FAKTISKT försök) -> exit 1, INTE hjälp', () => {
  nollstallManifest();
  const { kod, loggat, felloggat } = korMain(['--pass', 'test-pass']);
  assert.equal(kod, 1);
  assert.ok(felloggat.some((r) => r.includes('--citat')));
  assert.ok(
    !loggat.some((r) => r.includes('Flaggor:')),
    'ett ofullständigt FAKTISKT försök ska INTE tolkas som en hjälp-begäran',
  );
});

t('main: happy path stämplar filen och returnerar exit 0', () => {
  nollstallManifest();
  const { kod, loggat } = korMain([
    '--pass',
    'test-pass',
    '--citat',
    'Jag är nöjd. Lås som facit.',
  ]);
  assert.equal(kod, 0);
  assert.ok(loggat.some((r) => r.includes('stämplat')));
  const disk = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert.equal(disk.godkand.av, 'marcus');
  assert.equal(disk.godkand.citat, 'Jag är nöjd. Lås som facit.');
  assert.match(disk.godkand.datum, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(disk.godkand.sha && disk.godkand.sha.length > 0, 'sha måste vara satt');
  assert.equal('undantag' in disk.godkand, false);
  // Övriga fält orörda:
  assert.equal(disk.prototyp, 'test-pass');
  assert.deepEqual(disk.ytor, [{ yta: 'x', bilder: [], kallor: ['src/x.tsx'] }]);
});

t('main: okänt pass -> exit 1, listar kända pass', () => {
  nollstallManifest();
  const { kod, felloggat } = korMain(['--pass', 'finns-inte', '--citat', 'y']);
  assert.equal(kod, 1);
  assert.ok(felloggat.some((r) => r.includes('Okänt pass')));
  assert.ok(
    felloggat.some((r) => r.includes('test-pass')),
    'ska lista det kända passet',
  );
});

t('main: redan satt UTAN --ersatt -> exit 1, filen orörd', () => {
  nollstallManifest();
  korMain(['--pass', 'test-pass', '--citat', 'första godkännandet']);
  const foreAndra = readFileSync(MANIFEST_PATH, 'utf8');
  const { kod, felloggat } = korMain(['--pass', 'test-pass', '--citat', 'andra försöket']);
  assert.equal(kod, 1);
  assert.ok(felloggat.some((r) => r.includes('redan satt')));
  assert.equal(
    readFileSync(MANIFEST_PATH, 'utf8'),
    foreAndra,
    'filen får inte ändras vid nekad omstämpling',
  );
});

t('main: redan satt MED --ersatt -> exit 0, skriver över', () => {
  nollstallManifest();
  korMain(['--pass', 'test-pass', '--citat', 'första godkännandet']);
  const { kod } = korMain(['--pass', 'test-pass', '--citat', 'ersatt motivering', '--ersatt']);
  assert.equal(kod, 0);
  const disk = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert.equal(disk.godkand.citat, 'ersatt motivering');
});

t('main: --undantag skrivs till disk', () => {
  nollstallManifest();
  const { kod } = korMain([
    '--pass',
    'test-pass',
    '--citat',
    'delvis nöjd',
    '--undantag',
    'atgarder',
    '--skal',
    'körande prototyp är facit',
  ]);
  assert.equal(kod, 0);
  const disk = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert.deepEqual(disk.godkand.undantag, [{ yta: 'atgarder', skal: 'körande prototyp är facit' }]);
});

t('main: tomt --citat -> exit 1 INNAN filen rörs', () => {
  nollstallManifest();
  const fore = readFileSync(MANIFEST_PATH, 'utf8');
  const { kod, felloggat } = korMain(['--pass', 'test-pass', '--citat', '   ']);
  assert.equal(kod, 1);
  assert.ok(felloggat.some((r) => r.includes('--citat')));
  assert.equal(readFileSync(MANIFEST_PATH, 'utf8'), fore);
});

t('main: trasig JSON i manifestet -> exit 1', () => {
  nollstallManifest();
  writeFileSync(MANIFEST_PATH, '{ detta är inte json');
  const { kod, felloggat } = korMain(['--pass', 'test-pass', '--citat', 'y']);
  assert.equal(kod, 1);
  assert.ok(felloggat.some((r) => r.includes('JSON')));
});

t('main: saknad policyfil -> exit 3', () => {
  nollstallManifest();
  const utanPolicySandbox = mkdtempSync(join(tmpdir(), 'facit-godkann-nopolicy-'));
  const { kod, felloggat } = (() => {
    const foreExitCode = process.exitCode;
    process.exitCode = undefined;
    const consoleErr = console.error;
    const felloggat = [];
    console.error = (...a) => felloggat.push(a.join(' '));
    let kod;
    try {
      main(['--pass', 'x', '--citat', 'y'], { repoRoot: utanPolicySandbox });
      kod = process.exitCode ?? 0;
    } finally {
      console.error = consoleErr;
      process.exitCode = foreExitCode;
    }
    return { kod, felloggat };
  })();
  assert.equal(kod, 3);
  assert.ok(felloggat.some((r) => r.includes('.facit-policy.conf')));
  rmSync(utanPolicySandbox, { recursive: true, force: true });
});

t('main: policy utan FACIT_BILAGE_ROT -> exit 3', () => {
  const trasigSandbox = mkdtempSync(join(tmpdir(), 'facit-godkann-trasigpolicy-'));
  writeFileSync(join(trasigSandbox, '.facit-policy.conf'), 'FACIT_MANIFEST_NAMN="facit.json"\n');
  const { kod, felloggat } = (() => {
    const foreExitCode = process.exitCode;
    process.exitCode = undefined;
    const consoleErr = console.error;
    const felloggat = [];
    console.error = (...a) => felloggat.push(a.join(' '));
    let kod;
    try {
      main(['--pass', 'x', '--citat', 'y'], { repoRoot: trasigSandbox });
      kod = process.exitCode ?? 0;
    } finally {
      console.error = consoleErr;
      process.exitCode = foreExitCode;
    }
    return { kod, felloggat };
  })();
  assert.equal(kod, 3);
  assert.ok(felloggat.some((r) => r.includes('felkonfigurerad')));
  rmSync(trasigSandbox, { recursive: true, force: true });
});

process.on('beforeExit', () => {
  rmSync(SANDBOX, { recursive: true, force: true });
  if (existsSync(POLICY_SANDBOX)) rmSync(POLICY_SANDBOX, { recursive: true, force: true });
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla facit-godkann-tester gröna.');
});
