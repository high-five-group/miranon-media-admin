#!/usr/bin/env node
// test-check-codeql-push-pr-parity.mjs — self-test för
// check-codeql-push-pr-parity.mjs.
//
// SJU FALL. Grinden är billig att göra grön och det bevisar ingenting —
// varje fall nedan finns för att bevisa att den FÄLLER när den ska.
//
//   T1 identiska listor (ankare, verklig form)      → 0
//   T2 push ERSATT med en handskriven, IDENTISK lista → 0 (samma innehåll,
//      olika skrivsätt — grinden bryr sig om SEMANTIK, inte syntax)
//   T3 push ERSATT med en avvikande lista (en post skiljer) → 1
//   T4 push['paths-ignore'] saknas helt (regression)  → 1
//   T5 push är tom array                              → 1
//   T6 pull_request['paths-ignore'] saknas (inget att jämföra mot) → 2
//   T7 workflow-filen finns inte                       → 2
//
// T2 är det viktigaste fallet: det bevisar att grinden INTE bara är en
// ombdöpt textjämförelse av ankare-syntax — den jämför den RESOLVERADE
// YAML-strukturen, precis det check-listparitet.sh:s markörbaserade par
// (klassning-codeql-positiv) inte kan se eftersom det paret bara läser EN
// region (under pull_request).
//
// Test-isolering: allt sker i en temp-katalog. INGEN ändring av det
// riktiga repots .github/workflows/codeql.yml.
//
// Användning: node scripts/test-check-codeql-push-pr-parity.mjs
// Exit 0 om alla sju passerar, annars 1.
//
// Källa: TASK-464.2, review runda 1 fynd 2 (warning).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const GATE = path.join(REPO_ROOT, 'scripts', 'check-codeql-push-pr-parity.mjs');
const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'test-codeql-parity-'));

let pass = 0;
let fail = 0;

function report(namn, vantat, faktiskt) {
  if (vantat === faktiskt) {
    console.log(`  ✅ ${namn.padEnd(52)} exit=${faktiskt}`);
    pass++;
  } else {
    console.log(`  ❌ ${namn.padEnd(52)} exit=${faktiskt} (väntat ${vantat})`);
    fail++;
  }
}

function kor(fixturNamn) {
  const fixtur = path.join(TEST_DIR, fixturNamn);
  try {
    execFileSync('node', [GATE, fixtur], { stdio: 'pipe' });
    return 0;
  } catch (err) {
    return err.status ?? 99;
  }
}

function skriv(namn, innehall) {
  fs.writeFileSync(path.join(TEST_DIR, namn), innehall, 'utf8');
}

console.log('\ntest-check-codeql-push-pr-parity — sju fall');
console.log('─'.repeat(70));

// T1 — verklig ankare-form.
skriv(
  't1.yml',
  `on:
  pull_request:
    paths-ignore: &d0
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore: *d0
`,
);
report('T1 identiska listor (ankare)', 0, kor('t1.yml'));

// T2 — samma INNEHÅLL, men push skriven som en egen literal (ingen alias).
// Bevisar att grinden jämför SEMANTIK, inte YAML-syntaxform.
skriv(
  't2.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
`,
);
report('T2 handskriven men innehållsidentisk lista', 0, kor('t2.yml'));

// T3 — push handskriven och AVVIKANDE (en post skiljer). Den viktigaste
// positiva fällningen: detta är exakt den regression ADR-083-fyndet gällde.
skriv(
  't3.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore:
      - '**/*.md'
      - 'tasks/**'
`,
);
report('T3 avvikande push-lista → fäller', 1, kor('t3.yml'));

// T4 — push['paths-ignore'] saknas helt.
skriv(
  't4.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    branches: [main]
`,
);
report('T4 push paths-ignore saknas → fäller', 1, kor('t4.yml'));

// T5 — push är en tom array.
skriv(
  't5.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore: []
`,
);
report('T5 push paths-ignore tom → fäller', 1, kor('t5.yml'));

// T6 — pull_request paths-ignore saknas (inget att jämföra mot).
skriv(
  't6.yml',
  `on:
  pull_request:
    branches: [main]
  push:
    paths-ignore:
      - '**/*.md'
`,
);
report('T6 pull_request paths-ignore saknas', 2, kor('t6.yml'));

// T7 — workflow-filen finns inte.
report('T7 workflow-filen saknas', 2, kor('finns-inte.yml'));

console.log('─'.repeat(70));
console.log(`  ${pass} gröna, ${fail} röda\n`);

fs.rmSync(TEST_DIR, { recursive: true, force: true });

process.exit(fail === 0 ? 0 : 1);
