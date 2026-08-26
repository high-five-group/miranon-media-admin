#!/usr/bin/env node
// scripts/ci-metrics.mjs — CI-hastighet som siffror i stället för känsla
// (task-36.5 / T85 våg 2 / ADR-077). DORA-andan: hastighet och stabilitet
// läses TILLSAMMANS, aldrig hastighet ensam.
//
// Rapporterar ur körnings-API:t (gh api):
//   · PR-ledtid push→grönt (median + p95)
//   · kötid från skapad körning till staging-jobbets start (mutex-väntan)
//   · röd-orsak per jobb
//   · flaky-frekvens (rött som blev grönt vid omkörning av SAMMA kod)
//   · dedupens träffkvot (task-36.4) — läses EXAKT ur changed-jobbets logg
//     ("Dedup-TRÄFF"/"Dedup-miss"); skip-status kan inte skilja dedup från
//     docs-skip, så loggen är enda sanningsbärande källan.
//
// Körs manuellt (`node scripts/ci-metrics.mjs [--limit N] [--commit <ref>]
// [--json]`) och som steg i nattkörningen (nightly.yml, nightly-metrics) så
// att kurvan byggs upp av sig själv. Testfil: scripts/test-ci-metrics.mjs
// (fixtur-data, aldrig levande API).
//
// Kodade läsregler (dyrt lärda — bor i verktyget, inte i huvudet):
//   L314: uppslag mot commit kräver FULLSTÄNDIG SHA — förkortad ger tyst
//         noll träffar; kort form resolvas via `git rev-parse`, aldrig gissas.
//   L319: `cancelled` betyder inte användaravbrott — det kan vara en
//         jobb-timeout; avbrutna jobb rapporteras med körtid och flaggas,
//         aldrig tyst inräknade som "avbrutna av användare".
//
// Percentiler: nearest-rank (p50 = median) — deterministiskt, inga
// interpolerade värden som inte funnits i datat.

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-ci-metrics.mjs)
// ---------------------------------------------------------------------------

const toMin = (fromIso, toIso) => {
  const from = Date.parse(fromIso ?? '');
  const to = Date.parse(toIso ?? '');
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round(((to - from) / 60_000) * 10) / 10;
};

/** Nearest-rank-percentil på osorterad lista; null vid tom input. */
function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil((p / 100) * sorted.length) - 1];
}

/** Staging-jobbet matchas på namn-SUFFIX — anropar-prefixet skiljer sig mellan
 * ci.yml ("Test suite / …") och nightly.yml ("Nattlig fullsvit / …"). */
const STAGING_JOB_SUFFIX = 'Staging (API + E2E)';

const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/;

/**
 * Terminala utfall som betyder "körningen levererade inte". GitHub har nio
 * conclusions; att bara läsa `failure` gör måttet blint för `startup_failure`
 * (repot drabbades: run 30038460735, S79, L326), `timed_out`,
 * `action_required` och `stale`.
 *
 * `cancelled` ingår MEDVETET INTE — den hålls isär och flaggas per L319
 * (cancelled kan vara en jobb-timeout förklädd till användaravbrott).
 * `skipped` och `neutral` är inte röda.
 */
const RED_CONCLUSIONS = new Set([
  'failure',
  'startup_failure',
  'timed_out',
  'action_required',
  'stale',
]);

/**
 * L314: `gh run list`/körnings-API:ts commit-filter matchar bara FULLSTÄNDIG
 * SHA — förkortad ger tyst noll träffar, vilket läser som "runnet saknas".
 * Allt commit-uppslag går därför genom denna funktion: 40-hex passerar,
 * allt annat resolvas via injicerad resolver (`git rev-parse` i CLI:t);
 * oresolverbart KASTAR i stället för att fråga API:t med fel form.
 */
export function resolveFullSha(ref, resolveRef) {
  if (FULL_SHA_PATTERN.test(ref)) return ref;
  const resolved = (resolveRef(ref) ?? '').trim();
  if (!FULL_SHA_PATTERN.test(resolved)) {
    throw new Error(
      `L314: "${ref}" kunde inte resolvas till fullständig 40-hex-SHA — ` +
        'API:ts commit-filter kräver full SHA (förkortad ger tyst noll träffar)',
    );
  }
  return resolved;
}

/**
 * Klassa dedup-utfallet ur changed-jobbets logg (task-36.4:s exakta
 * logg-markörer i ci.yml). Skip-status räcker inte: en skippad suite kan vara
 * docs-skip ELLER dedup-träff — bara loggen bär orsaken.
 */
export function classifyDedupLog(logText) {
  const text = logText ?? '';
  if (text.includes('Dedup-TRÄFF')) return 'hit';
  if (text.includes('Dedup-miss')) return 'miss';
  if (text.includes('Dedup ej tillämplig')) return 'not-applicable';
  return 'unknown';
}

/**
 * Härled samtliga mått ur ett fönster av CI-runs + deras jobb + dedup-loggar.
 * Ren funktion: all API-hämtning sker utanför (fixtur-testbar, AC#3/AC#4).
 */
export function computeMetrics({
  runs,
  jobsByRunId = {},
  dedupLogByRunId = {},
  priorAttemptsByRunId = {},
}) {
  const completed = runs.filter((r) => r.status === 'completed');

  // PR-ledtid push→grönt: gröna pull_request-runs, created_at → updated_at.
  const prLeads = completed
    .filter((r) => r.event === 'pull_request' && r.conclusion === 'success')
    .map((r) => toMin(r.created_at, r.updated_at))
    .filter((v) => v !== null);

  // Staging-kötid: skapad körning → staging-jobbets faktiska start. Fångar
  // mutex-väntan + uppströms-jobb; runs där staging aldrig startade (skip,
  // avbrott före start) kan inte bidra med en kötid och ingår ej.
  const stagingQueues = completed
    .map((r) => {
      const staging = (jobsByRunId[r.id] ?? []).find((j) => j.name?.endsWith(STAGING_JOB_SUFFIX));
      return staging?.started_at ? toMin(r.created_at, staging.started_at) : null;
    })
    .filter((v) => v !== null);

  // Röd-orsak per jobb: endast BEVISAT failade jobb räknas. Avbrutna jobb
  // (conclusion=cancelled) hålls isär och flaggas med körtid — L319: cancelled
  // kan vara en jobb-timeout (jämför körtiden mot jobbets timeout-minutes
  // innan "avbruten av användare" godtas som förklaring).
  //
  // S88: mängden röda utfall utvidgad. Tidigare lästes ENBART `failure`, vilket
  // gjorde måttet blint för `startup_failure` — exakt den klass repot självt
  // drabbades av i S79 (run 30038460735, permissions-eskalering i reusable-
  // anroparna, L326). Ett mått som inte ser sin egen värsta incident mäter fel
  // sak. `cancelled` hålls fortsatt isär (L319), `skipped`/`neutral` är inte
  // röda.
  const redRuns = completed.filter((r) => RED_CONCLUSIONS.has(r.conclusion));
  const byJob = {};
  const byConclusion = {};
  const cancelled = [];
  const withoutJobLevelCause = [];
  for (const r of redRuns) {
    byConclusion[r.conclusion] = (byConclusion[r.conclusion] ?? 0) + 1;
    let sawFailedJob = false;
    for (const j of jobsByRunId[r.id] ?? []) {
      const bareName = j.name?.includes(' / ') ? j.name.split(' / ').at(-1) : j.name;
      if (j.conclusion === 'failure') {
        byJob[bareName] = (byJob[bareName] ?? 0) + 1;
        sawFailedJob = true;
      } else if (j.conclusion === 'cancelled') {
        cancelled.push({
          runId: r.id,
          job: bareName,
          runtimeMin: toMin(j.started_at, j.completed_at),
          note: 'cancelled ≠ användaravbrott — möjlig jobb-timeout (L319): jämför körtiden mot jobbets timeout-minutes',
        });
      }
    }
    // En röd körning utan failat jobb har en orsak UTANFÖR jobb-nivån —
    // `startup_failure` startar inga jobb alls. Utan egen redovisning ser
    // rapporten ut som "röd men ingen orsak", vilket läser som mätfel.
    if (!sawFailedJob) {
      withoutJobLevelCause.push({ runId: r.id, conclusion: r.conclusion });
    }
  }

  // Instabilitet: en flake är en körning som blev grön först efter omkörning
  // AV SAMMA KOD, där en tidigare attempt bevisat var röd.
  //
  // S88: `run_attempt > 1` räcker INTE som bevis. En omkörning startas också
  // vid plattforms-incidenter (GitHub-outage), ändrade secrets, cache-
  // experiment och ren nyfikenhet — attempt-räknaren bär inte orsaken. Den
  // gamla formen räknade varje grön omkörning som flake och blandade dessutom
  // två populationer i nämnaren (omkörnings-gröna + slutligt röda), vilket
  // inte är en frekvens över körningar.
  //
  // Saknas föregående attempts utfall klassas körningen som OVERIFIERAD och
  // räknas ALDRIG som flake — okänt får inte bli en anklagelse.
  let provenFlaky = 0;
  let unverifiedReruns = 0;
  for (const r of completed) {
    if (r.conclusion !== 'success' || (r.run_attempt ?? 1) <= 1) continue;
    const priors = priorAttemptsByRunId[r.id];
    if (!priors?.length) {
      unverifiedReruns += 1;
    } else if (priors.some((a) => RED_CONCLUSIONS.has(a.conclusion))) {
      provenFlaky += 1;
    } else {
      // Omkörd, men ingen tidigare attempt var röd — alltså omkörd av annan
      // orsak. Varken flake eller okänd.
    }
  }
  const flaky = {
    provenFlaky,
    unverifiedReruns,
    redFinal: redRuns.length,
    // Nämnare = slutförda körningar. "Hur ofta är CI instabil?" är en frekvens
    // över körningar, inte en kvot mellan två sorters dåliga utfall.
    rate: completed.length === 0 ? null : provenFlaky / completed.length,
  };

  // Dedup-träffkvot: kvoten räknas ENDAST över tillämpliga utfall
  // (hit + miss); ej-tillämpliga (PR-event) och okända (logg saknas/oläsbar)
  // redovisas separat. null vid 0/0 — en tom kvot får aldrig se ut som 0 %.
  const dedup = { hits: 0, misses: 0, notApplicable: 0, unknown: 0, hitRate: null };
  for (const logText of Object.values(dedupLogByRunId)) {
    const outcome = classifyDedupLog(logText);
    if (outcome === 'hit') dedup.hits += 1;
    else if (outcome === 'miss') dedup.misses += 1;
    else if (outcome === 'not-applicable') dedup.notApplicable += 1;
    else dedup.unknown += 1;
  }
  if (dedup.hits + dedup.misses > 0) {
    dedup.hitRate = dedup.hits / (dedup.hits + dedup.misses);
  }

  return {
    window: { total: runs.length, completed: completed.length },
    prLeadTime: {
      n: prLeads.length,
      medianMin: percentile(prLeads, 50),
      p95Min: percentile(prLeads, 95),
    },
    stagingQueue: {
      n: stagingQueues.length,
      medianMin: percentile(stagingQueues, 50),
      p95Min: percentile(stagingQueues, 95),
    },
    redCauses: { redRuns: redRuns.length, byJob, byConclusion, cancelled, withoutJobLevelCause },
    flaky,
    dedup,
  };
}

const fmtMin = (v) => (v === null ? '–' : `${v} min`);
const fmtPct = (v) => (v === null ? '– (inga tillämpliga utfall)' : `${(v * 100).toFixed(1)} %`);

/** Röd-uppdelning per conclusion — gör synligt att måttet ser mer än `failure`. */
const fmtConclusions = (byConclusion) => {
  const entries = Object.entries(byConclusion ?? {}).sort((a, b) => b[1] - a[1]);
  return entries.length === 0 ? '' : ` (${entries.map(([c, n]) => `${c}: ${n}`).join(' · ')})`;
};

/** Läsbar rapport — samma siffror som --json, för människor och step-summary. */
export function renderReport(m) {
  const lines = [
    `CI-mätning — fönster: ${m.window.total} runs (${m.window.completed} slutförda)`,
    '',
    `▸ PR-ledtid push→grönt: median ${fmtMin(m.prLeadTime.medianMin)} · p95 ${fmtMin(m.prLeadTime.p95Min)} (n=${m.prLeadTime.n})`,
    `▸ Tid skapad→staging-start: median ${fmtMin(m.stagingQueue.medianMin)} · p95 ${fmtMin(m.stagingQueue.p95Min)} (n=${m.stagingQueue.n})`,
    '    innehåller runner-allokering + uppströms-jobbens körtid + mutex-väntan — INTE isolerad mutex-tid',
    `▸ Röda runs: ${m.redCauses.redRuns}${fmtConclusions(m.redCauses.byConclusion)} — failade jobb:`,
  ];
  const jobEntries = Object.entries(m.redCauses.byJob).sort((a, b) => b[1] - a[1]);
  if (jobEntries.length === 0) lines.push('    (inga bevisat failade jobb)');
  for (const [job, count] of jobEntries) lines.push(`    ${job}: ${count}`);
  for (const r of m.redCauses.withoutJobLevelCause) {
    lines.push(
      `    ⚠️  run ${r.runId} — röd som "${r.conclusion}" UTAN failat jobb: orsaken ligger utanför jobb-nivån (t.ex. startup_failure startar inga jobb)`,
    );
  }
  for (const c of m.redCauses.cancelled) {
    lines.push(
      `    ⚠️  run ${c.runId} — ${c.job}: avbruten efter ${fmtMin(c.runtimeMin)}; möjlig jobb-timeout (L319), aldrig antaget användaravbrott`,
    );
  }
  lines.push(
    `▸ Instabilitet: ${fmtPct(m.flaky.rate)} av körningarna var BEVISAT flaky (${m.flaky.provenFlaky} av ${m.window.completed} slutförda; tidigare attempt bevisat röd)`,
    `    ${m.flaky.unverifiedReruns} omkörning(ar) med overifierad orsak — räknas aldrig som flake · ${m.flaky.redFinal} slutligt röda`,
    `▸ Merge-dedup (task-36.4): träffkvot ${fmtPct(m.dedup.hitRate)} (${m.dedup.hits} träff / ${m.dedup.misses} miss · ${m.dedup.notApplicable} ej tillämpliga · ${m.dedup.unknown} okända)`,
  );
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Hämtlager (gh api) + CLI — medvetet tunt; ALLT beräknande bor i de pura
// funktionerna ovan och testas mot fixturer (AC#3). Auth: lokalt inloggad gh,
// i Actions GH_TOKEN (nightly-metrics-jobbet grantar actions: read).
//
// gh — MEDVETET OPINNAD (TASK-312, 2026-08-24): ingen version-guard här.
// Skälet är dubbelt — (1) körs antingen på en GitHub-hostad runner (gh
// förinstallerat/versionshanterat av GitHub självt, samma kategori som
// jq där — se scripts/lib/jq-guard.sh § DEN ENA UNDANTAGNA
// ANROPSPUNKTEN) ELLER lokalt av Marcus (samma maskin/gh som alla hans
// andra `gh`-anrop), och (2) detta är en NATTLIG RAPPORTERINGSVÄG (metrik,
// inte landning) vars fel redan fångas läsbart: gh()-hjälparen nedan
// FÅNGAR varje fel och ytpresenterar gh:s egen felsträng via ApiError, i
// stället för att krascha ospecifikt. En för gammal/trasig gh syns alltså
// direkt i felmeddelandet, den försvinner inte tyst. Se
// scripts/lib/gh-guard.sh § SCOPE för den fulla avvägningen (samma kort).
// ---------------------------------------------------------------------------

import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

class ApiError extends Error {}

async function gh(args, { text = false } = {}) {
  try {
    const { stdout } = await run('gh', args, { maxBuffer: 64 * 1024 * 1024 });
    return text ? stdout : JSON.parse(stdout);
  } catch (err) {
    throw new ApiError(
      `gh ${args.slice(0, 2).join(' ')}: ${err.stderr?.slice(0, 300) || err.message}`,
    );
  }
}

async function fetchWindow(limit, commitSha) {
  const base = 'repos/{owner}/{repo}/actions';
  const runsPath = commitSha
    ? `${base}/workflows/ci.yml/runs?head_sha=${commitSha}&per_page=${limit}`
    : `${base}/workflows/ci.yml/runs?per_page=${limit}`;
  const runs = (await gh(['api', runsPath])).workflow_runs ?? [];

  const jobsByRunId = {};
  const dedupLogByRunId = {};
  const priorAttemptsByRunId = {};
  for (const r of runs) {
    // Instabilitets-bevis: för en grön run med run_attempt > 1 hämtas de
    // TIDIGARE attempternas utfall. Utan detta kan flake inte skiljas från en
    // omkörning av annan orsak (incident, secret-byte, cache-experiment) —
    // och skriptet klassar då körningen som overifierad i stället för att anta.
    // Endast omkörda gröna runs kostar extra anrop; de är få.
    if (r.conclusion === 'success' && (r.run_attempt ?? 1) > 1) {
      const priors = [];
      for (let n = 1; n < r.run_attempt; n += 1) {
        try {
          const attempt = await gh(['api', `${base}/runs/${r.id}/attempts/${n}`]);
          priors.push({ run_attempt: n, conclusion: attempt.conclusion });
        } catch (err) {
          console.error(`⚠️  attempt ${n} saknas för run ${r.id}: ${err.message}`);
        }
      }
      if (priors.length > 0) priorAttemptsByRunId[r.id] = priors;
    }
    // L319-medvetenhet: körnings-API:t kan släpa/felas per run — en enskild
    // miss får inte fälla hela mätningen; runet räknas då utan jobb-data.
    try {
      jobsByRunId[r.id] = (await gh(['api', `${base}/runs/${r.id}/jobs?per_page=100`])).jobs ?? [];
    } catch (err) {
      console.error(`⚠️  jobb-data saknas för run ${r.id}: ${err.message}`);
      continue;
    }
    // Dedup-utfall: endast main-push-runs bär dedup-grenen; loggen hämtas per
    // changed-jobb. Utgången logg (retention) ⇒ 'unknown' — redovisas, döljs ej.
    if (r.event === 'push' && r.head_branch === 'main') {
      const changedJob = jobsByRunId[r.id].find((j) => j.name === 'Detect changed files');
      if (changedJob) {
        try {
          dedupLogByRunId[r.id] = await gh(['api', `${base}/jobs/${changedJob.id}/logs`], {
            text: true,
          });
        } catch {
          dedupLogByRunId[r.id] = ''; // klassas 'unknown'
        }
      }
    }
  }
  return { runs, jobsByRunId, dedupLogByRunId, priorAttemptsByRunId };
}

async function gitRevParse(ref) {
  try {
    return (await run('git', ['rev-parse', ref])).stdout.trim();
  } catch {
    return '';
  }
}

function parseArgs(argv) {
  const args = { limit: 50, commit: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--limit') args.limit = Number(argv[++i]);
    else if (argv[i] === '--commit') args.commit = argv[++i];
    else if (argv[i] === '--json') args.json = true;
    else {
      console.error(
        `Okänd flagga: ${argv[i]} — användning: ci-metrics.mjs [--limit N] [--commit <ref>] [--json]`,
      );
      process.exit(1);
    }
  }
  if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
    console.error('--limit måste vara 1–100 (API:ts per_page-tak)');
    process.exit(1);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  try {
    let commitSha = null;
    if (args.commit) {
      // L314 hårt kodad: kort ref resolvas via git rev-parse; oresolverbar kastar.
      const resolved = await gitRevParse(args.commit);
      commitSha = resolveFullSha(args.commit, () => resolved);
    }
    const window = await fetchWindow(args.limit, commitSha);
    const metrics = computeMetrics(window);
    if (args.json) {
      console.log(JSON.stringify(metrics, null, 2));
    } else {
      console.log(renderReport(metrics));
    }
  } catch (err) {
    if (err.message?.includes('L314')) {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    }
    if (!(err instanceof ApiError)) throw err;
    console.error(`❌ API-fel: ${err.message}`);
    process.exit(2);
  }
}

// Kör endast som CLI — inte vid import från test-skriptet.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
