#!/usr/bin/env node
// scripts/test-check-nattkanal-partition.mjs — självtest för
// check-nattkanal-partition.mjs (TASK-450.10, 3A AC #1/#2 — tvåsidigt
// bevis, i samma form som test-check-aggregator-needs.mjs: en
// sandlådekopia av nightly.yml med ett jobb borttaget ur ALLA tre
// triggrar FÄLLER med jobbets namn, ett jobb i TVÅ triggrar FÄLLER, den
// RIKTIGA filen PASSERAR, ett ändrat produktjobbs-name: FÄLLER, ett
// föråldrat prefix FÄLLER, plus fail-closed-grenarna).
//
// Sandboxad i egen mktemp-katalog (rör aldrig repots nightly.yml eller
// .nattvakt-kanal-policy.conf, utom det uttryckliga real-fil-testet som
// läser dem read-only), ingen nätverkstrafik. Kör grinden som EGEN process
// (`node scripts/check-nattkanal-partition.mjs --file … --kanal-config …`,
// cwd = fixturens rot) och läser exit-koden — CLAUDE.md § "Fånga
// exitkoden separat".
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'check-nattkanal-partition.mjs');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'task450-10-nattkanal-partition-test-'));
}

function writeFile(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content);
}

// ═══ FIXTUR-BYGGARE ═══
// Tre "eligibla" nattjobb (jobA/jobB/jobC) speglar de åtta riktiga (suite,
// nightly-audit, …) i förenklad form, plus de tre kanaljobben i EXAKT
// samma jobb-ID:n som riktiga nightly.yml (alarm / bokforings-arende /
// beroende-arende), så realfils-defaultet i grinden gäller oförändrat.
const ELIGIBLE = ['jobA', 'jobB', 'jobC'];

function channelBlock(jobId, refs, needsList, ifOverride) {
  const needs = needsList ?? ELIGIBLE;
  let villkorText;
  if (typeof ifOverride === 'string') {
    villkorText = ifOverride;
  } else {
    const villkor =
      refs.length === 0 ? 'false' : refs.map((r) => `needs.${r}.result == 'failure'`).join(' || ');
    villkorText = `\${{ always() && (${villkor}) }}`;
  }
  return (
    `  ${jobId}:\n` +
    `    needs: [${needs.join(', ')}]\n` +
    `    if: >-\n` +
    `      ${villkorText}\n` +
    `    runs-on: ubuntu-latest\n` +
    `    steps:\n      - run: echo ${jobId}\n`
  );
}

function nightlyYaml({
  eligible = ELIGIBLE,
  jobNames = {},
  eligibleNeedsScalar = null, // { jobbId: true } → skriv `needs: <ett jobb>` utan hakparentes
  produktRefs = ['jobA'],
  bokforingRefs = ['jobB'],
  beroendeRefs = ['jobC'],
  produktNeeds = null,
  bokforingNeeds = null,
  beroendeNeeds = null,
  produktIfOverride = null, // rått if:-uttryck (t.ex. bracket-notation), kringgår produktRefs
  includeChannel = { produkt: true, bokforing: true, beroende: true },
} = {}) {
  const jobDefs = eligible
    .map((j) => {
      const namn = jobNames[j] ?? j;
      return `  ${j}:\n    name: ${namn}\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ${j}\n`;
    })
    .join('');
  let out = `jobs:\n${jobDefs}`;
  if (includeChannel.produkt)
    out += channelBlock('alarm', produktRefs, produktNeeds, produktIfOverride);
  if (includeChannel.bokforing)
    out += channelBlock('bokforings-arende', bokforingRefs, bokforingNeeds);
  if (includeChannel.beroende) out += channelBlock('beroende-arende', beroendeRefs, beroendeNeeds);
  void eligibleNeedsScalar;
  return out;
}

function kanalConf(prefixes) {
  const rader = prefixes.map((p) => `    "${p}"`).join('\n');
  return `NATTVAKT_PRODUKTKANAL_JOBBPREFIX=(\n${rader}\n)\n`;
}

function runGrind(dir, { file = 'nightly.yml', kanalConfig = 'kanal.conf' } = {}) {
  try {
    const out = execFileSync(
      process.execPath,
      [SCRIPT, '--file', file, '--kanal-config', kanalConfig],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
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

const BAS_JOBNAMN = { jobA: 'Jobb A', jobB: 'Jobb B', jobC: 'Jobb C' };
const BAS_PREFIX = ['Jobb A'];

// ═══ FALL 1 (GRÖNT — bas): partitionen håller, namn-ledet matchar ⇒ exit 0 ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', nightlyYaml({ jobNames: BAS_JOBNAMN }));
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 1: förväntade exit 0 (bas-partition håller), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 2 (RÖTT — ID-led, kärnfallet): "jobB" borttaget ur ALLA tre
// triggrar (bokforing släpper den, ingen annan tar den) ⇒ exit 1 MED
// jobbets namn ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', nightlyYaml({ jobNames: BAS_JOBNAMN, bokforingRefs: [] }));
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 2: förväntade exit 1 (jobB utlöser ingen kanal), fick ${res.code}`);
  assert(
    /"jobB"/.test(res.stderr) && /INGEN/.test(res.stderr),
    `Fall 2: förväntade "jobB" + "INGEN" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 3 (RÖTT — ID-led: dubbelt medlemskap): "jobA" ligger i BÅDE
// produkt- och bokföringskanalens trigger ⇒ exit 1 ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'nightly.yml',
    nightlyYaml({ jobNames: BAS_JOBNAMN, bokforingRefs: ['jobB', 'jobA'] }),
  );
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 3: förväntade exit 1 (jobA i två triggrar), fick ${res.code}`);
  assert(
    /"jobA"/.test(res.stderr) && /FLERA kanaler/.test(res.stderr),
    `Fall 3: förväntade "jobA" + "FLERA kanaler" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 4 (RÖTT — ID-led: referens till jobb som inte finns alls) ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'nightly.yml',
    nightlyYaml({ jobNames: BAS_JOBNAMN, produktRefs: ['jobX-finns-inte'] }),
  );
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 1,
    `Fall 4: förväntade exit 1 (referens till obefintligt jobb), fick ${res.code}`,
  );
  assert(
    /"jobX-finns-inte"/.test(res.stderr) && /finns inte som toppnivåjobb/.test(res.stderr),
    `Fall 4: förväntade "jobX-finns-inte" + "finns inte som toppnivåjobb" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 5 (RÖTT — ID-led: referens utanför kanalens EGEN needs-lista) ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'nightly.yml',
    nightlyYaml({ jobNames: BAS_JOBNAMN, produktNeeds: ['jobB', 'jobC'] }),
  );
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 1,
    `Fall 5: förväntade exit 1 (referens utanför egen needs), fick ${res.code}`,
  );
  assert(
    /"jobA"/.test(res.stderr) && /står inte i "alarm"\.needs/.test(res.stderr),
    `Fall 5: förväntade "jobA" + "står inte i \\"alarm\\".needs" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 6 (GRÖNT — den RIKTIGA filen): repots verkliga nightly.yml +
// .nattvakt-kanal-policy.conf ska passera utan --file/--kanal-config-override ═══
{
  const res = runReal();
  assert(
    res.code === 0,
    `Fall 6: förväntade exit 0 mot den riktiga nightly.yml, fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 7 (FAIL-CLOSED — nightly.yml saknas) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir, { file: 'finns-inte.yml' });
  assert(res.code === 2, `Fall 7: förväntade exit 2 (saknad nightly-fil), fick ${res.code}`);
}

// ═══ FALL 8 (FAIL-CLOSED — trasig YAML) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', 'jobs:\n  jobA:\n    runs-on: [ubuntu-latest\n');
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 8: förväntade exit 2 (trasig YAML), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 9 (FAIL-CLOSED — 'jobs:'-block saknas) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', 'name: Bara ett namn, inget jobs-block\n');
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 9: förväntade exit 2 (saknat 'jobs:'-block), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 10 (FAIL-CLOSED — produktkanaljobbet ("alarm") saknas i filen) ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'nightly.yml',
    nightlyYaml({
      jobNames: BAS_JOBNAMN,
      includeChannel: { produkt: false, bokforing: true, beroende: true },
    }),
  );
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 10: förväntade exit 2 (kanaljobbet "alarm" saknas), fick ${res.code}: ${res.stderr}`,
  );
  assert(/"alarm"/.test(res.stderr), `Fall 10: förväntade "alarm" i stderr, fick: ${res.stderr}`);
}

// ═══ FALL 11 (FAIL-CLOSED — kanal-config-filen saknas) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', nightlyYaml({ jobNames: BAS_JOBNAMN }));
  const res = runGrind(dir, { kanalConfig: 'finns-inte.conf' });
  assert(res.code === 2, `Fall 11: förväntade exit 2 (saknad kanal-config), fick ${res.code}`);
}

// ═══ FALL 12 (FAIL-CLOSED — prefix-arrayen tom) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', nightlyYaml({ jobNames: BAS_JOBNAMN }));
  writeFile(dir, 'kanal.conf', kanalConf([]));
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 12: förväntade exit 2 (tom prefix-array), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 13 (FAIL-CLOSED — trasig bash-syntax i kanal-config) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', nightlyYaml({ jobNames: BAS_JOBNAMN }));
  writeFile(dir, 'kanal.conf', 'NATTVAKT_PRODUKTKANAL_JOBBPREFIX=(\n  "ostängd\n');
  const res = runGrind(dir);
  assert(
    res.code === 2,
    `Fall 13: förväntade exit 2 (trasig bash-syntax), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 14 (RÖTT — namn-led, kärnfallet): produktjobbets name: ändrat så
// inget prefix längre matchar ⇒ exit 1 ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'nightly.yml',
    nightlyYaml({ jobNames: { ...BAS_JOBNAMN, jobA: 'Helt Omdöpt Jobb' } }),
  );
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 14: förväntade exit 1 (omdöpt produktjobb), fick ${res.code}`);
  assert(
    /"jobA"/.test(res.stderr) && /matchas av INGET prefix/.test(res.stderr),
    `Fall 14: förväntade "jobA" + "matchas av INGET prefix" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 15 (RÖTT — namn-led: ett prefix matchar inget jobb längre) ═══
{
  const dir = mkFixture();
  writeFile(dir, 'nightly.yml', nightlyYaml({ jobNames: BAS_JOBNAMN }));
  writeFile(dir, 'kanal.conf', kanalConf([...BAS_PREFIX, 'Föräldralöst Prefix']));
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 15: förväntade exit 1 (föräldralöst prefix), fick ${res.code}`);
  assert(
    /Föräldralöst Prefix/.test(res.stderr) &&
      /matchar INGET av produktkanalens jobbnamn/.test(res.stderr),
    `Fall 15: förväntade "Föräldralöst Prefix" + "matchar INGET" i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 16 (GRÖNT — namn-led, prefix-semantik): prefixet är en äkta
// PREFIX till jobbnamnet, inte identiskt — speglar "Nattlig fullsvit" mot
// "Nattlig fullsvit / Pure + Build" i den riktiga filen ⇒ exit 0 ═══
{
  const dir = mkFixture();
  writeFile(
    dir,
    'nightly.yml',
    nightlyYaml({ jobNames: { ...BAS_JOBNAMN, jobA: 'Nattlig fullsvit / Pure + Build' } }),
  );
  writeFile(dir, 'kanal.conf', kanalConf(['Nattlig fullsvit']));
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 16: förväntade exit 0 (prefix-matchning, ej likhet), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 17 (GRÖNT — robusthet, needs som skalär sträng): produktkanalens
// needs skrivs som EN bar sträng ("needs: jobA"), inte en array — giltig
// YAML-form som normalizeNeeds() måste hantera. Övriga kanaler orörda så
// partitionen fortfarande håller. ═══
{
  const dir = mkFixture();
  const yaml = nightlyYaml({ jobNames: BAS_JOBNAMN, produktNeeds: ['jobA'] }).replace(
    'needs: [jobA]',
    'needs: jobA',
  );
  writeFile(dir, 'nightly.yml', yaml);
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 17: förväntade exit 0 (needs som skalär sträng), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 18 (RÖTT — okänd needs-syntax, review runda 1 PR #2557):
// produktkanalens if-villkor använder BRACKET-notation ("needs['jobA'].result")
// i stället för punktnotation. extractTriggerRefs() fångar inte referensen
// (regexen matchar bara punktnotation), så jobA hade annars bara synts som
// "utlöser INGEN kanal" — ett generiskt, missvisande partitionsfynd. Grinden
// ska i stället ge ETT ÄRLIGT tilläggsmeddelande som namnger bracket-
// strängen och säger att uttrycket inte kunde tolkas. ═══
{
  const dir = mkFixture();
  const yaml = nightlyYaml({
    jobNames: BAS_JOBNAMN,
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal GH Actions-uttryck, inte ett mall-literal-misstag.
    produktIfOverride: "${{ always() && (needs['jobA'].result == 'failure') }}",
  });
  writeFile(dir, 'nightly.yml', yaml);
  writeFile(dir, 'kanal.conf', kanalConf(BAS_PREFIX));
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 18: förväntade exit 1 (okänd needs-syntax), fick ${res.code}`);
  assert(
    /kunde inte tolka uttrycket/.test(res.stderr) && /needs\['jobA'\]/.test(res.stderr),
    `Fall 18: förväntade "kunde inte tolka uttrycket" + bracket-strängen i stderr, fick: ${res.stderr}`,
  );
}

if (failCount > 0) {
  process.stderr.write(
    `\ntest-check-nattkanal-partition: ${failCount} fall FALLERADE, ${passCount} OK\n`,
  );
  process.exit(1);
}
process.stdout.write(`test-check-nattkanal-partition: alla ${passCount} kontroller OK\n`);
