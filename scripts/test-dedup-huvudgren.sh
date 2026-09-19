#!/usr/bin/env bash
# scripts/test-dedup-huvudgren.sh
#
# Empirisk test-suite för scripts/dedup-huvudgren.sh (TASK-464.4/SE1).
#
# Ett scenario per gren i mekaniken, båda riktningarna. Det exakta antalet
# gröna kontroller står i skriptets EGEN slutrad ("── Resultat: N passerade
# ──") — skriv aldrig av ett tal hit för hand (TASK-106-klassen).
#
#   T1  event != push (t.ex. pull_request)                        → false
#   T2  körnings-API-fel (`run list --event merge_group`)          → false
#   T3  noll gröna merge_group-körningar på SHA:t                  → false
#   T4  FLERA gröna merge_group-körningar på SAMMA SHA (tvetydigt) → false (AC#2)
#   T5  commits-API-fel vid förälder-uppslag                       → false
#   T6  förälder tom sträng                                        → false
#   T7  kö-grenens bas-suffix != SHA:ts första förälder             → false
#   T8  jobblist-fel (`run view --json jobs`)                       → false
#   T9  'Test suite' SAKNAS (inner-jobb) ⇒ sviten KÖRDE och var grön → true  (HIT, AC#1)
#   T10 'Test suite' NÄRVARANDE, conclusion=skipped (FÄLLAN, AC#1)   → false (grön MEN hoppad)
#   T11 'Test suite' NÄRVARANDE, oväntad conclusion (failure)        → false
#   T12 användningsfel (saknat SHA)                                 → exit 2
#   T13 användningsfel (saknad REPO)                                → exit 2
#   T14 KOPPLINGSGRINDEN — se nedan
#   T15 WIRING — ci.yml:s dedup-steg anropar faktiskt detta skript
#
# T9/T10 ÄR AC#1:S KONTRASTPAR I STUBBFORM — samma binära distinktion som är
# skarpt bevisad mot verkliga körningar (se nedan). FÄLLAN uppdraget namnger
# ordagrant ("villkoret får ALDRIG vara 'körningen är grön'") är T10: en
# merge_group-körning med conclusion=success DÄR 'Test suite' ändå är
# NÄRVARANDE (alltså skippad, D0-liknande kö-post) måste ge dedup_hit=false.
#
# ═══ SKARPT KONTRASTPAR (AC#1), MOT VERKLIGA KÖRNINGAR — INTE STUBBAT ═══
# Mätt 2026-09-19 mot detta repos faktiska historik (`gh run view`, ingen
# stub):
#   e845dfab180ef699b6a78343449ddbc0fe82748b (PR #2587, docs-landning,
#     ADR-133) → merge_group-körning 35444926324, conclusion=success, MEN
#     'Test suite' NÄRVARANDE med conclusion=skipped ⇒ dedup_hit=false.
#     Detta skript svarar EXAKT det på detta SHA — se PR-beskrivningen för
#     körningsutdata.
#   6eef96de04824644d8bb1400def9c6a804ff07a8 (PR #2590, kod-landning,
#     TASK-467) → merge_group-körning 35444969679, conclusion=success,
#     'Test suite' SAKNAS (expanderat till inner-jobb, samtliga gröna)
#     ⇒ dedup_hit=true. Detta skript svarar EXAKT det på detta SHA.
# Samma två SHA:n, samma dag, samma repo — TVÅSIDIGHETSBEVISET som n=1-
# stubben ovan inte ensam kan bära (stubben bevisar LOGIKEN, inte att den
# möter verkligheten — samma STUBBENS GRÄNS-lärdom som scripts/test-ci-
# wait.sh, S91, och scripts/classify-post-merge.sh redan bär).
#
# ═══ STUBBENS GRÄNS ═══
# Stubben kör skriptets EGNA `--jq`-uttryck genom riktiga jq mot JSON i
# API:ts form — inte förberedda svarssträngar. Ett jq-uttrycksfel fångas
# därför här, inte först i CI.
#
# Test-isolering: /tmp/task-464-4-test-dedup/ med en gh-stub på PATH.
# Återställer via trap. INGEN nätverkstrafik.
#
# Användning: bash scripts/test-dedup-huvudgren.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: backlog TASK-464.4 · ADR-039 § lesson→grind (L43)
# Etablerad: Session 126 (2026-09-19)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/task-464-4-test-dedup"
GATE_SRC="${REPO_ROOT}/scripts/dedup-huvudgren.sh"

MERGE_SHA="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PARENT_SHA="cccccccccccccccccccccccccccccccccccccccc"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/bin" "${TEST_DIR}/lib"
    cp "${GATE_SRC}" "${TEST_DIR}/dedup.sh"
    chmod +x "${TEST_DIR}/dedup.sh"
    cp "${REPO_ROOT}/scripts/lib/ci-suite-job-name.sh" "${TEST_DIR}/lib/"
    cp "${REPO_ROOT}/scripts/lib/svit-signal.sh" "${TEST_DIR}/lib/"

    # gh-stub. Scenariot styrs av miljövariabler:
    #   GH_RUNLIST_JSON  API-svar för `gh run list --event merge_group`
    #   GH_COMMIT_JSON   API-svar för `gh api repos/…/commits/<sha>`
    #   GH_RUNVIEW_JSON  API-svar för `gh run view --json jobs`
    #   GH_FAIL_ON       vilket anrop som ska ge exit 1:
    #                    runlist | commit_parent | runview
    #   GH_CALL_LOG      fil dit varje anrops argument loggas
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail

printf '%s\n' "$*" >> "${GH_CALL_LOG:-/dev/null}"

fail_on="${GH_FAIL_ON:-}"

jq_expr=""
prev=""
for a in "$@"; do
    if [[ "${prev}" == "--jq" ]]; then
        jq_expr="${a}"
    fi
    prev="${a}"
done

sub="${1:-}"
case "${sub}" in
    run)
        case "${2:-}" in
            list)
                [[ "${fail_on}" == "runlist" ]] && exit 1
                printf '%s' "${GH_RUNLIST_JSON:-[]}" | jq -r "${jq_expr}"
                exit $?
                ;;
            view)
                [[ "${fail_on}" == "runview" ]] && exit 1
                printf '%s' "${GH_RUNVIEW_JSON:-{\}}" | jq -r "${jq_expr}"
                exit $?
                ;;
            *)
                exit 1
                ;;
        esac
        ;;
    api)
        [[ "${fail_on}" == "commit_parent" ]] && exit 1
        printf '%s' "${GH_COMMIT_JSON:-{\}}" | jq -r "${jq_expr}"
        exit $?
        ;;
    *)
        exit 1
        ;;
esac
STUB
    chmod +x "${TEST_DIR}/bin/gh"
}

# Standardscenario: EN grön merge_group-körning, kö-basen matchar, sviten
# KÖRDE (Test suite saknas ⇒ HIT). Enskilda test skriver över delar.
scenario_defaults() {
    export GH_RUNLIST_JSON="[{\"databaseId\":7777,\"status\":\"completed\",\"conclusion\":\"success\",\"headBranch\":\"gh-readonly-queue/main/pr-99-${PARENT_SHA}\"}]"
    export GH_COMMIT_JSON="{\"parents\":[{\"sha\":\"${PARENT_SHA}\"}]}"
    export GH_RUNVIEW_JSON='{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Test suite / Pure + Build","conclusion":"success"}]}'
    export GH_FAIL_ON=""
    export GH_CALL_LOG="${TEST_DIR}/calls.log"
    : > "${GH_CALL_LOG}"
}

# run_case <namn> <förväntad dedup_hit> [sha] [event] — kör skriptet under stubben.
run_case() {
    local namn="$1" forvantat="$2" sha="${3:-${MERGE_SHA}}" event="${4:-push}"
    local ut faktiskt
    ut=$(PATH="${TEST_DIR}/bin:${PATH}" REPO="ett/repo" \
        EVENT_NAME="${event}" bash "${TEST_DIR}/dedup.sh" "${sha}" 2>&1)
    faktiskt=$(printf '%s' "${ut}" | sed -n 's/^dedup_hit=\([a-z]*\).*/\1/p' | head -1)
    if [[ "${faktiskt}" == "${forvantat}" ]]; then
        echo "  ✅ ${namn}: dedup_hit=${faktiskt}"
        PASSED=$(( PASSED + 1 ))
    else
        echo "  ❌ ${namn}: förväntat dedup_hit=${forvantat}, fick '${faktiskt}'"
        echo "     utdata: ${ut}"
        FAILED=$(( FAILED + 1 ))
    fi
}

pass() { echo "  ✅ $1"; PASSED=$(( PASSED + 1 )); }
fel() { echo "  ❌ $1"; FAILED=$(( FAILED + 1 )); }

setup

echo "── T1–T11: kärnmekaniken ──"

scenario_defaults
run_case "T1 event != push" "false" "${MERGE_SHA}" "pull_request"

scenario_defaults
export GH_FAIL_ON="runlist"
run_case "T2 körnings-API-fel (run list)" "false"

scenario_defaults
export GH_RUNLIST_JSON="[]"
run_case "T3 noll gröna merge_group-körningar" "false"

scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":7777,\"status\":\"completed\",\"conclusion\":\"success\",\"headBranch\":\"gh-readonly-queue/main/pr-99-${PARENT_SHA}\"},{\"databaseId\":8888,\"status\":\"completed\",\"conclusion\":\"success\",\"headBranch\":\"gh-readonly-queue/main/pr-100-${PARENT_SHA}\"}]"
run_case "T4 flera gröna körningar på samma SHA (tvetydigt, AC#2)" "false"

scenario_defaults
export GH_FAIL_ON="commit_parent"
run_case "T5 commits-API-fel vid förälder-uppslag" "false"

scenario_defaults
export GH_COMMIT_JSON='{"parents":[]}'
run_case "T6 förälder tom (ingen andra part i .parents[0])" "false"

scenario_defaults
export GH_COMMIT_JSON="{\"parents\":[{\"sha\":\"ddddddddddddddddddddddddddddddddddddddd\"}]}"
run_case "T7 kö-grenens bas != SHA:ts första förälder" "false"

scenario_defaults
export GH_FAIL_ON="runview"
run_case "T8 jobblist-fel (run view --json jobs)" "false"

scenario_defaults
run_case "T9 'Test suite' saknas ⇒ sviten KÖRDE och var grön (HIT)" "true"

scenario_defaults
export GH_RUNVIEW_JSON='{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Test suite","conclusion":"skipped"}]}'
run_case "T10 'Test suite' skippad TROTS grön kö-körning (FÄLLAN, AC#1)" "false"

scenario_defaults
export GH_RUNVIEW_JSON='{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Test suite","conclusion":"failure"}]}'
run_case "T11 'Test suite' oväntad conclusion (failure)" "false"

echo "── T12–T13: användningsfel ──"

set +e
PATH="${TEST_DIR}/bin:${PATH}" REPO="ett/repo" bash "${TEST_DIR}/dedup.sh" >/dev/null 2>&1
t12_kod=$?
set -e
if [[ "${t12_kod}" -eq 2 ]]; then
    pass "T12 saknat SHA-argument → exit 2"
else
    fel "T12 saknat SHA-argument gav exit ${t12_kod}, väntat 2"
fi

set +e
PATH="${TEST_DIR}/bin:${PATH}" REPO="" bash "${TEST_DIR}/dedup.sh" "${MERGE_SHA}" >/dev/null 2>&1
t13_kod=$?
set -e
if [[ "${t13_kod}" -eq 2 ]]; then
    pass "T13 saknad REPO → exit 2"
else
    fel "T13 saknad REPO gav exit ${t13_kod}, väntat 2"
fi

# --- T14: KOPPLINGSGRINDEN ----------------------------------------------------
# Samma mönster som scripts/test-classify-post-merge.sh T13a — LÄSER nu ur
# den DELADE libben (scripts/lib/ci-suite-job-name.sh), inte ur GATE_SRC.
echo "── T14: kopplingen till ci.yml ──"
CI_YML="${REPO_ROOT}/.github/workflows/ci.yml"
CI_SUITE_JOB_NAME_LIB="${REPO_ROOT}/scripts/lib/ci-suite-job-name.sh"

skript_namn=$(sed -n 's/^CI_SUITE_JOB_NAME="\(.*\)"$/\1/p' "${CI_SUITE_JOB_NAME_LIB}" | head -1)
ci_namn=$(awk '/^  suite:/{f=1;next} f&&/^    name: /{sub(/^    name: /,"");print;exit}' "${CI_YML}")

if [[ -z "${skript_namn}" ]]; then
    fel "T14a kunde inte läsa CI_SUITE_JOB_NAME ur ${CI_SUITE_JOB_NAME_LIB}"
elif [[ -z "${ci_namn}" ]]; then
    fel "T14a kunde inte läsa suite-jobbets name: ur ci.yml"
elif [[ "${skript_namn}" == "${ci_namn}" ]]; then
    pass "T14a CI_SUITE_JOB_NAME ('${skript_namn}') == ci.yml:s suite-jobbnamn"
else
    fel "T14a KOPPLINGSDRIFT: libben säger '${skript_namn}', ci.yml:s suite-jobb heter '${ci_namn}'."
fi

# --- T15: WIRING --------------------------------------------------------------
# Mönstret från T13b (scripts/test-classify-post-merge.sh): ankra på ett
# faktiskt `run:`-steg, ALDRIG på filnamnet som lös substräng (denna filens
# eget filhuvud nämner "scripts/dedup-huvudgren.sh", vilket hade gjort ett
# löst `grep -q` fail-open mot ett borttaget anrop).
if grep -qE '^[[:space:]]+run: bash scripts/dedup-huvudgren\.sh' "${CI_YML}"; then
    pass "T15 ci.yml kör faktiskt scripts/dedup-huvudgren.sh"
else
    fel "T15 ci.yml har inget 'run: bash scripts/dedup-huvudgren.sh'-steg — dedupen är frånkopplad."
fi

echo ""
echo "── Resultat: ${PASSED} passerade, ${FAILED} failade ──"
[[ "${FAILED}" -eq 0 ]]
