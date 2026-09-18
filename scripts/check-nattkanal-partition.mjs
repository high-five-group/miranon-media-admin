#!/usr/bin/env node
import fs from 'node:fs';
// scripts/check-nattkanal-partition.mjs — TASK-450.10 (3A): invariant-vakt
// för nattens kanalpartition, i EXAKT samma form som
// scripts/check-aggregator-needs.mjs (TASK-450.3 / N4).
//
// ═══ PROBLEMET ═══
// Sedan TASK-450.1 (N2) går nattens åtta larmbärande jobb i TRE kanaler
// (`alarm` / produkt, `bokforings-arende` / bokföring, `beroende-arende` /
// beroende) i stället för en. Varje kanal listar sina utlösande jobb-ID:n
// för hand i sitt `if:`-villkor (nightly.yml), och nattvaktens allowlist
// (.nattvakt-kanal-policy.conf § NATTVAKT_PRODUKTKANAL_JOBBPREFIX) listar
// produktkanalens jobb-NAMNPREFIX för hand, oberoende. I dag håller båda
// (verifierat av två granskare, se docs/research/ci-djupgranskning-
// 2026-09-17/10-migrations-och-atgardsplan.md § N2 + ADR-082 § Updates
// 2026-09-18) — men ingen mekanism vaktar det: ett nionde nattjobb som
// glöms i alla tre triggrar blir TYST (inget larmar), och ett jobb som
// hamnar i TVÅ triggrar bryter garantin att en läsare bara behöver läsa
// RUBRIKEN på det ärende hon råkar öppna. Ett omdöpt produktjobb — eller
// ett prefix som glidit — tystar nattvaktens dödmansgrepp för HELA
// produktkanalen medan en ren ID-jämförelse fortfarande ser grönt.
//
// ═══ VAD DEN PRÖVAR — TVÅ LED, BÅDA MÅSTE HÅLLA ═══
// (i)  ID-LEDET. De tre kanaljobbens `if:`-villkor (regex-extraherade
//      `needs.<jobb>.result`-referenser) PARTITIONERAR unionen av de tre
//      kanaljobbens `needs:`-listor: varje jobb i unionen utlöses av
//      EXAKT EN kanal — aldrig noll, aldrig två eller fler. Detta är den
//      strukturella "populationen": kanaljobben deklarerar redan (i
//      `needs:`) vilka jobb de kan LÄSA resultatet av (för jobb-status-
//      sektionen i varje ärende, T146) — samma population de tre `if:`-
//      villkoren ska dela upp utan rest.
// (ii) NAMN-LEDET (bara produktkanalen — det är den enda kanal
//      nightly-watchdog.yml känner till, se CONTRIBUTING § Nattnätet
//      "Vakten vaktar bara produktkanalen"). Varje jobb-ID i produkt-
//      kanalens (`alarm`) `if:`-villkor mappar till ett `name:`-fält som
//      NÅGOT prefix i .nattvakt-kanal-policy.conf FAKTISKT matchar (prefix,
//      inte likhet — se den filens § VÄRDENA för skälet). Symmetriskt:
//      varje prefix i configen måste FAKTISKT matcha minst ett av
//      produktkanalens jobbnamn — ett prefix som glidit och inte matchar
//      något är lika farligt som ett omdöpt jobb, det maskerar bara på
//      andra hållet.
//
// ═══ HÄRLETT, INGEN FEMTE HANDHÅLLEN LISTA ═══
// Skriptet skapar INGEN ny policy-fil. Kanaljobbens ID:n (produkt/
// bokforing/beroende) är en strukturell fakta om nattens CI-topologi —
// samma distinktion check-aggregator-needs.mjs gör för "ci-passed"
// (hårdkodad default, inte config). Ledet (i) härleds helt ur nightly.yml
// via js-yaml (samma bibliotek scripts/verify-ci-parity.mjs redan
// använder). Ledet (ii) återanvänder den BEFINTLIGA
// .nattvakt-kanal-policy.conf — den läses genom att SOURCA filen i en
// riktig bash-subprocess och skriva ut arrayen, exakt det
// nightly-watchdog.yml självt gör (". ./.nattvakt-kanal-policy.conf"), i
// stället för att återuppfinna en bash-array-parser i JS som kan divergera
// från den riktiga konsumentens tolkning.
//
// Fail-closed (exit 2): saknad/otolkbar nightly.yml, saknat 'jobs:'-block,
// ett kanaljobb saknas i filen, saknad/otolkbar .nattvakt-kanal-policy.conf,
// tom prefix-array. Fynd (exit 1): ett jobb i unionen utlöses av noll eller
// fler än en kanal, en kanal refererar ett jobb utanför sin egen `needs:`-
// lista eller ett jobb som inte finns alls, ett produktjobbs namn matchas av
// inget prefix, eller ett prefix matchar inget produktjobbs namn. Grönt
// (exit 0): båda leden håller.
//
// Källa: docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-
// atgardsplan.md § N2 + § N4 (formen); tasks/sessions/2026-09-17-session-
// 126.md § Del 9 (Marcus beslut 3A); ADR-082 § Updates 2026-09-18;
// .nattvakt-kanal-policy.conf § INVARIANTEN SOM MÅSTE HÅLLAS FÖR HAND.
// Etablerad: TASK-450.10 (2026-09-19)

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { load as loadYaml } from 'js-yaml';

const REPO_ROOT = process.cwd();
const DEFAULT_NIGHTLY_PATH = '.github/workflows/nightly.yml';
const DEFAULT_KANAL_CONFIG_PATH = '.nattvakt-kanal-policy.conf';
const DEFAULT_CHANNELS = {
  produkt: 'alarm',
  bokforing: 'bokforings-arende',
  beroende: 'beroende-arende',
};

function usageDie(msg) {
  process.stderr.write(`check-nattkanal-partition: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = {
    nightlyPath: DEFAULT_NIGHTLY_PATH,
    kanalConfigPath: DEFAULT_KANAL_CONFIG_PATH,
    channels: { ...DEFAULT_CHANNELS },
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' && argv[i + 1]) out.nightlyPath = argv[++i];
    else if (argv[i] === '--kanal-config' && argv[i + 1]) out.kanalConfigPath = argv[++i];
    else if (argv[i] === '--produkt' && argv[i + 1]) out.channels.produkt = argv[++i];
    else if (argv[i] === '--bokforing' && argv[i + 1]) out.channels.bokforing = argv[++i];
    else if (argv[i] === '--beroende' && argv[i + 1]) out.channels.beroende = argv[++i];
    else usageDie(`okänd flagga eller saknat värde: ${argv[i]}`);
  }
  return out;
}

function loadWorkflow(nightlyPath) {
  const abs = path.resolve(REPO_ROOT, nightlyPath);
  if (!fs.existsSync(abs)) {
    usageDie(`nightly-workflowen saknas: ${abs}`);
  }
  let parsed;
  try {
    parsed = loadYaml(fs.readFileSync(abs, 'utf8'));
  } catch (fel) {
    usageDie(`kunde inte YAML-parsa ${abs}: ${fel.message}`);
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.jobs !== 'object' ||
    parsed.jobs === null
  ) {
    usageDie(`${abs} saknar ett giltigt 'jobs:'-block.`);
  }
  return parsed;
}

// `needs:` är giltigt YAML i två former: en array eller en enstaka sträng.
function normalizeNeeds(needs) {
  if (needs === undefined || needs === null) return [];
  if (Array.isArray(needs)) return needs;
  if (typeof needs === 'string') return [needs];
  usageDie(`'needs' har en oväntad form: ${JSON.stringify(needs)}`);
}

// Extraherar varje `needs.<jobb-id>.result`-referens ur ett if:-uttryck.
// Ren regex, inte en GH Actions-expression-parser — samma "läs texten,
// jämför mängder"-nivå som resten av repots invariant-vakter (check-
// fetch-depth-invariant.sh, check-aggregator-needs.mjs). needs.<id> följer
// samma identifierar-regler som ett jobb-ID (bokstäver/siffror/_/-).
function extractTriggerRefs(ifExpr) {
  if (typeof ifExpr !== 'string') return new Set();
  const re = /needs\.([A-Za-z0-9_-]+)\.result/g;
  const out = new Set();
  let m = re.exec(ifExpr);
  while (m !== null) {
    out.add(m[1]);
    m = re.exec(ifExpr);
  }
  return out;
}

function channelInfo(workflow, kanalKey, jobId, nightlyPath) {
  const job = workflow.jobs[jobId];
  if (!job || typeof job !== 'object') {
    usageDie(`kanaljobbet "${jobId}" (${kanalKey}) finns inte i ${nightlyPath}.`);
  }
  return {
    kanalKey,
    jobId,
    needs: new Set(normalizeNeeds(job.needs)),
    triggerRefs: extractTriggerRefs(typeof job.if === 'string' ? job.if : ''),
    name: typeof job.name === 'string' ? job.name : jobId,
  };
}

// Läser NATTVAKT_PRODUKTKANAL_JOBBPREFIX genom att SOURCA konfig-filen i en
// riktig bash-process — samma tolkning som nightly-watchdog.yml självt gör
// (". ./.nattvakt-kanal-policy.conf"), i stället för en egen bash-array-
// regex som kan divergera från den riktiga semantiken (citattecken,
// escape, flerradiga poster).
function loadProduktPrefixes(kanalConfigPath) {
  const abs = path.resolve(REPO_ROOT, kanalConfigPath);
  if (!fs.existsSync(abs)) {
    usageDie(`kanal-policy-filen saknas: ${abs}`);
  }
  const script =
    'set -euo pipefail\n' +
    'source "$1"\n' +
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal bash-array-expansion (${…[@]}), inte ett mall-literal-misstag.
    'printf "%s\\n" "${NATTVAKT_PRODUKTKANAL_JOBBPREFIX[@]}"\n';
  const res = spawnSync('bash', ['-c', script, '--', abs], { encoding: 'utf8' });
  if (res.error) {
    usageDie(`kunde inte köra bash för att läsa ${abs}: ${res.error.message}`);
  }
  if (res.status !== 0) {
    usageDie(
      `kunde inte läsa NATTVAKT_PRODUKTKANAL_JOBBPREFIX ur ${abs} (exit ${res.status}): ${res.stderr.trim()}`,
    );
  }
  const prefixes = res.stdout.split('\n').filter((rad) => rad.length > 0);
  if (prefixes.length === 0) {
    usageDie(`NATTVAKT_PRODUKTKANAL_JOBBPREFIX är tom eller saknas i ${abs}.`);
  }
  return prefixes;
}

function main() {
  const { nightlyPath, kanalConfigPath, channels } = parseArgs(process.argv.slice(2));
  const workflow = loadWorkflow(nightlyPath);
  const allJobs = Object.keys(workflow.jobs);

  const infos = [
    channelInfo(workflow, 'produkt', channels.produkt, nightlyPath),
    channelInfo(workflow, 'bokforing', channels.bokforing, nightlyPath),
    channelInfo(workflow, 'beroende', channels.beroende, nightlyPath),
  ];

  const errors = [];

  // ═══ LED (i) — ID-LEDET ═══

  // Fail-closed-artade fynd (filen parsar fint, men referensen är trasig):
  // en kanal refererar ett jobb utanför sin EGEN needs-lista, eller ett
  // jobb som inte ens finns som toppnivåjobb.
  for (const c of infos) {
    for (const ref of c.triggerRefs) {
      if (!allJobs.includes(ref)) {
        errors.push(
          `kanalen "${c.jobId}" (${c.kanalKey}) refererar "${ref}" i sitt if-villkor, men ` +
            `det jobbet finns inte som toppnivåjobb i ${nightlyPath}.`,
        );
      } else if (!c.needs.has(ref)) {
        errors.push(
          `kanalen "${c.jobId}" (${c.kanalKey}) refererar "${ref}" i sitt if-villkor, men det ` +
            `jobbet står inte i "${c.jobId}".needs — needs.${ref}.result är ogiltig i GitHub Actions.`,
        );
      }
    }
  }

  // Populationen: unionen av de tre kanaljobbens needs-listor. Varje jobb i
  // unionen måste utlösa EXAKT EN av de tre kanalerna.
  const population = new Set();
  for (const c of infos) for (const jobb of c.needs) population.add(jobb);

  const agarePerJobb = new Map();
  for (const c of infos) {
    for (const ref of c.triggerRefs) {
      if (!agarePerJobb.has(ref)) agarePerJobb.set(ref, []);
      agarePerJobb.get(ref).push(c.kanalKey);
    }
  }

  for (const jobb of population) {
    const agare = agarePerJobb.get(jobb) ?? [];
    if (agare.length === 0) {
      errors.push(
        `jobbet "${jobb}" utlöser INGEN av de tre kanalerna (produkt/bokforing/beroende) — ` +
          `ett rött "${jobb}" blir tyst hela vägen. Lägg till det i någon kanals if-villkor, eller ` +
          'ta bort det ur samtliga needs-listor om det inte längre är alarm-bärande.',
      );
    } else if (agare.length > 1) {
      errors.push(
        `jobbet "${jobb}" utlöser FLERA kanaler (${agare.join(', ')}) — partitionen är bruten, ` +
          'exakt en kanal ska äga varje jobb (CONTRIBUTING § Nattnätet, "Läs rubriken, inte bara färgen").',
      );
    }
  }

  // ═══ LED (ii) — NAMN-LEDET (bara produktkanalen) ═══
  const produktInfo = infos.find((c) => c.kanalKey === 'produkt');
  const prefixes = loadProduktPrefixes(kanalConfigPath);
  const prefixAnvand = new Map(prefixes.map((p) => [p, false]));

  for (const jobId of produktInfo.triggerRefs) {
    const job = workflow.jobs[jobId];
    const namn = job && typeof job.name === 'string' ? job.name : jobId;
    const matchandePrefix = prefixes.find((p) => namn.startsWith(p));
    if (matchandePrefix === undefined) {
      errors.push(
        `produktjobbet "${jobId}" (name: "${namn}") matchas av INGET prefix i ${kanalConfigPath} — ` +
          'nattvakten (nightly-watchdog.yml) skulle inte känna igen jobbet som rött. Lägg till eller ' +
          'rätta ett prefix.',
      );
    } else {
      prefixAnvand.set(matchandePrefix, true);
    }
  }

  for (const [prefix, anvand] of prefixAnvand) {
    if (!anvand) {
      errors.push(
        `prefixet "${prefix}" i ${kanalConfigPath} matchar INGET av produktkanalens jobbnamn — ett ` +
          'föråldrat prefix maskerar att listan glidit. Städa eller rätta posten.',
      );
    }
  }

  if (errors.length > 0) {
    process.stderr.write(
      `❌ check-nattkanal-partition: ${errors.length} avvikelse(r) i ${nightlyPath} / ${kanalConfigPath}:\n\n`,
    );
    for (const fel of errors) process.stderr.write(`   - ${fel}\n`);
    process.stderr.write('\n');
    process.exit(1);
  }

  process.stdout.write(
    `✅ check-nattkanal-partition: OK — ${population.size} nattjobb partitionerade över 3 kanaler, ` +
      `${prefixes.length} produktkanals-prefix, alla matchade.\n`,
  );
}

main();
