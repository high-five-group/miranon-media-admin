#!/usr/bin/env node
// scripts/test-check-langa-streck.mjs — självtest för check-langa-streck.mjs
// (TASK-172 AC #2: tvåsidigt bevis — seedat fel fälls, ren kod passerar).
//
// Sandboxad i egen mktemp-katalog (rör aldrig repots src/ eller policy-fil),
// ingen nätverkstrafik. Kör grinden som EGEN process (`node
// scripts/check-langa-streck.mjs --dir src --config policy.json`, cwd =
// fixturens rot) och läser exit-koden — precis den disciplin CLAUDE.md §
// "Fånga exitkoden separat" kräver.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'check-langa-streck.mjs');

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'task172-langa-streck-test-'));
  fs.mkdirSync(path.join(dir, 'src'));
  return dir;
}

function writeSrc(dir, name, content) {
  fs.writeFileSync(path.join(dir, 'src', name), content);
}

function writeConfig(dir, exceptions) {
  fs.writeFileSync(path.join(dir, 'policy.json'), JSON.stringify({ exceptions }, null, 2));
}

// VIKTIGT: körs med cwd = fixturens ROT (dir), inte repo-roten. Skriptets
// REPO_ROOT = process.cwd() vid körning, och file-value-undantagens 'file'
// matchas mot path.relative(REPO_ROOT, ...) — samma kontrakt som den
// verkliga CI-körningen (cwd = repo-roten, filer under src/, config-filens
// 'file'-fält skrivna som "src/...", exakt den formen policy-filen bär).
// Körs grinden mot en helt orelaterad tmp-katalog UTAN att sätta cwd dit blir
// path.relative en lång "../../.."-sökväg och file-value-undantagen matchar
// aldrig — inte ett fel i skriptet, men ett fel i en testrigg som inte
// speglar det verkliga anropskontraktet.
function runGrind(dir, { srcDir = 'src', configPath = 'policy.json' } = {}) {
  try {
    const out = execFileSync(process.execPath, [SCRIPT, '--dir', srcDir, '--config', configPath], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

// ═══ FALL 1 (RÖTT-SIDAN): seedat em-dash-fel i JSX-text FÄLLS ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'Fel.tsx', 'export function Fel() {\n  return <p>Hej — då</p>;\n}\n');
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 1: förväntade exit 1 (JSX-text em-dash), fick ${res.code}`);
  assert(
    /Fel\.tsx.*jsx-text/.test(res.stderr),
    `Fall 1: förväntade filnamn+kind i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 2 (RÖTT-SIDAN): seedat en-dash-fel i StringLiteral FÄLLS ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'fel.ts', "export const x = 'a – b';\n");
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 2: förväntade exit 1 (en-dash string-literal), fick ${res.code}`);
  assert(
    /string-literal/.test(res.stderr),
    `Fall 2: förväntade 'string-literal' i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 3 (RÖTT-SIDAN): seedat fel i TemplateElement FÄLLS ═══
{
  const dir = mkFixture();
  // Fixtur-KÄLLKOD som skrivs till fil, inte en glömd template literal — den
  // YTTRE strängen är medvetet enkelfnuttad så den INRE backtick-mallen (med
  // sitt eget ${1}) blir bokstavlig text i fixturfilen.
  // biome-ignore lint/suspicious/noTemplateCurlyInString: se kommentaren ovan
  writeSrc(dir, 'mall.ts', 'export const y = `start — ${1} slut`;\n');
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 3: förväntade exit 1 (template-element), fick ${res.code}`);
  assert(
    /template-element/.test(res.stderr),
    `Fall 3: förväntade 'template-element' i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 4 (GRÖNT-SIDAN): ren kod utan långa streck PASSERAR ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'Ren.tsx',
    '// kommentar med — långt streck, ska INTE fällas\nexport function Ren() {\n  return <p>Hej - då</p>;\n}\n',
  );
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 0, `Fall 4: förväntade exit 0 (ren kod + kommentar), fick ${res.code}`);
}

// ═══ FALL 5 (GRÖNT-SIDAN, kärnan i task-168-parallellen): långt streck i
// KOMMENTAR ENSAM (ingen sträng/JSX-text) FÄLLER INTE — bevisar att AST-
// läsningen faktiskt skiljer kommentar från strängliteral/JSX-text, inte
// bara att koden råkar vara ren. ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'BaraKommentar.ts',
    '/* block-kommentar — med långt streck */\n// radkommentar — med långt streck\nexport const z = 1;\n',
  );
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 5: förväntade exit 0 (streck ENDAST i kommentar), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 6 (GRÖNT-SIDAN): global tom-markör-undantag släpper igenom en
// standalone "—" men fäller fortfarande en INBÄDDAD em-dash i samma fil ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'TomMarkor.tsx',
    "export function TomMarkor() {\n  return (\n    <>\n      <span>{'—'}</span>\n      <p>Hej — då</p>\n    </>\n  );\n}\n",
  );
  writeConfig(dir, [{ type: 'global', match: '—' }]);
  const res = runGrind(dir);
  assert(
    res.code === 1,
    `Fall 6: förväntade exit 1 (den inbäddade dashen ska fortfarande fällas), fick ${res.code}`,
  );
  const violationLines = res.stderr.split('\n').filter((l) => l.trim().startsWith('src/'));
  assert(
    violationLines.length === 1,
    `Fall 6: förväntade exakt 1 violation (tom-markören undantagen), fick ${violationLines.length}: ${res.stderr}`,
  );
  assert(
    /Hej — då/.test(res.stderr),
    `Fall 6: den kvarvarande violationen ska vara "Hej — då", fick: ${res.stderr}`,
  );
}

// ═══ FALL 7 (GRÖNT-SIDAN): file-value-undantag är FIL-SCOPAT — samma värde
// i en ANNAN fil fälls fortfarande ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'A.tsx', "export const a = '–';\n");
  writeSrc(dir, 'B.tsx', "export const b = '–';\n");
  writeConfig(dir, [{ type: 'file-value', file: 'src/A.tsx', match: '–' }]);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 7: förväntade exit 1 (B.tsx ej undantagen), fick ${res.code}`);
  assert(/B\.tsx/.test(res.stderr), `Fall 7: förväntade B.tsx i violation-listan: ${res.stderr}`);
  assert(
    !/A\.tsx/.test(res.stderr),
    `Fall 7: A.tsx ska INTE listas (fil-undantagen): ${res.stderr}`,
  );
}

// ═══ FALL 8 (fail-closed): saknad policy-fil ger exit 2, inte 0/1 ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'Ren.tsx', 'export const ok = 1;\n');
  const res = runGrind(dir, { configPath: 'saknas.json' });
  assert(res.code === 2, `Fall 8: förväntade exit 2 (saknad policy), fick ${res.code}`);
}

// ═══ FALL 9: import-modulspecifikation exkluderas strukturellt (aldrig
// användar-synlig) ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'Import.ts', "import { x } from './some—module';\nexport { x };\n");
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 9: förväntade exit 0 (dash i import-specifikation exkluderas strukturellt), fick ${res.code}: ${res.stderr}`,
  );
}

if (failCount > 0) {
  process.stderr.write(`\ntest-check-langa-streck: ${failCount} fall FALLERADE, ${passCount} OK\n`);
  process.exit(1);
}
process.stdout.write(`test-check-langa-streck: alla ${passCount} kontroller OK\n`);
