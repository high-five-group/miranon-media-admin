#!/usr/bin/env node
import fs from 'node:fs';
// scripts/check-mailto.mjs — TASK-147.8 AC #1: mekanisk vakt som fäller
// mailto:-vägar i src/, så stämplingslögnens ursprungliga mekanism
// (ett klick som bara öppnar mail-klienten, aldrig ett verkligt server-
// utskick — se AtgardsSida.tsx:s egen kommentar "mailto-eran satte 'skickad'
// på ett klick som bara öppnade ett fönster") inte kan återinföras tyst i
// utskicksflödena.
//
// ═══ VARFÖR AST OCH INTE REGEX-PÅ-FILINNEHÅLL ═══
// Samma skäl som scripts/check-langa-streck.mjs (TASK-172): en ren
// filinnehålls-regex skulle falsk-positiva mot docblock-kommentarer som
// FÖRKLARAR mailto-rivningen (AtgardsSida.tsx, Betalningar.tsx,
// registrationPayments.ts bär flera sådana — se grep-svepet i TASK-147.8s
// PR-underlag). Skriptet parsar varje fil med @babel/parser (jsx +
// typescript-plugins, samma konfiguration som check-langa-streck.mjs) och
// besöker ENDAST StringLiteral / JSXText / TemplateElement-noder;
// kommentarer hamnar i AST:ns `comments`-array och besöks aldrig av
// traverse(), så de kan strukturellt inte fällas.
//
// VARFÖR @babel/parser: samma motivering som check-langa-streck.mjs (repots
// `typescript`-paket är v7/tsgo och exponerar ingen klassisk AST-API via
// huvud-entrypointen) — @babel/parser + @babel/traverse är redan en
// TRANSITIV dependency av en DIREKT devDependency (@tanstack/router-cli).
// Ingen ny dependency läggs till, och ingen ny parse-konfiguration —
// PARSER_OPTIONS delar exakt samma plugin-lista som check-langa-streck.mjs
// (jsx + typescript), medvetet inte extraherad till en delad modul: två
// korta, oberoende skript är enklare att läsa var för sig än en delad
// abstraktion med en enda konsument vardera skulle motivera (över-
// engineering-vakten: ingen abstraktion utan en FAKTISK andra användare av
// just den abstraktionen — de två skripten löser olika mönster, bara
// parser-anropet råkar se likadant ut).
//
// ═══ VAD DEN PRÖVAR ═══
// Varje .ts/.tsx-fil under src/ (utom *.d.ts) parsas. För varje
// StringLiteral / JSXText / TemplateElement vars innehåll (case-okänsligt)
// innehåller substrängen "mailto:":
//   1. Import-/export-modulspecifikationer exkluderas strukturellt (de är
//      aldrig användar-synliga, oavsett innehåll) — en mailto: kan aldrig
//      uppstå där i praktiken, men samma strukturella uteslutning som
//      check-langa-streck.mjs hålls för konsekvens.
//   2. Innehållet whitespace-normaliseras och jämförs mot
//      .mailto-policy.json:s undantag — 'global' (matchar samma
//      normaliserade värde i VILKEN fil som helst) eller 'file-value'
//      (matchar samma normaliserade värde i EN namngiven fil, källmärkt
//      rationale krävs).
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
const MAILTO_RE = /mailto:/i;

function usageDie(msg) {
  process.stderr.write(`check-mailto: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = { srcDir: 'src', configPath: '.mailto-policy.json' };
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
  if (!MAILTO_RE.test(text)) return [];

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
    if (!MAILTO_RE.test(rawValue)) return;
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
    if (!MAILTO_RE.test(text)) continue;
    scanned++;
    violations = violations.concat(scanFile(file, relFile, policy, parser, traverse));
  }

  if (violations.length > 0) {
    process.stderr.write(
      `check-mailto: ${violations.length} mailto:-väg i användar-synlig kod (StringLiteral/JSXText/TemplateElement), ej config-undantagen:\n\n`,
    );
    for (const v of violations) {
      process.stderr.write(`  ${v.file}:${v.line} [${v.kind}] ${JSON.stringify(v.value)}\n`);
    }
    process.stderr.write(
      '\nUtskicksflödena går genom servern (useSendActionEmail/useSendActionTestEmail), aldrig genom mail-klientens eget fönster — se AtgardsSida.tsx. Är detta en genuin 1:1-kontaktlänk (ingen bulk-/utskicksflödesroll) och inte en återinförd stämplingslögn: lägg till ett undantag i .mailto-policy.json, med källmärkt rationale.\n',
    );
    process.exit(1);
  }

  process.stdout.write(
    `check-mailto: OK — ${scanned} fil(er) med "mailto:"-substräng skannade under ${srcDir}/, 0 ofångade mailto:-vägar (${policy.globalValues.size} globalt undantag, ${[...policy.fileValues.values()].reduce((n, s) => n + s.size, 0)} fil-undantag).\n`,
  );
}

main();
