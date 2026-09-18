#!/usr/bin/env node
import fs from 'node:fs';
// scripts/check-aggregator-needs.mjs — TASK-450.3 (N4): invariant-vakt för
// paraplyjobbets `needs`-lista.
//
// ═══ PROBLEMET ═══
// Repots ENDA obligatoriska kontroll är `ci-passed` ("CI Passed or
// Skipped", ci.yml). Dess `needs`-lista räknar upp de toppnivåjobb den
// bryr sig om — och den listan hålls för hand. Ett nytt toppnivåjobb som
// läggs till i `jobs:` men glöms i `ci-passed.needs` blir OSYNLIGT för
// paraplyet: jobbet kan misslyckas hur rött som helst utan att `ci-passed`
// någonsin ser det, och landningen blockeras inte. Ingen mekanism
// kontrollerade den listan innan detta skript (se
// docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
// § N4 — `scripts/verify-ci-parity.mjs:202` (`verifieraJobbmangd`) fäller
// bara om ett jobb är OKLASSAT i `.ci-parity-policy.json`, inte om det
// saknas i `ci-passed.needs`, och den filen körs dessutom inte i CI).
//
// ═══ VAD DEN PRÖVAR ═══
// Läser workflow-filen (default `.github/workflows/ci.yml`) med `js-yaml`,
// exakt samma bibliotek `scripts/verify-ci-parity.mjs` redan använder.
// Varje toppnivåjobb i `jobs:` UTOM paraplyjobbet (default `ci-passed`)
// måste antingen:
//   (a) stå i paraplyjobbets `needs`-lista, ELLER
//   (b) ha en EXPLICIT undantags-post i policy-filen (default
//       `.aggregator-needs-policy.json`) med ett ifyllt `rationale` —
//       samma "medvetna undantag, skrivet skäl"-form som
//       `.listparitet-policy.conf` använder för sina par.
// Ett jobb som varken uppfyller (a) eller (b) FÄLLER med sitt namn.
//
// Ett UNDANTAG som inte fyller någon funktion fäller också (AC #2): en
// post som pekar på ett jobb som REDAN står i `needs` (undantaget gör då
// ingenting — det är dött, städa det), eller på ett jobb som inte ens
// FINNS bland toppnivåjobben (utöver paraplyjobbet) — en kvarliggande post
// som maskerar att den egentliga listan glidit. Samma "ett kvarliggande
// undantag maskerar nästa drift"-argument som
// `scripts/verify-ci-parity.mjs`s `verifieraJobbmangd` använder för
// `.ci-parity-policy.json`.
//
// ═══ FORM ═══
// Samma form som `scripts/check-fetch-depth-invariant.sh` (namngiven i
// spec § N4 som förebild): läs filen, jämför två mängder, fäll med
// konkret namn vid avvikelse. Skillnaden är språket (`.mjs` + `js-yaml`,
// inte `bash` + `grep`) — motiverat av att `js-yaml` redan är en pinnad
// dependency (`package.json`) och den enda pålitliga vägen att parsa
// `needs:`s båda giltiga YAML-former (array ELLER enstaka sträng) utan att
// själv återuppfinna en YAML-parser i grep/awk.
//
// Config-driven grindvakt (CLAUDE.md-regeln, Lesson #6, UNIVERSAL):
// skriptets LOGIK är universell (kan dupliceras till andra spokes), VÄRDENA
// — undantagen — bor i `.aggregator-needs-policy.json`, aldrig hårdkodade
// här. Paraplyjobbets NAMN ("ci-passed") är däremot en strukturell fakta om
// DENNA repots CI-topologi, inte ett "värde" i policy-mening — samma
// distinktion `check-fetch-depth-invariant.sh` gör för sina bärar-sökvägar
// (hårdkodade konstanter, inte config); default kan ändå överridas via
// `--aggregator` om topologin någonsin byter namn.
//
// Fail-closed (exit 2): saknad/otolkbar workflow-fil, saknad/otolkbar
// policy-fil, malformad undantags-post (saknar `job` eller `rationale`),
// dubblett-undantag för samma jobb, eller paraplyjobbet självt saknas i
// filen. Fynd (exit 1): jobb utanför `needs` utan undantag, eller ett
// undantag som inte fyller någon funktion. Grönt (exit 0): allt stämmer.
//
// Källa: docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md § N4
// Etablerad: TASK-450.3 (2026-09-18)

import path from 'node:path';
import process from 'node:process';
import { load as loadYaml } from 'js-yaml';

const REPO_ROOT = process.cwd();
const DEFAULT_CI_PATH = '.github/workflows/ci.yml';
const DEFAULT_POLICY_PATH = '.aggregator-needs-policy.json';
const DEFAULT_AGGREGATOR = 'ci-passed';

function usageDie(msg) {
  process.stderr.write(`check-aggregator-needs: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = {
    ciPath: DEFAULT_CI_PATH,
    configPath: DEFAULT_POLICY_PATH,
    aggregator: DEFAULT_AGGREGATOR,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' && argv[i + 1]) out.ciPath = argv[++i];
    else if (argv[i] === '--config' && argv[i + 1]) out.configPath = argv[++i];
    else if (argv[i] === '--aggregator' && argv[i + 1]) out.aggregator = argv[++i];
    else usageDie(`okänd flagga eller saknat värde: ${argv[i]}`);
  }
  return out;
}

function loadWorkflow(ciPath) {
  const abs = path.resolve(REPO_ROOT, ciPath);
  if (!fs.existsSync(abs)) {
    usageDie(`workflow-filen saknas: ${abs}`);
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

function loadPolicy(configPath) {
  const abs = path.resolve(REPO_ROOT, configPath);
  if (!fs.existsSync(abs)) {
    usageDie(`policy-fil saknas: ${abs}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (fel) {
    usageDie(`ogiltig JSON i ${abs}: ${fel.message}`);
  }
  if (!Array.isArray(parsed.exceptions)) {
    usageDie(`${abs} saknar ett 'exceptions'-array.`);
  }
  const exceptions = new Map();
  for (const entry of parsed.exceptions) {
    if (!entry || typeof entry.job !== 'string' || entry.job.trim() === '') {
      usageDie(`undantags-post saknar ett giltigt 'job'-fält: ${JSON.stringify(entry)}`);
    }
    if (typeof entry.rationale !== 'string' || entry.rationale.trim() === '') {
      usageDie(
        `undantags-posten för jobbet "${entry.job}" saknar ett ifyllt 'rationale' — ` +
          'skrivet skäl krävs (samma form som .listparitet-policy.conf).',
      );
    }
    if (exceptions.has(entry.job)) {
      usageDie(`jobbet "${entry.job}" har flera undantags-poster i ${abs} — en post per jobb.`);
    }
    exceptions.set(entry.job, entry.rationale);
  }
  return exceptions;
}

// `needs:` är giltigt YAML i två former: en array (`[a, b]`) eller en
// enstaka sträng (`a`) när bara ett jobb krävs. Normalisera till array.
function normalizeNeeds(needs) {
  if (needs === undefined || needs === null) return [];
  if (Array.isArray(needs)) return needs;
  if (typeof needs === 'string') return [needs];
  usageDie(`'needs' har en oväntad form: ${JSON.stringify(needs)}`);
}

function main() {
  const { ciPath, configPath, aggregator } = parseArgs(process.argv.slice(2));
  const workflow = loadWorkflow(ciPath);
  const exceptions = loadPolicy(configPath);

  const allJobs = Object.keys(workflow.jobs);
  const aggregatorJob = workflow.jobs[aggregator];
  if (!allJobs.includes(aggregator) || !aggregatorJob || typeof aggregatorJob !== 'object') {
    usageDie(`paraplyjobbet "${aggregator}" finns inte i ${ciPath}.`);
  }

  const eligible = allJobs.filter((namn) => namn !== aggregator);
  const needsSet = new Set(normalizeNeeds(aggregatorJob.needs));

  const errors = [];

  // Onödiga undantag (AC #2): pekar på ett jobb som inte finns, eller på
  // ett jobb som redan står i needs och alltså inte behöver undantas.
  for (const [job, _rationale] of exceptions) {
    if (!eligible.includes(job)) {
      errors.push(
        `onödigt undantag: jobbet "${job}" finns inte bland toppnivåjobben (utöver ` +
          `paraplyjobbet "${aggregator}") — städa posten ur ${configPath}.`,
      );
    } else if (needsSet.has(job)) {
      errors.push(
        `onödigt undantag: jobbet "${job}" står redan i ${aggregator}.needs — undantaget i ` +
          `${configPath} fyller ingen funktion. Ta bort posten.`,
      );
    }
  }

  // Saknade jobb: varje toppnivåjobb utom paraplyjobbet och medvetet
  // undantagna jobb måste stå i needs.
  for (const job of eligible) {
    if (exceptions.has(job)) continue;
    if (!needsSet.has(job)) {
      errors.push(
        `jobbet "${job}" står INTE i ${aggregator}.needs — kan bli hur rött som helst utan att ` +
          `stoppa en landning. Lägg till "${job}" i needs-listan, eller undanta det explicit i ` +
          `${configPath} med ett skrivet skäl.`,
      );
    }
  }

  if (errors.length > 0) {
    process.stderr.write(
      `❌ check-aggregator-needs: ${errors.length} avvikelse(r) mellan ${ciPath} och ${configPath}:\n\n`,
    );
    for (const fel of errors) process.stderr.write(`   - ${fel}\n`);
    process.stderr.write('\n');
    process.exit(1);
  }

  process.stdout.write(
    `✅ check-aggregator-needs: OK — ${eligible.length} toppnivåjobb (utöver "${aggregator}"), ` +
      `${needsSet.size} i needs, ${exceptions.size} medvetna undantag.\n`,
  );
}

main();
