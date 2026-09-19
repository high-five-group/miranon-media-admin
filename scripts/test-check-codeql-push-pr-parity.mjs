#!/usr/bin/env node
// test-check-codeql-push-pr-parity.mjs — self-test för
// check-codeql-push-pr-parity.mjs.
//
// ELVA FALL. Grinden är billig att göra grön och det bevisar ingenting —
// varje fall nedan finns för att bevisa att den FÄLLER när den ska.
//
//   T1  identiska listor (ankare, verklig form)      → 0
//   T2  push ERSATT med en handskriven, IDENTISK lista → 0 (samma innehåll,
//       olika skrivsätt — grinden bryr sig om SEMANTIK, inte syntax)
//   T3  push ERSATT med en avvikande lista (en post skiljer) → 1
//   T4  push['paths-ignore'] saknas helt (regression)  → 1
//   T5  push är tom array                              → 1
//   T6  pull_request['paths-ignore'] saknas (inget att jämföra mot) → 2
//   T7  workflow-filen finns inte                       → 2
//   T8  TREDJE trigger (merge_group) TILLAGD med AVVIKANDE lista → 1
//   T9  TREDJE trigger (merge_group) TILLAGD med MATCHANDE lista → 0
//   T10 en trigger bär `paths` (POSITIV form)            → 1
//   T11 en trigger utan paths/paths-ignore (schedule) — utanför scope → 0
//
// T2 är det viktigaste fallet för RUNDA 1: det bevisar att grinden INTE
// bara är en ombdöpt textjämförelse av ankare-syntax — den jämför den
// RESOLVERADE YAML-strukturen, precis det check-listparitet.sh:s
// markörbaserade par (klassning-codeql-positiv) inte kan se eftersom det
// paret bara läser EN region (under pull_request).
//
// T8 är det viktigaste fallet för RUNDA 2:s generalisering (review fynd 2)
// — den exakta scenariot review-instruktionen efterfrågade: en HELT NY,
// tredje trigger med en egen avvikande lista, som runda 1-versionen (bara
// push ↔ pull_request) inte hade kunnat se alls.
//
// Test-isolering: allt sker i en temp-katalog. INGEN ändring av det
// riktiga repots .github/workflows/codeql.yml.
//
// Användning: node scripts/test-check-codeql-push-pr-parity.mjs
// Exit 0 om alla elva passerar, annars 1.
//
// Källa: TASK-464.2, review runda 1 fynd 2 (warning), review runda 2
// fynd 2 (info, generalisering).

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

console.log('\ntest-check-codeql-push-pr-parity — elva fall');
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

// T8 — TREDJE trigger (merge_group) tillagd med en AVVIKANDE lista. Det
// exakta scenariot review runda 2 fynd 2 efterfrågade: runda 1-versionen
// (bara push ↔ pull_request) hade inte kunnat se detta alls.
skriv(
  't8.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  merge_group:
    paths-ignore:
      - '**/*.md'
      - 'ANNAN-SOKVAG/**'
`,
);
report('T8 tredje trigger (merge_group) med avvikande lista → fäller', 1, kor('t8.yml'));

// T9 — samma tredje trigger, men med en MATCHANDE lista. Positiv kontroll:
// en korrekt konfigurerad tredje trigger ska INTE fällas.
skriv(
  't9.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  merge_group:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
`,
);
report('T9 tredje trigger (merge_group) med matchande lista → grönt', 0, kor('t9.yml'));

// T10 — en trigger bär `paths` (POSITIV form). Ska fällas oavsett innehåll
// — förekomsten ÄR felet, eftersom denna fil bara äger paths-ignore som
// avsedd mekanism.
skriv(
  't10.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  workflow_call:
    paths:
      - 'docs/**'
`,
);
report('T10 trigger med paths (positiv form) → fäller', 1, kor('t10.yml'));

// T11 — en trigger utan paths/paths-ignore (t.ex. schedule). Strukturellt
// utanför vaktens scope — ska INTE fällas.
skriv(
  't11.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  push:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
  schedule:
    - cron: '0 5 * * 1'
  workflow_dispatch: {}
`,
);
report('T11 trigger utan paths/paths-ignore (schedule) → grönt', 0, kor('t11.yml'));

console.log('─'.repeat(70));
console.log(`  ${pass} gröna, ${fail} röda\n`);

fs.rmSync(TEST_DIR, { recursive: true, force: true });

process.exit(fail === 0 ? 0 : 1);
