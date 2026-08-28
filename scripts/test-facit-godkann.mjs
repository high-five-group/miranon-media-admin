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
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  biomeFormatera,
  lasPolicy,
  main,
  parseArgs,
  renderHelp,
  resolveMainSha,
  tillampaGodkannande,
} from './facit-godkann.mjs';

// Repo-roten SETT FRÅN DETTA testskript — oberoende av facit-godkann.mjs:s
// egen REPO_ROOT-konstant, så testet är ett genuint EXTERNT bevis, inte en
// cirkelreferens. Används för att låna den REDAN INSTALLERADE, äkta
// biome-binären in i sandlådor (§ EFTERFIX-regressionsbeviset nedan).
const THIS_REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

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
// biomeFormatera — EFTERFIX (2026-08-08, EGET pass efter TASK-167s
// grundleverans). PR #1024 hand-rättade tasks/sessions/bilagor/
// s93-hallplats-prototyp/facit.json (commit 1a920a01) därför att den
// FÖRSTA skarpa stämplingen fällde `biome check .`: JSON.stringify(x, null,
// 2) expanderar VARJE array till flera rader, Biome kollapsar korta arrayer
// till en rad (biome.json lineWidth: 100, ingen JSON-exkludering). Se
// facit-godkann.mjs § BIOME-REN SERIALISERING för det fulla resonemanget.
// TVÅSIDIGT: biome NÄRVARANDE (formaterar om, verifieras mot en ÄKTA
// biome-binär — inte en mock) OCH biome FRÅNVARANDE (icke-fatalt).
// ===========================================================================

const BIOME_UNIT_SANDBOX = mkdtempSync(join(tmpdir(), 'facit-godkann-biomeunit-'));
const BIOME_BIN = join(THIS_REPO_ROOT, 'node_modules', '.bin', 'biome');

t(
  'biomeFormatera: kollapsar en JSON.stringify-expanderad array till EN rad (regressionsbevis)',
  () => {
    const fil = join(BIOME_UNIT_SANDBOX, 'expanderad.json');
    // Exakt den formen JSON.stringify(x, null, 2) producerar — samma form
    // som fällde PR #1024:s första skarpa körning.
    writeFileSync(
      fil,
      `${JSON.stringify({ bilder: ['facit-x.png'], kallor: ['src/x.tsx'] }, null, 2)}\n`,
    );
    const foreInnehall = readFileSync(fil, 'utf8');
    assert.match(
      foreInnehall,
      /"bilder": \[\n/,
      'JSON.stringify ska expandera arrayen (kontroll av testets egen premiss — annars bevisar testet ingenting)',
    );

    const resultat = biomeFormatera(fil, THIS_REPO_ROOT);
    assert.equal(
      resultat.ok,
      true,
      `biomeFormatera ska lyckas mot den RIKTIGA repo-roten: ${resultat.reason ?? ''}`,
    );

    const efterInnehall = readFileSync(fil, 'utf8');
    assert.match(
      efterInnehall,
      /"bilder": \["facit-x\.png"\]/,
      'arrayen ska vara kollapsad till EN rad efter Biome-formatering',
    );
  },
);

t(
  'biomeFormatera: den formaterade filen passerar "biome check" (regressionens kärna — TVÅSIDIGT-kravet)',
  () => {
    const fil = join(BIOME_UNIT_SANDBOX, 'check-bevis.json');
    writeFileSync(
      fil,
      `${JSON.stringify(
        { prototyp: 'x', bilder: ['a.png', 'b.png'], kallor: ['src/a.tsx'] },
        null,
        2,
      )}\n`,
    );
    const resultat = biomeFormatera(fil, THIS_REPO_ROOT);
    assert.equal(resultat.ok, true);

    assert.ok(
      existsSync(BIOME_BIN),
      'testmiljön måste ha en äkta biome-binär för detta bevis — annars är testet ovidkommande',
    );
    assert.doesNotThrow(
      () => execFileSync(BIOME_BIN, ['check', fil], { cwd: THIS_REPO_ROOT, stdio: 'pipe' }),
      'biome check MÅSTE passera på en Biome-formaterad fil — exakt vad PR #1024s bugg bröt (en fil som JSON.stringify skrev direkt fälldes)',
    );
  },
);

t(
  'biomeFormatera: OFORMATERAD JSON.stringify-utdata FALLER på biome check (negativ kontroll)',
  () => {
    // Bevisar att FÖREGÅENDE tests grönhet inte är trivial — samma innehåll,
    // INTE Biome-formaterat, ska fortfarande fällas. Annars vore "passerar
    // biome check"-testet meningslöst (kan inte skilja rätt från fel).
    const fil = join(BIOME_UNIT_SANDBOX, 'negativ-kontroll.json');
    writeFileSync(
      fil,
      `${JSON.stringify({ bilder: ['a.png'], kallor: ['src/a.tsx'] }, null, 2)}\n`,
    );
    assert.throws(
      () => execFileSync(BIOME_BIN, ['check', fil], { cwd: THIS_REPO_ROOT, stdio: 'pipe' }),
      'ren JSON.stringify-utdata (ej Biome-formaterad) ska FÄLLAS av biome check — annars bevisar den positiva sidan ingenting',
    );
  },
);

t('biomeFormatera: repoRoot utan biome-binär ger { ok:false } — ICKE fatalt, filen orörd', () => {
  const tomRoot = mkdtempSync(join(tmpdir(), 'facit-godkann-utanbiome-'));
  const fil = join(tomRoot, 'nagot.json');
  writeFileSync(fil, '{"x": 1}\n');
  const resultat = biomeFormatera(fil, tomRoot);
  assert.equal(resultat.ok, false);
  assert.match(resultat.reason, /saknas/);
  assert.equal(
    readFileSync(fil, 'utf8'),
    '{"x": 1}\n',
    'filen ska vara HELT ORÖRD vid ett formateringsfel',
  );
  rmSync(tomRoot, { recursive: true, force: true });
});

rmSync(BIOME_UNIT_SANDBOX, { recursive: true, force: true });

// ===========================================================================
// resolveMainSha — TASK-175 (2026-08-10). Regression för S93-stängningens
// mätta bugg: en lokal `main`-ref i en orkestrerar-checkout stod stilla
// medan origin rörde sig, och kvittot stämplade det FÖRLEGADE trädet
// ([[L573]] i tasks/lessons/vol-07.md).
// TVÅSIDIGT bevis: samma fixtur bevisar BÅDE att den gamla härledningen
// (lokal `main`, ingen fetch) ger den stillastående SHA:n OCH att den nya
// härledningen (resolveMainSha, färsk origin/main) ger den färska.
// ===========================================================================

// TASK-175 (CI-fällning, run 31380377469): `git init -q` UTAN uttryckligt
// grennamn ärver `init.defaultbranch` — "main" lokalt (Apple Gits egen
// vendor-config, se rapporten nedan), "master" på CI-runnern (stock git,
// ingen sådan config). Testerna nedan behöver ett FÖRUTSÄGBART grennamn
// ("main") oavsett miljö, eftersom de antingen läser den lokala main-refen
// direkt (för jämförelse) eller explicit tar bort den — `-b main` gör
// grennamnet en del av KOMMANDOT, inte av omgivningens config.
function nyttGitRepo(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@test.invalid'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir });
  return dir;
}

t(
  'resolveMainSha: härleder ur FÄRSK origin/main, inte en stillastående lokal main-ref (TASK-175, S93-regression)',
  () => {
    // "origin" — ett bart repo som senare rör sig UTAN att klonen nedan
    // någonsin fast-forwardas. Detta ÄR den mätta bugg-situationen.
    const origin = mkdtempSync(join(tmpdir(), 'facit-godkann-t175-origin-'));
    execFileSync('git', ['init', '-q', '--bare', '--initial-branch=main'], { cwd: origin });

    // Klonen vars LOKALA main-ref ska stå stilla — motsvarar en
    // orkestrerar-checkout som inte manuellt fast-forwardats.
    const klon = mkdtempSync(join(tmpdir(), 'facit-godkann-t175-klon-'));
    execFileSync('git', ['clone', '-q', origin, klon]);
    execFileSync('git', ['config', 'user.email', 'test@test.invalid'], { cwd: klon });
    execFileSync('git', ['config', 'user.name', 'test'], { cwd: klon });
    execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'första landningen'], {
      cwd: klon,
    });
    execFileSync('git', ['push', '-q', 'origin', 'HEAD:main'], { cwd: klon });
    const stillaSha = execFileSync('git', ['rev-parse', 'main'], {
      cwd: klon,
      encoding: 'utf8',
    }).trim();

    // Ett ANNAT ombud (t.ex. merge-kön) pushar vidare på origin — klonens
    // lokala main-ref rörs aldrig.
    const annanKlon = mkdtempSync(join(tmpdir(), 'facit-godkann-t175-annanklon-'));
    execFileSync('git', ['clone', '-q', origin, annanKlon]);
    execFileSync('git', ['config', 'user.email', 'test@test.invalid'], { cwd: annanKlon });
    execFileSync('git', ['config', 'user.name', 'test'], { cwd: annanKlon });
    execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'landning efter S93'], {
      cwd: annanKlon,
    });
    execFileSync('git', ['push', '-q', 'origin', 'HEAD:main'], { cwd: annanKlon });
    const farskSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: annanKlon,
      encoding: 'utf8',
    }).trim();

    assert.notEqual(stillaSha, farskSha, 'testets premiss: origin måste faktiskt ha rört sig');

    // BEVIS SIDA 1 (den gamla buggen): klonens lokala main-ref, läst UTAN
    // fetch — exakt vad den gamla `kor('main')`-härledningen gjorde — är
    // fortfarande den STILLASTÅENDE SHA:n.
    const lokalMainUtanFetch = execFileSync('git', ['rev-parse', 'main'], {
      cwd: klon,
      encoding: 'utf8',
    }).trim();
    assert.equal(
      lokalMainUtanFetch,
      stillaSha,
      'den gamla härledningen (lokal main, ingen fetch) ger det STILLASTÅENDE trädet — detta är buggen S93 mätte',
    );

    // BEVIS SIDA 2 (fixen): resolveMainSha() fetchar färskt och läser
    // origin/main — den FÄRSKA SHA:n, trots att klonens lokala main-ref
    // aldrig fast-forwardats.
    const resultat = resolveMainSha(klon);
    assert.equal(
      resultat,
      farskSha,
      'resolveMainSha ska härleda ur FÄRSK origin/main, inte den stillastående lokala main-refen',
    );
    assert.notEqual(
      resultat,
      stillaSha,
      'resultatet får ALDRIG vara den förlegade SHA:n den gamla buggen stämplade',
    );

    rmSync(origin, { recursive: true, force: true });
    rmSync(klon, { recursive: true, force: true });
    rmSync(annanKlon, { recursive: true, force: true });
  },
);

t(
  'resolveMainSha: utan origin-remote faller tillbaka till lokal main (oförändrat beteende)',
  () => {
    const repo = nyttGitRepo('facit-godkann-t175-utanorigin-');
    execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: repo });
    const lokalSha = execFileSync('git', ['rev-parse', 'main'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim();
    assert.equal(resolveMainSha(repo), lokalSha);
    rmSync(repo, { recursive: true, force: true });
  },
);

t(
  'resolveMainSha: utan origin OCH utan main-ref (helt tom historik) faller tillbaka till HEAD',
  () => {
    const repo = nyttGitRepo('facit-godkann-t175-tomhistorik-');
    // Ingen commit alls — varken "main" eller "HEAD" pekar på något ännu i
    // ett splitternytt repo, så vi lägger en commit på en ANNAN gren-form
    // (detached) för att simulera "lokal main saknas men HEAD finns".
    execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: repo });
    execFileSync('git', ['checkout', '-q', '-b', 'annan-gren'], { cwd: repo });
    execFileSync('git', ['branch', '-q', '-D', 'main'], { cwd: repo });
    const headSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim();
    assert.equal(resolveMainSha(repo), headSha);
    rmSync(repo, { recursive: true, force: true });
  },
);

t(
  'resolveMainSha: origin konfigurerad men ohämtbar -> kastar TYDLIGT fel (ingen tyst stale-SHA)',
  () => {
    const repo = nyttGitRepo('facit-godkann-t175-brutenorigin-');
    execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: repo });
    execFileSync('git', ['remote', 'add', 'origin', '/finns/garanterat/inte/nagonstans-t175'], {
      cwd: repo,
    });
    assert.throws(() => resolveMainSha(repo), /kunde inte hämta färsk origin\/main/);
    rmSync(repo, { recursive: true, force: true });
  },
);

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
  // Symlänka in en ÄKTA node_modules (samma teknik som en färsk worktree
  // görs körbar med, se CLAUDE.md § "Först av allt: gör worktreen körbar")
  // så main()s biomeFormatera-anrop hittar en RIKTIG biome-binär i
  // sandlådan — main() ska motsvara PRODUKTIONSVÄGEN, inte bara den isolerade
  // biomeFormatera()-funktionen (§ biomeFormatera-testerna ovan).
  //
  // biome.json MÅSTE symlänkas ÄVEN DEN — mätt UNDER detta passets eget
  // bygge: `biome format --write` med `cwd` satt till en katalog UTAN
  // biome.json hittar INGEN config uppåt i katalogträdet (SANDBOX ligger
  // under /var/folders/…, en helt egen trädgren) och faller tyst tillbaka
  // på Biomes INBYGGDA default (tab-indentering) i stället för att fela.
  // Resultatet blev en fil som `biome format --write` (utan config) ansåg
  // klar, men som `biome check` (MED config, space-indentering) sedan
  // fällde — en falsk grönhet i just den kombinationen som skulle bevisa
  // fixen. PRODUKTIONSVÄGEN drabbas INTE (repoRoot ÄR alltid den riktiga
  // checkouten där biome.json redan ligger bredvid scriptet) — detta är
  // uteslutande en sandlåde-trohetsfråga, men utan symlänken hade sviten
  // bevisat fel sak.
  if (existsSync(join(THIS_REPO_ROOT, 'node_modules'))) {
    symlinkSync(join(THIS_REPO_ROOT, 'node_modules'), join(SANDBOX, 'node_modules'));
  }
  if (existsSync(join(THIS_REPO_ROOT, 'biome.json'))) {
    symlinkSync(join(THIS_REPO_ROOT, 'biome.json'), join(SANDBOX, 'biome.json'));
  }
})();

// korMain — fångar console-utdata + exitCode, återställer process.exitCode
// efteråt så ett rött testfall inte smittar testskriptets EGEN exitkod.
// console.warn FÅNGAS IN I felloggat, INTE ett eget fält — mätt under detta
// passets bygge: en tidigare variant mockade bara console.error, och
// main()s biomeFormatera-varning (medvetet console.warn, se skriptets §
// BIOME-REN SERIALISERING) föll då tyst förbi mocken rakt ut på den
// RIKTIGA stderr i stället för att fångas — testet som skulle bevisa
// varningen fick then ett FALSKT rött utfall (assertionen hittade den
// aldrig i felloggat, trots att den faktiskt skrevs). console.warn skriver
// till samma ström (stderr) som console.error i Node, så samma capture-array
// är rätt modell.
function korMain(argv) {
  const foreExitCode = process.exitCode;
  process.exitCode = undefined;
  const consoleLog = console.log;
  const consoleErr = console.error;
  const consoleWarn = console.warn;
  const loggat = [];
  const felloggat = [];
  console.log = (...a) => loggat.push(a.join(' '));
  console.error = (...a) => felloggat.push(a.join(' '));
  console.warn = (...a) => felloggat.push(a.join(' '));
  let kod;
  try {
    main(argv, { repoRoot: SANDBOX });
    kod = process.exitCode ?? 0;
  } finally {
    console.log = consoleLog;
    console.error = consoleErr;
    console.warn = consoleWarn;
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
  const { kod, loggat, felloggat } = korMain([
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
  // EFTERFIX-regressionsbevis (PR #1024): ingen "Kunde inte Biome-
  // formatera"-varning när en äkta biome-binär FINNS i sandlådan (den
  // symlänkade node_modules ovan) — och den skrivna filen passerar
  // biome check direkt, utan manuell efterhandsrättning.
  assert.ok(
    !felloggat.some((r) => r.includes('Kunde inte Biome-formatera')),
    'ingen biome-varning förväntas när en äkta biome-binär finns i sandlådan',
  );
  assert.doesNotThrow(
    () => execFileSync(BIOME_BIN, ['check', MANIFEST_PATH], { cwd: THIS_REPO_ROOT, stdio: 'pipe' }),
    'main() ska producera en fil som passerar biome check DIREKT — exakt regressionen PR #1024 rättade för hand',
  );
});

t(
  'main: ETT REALISTISKT manifest (flerelements-arrayer, s93-formen) passerar biome check efter stämpling',
  () => {
    // Samma FORM som facit.json bar när PR #1024 fälldes: flera ytor, flera
    // bilder per yta — där JSON.stringify:s expansion var som mest synlig.
    writeFileSync(
      MANIFEST_PATH,
      `${JSON.stringify(
        {
          prototyp: 'test-pass',
          last: '2026-08-06',
          lasning: 'Lås som facit.',
          godkand: null,
          ytor: [
            {
              yta: 'betalningar',
              bilder: ['facit-betalningar-arbetsytan.png', 'facit-betalningar-maxat-kort.png'],
              kallor: ['src/components/events/detail/Betalningar.tsx'],
            },
            { yta: 'atgarder', bilder: [], kallor: ['src/components/events/detail/Atgarder.tsx'] },
          ],
        },
        null,
        2,
      )}\n`,
    );
    const { kod, felloggat } = korMain([
      '--pass',
      'test-pass',
      '--citat',
      'Regressionsbevis, s93-formen.',
    ]);
    assert.equal(kod, 0);
    assert.ok(!felloggat.some((r) => r.includes('Kunde inte Biome-formatera')));
    assert.doesNotThrow(() =>
      execFileSync(BIOME_BIN, ['check', MANIFEST_PATH], { cwd: THIS_REPO_ROOT, stdio: 'pipe' }),
    );
  },
);

t('main: biome SAKNAS i repoRoot -> stämplingen lyckas ÄNDÅ (exit 0), varning skriven', () => {
  // Isolerad från den delade SANDBOX (som NU bär en äkta biome via
  // symlänken ovan) — en EGEN sandlåda utan node_modules, för att bevisa
  // att en trasig/saknad biome-installation inte gör godkännandet
  // OMÖJLIGT. Detta är den ANDRA sidan av TVÅSIDIGT-kravet.
  const utanBiomeSandbox = mkdtempSync(join(tmpdir(), 'facit-godkann-mainutanbiome-'));
  const bilageRot = join(utanBiomeSandbox, 'bilagor');
  const passDir = join(bilageRot, 'test-pass');
  const manifestPath = join(passDir, 'facit.json');
  writeFileSync(
    join(utanBiomeSandbox, '.facit-policy.conf'),
    'FACIT_BILAGE_ROT="bilagor"\nFACIT_MANIFEST_NAMN="facit.json"\n',
  );
  mkdirSync(passDir, { recursive: true });
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      { prototyp: 'test-pass', last: '2026-08-06', lasning: 'x', godkand: null, ytor: [] },
      null,
      2,
    )}\n`,
  );
  execFileSync('git', ['init', '-q'], { cwd: utanBiomeSandbox });
  execFileSync('git', ['config', 'user.email', 'test@test.invalid'], { cwd: utanBiomeSandbox });
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: utanBiomeSandbox });
  execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: utanBiomeSandbox });

  const foreExitCode = process.exitCode;
  process.exitCode = undefined;
  const consoleLog = console.log;
  const consoleErr = console.error;
  const consoleWarn = console.warn;
  const loggat = [];
  const felloggat = [];
  console.log = (...a) => loggat.push(a.join(' '));
  console.error = (...a) => felloggat.push(a.join(' '));
  console.warn = (...a) => felloggat.push(a.join(' ')); // se korMain() ovan för varför
  let kod;
  try {
    main(['--pass', 'test-pass', '--citat', 'Godkänd trots saknad biome.'], {
      repoRoot: utanBiomeSandbox,
    });
    kod = process.exitCode ?? 0;
  } finally {
    console.log = consoleLog;
    console.error = consoleErr;
    console.warn = consoleWarn;
    process.exitCode = foreExitCode;
  }

  assert.equal(
    kod,
    0,
    'ett saknat biome-verktyg får ALDRIG blockera själva godkännande-handlingen',
  );
  assert.ok(felloggat.some((r) => r.includes('Kunde inte Biome-formatera')));
  const disk = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(disk.godkand.av, 'marcus', 'fältet ska ändå vara korrekt stämplat');
  rmSync(utanBiomeSandbox, { recursive: true, force: true });
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
