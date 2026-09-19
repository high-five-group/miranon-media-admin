#!/usr/bin/env bash
#
# test-check-codeql-d0-kodfri.sh — self-test för check-codeql-d0-kodfri.sh.
#
# TJUGOETT FALL (T16–T19 tillagda TASK-471; T20–T21 tillagda TASK-464.4).
# Grinden är billig att göra grön och det bevisar ingenting; varje fall
# nedan finns för att bevisa att den FÄLLER när den ska, eller att den
# vägrar uttala sig när den inte kan läsa det den ska pröva.
#
#   T1  analyserbar fil under D0, deklarerad undantag      → 0
#   T2  analyserbar fil under D0, ODEKLARERAD               → 1
#   T3  obehövligt undantag (filen finns inte längre)       → 1
#   T4  ingen analyserbar fil alls under D0                 → 0
#   T5  icke-analyserbar fil under D0 (t.ex. .md)            → 0 (ren docs-fil)
#   T6  policy-fil saknas                                    → 2
#   T7  start-markören saknas i workflow-filen               → 2
#   T8  slut-markören saknas i workflow-filen                → 2
#   T9  NOLL globs extraherade (markörer tomma)               → 2
#   T10 undantags-post utan skäl                              → 2
#   T11 HTML-fil (RENT innehåll) under D0, deklarerad         → 0
#   T12 HTML-fil (RENT innehåll) under D0, ODEKLARERAD        → 1
#   T13 git ls-files fallerar (ingen .git alls)                → 2
#   T14 action.yml UTANFÖR .github/workflows/, deklarerad      → 0
#   T15 action.yaml UTANFÖR .github/workflows/, ODEKLARERAD    → 1
#   T16 ci.yml-FORM (files:|, negationer), analyserbar odeklarerad → 1
#   T17 ci.yml-FORM, SAMMA fixtur, filen deklarerad                → 0
#   T18 ci.yml-FORM, ren .md under D0 (negationsrader i regionen)  → 0
#   T19 ci.yml-FORM, NOLL globs (bara "files: |" + negationer)     → 2
#   T20 negation ÖVERLAPPAR positiv glob → räknas ändå som träff  → 1
#   T21 markörsubsträng FÖRE riktiga regionen (ankrad matchning)  → 1
#
# T3 är det viktigaste fallet av de ursprungliga tio: ett kvarliggande
# undantag för en fil som inte längre matchar maskerar nästa drift på samma
# post — samma disciplin som check-listparitet.sh:s T7.
#
# T11–T12 ERSÄTTER (review runda 4 fynd 1, Marcus mandat) det innehålls-
# baserade filtret review runda 2/3 byggde ut och som review runda 4 fann
# fyra YTTERLIGARE bypasser mot (entitet-/hex-kodning, saknat semikolon,
# `data:text/html;base64,…`) — ett innehållsfilter för HTML/JS är en
# kapprustning en dokumentvakt inte ska föra. Grinden prövar nu ENDAST
# filändelse: VARJE `.html`/`.htm`/`.xhtml`-fil under D0 kräver ett
# deklarerat undantag, oavsett innehåll. T12:s fixtur bär MEDVETET noll
# `<script>`/handler-innehåll — det är själva poängen: en fil som TIDIGARE
# (review runda 2/3) hade passerat TYST (LAGER 2 höll den ren) fäller nu,
# eftersom innehållet inte längre spelar roll. Se det verkliga trädets
# motsvarighet: `docs/mallar/bilagor/*.html` fick fyra nya deklarerade
# poster i `.codeql-d0-kodfri-policy.conf` samma dag, av exakt detta skäl.
#
# T13 (tidigare T14): review runda 2 fynd 5 — ett `git ls-files`-fel fick
# tidigare tolkas som "noll filer, allt grönt" (fail-open); nu ska SAMMA fel
# ge anropsfel-koden.
#
# T14–T15 (tidigare T20–T21) är review runda 3 fynd 2: samma "D0 = kodfritt"-
# premiss som redan fallit två gånger (§ ANALYSERBARHET) föll en TREDJE gång
# på `actions`-språket — grinden prövade det ALDRIG förut. Matrisspråkets
# EGEN täckning (att codeql.yml:s matris bara innehåller KÄNDA språk) vaktas
# sedan review runda 4 fynd 2 av scripts/check-codeql-push-pr-parity.mjs i
# stället för härifrån — se den filens egen testsvit.
#
# T16–T19 (TASK-471) bevisar den PARAMETRISERADE andra konsumenten — ci.yml:s
# EGEN `klassning-d0`-region, ett annat SKRIVSÄTT än codeql.yml:s (en
# tj-actions/changed-files `files: |`-block-scalar med OCITERADE rader, plus
# `!`-negerade rader som inte hör till den positiva mängden) än T1–T15:s
# fixtur (en citerad YAML-lista). Grunden till kortet: `ls scripts | grep
# -iE "klassning|changed|d0"` hittar bara detta par (check-codeql-d0-kodfri.sh
# + denna fil) — INGEN separat svit finns för `changed`-jobbets EGNA
# `should_skip_tests`/`requires_lint_by_extension`-steg (de körs bara på
# GitHub Actions-plattformen; se scripts/verify-ci-parity.mjs för den
# LOKALA, härledda motsvarigheten). T16–T18 är alltså den tvåsidiga
# klassningsbeviset AC #1/§ Krav efterfrågar, fört mot samma skript som redan
# skarpt vaktar CodeQL-ytan: en NY analyserbar fil under ci.yml:s D0-lista
# fäller (T16), en .md-fil under SAMMA lista gör det inte (T18), och en
# deklaration räcker (T17) — bevisat mot ci.yml:s FAKTISKA skrivsätt, inte en
# förenklad kopia av det. T19 bevisar att `files: |`-inledaren och
# negationsraderna ensamma (ingen positiv glob) fortfarande ger NOLL-fallet,
# inte tyst noll-poster-grönt.
#
# Test-isolering: allt sker i en temp-katalog med ett MINIMALT eget git-repo
# (grinden kör `git ls-files`, som kräver en git-kontext) samt en fristående
# workflow-fixtur — INGEN beröring av det riktiga repots .github/workflows/
# eller .codeql-d0-kodfri-policy.conf.
#
# Användning: bash scripts/test-check-codeql-d0-kodfri.sh
# Exit 0 om alla tjugoett passerar, annars 1.
#
# Källa: TASK-464.2, review runda 1 fynd 1 (warning), review runda 2
# fynd 1 (warning) + fynd 5 (info), review runda 3 fynd 2 (warning),
# review runda 4 fynd 1 (warning, förenkling — HTML-innehållsfiltret
# borttaget). T16–T19: TASK-471 (D0-klassningen är inte kodfri för ci.yml:s
# egen klassning), AC #1 + #2. T20–T21: TASK-464.4 (orkestrerarens två
# info-fynd mot #2591 runda 1) — negations-överlappet (T20) och
# markörsubsträngens andra förekomst (T21), båda tidigare otestade.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATE="${REPO_ROOT}/scripts/check-codeql-d0-kodfri.sh"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-codeql-d0-kodfri.XXXXXX")"
trap 'rm -rf "${TEST_DIR}"' EXIT

pass=0
fail=0

report() {
    local namn="${1}" vantat="${2}" faktiskt="${3}"
    if [[ "${vantat}" == "${faktiskt}" ]]; then
        printf '  ✅ %-52s exit=%s\n' "${namn}" "${faktiskt}"
        pass=$((pass + 1))
    else
        printf '  ❌ %-52s exit=%s (väntat %s)\n' "${namn}" "${faktiskt}" "${vantat}"
        fail=$((fail + 1))
    fi
}

nollstall() {
    rm -rf "${TEST_DIR:?}"
    mkdir -p "${TEST_DIR}/.github/workflows"
    (cd "${TEST_DIR}" && git init -q && git config user.email "t@t.t" && git config user.name "t")
}

# T13 — samma katalogstruktur, men INGET git-repo alls. `git ls-files` ska
# då fallera, och grinden ska pröva den exitkoden explicit i stället för
# att tolka den tomma/felande utdatan som "noll filer".
nollstall_utan_git() {
    rm -rf "${TEST_DIR:?}"
    mkdir -p "${TEST_DIR}/.github/workflows"
}

# Skriver en minimal codeql.yml-fixtur med D0-globs mellan markörerna.
skriv_workflow() {
    local start="${1:-# paritet:start klassning-codeql-d0}" slut="${2:-# paritet:slut klassning-codeql-d0}"
    {
        printf 'on:\n  pull_request:\n    paths-ignore:\n'
        printf '      %s\n' "${start}"
        printf "      - '**/*.md'\n      - 'docs/**'\n      - 'tasks/**'\n"
        printf '      %s\n' "${slut}"
    } > "${TEST_DIR}/.github/workflows/codeql.yml"
}

skriv_policy() {
    printf '%s\n' "${1}" > "${TEST_DIR}/.codeql-d0-kodfri-policy.conf"
}

# T16–T19 (TASK-471): ci.yml:s EGET skrivsätt — en tj-actions/changed-files
# `files: |`-block-scalar, OCITERADE glob-rader, plus `!`-negerade rader
# (ALDRIG en del av den positiva mängden — samma form som ci.yml:s verkliga
# nio negationer, `!package.json` m.fl.). Skiljer sig medvetet från
# skriv_workflow ovan (citerad YAML-lista, codeql.yml:s form) — de två
# funktionerna bevisar att grindens rad-tolkning bär BÅDA formaten, inte bara
# den ena.
skriv_ci_workflow() {
    local start="${1:-# paritet:start klassning-d0}" slut="${2:-# paritet:slut klassning-d0}"
    {
        printf 'jobs:\n  changed:\n    steps:\n      - uses: tj-actions/changed-files@x\n        with:\n'
        printf '          %s\n' "${start}"
        printf '          files: |\n'
        printf '            **/*.md\n            docs/**\n            tasks/**\n'
        printf '            !package.json\n            !tsconfig*.json\n'
        printf '          %s\n' "${slut}"
    } > "${TEST_DIR}/.github/workflows/ci.yml"
}

# Lägger till + committar en fil i test-repots träd, så `git ls-files` ser den.
lagg_fil() {
    local rel="${1}" innehall="${2:-// probe}"
    mkdir -p "$(dirname "${TEST_DIR}/${rel}")"
    printf '%s\n' "${innehall}" > "${TEST_DIR}/${rel}"
    (cd "${TEST_DIR}" && git add "${rel}" && git commit -q -m "add ${rel}")
}

kor() {
    (cd "${TEST_DIR}" && bash "${GATE}" >/dev/null 2>&1; echo $?)
}

# T16–T19: samma gate-binär, riktad mot ci.yml:s klassning-d0-region i
# stället för default (codeql.yml). Detta ÄR den skarpa andra konsumenten
# (ci.yml:s `lint`-jobb, se check-codeql-d0-kodfri.sh § TVÅ KONSUMENTER) —
# testet skarpkör samma tre env-variabler CI faktiskt sätter.
kor_ci() {
    (
        cd "${TEST_DIR}" \
        && CODEQL_D0_KODFRI_WORKFLOW=.github/workflows/ci.yml \
           CODEQL_D0_KODFRI_START_MARK='# paritet:start klassning-d0' \
           CODEQL_D0_KODFRI_SLUT_MARK='# paritet:slut klassning-d0' \
           bash "${GATE}" >/dev/null 2>&1
        echo $?
    )
}

# Talet i denna banner skrivs INTE ut för hand (TASK-464.4 runda 2,
# review-fynd 2 — bannern sade "nitton fall" i tre veckor efter att T20/T21
# höjde det till tjugoett; filens eget huvud varnar mot exakt den TASK-106-
# klassen, ändå glömdes DENNA rad). Det exakta antalet står bara i
# slutraden ("N gröna, N röda"), som redan räknas dynamiskt.
printf '\ntest-check-codeql-d0-kodfri\n'
printf '%.0s─' {1..70}; printf '\n'

# T1 — analyserbar fil, deklarerad.
nollstall
skriv_workflow
lagg_fil "docs/backfill/engangs.mjs"
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/backfill/engangs.mjs:::Testfixtur — engångsskript, ingen npm/workflow-referens.
"'
ec="$(kor)"
report "T1 analyserbar fil, deklarerad undantag" 0 "${ec}"

# T2 — analyserbar fil, ODEKLARERAD. DEN VIKTIGASTE POSITIVA FÄLLNINGEN.
nollstall
skriv_workflow
lagg_fil "docs/backfill/engangs.mjs"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T2 analyserbar fil, odeklarerad → fäller" 1 "${ec}"

# T3 — obehövligt undantag (filen borttagen ur trädet efteråt).
nollstall
skriv_workflow
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/backfill/borttagen.mjs:::Fanns en gång, finns inte nu.
"'
ec="$(kor)"
report "T3 obehövligt undantag → fäller" 1 "${ec}"

# T4 — inga analyserbara filer alls under D0.
nollstall
skriv_workflow
lagg_fil "docs/README.md" "# ren dokumentation"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T4 inga analyserbara filer under D0" 0 "${ec}"

# T5 — en .md-fil under D0 är per definition inte analyserbar (JS/TS-familjen).
nollstall
skriv_workflow
lagg_fil "tasks/sessions/anteckning.md" "# session"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T5 icke-analyserbar fil (.md) under D0 → grönt" 0 "${ec}"

# T6 — policy-fil saknas helt.
nollstall
skriv_workflow
lagg_fil "docs/x.mjs"
ec="$(kor)"
report "T6 policy-fil saknas" 2 "${ec}"

# T7 — start-markören saknas i workflow-fixturen.
nollstall
{
    printf 'on:\n  pull_request:\n    paths-ignore:\n'
    printf "      - '**/*.md'\n"
    printf '      # paritet:slut klassning-codeql-d0\n'
} > "${TEST_DIR}/.github/workflows/codeql.yml"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T7 start-markören saknas" 2 "${ec}"

# T8 — slut-markören saknas.
nollstall
{
    printf 'on:\n  pull_request:\n    paths-ignore:\n'
    printf '      # paritet:start klassning-codeql-d0\n'
    printf "      - '**/*.md'\n"
} > "${TEST_DIR}/.github/workflows/codeql.yml"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T8 slut-markören saknas" 2 "${ec}"

# T9 — markörerna finns men regionen är TOM (noll globs). Samma disciplin
# som check-listparitet.sh: tom mängd får aldrig tolkas som "inget att pröva".
nollstall
{
    printf 'on:\n  pull_request:\n    paths-ignore:\n'
    printf '      # paritet:start klassning-codeql-d0\n'
    printf '      # paritet:slut klassning-codeql-d0\n'
} > "${TEST_DIR}/.github/workflows/codeql.yml"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T9 NOLL globs extraherade" 2 "${ec}"

# T10 — undantags-post utan skäl.
nollstall
skriv_workflow
lagg_fil "docs/x.mjs"
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/x.mjs:::
"'
ec="$(kor)"
report "T10 undantag utan skäl" 2 "${ec}"

# T11 — HTML-fil med RENT innehåll (ingen <script>, ingen handler), under
# D0, DEKLARERAD. Bevisar att en deklaration räcker oavsett innehåll —
# grinden prövar inte LÄNGRE vad filen faktiskt innehåller (review runda 4
# fynd 1).
nollstall
skriv_workflow
lagg_fil "docs/mallar/kvitto.html" "<html><body><h1>Kvitto</h1><p>Ren statisk markup, inget skript.</p></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/mallar/kvitto.html:::Testfixtur — ren HTML, deklarerad ändå (innehåll spelar ingen roll, review runda 4 fynd 1).
"'
ec="$(kor)"
report "T11 HTML (rent innehåll), deklarerad → grönt" 0 "${ec}"

# T12 — SAMMA fixtur (rent innehåll, ingen <script>, ingen handler), men
# ODEKLARERAD. DEN VIKTIGASTE av de femton: under review runda 2/3:s
# innehållsfilter hade DENNA EXAKTA fil passerat TYST (0, inget undantag
# krävt) — nu fäller den, eftersom filändelsen ensam avgör. Detta är
# regressionsbeviset för förenklingen (Marcus mandat, review runda 4 fynd 1).
nollstall
skriv_workflow
lagg_fil "docs/mallar/kvitto.html" "<html><body><h1>Kvitto</h1><p>Ren statisk markup, inget skript.</p></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T12 HTML (rent innehåll), odeklarerad → fäller (var 0 under gamla filtret)" 1 "${ec}"

# T13 — `git ls-files` fallerar helt (ingen .git). Review runda 2 fynd 5:
# stderr/exitkod svaldes tidigare tyst, vilket hade gett "0 filer, allt
# grönt" här — nu ska anropsfel-koden användas i stället.
nollstall_utan_git
skriv_workflow
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T13 git ls-files fallerar (ingen .git) → anropsfel" 2 "${ec}"

# T14 — action.yml UTANFÖR .github/workflows/, under en D0-sökväg,
# DEKLARERAD. actions-extraktorn (codeql.github.com, GitHub Actions-raden)
# läser **/action.yml oavsett katalog, inte bara .github/workflows/.
nollstall
skriv_workflow
lagg_fil "docs/reference/mallaktioner/action.yml" $'name: x\nruns:\n  using: composite\n  steps: []\n'
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/reference/mallaktioner/action.yml:::Testfixtur — action.yml under D0, deklarerat undantag.
"'
ec="$(kor)"
report "T14 action.yml under D0, deklarerad undantag" 0 "${ec}"

# T15 — samma mönster, alternativ ändelse (.yaml), ODEKLARERAD. Review
# runda 3 fynd 2: grinden prövade tidigare ALDRIG detta filnamnsmönster —
# den nionde exceptionens grannmängd var alltid osynlig.
nollstall
skriv_workflow
lagg_fil "docs/reference/mallaktioner/action.yaml" $'name: x\nruns:\n  using: composite\n  steps: []\n'
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T15 action.yaml under D0, odeklarerad → fäller" 1 "${ec}"

# T16 — TASK-471, andra konsumenten: ci.yml:s EGET skrivsätt (files: |,
# ociterat, plus två `!`-negerade rader). Analyserbar fil under D0,
# ODEKLARERAD. DEN VIKTIGASTE av de fyra nya: bevisar att grinden fäller på
# ci.yml:s region DIREKT — inte bara på codeql.yml:s speglade kopia.
nollstall
skriv_ci_workflow
lagg_fil "docs/backfill/engangs.mjs"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor_ci)"
report "T16 ci.yml-FORM: analyserbar fil, odeklarerad → fäller" 1 "${ec}"

# T17 — SAMMA fixtur som T16, filen deklarerad. En delad undantagslista
# (samma policy-fil som T1/T2 använder) räcker för BÅDA konsumenterna.
nollstall
skriv_ci_workflow
lagg_fil "docs/backfill/engangs.mjs"
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/backfill/engangs.mjs:::Testfixtur — engångsskript, ingen npm/workflow-referens.
"'
ec="$(kor_ci)"
report "T17 ci.yml-FORM: samma fil, deklarerad → grönt" 0 "${ec}"

# T18 — ci.yml-FORM, en REN .md-fil under D0, negationsraderna oberörda.
# Tvåsidigt bevis ihop med T16: dokumentation fortsätter passera obehindrat
# på ci.yml:s EGEN region, en kodfil gör det inte.
nollstall
skriv_ci_workflow
lagg_fil "docs/README.md" "# ren dokumentation"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor_ci)"
report "T18 ci.yml-FORM: ren .md-fil under D0 → grönt" 0 "${ec}"

# T19 — ci.yml-FORM, INGA positiva globs (bara "files: |" + två
# negationsrader mellan markörerna). Samma NOLL-poster-disciplin som T9,
# bevisad mot det ANDRA skrivsättet: block-scalar-inledaren och `!`-raderna
# får inte tyst räknas som "en glob hittad".
nollstall
{
    printf 'jobs:\n  changed:\n    steps:\n      - with:\n'
    printf '          # paritet:start klassning-d0\n'
    printf '          files: |\n            !package.json\n            !tsconfig*.json\n'
    printf '          # paritet:slut klassning-d0\n'
} > "${TEST_DIR}/.github/workflows/ci.yml"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor_ci)"
report "T19 ci.yml-FORM: NOLL positiva globs (bara negationer)" 2 "${ec}"

# T20 (TASK-464.4, orkestrerarens info-fynd #1 mot #2591 runda 1) —
# ÖVERLAPPET: en `!`-negerad rad vars sökväg FALLER INNANFÖR en positiv
# glob, på en fil med analyserbar ändelse. Radtolkaren (§ Extrahera D0-globs
# live i check-codeql-d0-kodfri.sh) HOPPAR negerade rader helt i stället för
# att applicera dem som undantag från de positiva globerna — i dagens
# VERKLIGA ci.yml är det fail-safe (ingen av de nio negationerna ligger
# under en D0-katalog), men det var OTESTAT: inget fall bevisade vad som
# händer när en negation FAKTISKT överlappar. Beslutet, uttryckligt: en
# överlappad, negerad fil räknas ÄNDÅ som en träff (grinden ignorerar
# negationen, i stället för att dra bort den) — en SÄKER superset av
# ci.yml:s verkliga D0-mängd (ci.yml:s egen `should_skip_tests` skulle
# klassa filen som KOD via negationen och köra full svit på den; grinden
# här är strängare, aldrig slappare, vilket är rätt riktning för en
# säkerhetsangränsande vakt). Fixturen: `docs/**` (positiv) + `!docs/x/
# probe.ts` (negation som överlappar den positiva globen) + filen faktiskt
# skapad på just den sökvägen.
nollstall
{
    printf 'jobs:\n  changed:\n    steps:\n      - with:\n'
    printf '          # paritet:start klassning-d0\n'
    printf '          files: |\n            **/*.md\n            docs/**\n'
    printf '            !docs/x/probe.ts\n'
    printf '          # paritet:slut klassning-d0\n'
} > "${TEST_DIR}/.github/workflows/ci.yml"
lagg_fil "docs/x/probe.ts"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor_ci)"
report "T20 negation ÖVERLAPPAR positiv glob → räknas ändå som träff (säker superset)" 1 "${ec}"

# T21 (TASK-464.4, orkestrerarens info-fynd #2 mot #2591 runda 1) —
# MARKÖRSTRÄNGARNA FÖREKOMMER EN ANDRA GÅNG i ci.yml, som env-VÄRDEN till
# CODEQL_D0_KODFRI_START_MARK/_SLUT_MARK (rad ~1085–1086 i det RIKTIGA
# ci.yml). Ett `index($0, s)`-uttryck utan ankring hade träffat den formen
# lika villigt som den RIKTIGA markören — det fungerade tidigare BARA för
# att den riktiga regionen alltid stod FÖRE env-raderna i filen. Denna
# fixtur kastar om ordningen: de FÖRVIRRANDE env-raderna (som INNEHÅLLER
# markörsubsträngen men inte ÄR markören) står FÖRE den riktiga
# `files: |`-regionen. Ankrad matchning (§ MARKÖRMATCHNINGEN, check-codeql-
# d0-kodfri.sh) hittar ändå RÄTT region och fäller på den odeklarerade
# analyserbara filen; ett oankrat `index()` hade i stället låst fast `f` på
# den FÖRSTA förvirrande raden och `exit`:at på den ANDRA (ingenting
# däremellan) — NOLL globs extraherade, exit 2, aldrig den riktiga
# klassningen.
nollstall
{
    printf "jobs:\n  lint:\n    steps:\n      - env:\n"
    printf "          CODEQL_D0_KODFRI_START_MARK: '# paritet:start klassning-d0'\n"
    printf "          CODEQL_D0_KODFRI_SLUT_MARK: '# paritet:slut klassning-d0'\n"
    printf '  changed:\n    steps:\n      - uses: tj-actions/changed-files@x\n        with:\n'
    printf '          # paritet:start klassning-d0\n'
    printf '          files: |\n            **/*.md\n            docs/**\n'
    printf '          # paritet:slut klassning-d0\n'
} > "${TEST_DIR}/.github/workflows/ci.yml"
lagg_fil "docs/backfill/engangs.mjs"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor_ci)"
report "T21 markörsubsträng FÖRE riktiga regionen (ankrad matchning) → fäller ändå rätt" 1 "${ec}"

printf '%.0s─' {1..70}; printf '\n'
printf '  %d gröna, %d röda\n\n' "${pass}" "${fail}"
[[ "${fail}" -eq 0 ]] || exit 1
exit 0
