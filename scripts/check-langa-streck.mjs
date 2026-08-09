#!/usr/bin/env node
import fs from 'node:fs';
// scripts/check-langa-streck.mjs — TASK-172 (scope A): mekanisk vakt som
// fäller NYA långa streck (em-dash — / en-dash –) i användar-synliga
// strängar i src/.
//
// ═══ VARFÖR AST OCH INTE REGEX ═══
// En ren regex över filinnehåll skulle falsk-positiva mot kodkommentarer
// (scope B — kommentarer/docs ingår INTE i detta svep, task-172 Description)
// — samma felklass task-168 fixade i en annan hook. Skriptet parsar varje
// fil med @babel/parser (jsx + typescript-plugins) och besöker ENDAST
// StringLiteral / JSXText / TemplateElement-noder; kommentarer hamnar i
// AST:ns `comments`-array och besöks aldrig av traverse(), så de kan
// strukturellt inte fällas.
//
// VARFÖR @babel/parser OCH INTE `typescript`-paketet: repots `typescript`-
// beroende är v7 (TASK-161-familjens native Go-kompilator, "tsgo") vars npm-
// paket INTE längre exponerar den klassiska AST-API:n
// (`ts.createSourceFile` m.fl.) via sitt huvud-entrypoint — bara
// `version`/`versionMajorMinor` (verifierat 2026-08-09, TASK-172:
// `require('typescript')` ger `{ version, versionMajorMinor }`, `ScriptTarget`
// är `undefined`). Paketet exponerar en "unstable/ast"-subpath, men den bär
// den prefixet av ett skäl. @babel/parser + @babel/traverse (7.29.7) är
// däremot en STABIL, väletablerad AST-lösning som redan är en TRANSITIV
// dependency av en DIREKT devDependency (`@tanstack/router-cli` /
// `@tanstack/router-plugin`, vars kodgenerering använder Babel för att
// parsa routefiler) — verifierat i package-lock.json. Ingen ny dependency
// läggs till.
//
// ═══ VAD DEN PRÖVAR ═══
// Varje .ts/.tsx-fil under src/ (utom *.d.ts) parsas. För varje
// StringLiteral / JSXText / TemplateElement vars innehåll matchar
// em-dash (—) eller en-dash (–):
//   1. Import-/export-modulspecifikationer exkluderas strukturellt (de är
//      aldrig användar-synliga, oavsett innehåll).
//   2. Innehållet whitespace-normaliseras (\s+ → enkelt mellanslag, trimmat)
//      och jämförs mot .langa-streck-policy.json:s undantag:
//        - 'global': matchar samma normaliserade värde i VILKEN fil som helst
//          (tom-markören).
//        - 'file-value': matchar samma normaliserade värde i EN namngiven fil
//          (REST-poster, referens-/baseline-låsta ytor — se policyns _readme).
//   3. Allt annat är en FÄLLNING: filnamn, radnummer, nod-typ och innehåll
//      skrivs ut, exit 1.
//
// Fail-closed: ogiltig policy-JSON, ett parse-fel i en käll-fil, eller en
// saknad src/-katalog ger exit 2 (skriptfel — skiljs från "grinden hittade
// en överträdelse", exit 1).
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);

const REPO_ROOT = process.cwd();
const DASH_RE = /[—–]/;

function usageDie(msg) {
  process.stderr.write(`check-langa-streck: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = { srcDir: 'src', configPath: '.langa-streck-policy.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) {
      out.srcDir = argv[++i];
    } else if (argv[i] === '--config' && argv[i + 1]) {
      out.configPath = argv[++i];
    }
  }
  return out;
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function loadPolicy(configPath) {
  const abs = path.resolve(REPO_ROOT, configPath);
  if (!fs.existsSync(abs)) {
    usageDie(`policy-fil saknas: ${abs}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    usageDie(`ogiltig JSON i ${abs}: ${e.message}`);
  }
  if (!Array.isArray(parsed.exceptions)) {
    usageDie(`${abs} saknar ett 'exceptions'-array`);
  }
  const globalValues = new Set();
  const fileValues = new Map(); // relFile -> Set<normalizedValue>
  for (const entry of parsed.exceptions) {
    if (entry.type === 'global') {
      globalValues.add(normalize(entry.match));
    } else if (entry.type === 'file-value') {
      if (!entry.file || typeof entry.match !== 'string') {
        usageDie(`file-value-post saknar 'file' eller 'match': ${JSON.stringify(entry)}`);
      }
      const norm = normalize(entry.file);
      if (!fileValues.has(norm)) fileValues.set(norm, new Set());
      fileValues.get(norm).add(normalize(entry.match));
    } else {
      usageDie(`okänd undantags-typ: ${entry.type}`);
    }
  }
  return { globalValues, fileValues };
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

function isModuleSpecifier(node, parent) {
  return (
    (parent.type === 'ImportDeclaration' ||
      parent.type === 'ExportNamedDeclaration' ||
      parent.type === 'ExportAllDeclaration') &&
    parent.source === node
  );
}

function scanFile(file, relFile, policy, parser, traverse) {
  const text = fs.readFileSync(file, 'utf8');
  if (!DASH_RE.test(text)) return [];

  let ast;
  try {
    ast = parser.parse(text, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: false,
    });
  } catch (e) {
    usageDie(`parse-fel i ${relFile}: ${e.message}`);
  }

  const violations = [];
  const fileExceptions = policy.fileValues.get(normalize(relFile));

  function record(node, kind, rawValue) {
    if (!DASH_RE.test(rawValue)) return;
    const norm = normalize(rawValue);
    if (policy.globalValues.has(norm)) return;
    if (fileExceptions?.has(norm)) return;
    violations.push({
      file: relFile,
      line: node.loc.start.line,
      kind,
      value: rawValue.length > 80 ? `${rawValue.slice(0, 77)}...` : rawValue,
    });
  }

  traverse.default(ast, {
    StringLiteral(p) {
      if (isModuleSpecifier(p.node, p.parent)) return;
      record(p.node, 'string-literal', p.node.value);
    },
    JSXText(p) {
      record(p.node, 'jsx-text', p.node.value);
    },
    TemplateElement(p) {
      record(p.node, 'template-element', p.node.value.raw);
    },
  });

  return violations;
}

function main() {
  const { srcDir, configPath } = parseArgs(process.argv.slice(2));
  const absSrcDir = path.resolve(REPO_ROOT, srcDir);
  if (!fs.existsSync(absSrcDir)) {
    usageDie(`käll-katalog saknas: ${absSrcDir}`);
  }

  const parser = require('@babel/parser');
  const traverseMod = require('@babel/traverse');
  const traverse = { default: traverseMod.default || traverseMod };

  const policy = loadPolicy(configPath);
  const files = walk(absSrcDir);

  let violations = [];
  let scanned = 0;
  for (const file of files) {
    const relFile = path.relative(REPO_ROOT, file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    if (!DASH_RE.test(text)) continue;
    scanned++;
    violations = violations.concat(scanFile(file, relFile, policy, parser, traverse));
  }

  if (violations.length > 0) {
    process.stderr.write(
      `check-langa-streck: ${violations.length} långt streck i användar-synlig kod (StringLiteral/JSXText/TemplateElement), ej config-undantagna:\n\n`,
    );
    for (const v of violations) {
      process.stderr.write(`  ${v.file}:${v.line} [${v.kind}] ${JSON.stringify(v.value)}\n`);
    }
    process.stderr.write(
      '\nErsätt med kort bindestreck (-) eller omformulera. Är detta en genuin tom-markör eller en referens-/baseline-låst yta (se .langa-streck-policy.json _readme): lägg till ett undantag där, med källmärkt rationale.\n',
    );
    process.exit(1);
  }

  process.stdout.write(
    `check-langa-streck: OK — ${scanned} fil(er) med streck-tecken skannade under ${srcDir}/, 0 ofångade långa streck (${policy.globalValues.size} globalt undantag, ${[...policy.fileValues.values()].reduce((n, s) => n + s.size, 0)} fil-undantag).\n`,
  );
}

main();
