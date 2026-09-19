#!/usr/bin/env node
// test-check-codeql-push-pr-parity.mjs — self-test för
// check-codeql-push-pr-parity.mjs.
//
// SJUTTON FALL. Grinden är billig att göra grön och det bevisar ingenting —
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
//   T12 jobs+matrix.include[].language, KÄNDA språk      → 0
//   T13 jobs+matrix.language FLOW-form, KÄNDA språk       → 0
//   T14 jobs+matrix.language BLOCK-listform, KÄNDA språk  → 0
//   T15 jobs+matrix (finns) men INGET språk härledbart    → 2 (tolkningsfel)
//   T16 jobs+matrix.include[].language med ETT okänt språk → 1
//   T17 jobs UTAN någon strategy.matrix alls               → 0 (no-op)
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
// T12–T17 (review runda 4 fynd 2) är SPRÅKMATRISEN, flyttad hit från
// check-codeql-d0-kodfri.sh (som bara kände include-formen via en REGEX
// och blev ett tyst no-op på flow-/block-listform). T13–T14 bevisar att
// js-yaml normaliserar de två SYNTAKTISKA varianterna av matrix.language
// till samma resultat, utan specialfall. T15 är DEN VIKTIGASTE: den bevisar
// fail-closed — en matris som SYNS (`strategy.matrix` är ett objekt) men
// vars språk inte går att härleda ur någon känd form ska FÄLLA, aldrig
// tolkas som "inget att pröva". T17 bevisar att no-op-vägen (ingen matris
// alls) inte stör T1–T11, som aldrig definierar `jobs:`.
//
// Test-isolering: allt sker i en temp-katalog. INGEN ändring av det
// riktiga repots .github/workflows/codeql.yml.
//
// Användning: node scripts/test-check-codeql-push-pr-parity.mjs
// Exit 0 om alla sjutton passerar, annars 1.
//
// Källa: TASK-464.2, review runda 1 fynd 2 (warning), review runda 2
// fynd 2 (info, generalisering), review runda 4 fynd 2 (warning,
// språkmatris-kontrollen flyttad hit och gjord fail-closed).

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

console.log('\ntest-check-codeql-push-pr-parity — sjutton fall');
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

// T12 — jobs+matrix.include[].language, den VERKLIGA formen i codeql.yml,
// bägge kända språk.
skriv(
  't12.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore:
      - '**/*.md'
jobs:
  analyze:
    strategy:
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none
          - language: actions
            build-mode: none
`,
);
report('T12 matrix.include[].language, kända språk → grönt', 0, kor('t12.yml'));

// T13 — jobs+matrix.language i FLOW-form (`language: [a, b]`). Detta är
// EXAKT det scenario review runda 4 fynd 2 beskrev som ett tyst no-op i
// den gamla regex-baserade vakten.
skriv(
  't13.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore:
      - '**/*.md'
jobs:
  analyze:
    strategy:
      matrix:
        language: [javascript-typescript, actions]
`,
);
report('T13 matrix.language flow-form, kända språk → grönt', 0, kor('t13.yml'));

// T14 — jobs+matrix.language i BLOCK-listform. js-yaml normaliserar denna
// och T13:s flow-form till EXAKT samma JS-array — samma kodväg, olika
// YAML-syntax.
skriv(
  't14.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore:
      - '**/*.md'
jobs:
  analyze:
    strategy:
      matrix:
        language:
          - javascript-typescript
          - actions
`,
);
report('T14 matrix.language block-listform, kända språk → grönt', 0, kor('t14.yml'));

// T15 — DEN VIKTIGASTE av de sex nya fallen. strategy.matrix ÄR ett objekt
// (matrisen "syns"), och den bär till och med ett `include:`-fält — men
// INGEN post har ett `.language`-fält, så noll språk kan härledas. Detta
// ska FÄLLA (anropsfel), aldrig tolkas som "ingen matris, inget att pröva".
skriv(
  't15.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore:
      - '**/*.md'
jobs:
  analyze:
    strategy:
      matrix:
        include:
          - build-mode: none
`,
);
report('T15 matris hittad men inget språk härledbart → anropsfel', 2, kor('t15.yml'));

// T16 — matrix.include[].language med ETT språk grinden inte känner
// ('python'). Den ursprungliga kärnan i review runda 3 fynd 2, nu här.
skriv(
  't16.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore:
      - '**/*.md'
jobs:
  analyze:
    strategy:
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none
          - language: python
            build-mode: none
`,
);
report('T16 okänt matrisspråk (python) → fäller', 1, kor('t16.yml'));

// T17 — jobs: definierat, men INGEN strategy.matrix i något jobb. No-op-
// vägen: kontrollen ska inte hitta på ett fel där ingen matrisdriven
// språkväljare används alls.
skriv(
  't17.yml',
  `on:
  pull_request:
    paths-ignore:
      - '**/*.md'
  push:
    paths-ignore:
      - '**/*.md'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hej
`,
);
report('T17 jobs utan strategy.matrix alls → grönt (no-op)', 0, kor('t17.yml'));

console.log('─'.repeat(70));
console.log(`  ${pass} gröna, ${fail} röda\n`);

fs.rmSync(TEST_DIR, { recursive: true, force: true });

process.exit(fail === 0 ? 0 : 1);
