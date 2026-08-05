#!/usr/bin/env node
// scripts/verify-ci-parity.mjs — kör den grinduppsättning ci.yml + ci-suite.yml
// faktiskt kör för en vanlig kod-PR, i ETT lokalt kommando.
//
// ═══ VARFÖR DEN HÄR FILEN FINNS ═══
// Fyra mätta instanser i EN session (2026-08-05, S97) visade att ingen lokal
// kommandouppsättning motsvarade CI:s — var och en som verifierar före push
// plockar ihop sin egen delmängd och missar olika delar (fel jobb, fel flagga,
// fel scope, fel räkning av en grinds egna fynd). `npm run check:docs` löste
// samma problem för de tretton dokumentations-grindarna 2026-07-26; detta
// skript gör motsvarande för RESTEN av ci.yml + ci-suite.yml.
//
// ═══ HÄRLETT, INTE DUPLICERAT ═══
// En handhållen lista i package.json löser ingenting — den driftar första
// gången ci.yml får en ny grind utan att listan uppdateras, och ger falsk
// trygghet på köpet (precis ADR-083-felklassen: prosa som påstår en täckning
// ingen mekanism håller). Detta skript väljer därför en annan form:
//
//   1. `npm run check:docs` täcker redan TRETTON grindar (docs-jobbet +
//      lint-jobbets dokumentations-grindar) — de återanvänds, dupliceras inte.
//   2. RESTEN av lint-jobbets och docs-jobbets steg, plus ci-suite.yml:s
//      `test-fast`/`acceptance`/`webblasarbeteende`-jobb (de tre som faktiskt
//      instansieras på PR-ytan — se § SUITE-YTAN nedan), läses ur
//      workflow-YAML:en VID VARJE KÖRNING och körs VERBATIM, steg för steg.
//      Lägger ci.yml till en rad i ett känt jobbs `run:`-block plockas den
//      upp automatiskt nästa gång detta skript körs — ingen manifest-post,
//      ingen synk, ingen drift möjlig på den ytan.
//   3. Det ENDA som är kvar att deklarera är UNDANTAGEN: infrastruktur-steg
//      (Checkout, Setup Node, npm ci …) som inte validerar något, steg redan
//      täckta av check:docs, och tre binärer som CI laddar ner pinnade
//      versioner av (shellcheck/actionlint/vale) — de version-kollas mot den
//      pin som extraheras ur ci.yml:s EGEN steg-text i stället för att
//      dupliceras som en fjärde siffra att hålla i synk. Se .ci-parity-policy.json.
//
// ═══ PARITETS-GRINDEN — VAD SOM FORTFARANDE KAN DRIFTA ═══
// Verbatim-körning stänger drift INOM ett känt jobb. Kvar är två ytor,
// och båda vaktas mekaniskt HÄR, fail-closed, INNAN något körs:
//   (a) en HELT NY jobb i ci.yml eller ci-suite.yml som denna policy inte
//       känner till (verifieraJobbmangd) — antingen ny täckning som ska
//       klassas, eller en policy-post som blivit stale och ska städas bort.
//   (b) `suite`-jobbets `run_staging`/`run_a11y`-inputs slutar vara literalt
//       `false` (verifieraSuiteInputInvarianter) — då måste purge/a11y/
//       test-staging tas in i derivedJobs, för de är för närvarande
//       UTESLUTNA på antagandet att de aldrig instansieras på PR-ytan.
//   (c) ett härlett stegs `run:`- eller `env:`-text bär ett GH Actions-
//       uttryck (`${{ … }}`) som inte är känt (exprSubstitutions) — körs
//       ALDRIG blint, skriptet fäller hellre än att köra trasig bash.
//
// ═══ SUITE-YTAN — VARFÖR BARA TRE AV SEX ci-suite.yml-JOBB ═══
// ci.yml:s `suite`-jobb skickar `run_staging: false` och `run_a11y: false`
// VILLKORSLÖST till ci-suite.yml (se ci.yml, jobbet `suite`, kommentarerna
// "är VILLKORSLÖST"). `purge`, `a11y` och `test-staging` gatas på just de
// inputs och instansieras därför ALDRIG på PR-ytan — och kräver dessutom
// STAGING_AIRTABLE_TOKEN/TEST_SUPABASE_*-secrets som inte finns lokalt.
// Detta skript antar därför att bara `test-fast`, `acceptance` och
// `webblasarbeteende` är relevanta — och verifierar antagandet mekaniskt vid
// varje körning (§ b ovan) i stället för att bara lita på det.
//
// ═══ DEFAULT ÄR DET FULLSTÄNDIGA LÄGET ═══
// Kostnaden är verklig (Acceptance-klassen ensam är ~7 min i CI). Ett
// snabbläge som RÅKAR bli default återskapar precis det problem detta
// skript finns för att lösa — `--fast` finns för iterativt lokalt arbete,
// men skriver ut en banderoll som inte går att missa, både före och efter
// körning, och räknas ALDRIG som fullständig täckning.
//
// Användning:
//   node scripts/verify-ci-parity.mjs           — fullständigt (motsvarar CI)
//   node scripts/verify-ci-parity.mjs --fast     — hoppar Acceptance + Webblasarbeteende
//   node scripts/verify-ci-parity.mjs --list     — visa planen, kör inget
//   npm run verify:ci-parity[:fast]              — samma, via package.json
//
// Exit 0  — allt grönt (fullständigt läge = motsvarar CI:s väckta jobb).
// Exit 1  — minst en grind rödmålad.
// Exit 2  — PARITETEN SJÄLV är trasig (ny jobb / ändrad suite-input /
//           ohanterat GH-uttryck) — skriptet vägrar uttala sig om täckning
//           det inte längre kan garantera. Kör inget gate-arbete i detta läge.
// Exit 64 — policy-/miljöfel (`.ci-parity-policy.json` saknas/trasig, eller
//           workflow-filerna kan inte läsas).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

const EXIT_OK = 0;
const EXIT_GATE_FAILED = 1;
const EXIT_PARITY_BROKEN = 2;
const EXIT_POLICYFEL = 64;

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POLICY_PATH = join(REPO, '.ci-parity-policy.json');

const GH_EXPR = /\$\{\{[^}]*\}\}/g;

const FAST_MODE_SKIP = new Set([
  'Acceptance tests (hermetiska)',
  'Acceptance-klassens tvåsidiga bevis (hermetik-självtest)',
  'Webblasarbeteende-tester (fixturfritt, noll nätverksanrop)',
]);

/* ── CLI-argument ─────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const args = { fast: false, list: false, help: false };
  for (const a of argv) {
    if (a === '--fast' || a === '-f') args.fast = true;
    else if (a === '--list') args.list = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else {
      console.error(`Okänd flagga: ${a} (--fast | --list | --help)`);
      process.exit(EXIT_POLICYFEL);
    }
  }
  return args;
}

/* ── Läsning ──────────────────────────────────────────────────────────── */

function laddaPolicy() {
  if (!existsSync(POLICY_PATH)) {
    console.error(`❌ Policy-filen saknas: ${POLICY_PATH}`);
    console.error(
      '   Fail-closed: en paritets-grind utan sin egen config rapporteras ALDRIG som grön.',
    );
    process.exit(EXIT_POLICYFEL);
  }
  try {
    return JSON.parse(readFileSync(POLICY_PATH, 'utf-8'));
  } catch (fel) {
    console.error(`❌ Policy-filen kunde inte tolkas: ${POLICY_PATH}\n   ${fel.message}`);
    process.exit(EXIT_POLICYFEL);
  }
}

function laddaWorkflow(relPath) {
  const abs = join(REPO, relPath);
  if (!existsSync(abs)) {
    console.error(`❌ Workflow-filen saknas: ${abs}`);
    process.exit(EXIT_POLICYFEL);
  }
  const raw = readFileSync(abs, 'utf-8');
  let parsed;
  try {
    parsed = loadYaml(raw);
  } catch (fel) {
    console.error(`❌ Kunde inte YAML-parsa ${relPath}: ${fel.message}`);
    process.exit(EXIT_POLICYFEL);
  }
  return { relPath, raw, parsed };
}

/* ── Paritets-preflight (fail-closed, körs INNAN något grindas) ─────────── */

export function verifieraJobbmangd(parsed, kandaJobb, filLabel) {
  const fel = [];
  const verkliga = new Set(Object.keys(parsed.jobs ?? {}));
  const deklarerade = new Set(Object.keys(kandaJobb));

  for (const namn of verkliga) {
    if (!deklarerade.has(namn)) {
      fel.push(
        `${filLabel}: jobbet "${namn}" är NYTT — okänt för .ci-parity-policy.json. ` +
          `Klassa det i knownJobs (derivera det i derivedJobs, eller uteslut det med skäl) ` +
          'innan denna grind kan lita på sin egen täckning.',
      );
    }
  }
  for (const namn of deklarerade) {
    if (!verkliga.has(namn)) {
      fel.push(
        `${filLabel}: policyn deklarerar jobbet "${namn}" men det finns inte längre i ` +
          'workflow-filen. Ett kvarliggande undantag maskerar nästa drift — städa posten.',
      );
    }
  }
  return fel;
}

export function verifieraSuiteInputInvarianter(parsedCi, invarianter) {
  const fel = [];
  for (const inv of invarianter) {
    const jobb = parsedCi.jobs?.[inv.job];
    const varde = jobb?.with?.[inv.input];
    if (varde !== inv.mustBeLiteral) {
      fel.push(
        `ci.yml: jobb "${inv.job}" input "${inv.input}" är ${JSON.stringify(varde)}, ` +
          `förväntat literalt ${JSON.stringify(inv.mustBeLiteral)}. ${inv.why}`,
      );
    }
  }
  return fel;
}

/* ── GH Actions-uttryck (`${{ … }}`) — substituera kända, fäll på okända ── */

export function losUttryck(varde, substitutioner) {
  let ut = varde;
  for (const [uttryck, ersattning] of Object.entries(substitutioner)) {
    ut = ut.split(uttryck).join(ersattning);
  }
  return ut;
}

export function hittaOhanteradeUttryck(text) {
  return [...(text ?? '').matchAll(GH_EXPR)].map((m) => m[0]);
}

export function losStegEnv(step, substitutioner) {
  const env = {};
  const ohanterade = [];
  for (const [k, v] of Object.entries(step.env ?? {})) {
    const raw = typeof v === 'string' ? v : String(v);
    const lost = losUttryck(raw, substitutioner);
    ohanterade.push(...hittaOhanteradeUttryck(lost).map((u) => `env.${k}: ${u}`));
    env[k] = lost;
  }
  return { env, ohanterade };
}

/* ── Klassning av ett steg ────────────────────────────────────────────── */

export function klassificeraSteg(namn, policy) {
  if (policy.stepClassification.infra.includes(namn)) return 'infra';
  if (policy.stepClassification.coveredByCheckDocs.includes(namn)) return 'covered';
  if (policy.specialSteps[namn]) return 'special';
  return 'derive';
}

/* ── Körning av ett härlett steg (verbatim run:-block i temp-fil) ────────
 *
 * GH Actions kör `run:`-block med `bash --noprofile --norc -eo pipefail
 * <genererad temp-fil>` på Linux/macOS-runners — INTE `bash -c "…"`.
 * Samma form här: blocket skrivs till en riktig temp-fil och exekveras som
 * skript, vilket undviker skal-citerings-hazarder och matchar CI:s exakta
 * feltoleranta semantik (stannar vid FÖRSTA felande rad i ett flerradsblock,
 * precis som CI skulle göra för samma steg).
 */
function korSteg(label, runText, env, tmpRoot) {
  const fil = join(tmpRoot, `${label}.sh`);
  writeFileSync(fil, runText, { mode: 0o755 });
  const start = Date.now();
  const res = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', fil], {
    cwd: REPO,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  return { ok: res.status === 0, ms: Date.now() - start, status: res.status, signal: res.signal };
}

/* ── Special-hantering: pinnade binärer (shellcheck/vale) + actionlint ──── */

export function extraheraGrupp(text, regexStr, fel) {
  const m = (text ?? '').match(new RegExp(regexStr));
  if (!m) {
    fel.push(
      `Kunde inte extrahera "${regexStr}" ur ci.yml:s steg-text — steget har ändrat form, ` +
        'uppdatera .ci-parity-policy.json:s specialSteps-post.',
    );
    return null;
  }
  return m[1];
}

function verifieraVersion(tool, args, matchRegex, pinVersion, remedyHint) {
  const res = spawnSync(tool, args, { encoding: 'utf8' });
  if (res.error || (res.status !== 0 && res.status !== null && !res.stdout && !res.stderr)) {
    return { ok: false, detail: `${tool} kunde inte köras lokalt. ${remedyHint}` };
  }
  const text = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  const m = text.match(new RegExp(matchRegex, 'm'));
  if (!m) {
    return {
      ok: false,
      detail: `Kunde inte tolka \`${tool} ${args.join(' ')}\`-utdata mot mönstret. ${remedyHint}`,
    };
  }
  if (m[1] !== pinVersion) {
    return {
      ok: false,
      detail:
        `${tool} ${m[1]} lokalt != CI:s pinnade ${pinVersion}. En annan version kan sakna eller ` +
        `ha ANDRA regler än den CI faktiskt kör mot (t.ex. shellcheck 0.9.x saknar SC2310/SC2311). ${remedyHint}`,
    };
  }
  return { ok: true, detail: `${tool} ${m[1]} — matchar CI:s pin exakt.` };
}

function hanteraVersionAssert(step, spec, fel) {
  const pin = extraheraGrupp(step.run, spec.pinRegex, fel);
  if (pin === null) return { ok: false, ms: 0 };
  const start = Date.now();
  const utfall = verifieraVersion(
    spec.tool,
    spec.versionArgs,
    spec.versionOutputRegex,
    pin,
    spec.remedyHint,
  );
  return { ok: utfall.ok, ms: Date.now() - start, detail: utfall.detail };
}

function hanteraActionlintHybrid(step, spec, tmpRoot, fel) {
  const pin = extraheraGrupp(step.run, spec.pinRegex, fel);
  const ignoreFlag = extraheraGrupp(step.run, spec.ignoreFlagRegex, fel);
  if (pin === null || ignoreFlag === null) return { ok: false, ms: 0 };

  const start = Date.now();
  const versionUtfall = verifieraVersion(
    'actionlint',
    spec.versionArgs,
    spec.versionOutputRegex,
    pin,
    spec.remedyHint,
  );

  if (versionUtfall.ok) {
    const res = spawnSync('actionlint', ['-color', '-ignore', ignoreFlag], {
      cwd: REPO,
      stdio: 'inherit',
    });
    return {
      ok: res.status === 0,
      ms: Date.now() - start,
      detail: `lokal actionlint ${pin} matchar pin — kört direkt med ci.yml:s egen -ignore-sträng.`,
    };
  }

  console.log(
    `⚠️  ${versionUtfall.detail}\n   Faller tillbaka på CI:s eget nedladdningsrecept ur ci.yml ` +
      '(kräver nätverk, ingen sudo, rör aldrig /usr/local/bin).',
  );
  const korning = korSteg('lint-check-workflow-files-actionlint-fallback', step.run, {}, tmpRoot);
  return {
    ok: korning.ok,
    ms: Date.now() - start,
    detail: 'kört via CI:s nedladdningsrecept (fallback)',
  };
}

/**
 * "Check YAML syntax (yamllint)"-steget konflaterar bootstrap (`pip install
 * --quiet yamllint`) och grind (`yamllint .github/`) i SAMMA `run:`-block —
 * rimligt på en fräsch CI-runner, men `pip` (utan siffra) finns inte på
 * PATH på en macOS/Homebrew-maskin där `yamllint` redan är installerat via
 * en annan väg (mätt: `pip3`/`python3 -m pip` finns, bar `pip` gör inte).
 * Verbatim-körning av HELA blocket hade alltså fällt på steg 1 av två, av
 * ett skäl som inte har med YAML-innehållet att göra.
 *
 * Lösningen är INTE att hårdkoda "yamllint .github/" som en fjärde
 * duplicerad siffra — det vore precis den drift-risk skriptet finns för att
 * undvika (scopet ".github/" skulle kunna ändras i ci.yml utan att någon
 * uppdaterar en kopia här). I stället: verifiera att verktyget redan finns
 * på PATH, och härled den FAKTISKA gate-kommandoraden ur steg-texten genom
 * att ta dess sista icke-tomma rad — CI:s egen konvention i detta steg
 * (bootstrap-rader följt av den faktiska körningen sist).
 */
function hanteraToolPresenceLastLine(step, spec, tmpRoot) {
  const finns = spawnSync(spec.tool, spec.presenceArgs ?? ['--version'], { encoding: 'utf8' });
  if (finns.error) {
    return {
      ok: false,
      ms: 0,
      detail: `${spec.tool} hittades inte på PATH lokalt. ${spec.remedyHint}`,
    };
  }

  const rader = (step.run ?? '')
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (rader.length === 0) {
    return { ok: false, ms: 0, detail: 'Steget saknar körbar text att härleda sista raden ur.' };
  }
  const sistaRaden = rader[rader.length - 1];

  const korning = korSteg(`${spec.tool}-sista-raden`, sistaRaden, {}, tmpRoot);
  return {
    ok: korning.ok,
    ms: korning.ms,
    detail: `${spec.tool} fanns redan lokalt — körde ci.yml:s sista rad verbatim: \`${sistaRaden}\``,
  };
}

/* ── check:docs — de tretton redan-mekaniserade dokumentations-grindarna ── */

function korCheckDocs() {
  console.log(
    '\n\x1b[1m═══ npm run check:docs (13 grindar — docs-jobbet + lint-jobbets docs-grindar) ═══\x1b[0m',
  );
  const start = Date.now();
  const res = spawnSync('npm', ['run', '--silent', 'check:docs'], { cwd: REPO, stdio: 'inherit' });
  return { ok: res.status === 0, ms: Date.now() - start };
}

/* ── Huvudflöde ───────────────────────────────────────────────────────── */

function skrivUtPlan(jobbSteg) {
  console.log('\n\x1b[1m═══ PLAN (--list, inget körs) ═══\x1b[0m');
  for (const { jobLabel, steg } of jobbSteg) {
    console.log(`\n${jobLabel}:`);
    for (const { namn, klass } of steg) {
      const tag = {
        infra: 'infra (hoppas)',
        covered: 'check:docs (redan täckt)',
        special: 'special',
        derive: 'härleds+körs',
      }[klass];
      console.log(`  [${tag}] ${namn}`);
    }
  }
}

function skrivUtHjalp() {
  console.log(`verify-ci-parity — kör den grinduppsättning en vanlig kod-PR väcker i CI.

Användning:
  node scripts/verify-ci-parity.mjs           fullständigt läge (motsvarar CI)
  node scripts/verify-ci-parity.mjs --fast     hoppar Acceptance + Webblasarbeteende (INTE CI-parity)
  node scripts/verify-ci-parity.mjs --list     visa planen (härledd ur ci.yml/ci-suite.yml), kör inget
  node scripts/verify-ci-parity.mjs --help     denna text

  npm run verify:ci-parity[:fast]              samma, via package.json

Exit 0 = grönt. Exit 1 = en grind rödmålad. Exit 2 = paritets-preflighten
själv trasig (se .ci-parity-policy.json). Exit 64 = policy-/miljöfel.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    skrivUtHjalp();
    return EXIT_OK;
  }

  const totalStart = Date.now();

  if (args.fast) {
    console.log(
      '\x1b[41m\x1b[97m  ⚠️  FAST-LÄGE — DETTA ÄR INTE CI-PARITET. Acceptance + Webblasarbeteende hoppas. ' +
        'Kör UTAN --fast före push.  \x1b[0m',
    );
  }

  const policy = laddaPolicy();
  const ci = laddaWorkflow(policy.workflows.ci);
  const ciSuite = laddaWorkflow(policy.workflows.ciSuite);

  const preflightFel = [
    ...verifieraJobbmangd(ci.parsed, policy.knownJobs.ci, 'ci.yml'),
    ...verifieraJobbmangd(ciSuite.parsed, policy.knownJobs.ciSuite, 'ci-suite.yml'),
    ...verifieraSuiteInputInvarianter(ci.parsed, policy.suiteInputInvariants),
  ];
  if (preflightFel.length > 0) {
    console.error('\n❌ PARITETEN ÄR TRASIG — verify-ci-parity litar inte på sin egen täckning:\n');
    for (const f of preflightFel) console.error(`   · ${f}`);
    console.error(
      '\n   Skriptet kör INGET grind-arbete i detta läge: en delvis täckning som rapporteras\n' +
        '   som fullständig är farligare än att inte rapportera alls.',
    );
    return EXIT_PARITY_BROKEN;
  }
  console.log('✅ Paritets-preflight: jobbmängden + suite-input-invarianterna matchar policyn.');

  // Bygg den fulla plan-listan: {jobLabel, steg:[{namn, step, klass}]}
  const planer = [];
  for (const jobbNamn of policy.derivedJobs.ci) {
    const steg = (ci.parsed.jobs[jobbNamn].steps ?? []).map((step) => ({
      namn: step.name,
      step,
      klass: klassificeraSteg(step.name, policy),
    }));
    planer.push({ jobLabel: `ci.yml :: ${jobbNamn}`, steg });
  }
  for (const jobbNamn of policy.derivedJobs.ciSuite) {
    const steg = (ciSuite.parsed.jobs[jobbNamn].steps ?? []).map((step) => ({
      namn: step.name,
      step,
      klass: klassificeraSteg(step.name, policy),
    }));
    planer.push({ jobLabel: `ci-suite.yml :: ${jobbNamn}`, steg });
  }

  if (args.list) {
    skrivUtPlan(planer);
    return EXIT_OK;
  }

  const resultat = []; // {namn, jobLabel, status: 'PASS'|'FAIL'|'SKIP', ms, detail?}

  const checkDocs = korCheckDocs();
  resultat.push({
    namn: 'npm run check:docs (13 grindar)',
    jobLabel: '(täcker ci.yml docs-jobbet + 9 av lint-jobbets steg)',
    status: checkDocs.ok ? 'PASS' : 'FAIL',
    ms: checkDocs.ms,
  });

  const tmpRoot = mkdtempSync(join(os.tmpdir(), 'ci-parity-'));
  try {
    for (const { jobLabel, steg } of planer) {
      for (const { namn, step, klass } of steg) {
        if (klass === 'infra' || klass === 'covered') {
          resultat.push({ namn, jobLabel, status: 'SKIP', ms: 0, detail: klass });
          continue;
        }

        if (args.fast && FAST_MODE_SKIP.has(namn)) {
          resultat.push({ namn, jobLabel, status: 'SKIP', ms: 0, detail: '--fast' });
          continue;
        }

        console.log(`\n\x1b[1m▶ [${jobLabel}] ${namn}\x1b[0m`);

        if (klass === 'special') {
          const spec = policy.specialSteps[namn];
          const fel = [];
          const utfall =
            spec.handling === 'actionlintHybrid'
              ? hanteraActionlintHybrid(step, spec, tmpRoot, fel)
              : spec.handling === 'toolPresenceLastLine'
                ? hanteraToolPresenceLastLine(step, spec, tmpRoot)
                : hanteraVersionAssert(step, spec, fel);
          if (fel.length > 0) {
            for (const f of fel) console.error(`   ❌ ${f}`);
            resultat.push({ namn, jobLabel, status: 'FAIL', ms: 0, detail: fel.join(' | ') });
            continue;
          }
          if (utfall.detail) console.log(`   ${utfall.ok ? '✅' : '❌'} ${utfall.detail}`);
          resultat.push({ namn, jobLabel, status: utfall.ok ? 'PASS' : 'FAIL', ms: utfall.ms });
          continue;
        }

        // klass === 'derive'
        if (!step.run) {
          console.error(
            `   ❌ Steget använder \`uses:\` (inte \`run:\`) och är oklassat i .ci-parity-policy.json. ` +
              'Klassa det (infra / coveredByCheckDocs / specialSteps) innan skriptet kan derivera det.',
          );
          resultat.push({ namn, jobLabel, status: 'FAIL', ms: 0, detail: 'oklassat uses:-steg' });
          continue;
        }

        const { env, ohanterade: envOhanterade } = losStegEnv(step, policy.exprSubstitutions);
        const runOhanterade = hittaOhanteradeUttryck(step.run);
        const ohanterade = [...envOhanterade, ...runOhanterade];
        if (ohanterade.length > 0) {
          console.error(
            `   ❌ Ohanterat GH Actions-uttryck i detta steg: ${ohanterade.join(', ')}\n` +
              '      Skriptet kör aldrig blint — lägg en post i .ci-parity-policy.json:s ' +
              'exprSubstitutions, eller klassa om steget.',
          );
          resultat.push({ namn, jobLabel, status: 'FAIL', ms: 0, detail: 'ohanterat GH-uttryck' });
          continue;
        }

        const label = `${jobLabel}--${namn}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 80);
        const korning = korSteg(label, step.run, env, tmpRoot);
        resultat.push({ namn, jobLabel, status: korning.ok ? 'PASS' : 'FAIL', ms: korning.ms });
      }
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  /* ── Sammanfattning ───────────────────────────────────────────────── */

  const passed = resultat.filter((r) => r.status === 'PASS');
  const failed = resultat.filter((r) => r.status === 'FAIL');
  const skipped = resultat.filter(
    (r) => r.status === 'SKIP' && r.detail !== 'infra' && r.detail !== 'covered',
  );
  const totalMs = Date.now() - totalStart;

  console.log('\n\x1b[1m─────────── verify-ci-parity ───────────\x1b[0m');
  console.log(`\x1b[32m✅ ${passed.length} gröna\x1b[0m (inkl. check:docs 13 grindar)`);
  if (skipped.length > 0) {
    console.log(
      `\x1b[33m⏭  ${skipped.length} skippade (${[...new Set(skipped.map((s) => s.detail))].join(', ')})\x1b[0m`,
    );
  }
  if (failed.length > 0) {
    console.log(`\x1b[31m❌ ${failed.length} röda:\x1b[0m`);
    for (const f of failed)
      console.log(`   · [${f.jobLabel}] ${f.namn}${f.detail ? ` — ${f.detail}` : ''}`);
  }
  console.log(`⏱  Total körtid: ${(totalMs / 1000).toFixed(1)} s`);

  if (args.fast) {
    console.log(
      '\x1b[41m\x1b[97m  ⚠️  FAST-LÄGE — resultatet ovan är INTE CI-parity (Acceptance + ' +
        'Webblasarbeteende hoppades). Kör UTAN --fast före push.  \x1b[0m',
    );
  }

  if (failed.length > 0) {
    console.log('\n\x1b[31mverify-ci-parity RÖTT — fixa ovanstående före push.\x1b[0m');
    return EXIT_GATE_FAILED;
  }

  console.log(
    args.fast
      ? '\n\x1b[33mverify-ci-parity grönt på det som kördes — INTE CI-parity, se banderollen ovan.\x1b[0m'
      : '\n\x1b[32mverify-ci-parity grönt — motsvarar den grinduppsättning en vanlig kod-PR väcker i CI.\x1b[0m',
  );
  return EXIT_OK;
}

if (import.meta.main) {
  process.exit(await main());
}
