#!/usr/bin/env bash
#
# test-check-codeql-d0-kodfri.sh — self-test för check-codeql-d0-kodfri.sh.
#
# TIO FALL. Grinden är billig att göra grön och det bevisar ingenting; varje
# fall nedan finns för att bevisa att den FÄLLER när den ska, eller att den
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
#
# T3 är det viktigaste fallet: ett kvarliggande undantag för en fil som inte
# längre matchar maskerar nästa drift på samma post — samma disciplin som
# check-listparitet.sh:s T7.
#
# Test-isolering: allt sker i en temp-katalog med ett MINIMALT eget git-repo
# (grinden kör `git ls-files`, som kräver en git-kontext) samt en fristående
# workflow-fixtur — INGEN beröring av det riktiga repots .github/workflows/
# eller .codeql-d0-kodfri-policy.conf.
#
# Användning: bash scripts/test-check-codeql-d0-kodfri.sh
# Exit 0 om alla tio passerar, annars 1.
#
# Källa: TASK-464.2, review runda 1 fynd 1 (warning).

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

printf '\ntest-check-codeql-d0-kodfri — tio fall\n'
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

printf '%.0s─' {1..70}; printf '\n'
printf '  %d gröna, %d röda\n\n' "${pass}" "${fail}"
[[ "${fail}" -eq 0 ]] || exit 1
exit 0
