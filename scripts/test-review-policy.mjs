#!/usr/bin/env node
// scripts/test-review-policy.mjs — tester för policy-ytan (TASK-173.2:
// .review-policy.json + scripts/lib/review-policy.mjs +
// scripts/hamta-review-policy.mjs).
//
// Samma konvention som scripts/test-validera-review-utlatande.mjs: de PURA
// funktionerna importeras direkt, och ett sista lager prövar CLI:ts exit-koder
// via spawnSync — annars vore pure-function-testerna förenliga med en CLI som
// alltid returnerar 0.
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT ═══
// Varje regel prövas i BÅDA riktningar: brytet → RÖTT, den rättade formen →
// GRÖNT. AC #1 (regler läses ENDAST ur main) får den strängaste formen som
// finns att ge den: ett riktigt temporärt git-repo där `main` och den
// utcheckade grenen bär OLIKA policyfiler, plus en tredje, ocommittad version
// i arbetsträdet. Läsningen måste ge MAIN:s innehåll i alla tre lägen — och
// KONTRAST-testet läser samma repo via grenens ref och får angriparens
// innehåll, vilket bevisar att fixturen faktiskt KAN skilja dem åt. Utan det
// kontrast-testet vore huvudtestet vakuöst: en trasig implementation som
// alltid returnerade tomt hade också "passerat".
//
// ═══ VARFÖR TEMP-REPOT FÅR EN node_modules-SYMLÄNK ═══
// CLI:t härleder sitt repo ur SKRIPTETS egen plats (inte ur cwd), så en äkta
// CLI-körning kräver att skript-filerna ligger i temp-repot. Symlänken ger dem
// `micromatch`/`zod` utan att något skräp skapas i det riktiga repot — samma
// grepp som bygg-agentens worktree-uppsättning.
//
// Kör: node scripts/test-review-policy.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lasPolicyUrRef, TRUSTED_REF } from './hamta-review-policy.mjs';
import {
  matchaRegler,
  POLICY_FIL,
  POLICY_VERSION,
  parsaPolicy,
  renderaRegler,
} from './lib/review-policy.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

/** En minimal, i övrigt giltig regel — varje test muterar en kopia. */
function giltigRegel(overrides = {}) {
  return {
    id: 'test-regel',
    rubrik: 'En testregel',
    monster: ['src/**/*.ts'],
    undantag: [],
    provning: 'Pröva något.',
    kalla: 'CLAUDE.md § Något',
    ...overrides,
  };
}

function giltigPolicy(regler = [giltigRegel()]) {
  return { version: POLICY_VERSION, regler };
}

/* ══════════════════════════════════════════════════════════════════════
   A. parsaPolicy — fail-closed i båda riktningar
   ══════════════════════════════════════════════════════════════════ */

test('A1 giltig minimal policy passerar', () => {
  const { ok, errors } = parsaPolicy(giltigPolicy());
  assert.equal(ok, true, `förväntade ok, fick: ${errors.join('; ')}`);
});

test('A2 policy med _readme-array passerar (kommentarfältet är tillåtet)', () => {
  const { ok } = parsaPolicy({ ...giltigPolicy(), _readme: ['rad ett', 'rad två'] });
  assert.equal(ok, true);
});

test('A3 okänd version fälls (framtida brytande form ska synas, inte tolkas som dagens)', () => {
  const { ok, errors } = parsaPolicy({ ...giltigPolicy(), version: POLICY_VERSION + 1 });
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.startsWith('version')),
    `väntade version-fel, fick: ${errors}`,
  );
});

test('A4 KONTRAST: rätt version passerar (A3 fäller på versionen, inte på något annat)', () => {
  assert.equal(parsaPolicy({ ...giltigPolicy(), version: POLICY_VERSION }).ok, true);
});

test('A5 dubblett-id fälls (utlåtandets policyRegler slås upp på id)', () => {
  const { ok, errors } = parsaPolicy(
    giltigPolicy([giltigRegel({ id: 'samma' }), giltigRegel({ id: 'samma' })]),
  );
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes('dubblett-id')),
    `fick: ${errors}`,
  );
});

test('A6 KONTRAST: två regler med OLIKA id passerar', () => {
  const { ok } = parsaPolicy(
    giltigPolicy([giltigRegel({ id: 'ett' }), giltigRegel({ id: 'tva' })]),
  );
  assert.equal(ok, true);
});

test('A7 tom monster-array fälls (en regel utan mönster vore repo-bred — AC #2)', () => {
  const { ok, errors } = parsaPolicy(giltigPolicy([giltigRegel({ monster: [] })]));
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes('monster')),
    `fick: ${errors}`,
  );
});

test('A8 id med versaler/mellanslag fälls (kebab-case krävs)', () => {
  assert.equal(parsaPolicy(giltigPolicy([giltigRegel({ id: 'Min Regel' })])).ok, false);
  assert.equal(parsaPolicy(giltigPolicy([giltigRegel({ id: 'MinRegel' })])).ok, false);
});

test('A9 KONTRAST: giltigt kebab-case-id passerar', () => {
  assert.equal(parsaPolicy(giltigPolicy([giltigRegel({ id: 'min-regel-2' })])).ok, true);
});

test('A10 saknad kalla fälls (varje regel måste peka på sin styrande yta)', () => {
  const utanKalla = giltigRegel();
  delete utanKalla.kalla;
  assert.equal(parsaPolicy(giltigPolicy([utanKalla])).ok, false);
});

test('A11 okänt/felstavat fält fälls (strictObject — inget tyst strip)', () => {
  const { ok } = parsaPolicy(giltigPolicy([giltigRegel({ monsterr: ['x'] })]));
  assert.equal(ok, false);
});

test('A12 helt tom input fälls med fel, inte en krasch', () => {
  const { ok, errors } = parsaPolicy({});
  assert.equal(ok, false);
  assert.ok(errors.length > 0);
});

/* ══════════════════════════════════════════════════════════════════════
   B. matchaRegler — AC #2: injiceras ENDAST vid match, med scope
   ══════════════════════════════════════════════════════════════════ */

const { policy: tvaRegler } = parsaPolicy(
  giltigPolicy([
    giltigRegel({ id: 'ts-regel', monster: ['src/**/*.ts'] }),
    giltigRegel({ id: 'css-regel', monster: ['src/**/*.css'] }),
  ]),
);

test('B1 matchande fil ger regeln MED scope-etikett', () => {
  const traffar = matchaRegler(['src/lib/a.ts'], tvaRegler);
  assert.equal(traffar.length, 1);
  assert.equal(traffar[0].id, 'ts-regel');
  assert.deepEqual(traffar[0].scope.monster, ['src/**/*.ts']);
  assert.deepEqual(traffar[0].scope.matchadeFiler, ['src/lib/a.ts']);
});

test('B2 icke-matchande fil ger INGEN regel (kärnan i AC #2)', () => {
  assert.deepEqual(matchaRegler(['README.md'], tvaRegler), []);
});

test('B3 scope.matchadeFiler bär BARA de matchande — inte hela diffen', () => {
  const traffar = matchaRegler(['src/lib/a.ts', 'README.md', 'docs/x.md'], tvaRegler);
  assert.equal(traffar.length, 1);
  assert.deepEqual(traffar[0].scope.matchadeFiler, ['src/lib/a.ts']);
});

test('B4 ALLA matchande regler ackumuleras — inte bara den sista (avsteg från CODEOWNERS)', () => {
  const { policy } = parsaPolicy(
    giltigPolicy([
      giltigRegel({ id: 'bred', monster: ['src/**'] }),
      giltigRegel({ id: 'smal', monster: ['src/data/**'] }),
    ]),
  );
  const traffar = matchaRegler(['src/data/x.ts'], policy);
  assert.deepEqual(
    traffar.map((t) => t.id).sort(),
    ['bred', 'smal'],
    'båda reglerna måste injiceras — last-match-wins vore en tyst försvagning',
  );
});

test('B5 undantag exkluderar en fil som annars matchar', () => {
  const { policy } = parsaPolicy(
    giltigPolicy([giltigRegel({ monster: ['src/**/*.ts'], undantag: ['**/*.test.ts'] })]),
  );
  const traffar = matchaRegler(['src/a.ts', 'src/a.test.ts'], policy);
  assert.equal(traffar.length, 1);
  assert.deepEqual(traffar[0].scope.matchadeFiler, ['src/a.ts']);
});

test('B6 regel vars ENDA träff är undantagen injiceras inte alls', () => {
  const { policy } = parsaPolicy(
    giltigPolicy([giltigRegel({ monster: ['src/**/*.ts'], undantag: ['**/*.test.ts'] })]),
  );
  assert.deepEqual(matchaRegler(['src/a.test.ts'], policy), []);
});

test('B7 dot: true — dolda sökvägar nås (fail-safe åt rätt håll)', () => {
  const { policy } = parsaPolicy(
    giltigPolicy([giltigRegel({ id: 'ci', monster: ['.github/workflows/**'] })]),
  );
  const traffar = matchaRegler(['.github/workflows/ci.yml'], policy);
  assert.equal(traffar.length, 1, 'ett dot-prefixat mönster måste matcha');
});

test('B8 utdata är deterministisk: sorterad och deduplicerad', () => {
  const { policy } = parsaPolicy(giltigPolicy([giltigRegel({ monster: ['src/**/*.ts'] })]));
  const traffar = matchaRegler(['src/b.ts', 'src/a.ts', 'src/b.ts'], policy);
  assert.deepEqual(traffar[0].scope.matchadeFiler, ['src/a.ts', 'src/b.ts']);
});

test('B9 tom fil-lista ger noll regler (inte alla regler)', () => {
  assert.deepEqual(matchaRegler([], tvaRegler), []);
});

/* ══════════════════════════════════════════════════════════════════════
   C. renderaRegler — scope syns före prövningstexten
   ══════════════════════════════════════════════════════════════════ */

test('C1 noll träffar renderas som en explicit utsaga med sha', () => {
  const text = renderaRegler([], 'abc1234');
  assert.match(text, /Inga path-scopade granskningsregler/);
  assert.match(text, /abc1234/);
});

test('C2 träff renderas med id, scope-rader, prövning och källa', () => {
  const traffar = matchaRegler(['src/lib/a.ts'], tvaRegler);
  const text = renderaRegler(traffar, 'abc1234');
  assert.match(text, /\[id: ts-regel\]/);
  assert.match(text, /Scope — mönster: src\/\*\*\/\*\.ts/);
  assert.match(text, /Scope — matchade filer i denna PR: src\/lib\/a\.ts/);
  assert.match(text, /Pröva: /);
  assert.match(text, /Källa: /);
  assert.match(text, /aldrig repo-bred/, 'texten måste varna mot repo-bred läsning');
});

test('C3 scope-raden står FÖRE prövningstexten (läsordningen är avsiktlig)', () => {
  const text = renderaRegler(matchaRegler(['src/lib/a.ts'], tvaRegler), 'abc1234');
  assert.ok(text.indexOf('Scope — mönster') < text.indexOf('Pröva:'));
});

/* ══════════════════════════════════════════════════════════════════════
   D. lasPolicyUrRef — AC #1: ENDAST ur main. Riktigt git-repo.
   ══════════════════════════════════════════════════════════════════ */

const tmpRot = mkdtempSync(join(tmpdir(), 'task-173-2-'));

function git(repoPath, args) {
  const res = spawnSync('git', args, { cwd: repoPath, encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`git ${args.join(' ')} misslyckades: ${res.stderr}`);
  }
  return res.stdout;
}

/**
 * Bygger ett repo där `main`, den utcheckade grenen och arbetsträdet bär TRE
 * olika versioner av policyfilen. Endast main-versionen får nå läsaren.
 */
function byggAngriparRepo(namn, { mainInnehall, grenInnehall, arbetstradInnehall }) {
  const repoPath = join(tmpRot, namn);
  mkdirSync(repoPath, { recursive: true });
  git(repoPath, ['init', '-q', '-b', 'main']);
  git(repoPath, ['config', 'user.email', 'test@example.com']);
  git(repoPath, ['config', 'user.name', 'Test']);

  writeFileSync(join(repoPath, POLICY_FIL), mainInnehall, 'utf8');
  git(repoPath, ['add', POLICY_FIL]);
  git(repoPath, ['commit', '-q', '-m', 'main: den trusted policyn']);
  // Ett äkta origin/main — samma ref den skarpa vägen hårdkodar.
  git(repoPath, ['update-ref', `refs/remotes/${TRUSTED_REF}`, 'refs/heads/main']);

  if (grenInnehall !== undefined) {
    git(repoPath, ['checkout', '-q', '-b', 'angripare']);
    writeFileSync(join(repoPath, POLICY_FIL), grenInnehall, 'utf8');
    git(repoPath, ['add', POLICY_FIL]);
    git(repoPath, ['commit', '-q', '-m', 'gren: manipulerad policy']);
  }
  if (arbetstradInnehall !== undefined) {
    writeFileSync(join(repoPath, POLICY_FIL), arbetstradInnehall, 'utf8');
  }
  return repoPath;
}

const MAIN_POLICY = JSON.stringify(
  giltigPolicy([giltigRegel({ id: 'skarp-regel', provning: 'Den skarpa prövningen ur main.' })]),
);
const GREN_POLICY = JSON.stringify(
  giltigPolicy([giltigRegel({ id: 'tandlos-regel', provning: 'Granska inget.' })]),
);
const ARBETSTRAD_POLICY = JSON.stringify(
  giltigPolicy([giltigRegel({ id: 'arbetstrad-regel', provning: 'Inte heller denna.' })]),
);

try {
  const angriparRepo = byggAngriparRepo('angripare', {
    mainInnehall: MAIN_POLICY,
    grenInnehall: GREN_POLICY,
    arbetstradInnehall: ARBETSTRAD_POLICY,
  });

  test('D1 AC #1: läsningen ger MAIN:s policy trots att en annan gren är utcheckad', () => {
    const res = lasPolicyUrRef(angriparRepo);
    assert.equal(res.ok, true, `förväntade ok, fick: ${res.errors.join('; ')}`);
    assert.deepEqual(
      res.policy.regler.map((r) => r.id),
      ['skarp-regel'],
    );
  });

  test('D2 AC #1: en ocommittad arbetsträds-version påverkar inte heller läsningen', () => {
    // Arbetsträdet bär ARBETSTRAD_POLICY (skrivet ovan, aldrig committat).
    const res = lasPolicyUrRef(angriparRepo);
    assert.ok(
      !res.policy.regler.some((r) => r.id === 'arbetstrad-regel'),
      'en readFileSync-implementation hade plockat upp arbetsträdets version här',
    );
  });

  test('D3 KONTRAST: samma repo läst via grenens ref GER angriparens policy', () => {
    // Utan detta test vore D1/D2 vakuösa — en implementation som alltid
    // returnerade tomt hade också "passerat" dem.
    const res = lasPolicyUrRef(angriparRepo, 'refs/heads/angripare');
    assert.equal(res.ok, true);
    assert.deepEqual(
      res.policy.regler.map((r) => r.id),
      ['tandlos-regel'],
    );
  });

  test('D4 den lästa SHA:n är MAIN:s commit, inte grenens (commit-pinning)', () => {
    const mainSha = git(angriparRepo, ['rev-parse', 'refs/heads/main']).trim();
    const grenSha = git(angriparRepo, ['rev-parse', 'refs/heads/angripare']).trim();
    const res = lasPolicyUrRef(angriparRepo);
    assert.equal(res.sha, mainSha);
    assert.notEqual(res.sha, grenSha);
  });

  test('D5 fail-closed: trasig JSON i main ger ok:false (ingen tyst tom regelmängd)', () => {
    const trasigt = byggAngriparRepo('trasig-json', { mainInnehall: '{ detta är inte json' });
    const res = lasPolicyUrRef(trasigt);
    assert.equal(res.ok, false);
    assert.equal(res.policy, null);
    assert.ok(
      res.errors.some((e) => e.includes('inte giltig JSON')),
      `fick: ${res.errors}`,
    );
    assert.ok(res.sha, 'SHA ska ändå rapporteras så felet kan spåras till en commit');
  });

  test('D6 fail-closed: schemabrott i main ger ok:false', () => {
    const felVersion = byggAngriparRepo('fel-version', {
      mainInnehall: JSON.stringify({ version: 999, regler: [] }),
    });
    const res = lasPolicyUrRef(felVersion);
    assert.equal(res.ok, false);
    assert.ok(
      res.errors.some((e) => e.startsWith('version')),
      `fick: ${res.errors}`,
    );
  });

  test('D7 fail-closed: policyfilen saknas i main ger ok:false', () => {
    const utanFil = join(tmpRot, 'utan-fil');
    mkdirSync(utanFil, { recursive: true });
    git(utanFil, ['init', '-q', '-b', 'main']);
    git(utanFil, ['config', 'user.email', 'test@example.com']);
    git(utanFil, ['config', 'user.name', 'Test']);
    writeFileSync(join(utanFil, 'annat.txt'), 'x', 'utf8');
    git(utanFil, ['add', 'annat.txt']);
    git(utanFil, ['commit', '-q', '-m', 'utan policy']);
    git(utanFil, ['update-ref', `refs/remotes/${TRUSTED_REF}`, 'refs/heads/main']);
    const res = lasPolicyUrRef(utanFil);
    assert.equal(res.ok, false);
    assert.ok(
      res.errors.some((e) => e.includes('kunde inte läsa')),
      `fick: ${res.errors}`,
    );
  });

  test('D8 fail-closed: okänd ref ger ok:false och sha=null', () => {
    const res = lasPolicyUrRef(angriparRepo, 'refs/heads/finns-inte');
    assert.equal(res.ok, false);
    assert.equal(res.sha, null);
  });

  test('D9 KONTRAST: en giltig policy i main ger ok:true (D5–D8 fäller på felet, inte alltid)', () => {
    const rent = byggAngriparRepo('rent', { mainInnehall: MAIN_POLICY });
    assert.equal(lasPolicyUrRef(rent).ok, true);
  });

  /* ════════════════════════════════════════════════════════════════════
     E. CLI-lagret — exit-koderna måste matcha logiken
     ════════════════════════════════════════════════════════════════ */

  /** Kopierar CLI + lib till ett temp-repo och kör dem där, så CLI:t härleder
   * temp-repot som sitt eget (den härledningen är hela poängen: ingen
   * ref-flagga finns att peka någon annanstans med). */
  function byggCliRepo(namn, mainInnehall) {
    const repoPath = byggAngriparRepo(namn, {
      mainInnehall,
      grenInnehall: GREN_POLICY,
    });
    mkdirSync(join(repoPath, 'scripts', 'lib'), { recursive: true });
    copyFileSync(
      join(REPO, 'scripts', 'hamta-review-policy.mjs'),
      join(repoPath, 'scripts', 'hamta-review-policy.mjs'),
    );
    copyFileSync(
      join(REPO, 'scripts', 'lib', 'review-policy.mjs'),
      join(repoPath, 'scripts', 'lib', 'review-policy.mjs'),
    );
    symlinkSync(join(REPO, 'node_modules'), join(repoPath, 'node_modules'));
    return repoPath;
  }

  function korCli(repoPath, args) {
    return spawnSync('node', [join(repoPath, 'scripts', 'hamta-review-policy.mjs'), ...args], {
      cwd: repoPath,
      encoding: 'utf8',
    });
  }

  const cliRepo = byggCliRepo('cli', MAIN_POLICY);

  test('E1 CLI: --filer med matchande fil → exit 0 och regeln i utdatan', () => {
    const res = korCli(cliRepo, ['--filer', 'src/a.ts']);
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /skarp-regel/);
  });

  test('E2 CLI: den utcheckade grenens policy syns ALDRIG i utdatan (AC #1 hela vägen)', () => {
    const res = korCli(cliRepo, ['--filer', 'src/a.ts']);
    assert.ok(
      !res.stdout.includes('tandlos-regel'),
      'CLI:t läste grenens policy — AC #1 är brutet i den skarpa vägen',
    );
  });

  test('E3 CLI: icke-matchande fil → exit 0 med explicit "inga regler"', () => {
    const res = korCli(cliRepo, ['--filer', 'README.md']);
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /Inga path-scopade granskningsregler/);
  });

  test('E4 CLI: --json ger parsbar JSON med policySha och scope', () => {
    const res = korCli(cliRepo, ['--filer', 'src/a.ts', '--json']);
    assert.equal(res.status, 0, res.stderr);
    const data = JSON.parse(res.stdout);
    assert.equal(data.ref, TRUSTED_REF);
    assert.match(data.policySha, /^[0-9a-f]{40}$/);
    assert.equal(data.policyRegler.length, 1);
    assert.deepEqual(data.policyRegler[0].scope.matchadeFiler, ['src/a.ts']);
  });

  test('E5 CLI: trasig policy i main → exit 64 (POLICYFEL, fail-closed)', () => {
    const trasigCli = byggCliRepo('cli-trasig', '{ inte json');
    const res = korCli(trasigCli, ['--filer', 'src/a.ts']);
    assert.equal(res.status, 64, `väntade 64, fick ${res.status}: ${res.stderr}`);
    assert.match(res.stderr, /POLICYFEL/);
  });

  test('E6 CLI: inget argument → exit 2', () => {
    assert.equal(korCli(cliRepo, []).status, 2);
  });

  test('E7 CLI: --pr och --filer samtidigt → exit 2 (ömsesidigt uteslutande)', () => {
    assert.equal(korCli(cliRepo, ['--pr', '1', '--filer', 'a.ts']).status, 2);
  });

  test('E8 CLI: okänt argument → exit 2', () => {
    assert.equal(korCli(cliRepo, ['--ref', 'HEAD']).status, 2);
  });

  test('E9 CLI: --pr med icke-numeriskt värde → exit 2', () => {
    assert.equal(korCli(cliRepo, ['--pr', 'abc']).status, 2);
  });

  /* ════════════════════════════════════════════════════════════════════
     F. Den RIKTIGA .review-policy.json validerar mot sitt eget schema
     ════════════════════════════════════════════════════════════════ */

  test('F1 repots egen .review-policy.json validerar (fångar en trasig regel före push)', () => {
    const raw = JSON.parse(spawnSync('cat', [join(REPO, POLICY_FIL)], { encoding: 'utf8' }).stdout);
    const { ok, errors } = parsaPolicy(raw);
    assert.equal(ok, true, `repots policyfil validerar inte: ${errors.join('; ')}`);
  });

  test('F2 varje regel i repots policyfil har minst ett mönster och en källa', () => {
    const raw = JSON.parse(spawnSync('cat', [join(REPO, POLICY_FIL)], { encoding: 'utf8' }).stdout);
    const { policy } = parsaPolicy(raw);
    for (const regel of policy.regler) {
      assert.ok(regel.monster.length > 0, `${regel.id} saknar mönster`);
      assert.ok(regel.kalla.length > 0, `${regel.id} saknar källa`);
    }
  });
} finally {
  rmSync(tmpRot, { recursive: true, force: true });
}

console.log(`\n${passed} gröna, ${failed} röda.`);
process.exit(failed > 0 ? 1 : 0);
