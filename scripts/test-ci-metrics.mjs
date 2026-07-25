#!/usr/bin/env node
// scripts/test-ci-metrics.mjs — tester för mätskriptets pura beräknings-
// funktioner (samma konvention som scripts/test-purge-staging-sentinels.mjs:
// skript bär eget test-skript med samma namnstam; fixtur-data, aldrig levande
// API — task-36.5 AC#3/AC#4). Körs dessutom som första steg i nightly-metrics-
// jobbet så testet har en återkommande CI-bärare utan att röra ci.yml.
//
// Kör: node scripts/test-ci-metrics.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.
//
// Testfallen asserterar HÄRLEDDA MÅTT ur känd fixtur-input via de publika
// ytorna (computeMetrics/classifyDedupLog/resolveFullSha/renderReport) —
// aldrig interna hjälpfunktioner. Läsreglerna L314 (full SHA) och L319
// (cancelled ≠ användaravbrott) har egna fall.

import assert from 'node:assert/strict';
import { classifyDedupLog, computeMetrics, renderReport, resolveFullSha } from './ci-metrics.mjs';

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

// --- Fixtur-byggare (känd input, handräknade facit) ---

const T0 = '2026-07-24T10:00:00Z';
const min = (n) => new Date(Date.parse(T0) + n * 60_000).toISOString();

let nextId = 1;
function mkRun({ event = 'pull_request', conclusion = 'success', leadMin = 5, attempt = 1 }) {
  return {
    id: nextId++,
    event,
    status: 'completed',
    conclusion,
    run_attempt: attempt,
    created_at: T0,
    updated_at: min(leadMin),
    head_sha: 'a'.repeat(40),
  };
}

// --- PR-ledtid: median + p95 ur gröna pull_request-runs (AC#1) ---

t('PR-ledtid: median + p95 (nearest-rank) ur gröna PR-runs; röda och push-runs exkluderade', () => {
  const runs = [
    mkRun({ leadMin: 4 }),
    mkRun({ leadMin: 6 }),
    mkRun({ leadMin: 8 }),
    mkRun({ leadMin: 10 }),
    mkRun({ leadMin: 30 }),
    mkRun({ conclusion: 'failure', leadMin: 60 }), // röd PR — ingår ej i ledtid-till-grönt
    mkRun({ event: 'push', leadMin: 2 }), // main-push — ingen PR-ledtid
  ];
  const m = computeMetrics({ runs, jobsByRunId: {}, dedupLogByRunId: {} });
  assert.equal(m.prLeadTime.n, 5);
  assert.equal(m.prLeadTime.medianMin, 8);
  assert.equal(m.prLeadTime.p95Min, 30);
});

// --- Staging-kötid: skapad körning → staging-jobbets start (AC#1) ---

t('staging-kötid: median + p95 över runs som bär staging-jobbet, oavsett anropar-prefix', () => {
  const r1 = mkRun({ leadMin: 15 });
  const r2 = mkRun({ event: 'push', leadMin: 12 });
  const r3 = mkRun({ event: 'schedule', leadMin: 40 });
  const r4 = mkRun({ leadMin: 5 }); // inget staging-jobb (D1/docs-only) — ingår ej
  const r5 = mkRun({ conclusion: 'failure', leadMin: 9 }); // staging aldrig startad — ingår ej
  const jobsByRunId = {
    [r1.id]: [{ name: 'Test suite / Staging (API + E2E)', started_at: min(2) }],
    [r2.id]: [{ name: 'Test suite / Staging (API + E2E)', started_at: min(3) }],
    [r3.id]: [{ name: 'Nattlig fullsvit / Staging (API + E2E)', started_at: min(10) }],
    [r4.id]: [{ name: 'Test suite / Pure + Build', started_at: min(1) }],
    [r5.id]: [{ name: 'Test suite / Staging (API + E2E)', started_at: null }],
  };
  const m = computeMetrics({ runs: [r1, r2, r3, r4, r5], jobsByRunId, dedupLogByRunId: {} });
  assert.equal(m.stagingQueue.n, 3);
  assert.equal(m.stagingQueue.medianMin, 3);
  assert.equal(m.stagingQueue.p95Min, 10);
});

// --- Röd-orsak per jobb + L319: cancelled ≠ användaravbrott (AC#1/AC#5) ---

t('röd-orsak: failade jobb räknas per avprefixat namn; gröna runs bidrar inte', () => {
  const red1 = mkRun({ conclusion: 'failure', leadMin: 12 });
  const red2 = mkRun({ event: 'push', conclusion: 'failure', leadMin: 8 });
  const green = mkRun({ leadMin: 5 });
  const jobsByRunId = {
    [red1.id]: [
      {
        name: 'Test suite / Staging (API + E2E)',
        conclusion: 'failure',
        started_at: min(1),
        completed_at: min(11),
      },
      {
        name: 'Lint + Audit + TypeCheck',
        conclusion: 'success',
        started_at: min(0),
        completed_at: min(2),
      },
    ],
    [red2.id]: [
      {
        name: 'Test suite / Staging (API + E2E)',
        conclusion: 'failure',
        started_at: min(1),
        completed_at: min(7),
      },
    ],
    [green.id]: [{ name: 'Lint + Audit + TypeCheck', conclusion: 'success' }],
  };
  const m = computeMetrics({ runs: [red1, red2, green], jobsByRunId, dedupLogByRunId: {} });
  assert.equal(m.redCauses.redRuns, 2);
  assert.deepEqual(m.redCauses.byJob, { 'Staging (API + E2E)': 2 });
});

t(
  'L319: cancelled-jobb flaggas med körtid som möjlig jobb-timeout — räknas ALDRIG som användaravbrott',
  () => {
    const red = mkRun({ conclusion: 'failure', leadMin: 35 });
    const jobsByRunId = {
      [red.id]: [
        {
          name: 'Test suite / Staging (API + E2E)',
          conclusion: 'cancelled',
          started_at: min(0),
          completed_at: min(30),
        },
      ],
    };
    const m = computeMetrics({ runs: [red], jobsByRunId, dedupLogByRunId: {} });
    assert.deepEqual(m.redCauses.byJob, {}); // cancelled är inte en bevisad jobb-rödorsak
    assert.equal(m.redCauses.cancelled.length, 1);
    assert.equal(m.redCauses.cancelled[0].job, 'Staging (API + E2E)');
    assert.equal(m.redCauses.cancelled[0].runtimeMin, 30);
    assert.match(m.redCauses.cancelled[0].note, /jobb-timeout/);
    assert.match(m.redCauses.cancelled[0].note, /L319/);
  },
);

// --- Röda utfall: alla terminala icke-leveranser, inte bara `failure` ---
// GitHub har nio conclusions. Att bara läsa `failure` missar bland annat
// `startup_failure` — vilket repot självt drabbades av (run 30038460735,
// S79:s permissions-eskalering, L326). En vakt som inte ser sin egen värsta
// incident mäter fel sak.

t('röd-orsak: startup_failure, timed_out, action_required och stale räknas som röda', () => {
  const runs = [
    mkRun({ conclusion: 'failure' }),
    mkRun({ conclusion: 'startup_failure' }),
    mkRun({ conclusion: 'timed_out' }),
    mkRun({ conclusion: 'action_required' }),
    mkRun({ conclusion: 'stale' }),
    mkRun({ conclusion: 'success' }),
    mkRun({ conclusion: 'cancelled' }), // hålls isär (L319), ej röd
    mkRun({ conclusion: 'skipped' }), // ej röd
  ];
  const m = computeMetrics({ runs, jobsByRunId: {}, dedupLogByRunId: {} });
  assert.equal(m.redCauses.redRuns, 5);
  assert.equal(m.redCauses.byConclusion.startup_failure, 1);
  assert.equal(m.redCauses.byConclusion.timed_out, 1);
  assert.equal(m.redCauses.byConclusion.failure, 1);
});

t('röd-orsak: röd körning UTAN failade jobb redovisas explicit — försvinner aldrig tyst', () => {
  // startup_failure betyder att inga jobb ens startade: byJob blir tom, och
  // utan egen redovisning ser rapporten ut som "röd men ingen orsak".
  const sf = mkRun({ conclusion: 'startup_failure' });
  const vanligtRott = mkRun({ conclusion: 'failure' });
  const m = computeMetrics({
    runs: [sf, vanligtRott],
    jobsByRunId: {
      [vanligtRott.id]: [{ name: 'CI / Staging (API + E2E)', conclusion: 'failure' }],
    },
    dedupLogByRunId: {},
  });
  assert.equal(m.redCauses.redRuns, 2);
  assert.equal(m.redCauses.byJob['Staging (API + E2E)'], 1);
  assert.equal(m.redCauses.withoutJobLevelCause.length, 1);
  assert.equal(m.redCauses.withoutJobLevelCause[0].conclusion, 'startup_failure');
});

// --- Instabilitet: BEVISAD flake, aldrig antagen (S88 mätardefinitions-fix) ---
// Tidigare räknades varje grön run med run_attempt > 1 som flake. Omkörning
// sker också vid plattforms-incidenter, ändrade secrets, cache-experiment och
// ren nyfikenhet — attempt-räknaren bär inte orsaken. Föregående attempts
// utfall måste läsas; saknas det klassas körningen som OVERIFIERAD, aldrig
// som flake.

t('instabilitet: flake kräver BEVISAT röd föregående attempt — attempt > 1 räcker inte', () => {
  const flake = mkRun({ leadMin: 5, attempt: 2 });
  const omkordAvAnnanOrsak = mkRun({ leadMin: 6, attempt: 2 });
  const runs = [flake, omkordAvAnnanOrsak, mkRun({ leadMin: 4 })];
  const m = computeMetrics({
    runs,
    jobsByRunId: {},
    dedupLogByRunId: {},
    priorAttemptsByRunId: {
      [flake.id]: [{ run_attempt: 1, conclusion: 'failure' }],
      [omkordAvAnnanOrsak.id]: [{ run_attempt: 1, conclusion: 'success' }],
    },
  });
  assert.equal(m.flaky.provenFlaky, 1);
  assert.equal(m.flaky.unverifiedReruns, 0);
});

t('instabilitet: okänd föregående attempt blir OVERIFIERAD — aldrig antagen flake', () => {
  const okand = mkRun({ leadMin: 5, attempt: 3 });
  const m = computeMetrics({
    runs: [okand, mkRun({ leadMin: 4 })],
    jobsByRunId: {},
    dedupLogByRunId: {},
    priorAttemptsByRunId: {},
  });
  assert.equal(m.flaky.provenFlaky, 0);
  assert.equal(m.flaky.unverifiedReruns, 1);
  assert.equal(m.flaky.rate, 0);
});

t('instabilitet: nämnaren är slutförda körningar — inte blandad population', () => {
  const flake = mkRun({ leadMin: 5, attempt: 2 });
  const runs = [
    flake,
    mkRun({ conclusion: 'failure' }),
    mkRun({ leadMin: 4 }),
    mkRun({ leadMin: 6 }),
  ];
  const m = computeMetrics({
    runs,
    jobsByRunId: {},
    dedupLogByRunId: {},
    priorAttemptsByRunId: { [flake.id]: [{ run_attempt: 1, conclusion: 'failure' }] },
  });
  // 1 bevisad flake av 4 slutförda = 25 %. Gamla formen gav 1/(1+1) = 50 %
  // genom att blanda omkörnings-gröna med slutligt röda i nämnaren.
  assert.equal(m.flaky.rate, 0.25);
  assert.equal(m.flaky.redFinal, 1);
});

t(
  'instabilitet: utan slutförda körningar är kvoten null — aldrig 0/0 maskerat som "stabilt"',
  () => {
    const m = computeMetrics({ runs: [], jobsByRunId: {}, dedupLogByRunId: {} });
    assert.equal(m.flaky.provenFlaky, 0);
    assert.equal(m.flaky.rate, null);
  },
);

// --- Dedup-träffkvot (task-36.4): läses ur changed-jobbets logg (AC#1) ---
// Skip-status kan inte skilja dedup-träff från docs-skip — loggens exakta
// markörer ("Dedup-TRÄFF"/"Dedup-miss") är enda sanningsbärande källan.

t('classifyDedupLog: känner igen ci.yml:s tre logg-markörer + okänt', () => {
  assert.equal(
    classifyDedupLog(
      '2026-07-23T21:54:01Z ✅ Dedup-TRÄFF: träd == a7f60c52e1b2^{tree} och den SHA:n har grön CI-run → tunga jobb hoppas.',
    ),
    'hit',
  );
  assert.equal(
    classifyDedupLog('Dedup-miss: träd-avvikelse (abc != def) → full svit (fail-closed).'),
    'miss',
  );
  assert.equal(
    classifyDedupLog('Dedup ej tillämplig (event=pull_request, ej push) → full svit.'),
    'not-applicable',
  );
  assert.equal(classifyDedupLog('helt annan logg utan markör'), 'unknown');
});

t(
  'dedup-träffkvot: hits/(hits+misses); ej-tillämpliga och okända står utanför kvoten men redovisas',
  () => {
    const r1 = mkRun({ event: 'push', leadMin: 1 });
    const r2 = mkRun({ event: 'push', leadMin: 10 });
    const r3 = mkRun({ event: 'push', leadMin: 9 });
    const r4 = mkRun({ leadMin: 5 });
    const m = computeMetrics({
      runs: [r1, r2, r3, r4],
      jobsByRunId: {},
      dedupLogByRunId: {
        [r1.id]: '✅ Dedup-TRÄFF: träd == a7f60c52e1b2^{tree} → tunga jobb hoppas.',
        [r2.id]: 'Dedup-miss: ingen andra förälder (ej merge-commit) → full svit (fail-closed).',
        [r3.id]: 'Dedup-miss: träd-avvikelse → full svit (fail-closed).',
        [r4.id]: 'Dedup ej tillämplig (event=pull_request, ej push) → full svit.',
      },
    });
    assert.equal(m.dedup.hits, 1);
    assert.equal(m.dedup.misses, 2);
    assert.equal(m.dedup.notApplicable, 1);
    assert.equal(m.dedup.unknown, 0);
    assert.equal(Math.round(m.dedup.hitRate * 1000) / 1000, 0.333);
  },
);

t('dedup-träffkvot: null när inga tillämpliga utfall finns — 0/0 maskeras aldrig', () => {
  const m = computeMetrics({ runs: [mkRun({ leadMin: 3 })], jobsByRunId: {}, dedupLogByRunId: {} });
  assert.equal(m.dedup.hitRate, null);
});

// --- L314: commit-uppslag kräver FULLSTÄNDIG SHA (AC#5) ---

const FULL_SHA = 'db6ef53a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e';

t('L314: fullständig 40-hex-SHA passerar orörd — resolvern anropas inte', () => {
  assert.equal(
    resolveFullSha(FULL_SHA, () => {
      throw new Error('resolvern ska inte anropas');
    }),
    FULL_SHA,
  );
});

t('L314: kort form resolvas via git rev-parse-resolvern, gissas aldrig', () => {
  assert.equal(
    resolveFullSha('db6ef53', (ref) => (ref === 'db6ef53' ? FULL_SHA : '')),
    FULL_SHA,
  );
});

t('L314: oresolverbar ref kastar med L314-hänvisning — tyst noll-träff är förbjuden', () => {
  assert.throws(() => resolveFullSha('finns-ej', () => ''), /L314/);
  assert.throws(() => resolveFullSha('kortsha', () => 'fortfarande-inte-40-hex'), /L314/);
});

// --- Rapportens ärlighet: måttnamn får inte påstå mer än datan bär ---

t('renderReport: staging-måttet utges INTE för isolerad mutex-väntan', () => {
  // Måttet är run.created_at → staging.started_at och innehåller därmed
  // runner-allokering + uppströms-jobbens körtid + mutex-väntan. Koden vet
  // det (kommentaren säger det) — men rapportraden gjorde inte det, och det
  // är rapporten en människa fattar beslut på.
  const r = mkRun({ leadMin: 20 });
  const m = computeMetrics({
    runs: [r],
    jobsByRunId: { [r.id]: [{ name: 'Test suite / Staging (API + E2E)', started_at: min(7) }] },
    dedupLogByRunId: {},
  });
  const text = renderReport(m);
  assert.doesNotMatch(
    text,
    /kötid[^\n]*\(mutex-väntan\)/,
    'rapporten får inte utge skapad→jobbstart för isolerad mutex-väntan',
  );
  assert.match(text, /uppströms/, 'rapporten ska säga vad måttet faktiskt innehåller');
});

t('renderReport: instabilitet redovisar bevisade flakes och overifierade omkörningar isär', () => {
  const flake = mkRun({ leadMin: 5, attempt: 2 });
  const okand = mkRun({ leadMin: 6, attempt: 2 });
  const m = computeMetrics({
    runs: [flake, okand, mkRun({ leadMin: 4 })],
    jobsByRunId: {},
    dedupLogByRunId: {},
    priorAttemptsByRunId: { [flake.id]: [{ run_attempt: 1, conclusion: 'failure' }] },
  });
  const text = renderReport(m);
  assert.match(text, /overifierad/i, 'overifierade omkörningar ska synas, inte tystas');
});

// --- Rapporten: siffrorna och läsreglerna syns i utskriften ---

t('renderReport: bär måtten, dedup-kvoten och L319-flaggan i läsbar text', () => {
  const red = mkRun({ conclusion: 'failure', leadMin: 35 });
  const hit = mkRun({ event: 'push', leadMin: 1 });
  const runs = [mkRun({ leadMin: 8 }), red, hit];
  const m = computeMetrics({
    runs,
    jobsByRunId: {
      [red.id]: [
        {
          name: 'Test suite / Staging (API + E2E)',
          conclusion: 'cancelled',
          started_at: min(0),
          completed_at: min(30),
        },
      ],
    },
    dedupLogByRunId: { [hit.id]: '✅ Dedup-TRÄFF: träd == abc^{tree}' },
  });
  const text = renderReport(m);
  assert.match(text, /PR-ledtid.*median 8([.,]0)? min/);
  assert.match(text, /träffkvot 100([.,]0)? %/);
  assert.match(text, /jobb-timeout.*L319|L319.*jobb-timeout/);
  assert.match(text, /Staging \(API \+ E2E\)/);
});

process.on('beforeExit', () => {
  if (failed > 0) {
    console.error(`\n${failed} test(er) RÖDA`);
    process.exit(1);
  }
  console.log('\nAlla ci-metrics-tester gröna.');
});
