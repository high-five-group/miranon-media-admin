#!/usr/bin/env bash
#
# test-check-codeql-d0-kodfri.sh — self-test för check-codeql-d0-kodfri.sh.
#
# TJUGOTRE FALL. Grinden är billig att göra grön och det bevisar ingenting;
# varje fall nedan finns för att bevisa att den FÄLLER när den ska, eller att
# den vägrar uttala sig när den inte kan läsa det den ska pröva.
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
#   T11 HTML MED <script>-block, odeklarerad                  → 1
#   T12 HTML UTAN kod (varken script eller handler)            → 0 (tyst, inget undantag krävs)
#   T13 HTML med inline-händelsehanterare (onclick=)           → 1
#   T14 git ls-files fallerar (ingen .git alls)                → 2
#   T15 HTML <SCRIPT> VERSAL tagg, odeklarerad                 → 1 (case-insensitive)
#   T16 HTML javascript:-URI, odeklarerad                      → 1 (javascript:-fix)
#   T17 HTML ONCLICK= VERSALT attribut, odeklarerad            → 1 (case-insensitive)
#   T18 HTML attribut på egen rad, inget eget mellanslag       → 1 (radbrytnings-fix)
#   T19 HTML binär/ogiltig UTF-8, odeklarerad                  → 1 (fail-closed)
#   T20 action.yml UTANFÖR .github/workflows/, deklarerad      → 0
#   T21 action.yaml UTANFÖR .github/workflows/, ODEKLARERAD    → 1
#   T22 matrisspråk KÄNDA (javascript-typescript+actions)      → 0 (regression)
#   T23 matrisspråk med ETT okänt språk ('python')              → 2 (matris-vakt)
#
# T3 är det viktigaste fallet av de ursprungliga tio: ett kvarliggande
# undantag för en fil som inte längre matchar maskerar nästa drift på samma
# post — samma disciplin som check-listparitet.sh:s T7.
#
# T12 är det viktigaste av review runda 2:s fyra nya fall: bevisar att
# LAGER 2 (innehållsfiltret) faktiskt håller grinden TYST på ren HTML i
# stället för att dränka varje docs/mallar/-fil i onödiga undantag. T14 är
# det NÄST viktigaste: review runda 2 fynd 5 — ett `git ls-files`-fel fick
# tidigare tolkas som "noll filer, allt grönt" (fail-open); nu ska SAMMA fel
# ge anropsfel-koden.
#
# T15–T19 är review runda 3 fynd 1: samtliga fem är BEVISADE BYPASSER mot
# runda 2:s version av LAGER 2 (körda mot den gamla `grep -qE` UTAN `-i`,
# utan javascript:-mönster, rad-för-rad — varje fall gav "NOT MATCHED" innan
# fixen). T20–T21 är review runda 3 fynd 2: samma "D0 = kodfritt"-premiss
# som redan fallit två gånger (§ ANALYSERBARHET) föll en TREDJE gång på
# `actions`-språket — grinden prövade det ALDRIG förut. T22–T23 bevisar att
# den nya matris-vakten (§ SPRÅKMATRISEN) varken stör det KÄNDA fallet
# (T22) eller missar det OKÄNDA (T23) — den viktigaste av de två är T23:
# den är just det test instruktionen krävde ("fäller om codeql.yml:s
# språkmatris innehåller ett språk tabellen/vakten inte känner").
#
# Test-isolering: allt sker i en temp-katalog med ett MINIMALT eget git-repo
# (grinden kör `git ls-files`, som kräver en git-kontext) samt en fristående
# workflow-fixtur — INGEN beröring av det riktiga repots .github/workflows/
# eller .codeql-d0-kodfri-policy.conf.
#
# Användning: bash scripts/test-check-codeql-d0-kodfri.sh
# Exit 0 om alla tjugotre passerar, annars 1.
#
# Källa: TASK-464.2, review runda 1 fynd 1 (warning), review runda 2
# fynd 1 (warning) + fynd 5 (info), review runda 3 fynd 1 (warning) +
# fynd 2 (warning).

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

# T14 — samma katalogstruktur, men INGET git-repo alls. `git ls-files` ska
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

printf '\ntest-check-codeql-d0-kodfri — tjugotre fall\n'
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

# T9 — markörerna finns men regionen är TOM (noll globs). Samma T14-disciplin
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

# T11 — HTML-fil MED <script>-block, odeklarerad. Bevisar LAGER 2 fångar
# den typ av fil review runda 2 fynd 1 visade att LAGER 1 (ändelse-listan)
# ensam missade helt (docs/design/farg-atlas.html i det verkliga trädet).
nollstall
skriv_workflow
lagg_fil "docs/design/atlas.html" "<html><body><script>console.log('x');</script></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T11 HTML med <script>, odeklarerad → fäller" 1 "${ec}"

# T12 — HTML-fil UTAN kod (ren statisk markup). DEN VIKTIGASTE av de fyra
# nya fallen: bevisar att grinden är TYST på vanlig dokumentations-HTML i
# stället för att dränka varje docs/mallar/-fil i onödiga undantag.
nollstall
skriv_workflow
lagg_fil "docs/mallar/kvitto.html" "<html><body><h1>Kvitto</h1><p>Ren statisk markup.</p></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T12 HTML utan kod → tyst grönt, inget undantag krävs" 0 "${ec}"

# T13 — HTML-fil utan <script> men med en inline-händelsehanterare. Samma
# LAGER 2-mekanik, andra signalen (onXxx=-attribut i stället för <script>).
nollstall
skriv_workflow
lagg_fil "docs/design/knapp.html" "<html><body><button onclick=\"alert('x')\">Klicka</button></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T13 HTML med inline-händelsehanterare → fäller" 1 "${ec}"

# T14 — `git ls-files` fallerar helt (ingen .git). Review runda 2 fynd 5:
# stderr/exitkod svaldes tidigare tyst, vilket hade gett "0 filer, allt
# grönt" här — nu ska anropsfel-koden användas i stället.
nollstall_utan_git
skriv_workflow
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T14 git ls-files fallerar (ingen .git) → anropsfel" 2 "${ec}"

# T15 — HTML <SCRIPT> med VERSAL tagg. Review runda 2:s filter körde
# `grep -qE` UTAN `-i` — bevisad bypass (§ header). Nu skiftlägesokänsligt.
nollstall
skriv_workflow
lagg_fil "docs/design/upper.html" "<html><body><SCRIPT>alert(1)</SCRIPT></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T15 HTML <SCRIPT> versal tagg, odeklarerad → fäller" 1 "${ec}"

# T16 — HTML med en javascript:-URI, INGEN <script>-tagg och INGET
# onXxx=-attribut. Review runda 3 fynd 1: helt osynligt för runda 2:s ERE.
nollstall
skriv_workflow
lagg_fil "docs/design/jsuri.html" "<html><body><a href=\"javascript:alert(1)\">x</a></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T16 HTML javascript:-URI, odeklarerad → fäller" 1 "${ec}"

# T17 — HTML med VERSALT ONCLICK=-attribut. Samma case-känslighets-bypass
# som T15, andra formen (attribut i stället för tagg).
nollstall
skriv_workflow
lagg_fil "docs/design/upperattr.html" "<html><body><button ONCLICK=\"alert(1)\">x</button></body></html>"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T17 HTML ONCLICK= versalt attribut, odeklarerad → fäller" 1 "${ec}"

# T18 — attribut på EGEN RAD utan eget inledande mellanslag. grep:s
# rad-för-rad-läsning gjorde detta till en tyst bypass mot runda 2:s
# version ('onclick="..."' står då först på sin rad, ingen [[:space:]]
# direkt före "on" INOM den raden). Radbrytnings-plattningen fixar det.
nollstall
skriv_workflow
lagg_fil "docs/design/flerrad.html" $'<html><body><button\nonclick="alert(1)">x</button></body></html>'
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T18 HTML attribut på egen rad utan mellanslag, odeklarerad → fäller" 1 "${ec}"

# T19 — HTML-familjefil som inte går att läsa som giltig text (binär/
# ogiltig UTF-8, innehåller ett NUL-byte). FAIL-CLOSED (review runda 3
# fynd 1): grinden kan inte bevisa frånvaro av kod och räknar filen som
# analyserbar, trots att INGET av HTML_KOD_ERE:s läsbara mönster syns.
nollstall
skriv_workflow
mkdir -p "${TEST_DIR}/docs/design"
printf '\x00\x01<html><body>brus</body></html>' > "${TEST_DIR}/docs/design/binart.html"
(cd "${TEST_DIR}" && git add docs/design/binart.html && git commit -q -m "add binart.html")
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T19 binär/ogiltig HTML (fail-closed), odeklarerad → fäller" 1 "${ec}"

# T20 — action.yml UTANFÖR .github/workflows/, under en D0-sökväg,
# DEKLARERAD. actions-extraktorn (codeql.github.com, GitHub Actions-raden)
# läser **/action.yml oavsett katalog, inte bara .github/workflows/.
nollstall
skriv_workflow
lagg_fil "docs/reference/mallaktioner/action.yml" $'name: x\nruns:\n  using: composite\n  steps: []\n'
skriv_policy 'CODEQL_D0_UNDANTAG="
docs/reference/mallaktioner/action.yml:::Testfixtur — action.yml under D0, deklarerat undantag.
"'
ec="$(kor)"
report "T20 action.yml under D0, deklarerad undantag" 0 "${ec}"

# T21 — samma mönster, alternativ ändelse (.yaml), ODEKLARERAD. Review
# runda 3 fynd 2: grinden prövade tidigare ALDRIG detta filnamnsmönster —
# den nionde exceptionens grannmängd var alltid osynlig.
nollstall
skriv_workflow
lagg_fil "docs/reference/mallaktioner/action.yaml" $'name: x\nruns:\n  using: composite\n  steps: []\n'
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T21 action.yaml under D0, odeklarerad → fäller" 1 "${ec}"

# T22 — codeql.yml:s matris bär BARA kända språk (javascript-typescript +
# actions). Bevisar att den nya matris-vakten inte stör det normala,
# förväntade fallet.
nollstall
{
    printf 'on:\n  pull_request:\n    paths-ignore:\n'
    printf '      # paritet:start klassning-codeql-d0\n'
    printf "      - '**/*.md'\n      - 'docs/**'\n      - 'tasks/**'\n"
    printf '      # paritet:slut klassning-codeql-d0\n'
    printf 'jobs:\n  analyze:\n    strategy:\n      matrix:\n        include:\n'
    printf '          - language: javascript-typescript\n'
    printf '            build-mode: none\n'
    printf '          - language: actions\n'
    printf '            build-mode: none\n'
} > "${TEST_DIR}/.github/workflows/codeql.yml"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T22 matrisspråk kända (javascript-typescript+actions) → grönt" 0 "${ec}"

# T23 — codeql.yml:s matris bär ETT språk vakten inte känner ('python').
# DEN VIKTIGASTE av de nya fallen: exakt det scenario instruktionen
# efterfrågade ("fäller om språkmatrisen innehåller ett språk tabellen/
# vakten inte känner") — bevisar att premissen inte kan falla en FJÄRDE
# gång tyst.
nollstall
{
    printf 'on:\n  pull_request:\n    paths-ignore:\n'
    printf '      # paritet:start klassning-codeql-d0\n'
    printf "      - '**/*.md'\n"
    printf '      # paritet:slut klassning-codeql-d0\n'
    printf 'jobs:\n  analyze:\n    strategy:\n      matrix:\n        include:\n'
    printf '          - language: javascript-typescript\n'
    printf '            build-mode: none\n'
    printf '          - language: python\n'
    printf '            build-mode: none\n'
} > "${TEST_DIR}/.github/workflows/codeql.yml"
skriv_policy 'CODEQL_D0_UNDANTAG=""'
ec="$(kor)"
report "T23 okänt matrisspråk ('python') → anropsfel" 2 "${ec}"

printf '%.0s─' {1..70}; printf '\n'
printf '  %d gröna, %d röda\n\n' "${pass}" "${fail}"
[[ "${fail}" -eq 0 ]] || exit 1
exit 0
