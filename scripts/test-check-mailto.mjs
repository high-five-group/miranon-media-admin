#!/usr/bin/env node
// scripts/test-check-mailto.mjs — självtest för check-mailto.mjs
// (TASK-147.8 AC #1: tvåsidigt bevis — seedad mailto:-återinförsel FÄLLS,
// ren kod och config-undantagen kontaktlänk PASSERAR).
//
// Sandboxad i egen mktemp-katalog (rör aldrig repots src/ eller policy-fil),
// ingen nätverkstrafik. Kör grinden som EGEN process (`node
// scripts/check-mailto.mjs --dir src --config policy.json`, cwd =
// fixturens rot) och läser exit-koden — precis den disciplin CLAUDE.md §
// "Fånga exitkoden separat" kräver. Struktur speglar
// scripts/test-check-langa-streck.mjs (samma AST-motor, samma fixtur-rigg).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'check-mailto.mjs');

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'task147-8-mailto-test-'));
  fs.mkdirSync(path.join(dir, 'src'));
  return dir;
}

function writeSrc(dir, name, content) {
  fs.writeFileSync(path.join(dir, 'src', name), content);
}

function writeConfig(dir, exceptions) {
  fs.writeFileSync(path.join(dir, 'policy.json'), JSON.stringify({ exceptions }, null, 2));
}

// VIKTIGT: körs med cwd = fixturens ROT (dir), inte repo-roten — samma
// kontrakt-motivering som test-check-langa-streck.mjs (path.relative mot
// REPO_ROOT = process.cwd() vid körning).
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

// ═══ FALL 1 (RÖTT-SIDAN): seedad mailto: i JSX-attributets StringLiteral
// (t.ex. `<a href="mailto:foo@example.se">`) FÄLLS ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'Fel.tsx',
    'export function Fel() {\n  return <a href="mailto:foo@example.se">Mejla</a>;\n}\n',
  );
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 1: förväntade exit 1 (StringLiteral mailto:), fick ${res.code}`);
  assert(
    /Fel\.tsx.*string-literal/.test(res.stderr),
    `Fall 1: förväntade filnamn+kind i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 2 (RÖTT-SIDAN): seedad mailto: i TemplateElement (`mailto:${e}`)
// FÄLLS — exakt formen PersonDetailPrototyp.tsx bär (utan undantag) ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'Mall.tsx',
    // Fixtur-KÄLLKOD som skrivs till fil, inte en glömd template literal —
    // den YTTRE strängen är medvetet enkelfnuttad så den INRE backtick-mallen
    // (med sitt eget ${e}) blir bokstavlig text i fixturfilen (samma mönster
    // som test-check-langa-streck.mjs FALL 3).
    // biome-ignore lint/suspicious/noTemplateCurlyInString: se kommentaren ovan
    'export function Mall({ e }: { e: string }) {\n  return <a href={`mailto:${e}`}>Mejla</a>;\n}\n',
  );
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 2: förväntade exit 1 (template-element mailto:), fick ${res.code}`);
  assert(
    /template-element/.test(res.stderr),
    `Fall 2: förväntade 'template-element' i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 3 (RÖTT-SIDAN): seedad mailto: i ren JSXText FÄLLS ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'Text.tsx',
    'export function Text() {\n  return <p>mailto:hej@exempel.se</p>;\n}\n',
  );
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 3: förväntade exit 1 (jsx-text mailto:), fick ${res.code}`);
  assert(
    /jsx-text/.test(res.stderr),
    `Fall 3: förväntade 'jsx-text' i stderr, fick: ${res.stderr}`,
  );
}

// ═══ FALL 4 (GRÖNT-SIDAN): ren kod utan mailto: PASSERAR — och en mailto:
// ENDAST i kommentar fäller INTE (samma AST-disciplin som langa-streck) ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'Ren.tsx',
    '// gammal mailto:-väg, riven — se historiken\nexport function Ren() {\n  return <a href="/atgarder">Åtgärder</a>;\n}\n',
  );
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 4: förväntade exit 0 (mailto: ENDAST i kommentar), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 5 (GRÖNT-SIDAN): file-value-undantag är FIL-SCOPAT — samma
// mailto:-värde i en ANNAN fil fälls fortfarande (precis den skillnad som
// gör PersonDetailPrototyp.tsx-undantaget säkert: det stoppar INTE en ny
// bulk-mailto någon annanstans) ═══
{
  const dir = mkFixture();
  writeSrc(
    dir,
    'Kontakt.tsx',
    // Fixtur-KÄLLKOD, samma enkelfnutt/backtick-mönster som FALL 2 ovan.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: se FALL 2s kommentar
    'export function K({ e }: { e: string }) {\n  return <a href={`mailto:${e}`}>Mejla</a>;\n}\n',
  );
  writeSrc(
    dir,
    'Batch.tsx',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: se FALL 2s kommentar
    'export function B({ e }: { e: string }) {\n  return <a href={`mailto:${e}`}>Skicka till alla</a>;\n}\n',
  );
  writeConfig(dir, [{ type: 'file-value', file: 'src/Kontakt.tsx', match: 'mailto:' }]);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 5: förväntade exit 1 (Batch.tsx ej undantagen), fick ${res.code}`);
  assert(
    /Batch\.tsx/.test(res.stderr),
    `Fall 5: förväntade Batch.tsx i violation-listan: ${res.stderr}`,
  );
  assert(
    !/Kontakt\.tsx/.test(res.stderr),
    `Fall 5: Kontakt.tsx ska INTE listas (fil-undantagen): ${res.stderr}`,
  );
}

// ═══ FALL 6 (fail-closed): saknad policy-fil ger exit 2, inte 0/1 ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'Ren.tsx', 'export const ok = 1;\n');
  const res = runGrind(dir, { configPath: 'saknas.json' });
  assert(res.code === 2, `Fall 6: förväntade exit 2 (saknad policy), fick ${res.code}`);
}

// ═══ FALL 7: import-modulspecifikation exkluderas strukturellt (en
// osannolik men strukturellt möjlig sökväg med "mailto:" i namnet) ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'Import.ts', "import { x } from './mailto:modul';\nexport { x };\n");
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(
    res.code === 0,
    `Fall 7: förväntade exit 0 (mailto: i import-specifikation exkluderas strukturellt), fick ${res.code}: ${res.stderr}`,
  );
}

// ═══ FALL 8 (GRÖNT-SIDAN): case-okänslig matchning — "MAILTO:" fälls
// likaväl som "mailto:" ═══
{
  const dir = mkFixture();
  writeSrc(dir, 'Versal.tsx', 'export function V() {\n  return <p>MAILTO:hej@exempel.se</p>;\n}\n');
  writeConfig(dir, []);
  const res = runGrind(dir);
  assert(res.code === 1, `Fall 8: förväntade exit 1 (case-okänslig MAILTO:), fick ${res.code}`);
}

if (failCount > 0) {
  process.stderr.write(`\ntest-check-mailto: ${failCount} fall FALLERADE, ${passCount} OK\n`);
  process.exit(1);
}
process.stdout.write(`test-check-mailto: alla ${passCount} kontroller OK\n`);
