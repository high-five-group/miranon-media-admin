#!/usr/bin/env node
// scripts/test-check-aggregator-needs.mjs — självtest för
// check-aggregator-needs.mjs (TASK-450.3, N4 AC #1/#2 — tvåsidigt bevis:
// en sandlådekopia av ci.yml med ett jobb borttaget ur `needs` FÄLLER med
// jobbets namn, den riktiga filen PASSERAR, ett onödigt undantag fäller,
// och trasig indata är fail-closed).
//
// Sandboxad i egen mktemp-katalog (rör aldrig repots ci.yml eller policy-
// fil, utom det uttryckliga real-fil-testet som läser dem read-only), ingen
// nätverkstrafik. Kör grinden som EGEN process
// (`node scripts/check-aggregator-needs.mjs --file … --config …`, cwd =
// fixturens rot) och läser exit-koden — CLAUDE.md § "Fånga exitkoden
// separat". Struktur speglar scripts/test-check-mailto.mjs (samma
// fixtur-rigg, samma assert-räknare).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'check-aggregator-needs.mjs');

let failCount = 0;
let passCount = 0;

function assert(cond, msg) {
  if (cond) {
    passCount++;
  } else {
    failCount++;
    process.stderr.write(`FAIL: ${msg}\n`);
  }
}

function mkFixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'task450-3-aggregator-needs-test-'));
}

function writeFile(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content);
}

function writePolicy(dir, name, exceptionsOrRaw) {
  const body = Array.isArray(exceptionsOrRaw) ? { exceptions: exceptionsOrRaw } : exceptionsOrRaw;
  fs.writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
}

// Bas-fixturen: sju toppnivåjobb, exakt samma FORM (om än förenklad
// step-kropp) som repots riktiga ci.yml — sex jobb + paraplyjobbet
// "ci-passed" vars needs-lista räknar upp samtliga sex.
const ALL_SIX = 'changed, lint, audit, docs, suite, review-backstopp'.split(', ');

function ciYaml({
  needs = ALL_SIX,
  dropJobs = [],
  scalarNeeds = false,
  includeAggregator = true,
} = {}) {
  const jobDefs = ALL_SIX.filter((j) => !dropJobs.includes(j))
    .map((j) => `  ${j}:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ${j}\n`)
    .join('');
  const needsYaml = scalarNeeds ? needs[0] : `[${needs.join(', ')}]`;
  const aggregatorYaml = includeAggregator
    ? `  ci-passed:\n    needs: ${needsYaml}\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ci-passed\n`
    : '';
  return `jobs:\n${jobDefs}${aggregatorYaml}`;
}

function runGrind(dir, { file = 'ci.yml', config = 'policy.json' } = {}) {
  try {
    const out = execFileSync(process.execPath, [SCRIPT, '--file', file, '--config', config], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

function runReal() {
  try {
    const out = execFileSync(process.execPath, [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

// ═══ FALL 1 (GRÖNT — bas): alla sex jobb i needs, inga undantag ⇒ exit 0 ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml());
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 1: förväntade exit 0 (komplett needs-lista), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 2 (RÖTT — kärnfallet): "audit" borttaget ur needs ⇒ exit 1 MED
// jobbets namn i stderr ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml({ needs: ALL_SIX.filter((j) => j !== 'audit') }));
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 2: förväntade exit 1 (audit saknas i needs), fick ${res.code}`);
  assert(
    /"audit"/.test(res.stderr),
    `Fall 2: förväntade jobbnamnet "audit" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 3 (GRÖNT — den RIKTIGA filen): repots verkliga ci.yml +
// .aggregator-needs-policy.json ska passera utan --file/--config-override ═══
{
  const res = runReal();
  assert(
    res.code === 0,
    `Fall 3: förväntade exit 0 mot den riktiga ci.yml, fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 4 (RÖTT — onödigt undantag, redan i needs): "audit" ligger kvar
// i needs OCH har en undantags-post ⇒ exit 1 (AC #2) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml());
  writePolicy(dir, 'policy.json', [{ job: 'audit', rationale: 'test: redundant post' }]);
  const res = runGrind(dir);
  assert(
    res.code === 1,
    `Fall 4: förväntade exit 1 (onödigt undantag, redan i needs), fick ${res.code}`,
  );
  assert(
    /onödigt undantag/.test(res.stderr) && /"audit"/.test(res.stderr),
    `Fall 4: förväntade "onödigt undantag" + "audit" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 5 (RÖTT — onödigt undantag, jobbet finns inte): undantag pekar
// på ett jobb som saknas bland toppnivåjobben ⇒ exit 1 (AC #2) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml());
  writePolicy(dir, 'policy.json', [{ job: 'spokjobb-finns-inte', rationale: 'test: stale' }]);
  const res = runGrind(dir);
  assert(
    res.code === 1,
    `Fall 5: förväntade exit 1 (undantag för obefintligt jobb), fick ${res.code}`,
  );
  assert(
    /onödigt undantag/.test(res.stderr) && /spokjobb-finns-inte/.test(res.stderr),
    `Fall 5: förväntade "onödigt undantag" + jobbnamnet i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 6 (GRÖNT — legitimt undantag fungerar): "audit" saknas i needs
// MEN har en giltig undantags-post ⇒ exit 0 (mekanismens positiva väg) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml({ needs: ALL_SIX.filter((j) => j !== 'audit') }));
  writePolicy(dir, 'policy.json', [{ job: 'audit', rationale: 'test: medvetet undantaget' }]);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 6: förväntade exit 0 (legitimt undantaget jobb), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 7 (RÖTT — flera saknade jobb): "audit" OCH "docs" båda borttagna
// ur needs, ingen har undantag ⇒ exit 1 med BÅDA namnen ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml({ needs: ALL_SIX.filter((j) => j !== 'audit' && j !== 'docs') }));
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 7: förväntade exit 1 (två saknade jobb), fick ${res.code}`);
  assert(
    /"audit"/.test(res.stderr) && /"docs"/.test(res.stderr),
    `Fall 7: förväntade BÅDA jobbnamnen i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 8 (FAIL-CLOSED — trasig YAML): syntaktiskt ogiltig YAML ⇒ exit 2 ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', 'jobs:\n  changed:\n    runs-on: [ubuntu-latest\n');
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 8: förväntade exit 2 (trasig YAML), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 9 (FAIL-CLOSED — saknad ci.yml) ═══
{
  const dir = mkFixture();
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir, { file: 'finns-inte.yml' });
  assert(res.code === 2, `Fall 9: förväntade exit 2 (saknad workflow-fil), fick ${res.code}`);
}

// ═══ FALL 10 (FAIL-CLOSED — saknad policy-fil) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml());
  const res = runGrind(dir, { config: 'finns-inte.json' });
  assert(res.code === 2, `Fall 10: förväntade exit 2 (saknad policy-fil), fick ${res.code}`);
}

// ═══ FALL 11 (FAIL-CLOSED — undantags-post utan rationale) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml({ needs: ALL_SIX.filter((j) => j !== 'audit') }));
  writePolicy(dir, 'policy.json', [{ job: 'audit' }]);
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 11: förväntade exit 2 (undantag utan rationale), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 12 (FAIL-CLOSED — exceptions är inte ett array) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml());
  writePolicy(dir, 'policy.json', { exceptions: 'audit' });
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 12: förväntade exit 2 ('exceptions' ej array), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 13 (GRÖNT — robusthet, needs som skalär sträng): endast ETT
// eligibelt jobb, needs uttryckt som sträng (inte array) — giltig YAML-form ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'ci.yml',
    ciYaml({
      dropJobs: ['lint', 'audit', 'docs', 'suite', 'review-backstopp'],
      needs: ['changed'],
      scalarNeeds: true,
    }),
  );
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 13: förväntade exit 0 (needs som skalär sträng), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 14 (FAIL-CLOSED — paraplyjobbet saknas i filen) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml({ includeAggregator: false }));
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 14: förväntade exit 2 (paraplyjobbet "ci-passed" saknas), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 15 (FAIL-CLOSED — dubblett-undantag för samma jobb) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', ciYaml({ needs: ALL_SIX.filter((j) => j !== 'audit') }));
  writePolicy(dir, 'policy.json', [
    { job: 'audit', rationale: 'första posten' },
    { job: 'audit', rationale: 'andra posten' },
  ]);
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 15: förväntade exit 2 (dubblett-undantag), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 16 (FAIL-CLOSED — 'jobs:'-block saknas helt, i övrigt giltig YAML) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'ci.yml', 'name: Bara ett namn, inget jobs-block\n');
  writePolicy(dir, 'policy.json', []);
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 16: förväntade exit 2 (saknat 'jobs:'-block), fick ${res.code}: ${res.stderr}`,
  );
}

if (failCount > 0) {
  process.stderr.write(
    `\ntest-check-aggregator-needs: ${failCount} fall FALLERADE, ${passCount} OK\n`,
  );
  process.exit(1);
}
process.stdout.write(`test-check-aggregator-needs: alla ${passCount} kontroller OK\n`);
