#!/usr/bin/env bash
# scripts/test-svit-signal.sh
#
# Litet, EGET test för scripts/lib/svit-signal.sh:s las_svit_signal()
# (TASK-464.4 runda 2, review-fynd 1) — separat från de två konsumenternas
# egna sviter (test-classify-post-merge.sh, test-dedup-huvudgren.sh), som
# bara prövar signalen INDIREKT genom respektive skripts tolkning. Denna
# svit prövar SIGNALEN SJÄLV: sju möjliga utfall, ett fall vardera.
#
#   T1 paraplyjobbet finns, conclusion=skipped        → SKIPPED:skipped
#   T2 paraplyjobbet finns, conclusion=failure        → SKIPPED:failure
#   T3 inre jobb finns, minst ett success, inget dåligt → RUN
#   T4 inre jobb finns (blandat success+skipped, t.ex.
#      Staging/A11y som ALLTID är skipped där)         → RUN (skipped TILLÅTET)
#   T5 varken paraplyjobb eller inre jobb i listan      → OKAND:tomt
#   T6 inre jobb finns, men INGET har success           → OKAND:inga-lyckade
#   T7 inre jobb finns, ett har en konklusion utanför
#      {success, skipped} (t.ex. failure)               → OKAND:ovantad-konklusion
#   T8 gh run view svarar inte                          → API_FEL
#
# T5 ÄR DEN SKARPA BUGGEN (runda 2 review-fynd 1): ett SAKNAT jobb med
# namnet CI_SUITE_JOB_NAME tolkades TIDIGARE som RUN rakt av — sant när
# anropet expanderat till inre jobb, men EXAKT samma tomma träff uppstår om
# "Test suite" döps om i ci.yml utan att scripts/lib/ci-suite-job-name.sh
# följer med. T5:s fixtur (en helt OFÖRVANT jobbnamn, varken paraplyjobbets
# eller något prefixat inre jobb) är just den situationen — se
# scripts/test-dedup-huvudgren.sh T16 för samma scenario genom en
# konsument, tvåsidigt mutationstestat mot den GAMLA koden där.
#
# Test-isolering: /tmp/test-svit-signal/ med en gh-stub på PATH. INGEN
# nätverkstrafik, inget riktigt gh-anrop.
#
# Användning: bash scripts/test-svit-signal.sh
# Exit 0 om alla åtta passerar, annars 1.
#
# Källa: TASK-464.4 runda 2 (orkestrerarens review-fynd 1, PR #2598)
# Etablerad: Session 126 (2026-09-19)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-svit-signal.XXXXXX")"
trap 'rm -rf "${TEST_DIR}"' EXIT

mkdir -p "${TEST_DIR}/bin"

# gh-stub: enda subkommandot som behövs är `run view --json jobs --jq …`.
# Stubben kör det RIKTIGA --jq-uttrycket mot fixtur-JSON i API:ts form.
cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
[[ "${GH_FAIL:-}" == "1" ]] && exit 1
jq_expr=""
prev=""
for a in "$@"; do
    [[ "${prev}" == "--jq" ]] && jq_expr="${a}"
    prev="${a}"
done
printf '%s' "${GH_JOBS_JSON:-{\"jobs\":[]\}}" | jq -r "${jq_expr}"
STUB
chmod +x "${TEST_DIR}/bin/gh"

PASSED=0
FAILED=0

kor() {
    PATH="${TEST_DIR}/bin:${PATH}" REPO="ett/repo" CI_SUITE_JOB_NAME="Test suite" bash -c '
        source "'"${REPO_ROOT}"'/scripts/lib/svit-signal.sh"
        las_svit_signal "123"
    '
}

fall() {
    local namn="$1" vantat="$2" fixtur="$3" gh_fail="${4:-0}"
    export GH_JOBS_JSON="${fixtur}"
    export GH_FAIL="${gh_fail}"
    local ut
    ut="$(kor)"
    if [[ "${ut}" == "${vantat}" ]]; then
        echo "  ✅ ${namn}: ${ut}"
        PASSED=$(( PASSED + 1 ))
    else
        echo "  ❌ ${namn}: förväntat '${vantat}', fick '${ut}'"
        FAILED=$(( FAILED + 1 ))
    fi
}

printf '\ntest-svit-signal — åtta fall\n'
printf '%.0s─' {1..60}; printf '\n'

fall "T1 paraplyjobbet, conclusion=skipped" "SKIPPED:skipped" \
    '{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Test suite","conclusion":"skipped"}]}'

fall "T2 paraplyjobbet, conclusion=failure" "SKIPPED:failure" \
    '{"jobs":[{"name":"Test suite","conclusion":"failure"}]}'

fall "T3 ett inre jobb, success, inget dåligt" "RUN" \
    '{"jobs":[{"name":"Test suite / Pure + Build","conclusion":"success"}]}'

fall "T4 blandat success+skipped (Staging/A11y-formen) ⇒ RUN" "RUN" \
    '{"jobs":[{"name":"Test suite / Pure + Build","conclusion":"success"},{"name":"Test suite / Acceptance (hermetisk) (1)","conclusion":"success"},{"name":"Test suite / Staging (API + E2E)","conclusion":"skipped"},{"name":"Test suite / A11y (axe-runner)","conclusion":"skipped"}]}'

fall "T5 varken paraplyjobb eller inre jobb (omdöpt namn) ⇒ OKAND:tomt" "OKAND:tomt" \
    '{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Full svit (omdöpt, EJ Test suite)","conclusion":"skipped"}]}'

fall "T6 inre jobb finns, inget success ⇒ OKAND:inga-lyckade" "OKAND:inga-lyckade" \
    '{"jobs":[{"name":"Test suite / Staging (API + E2E)","conclusion":"skipped"},{"name":"Test suite / A11y (axe-runner)","conclusion":"skipped"}]}'

fall "T7 inre jobb med failure bland i övrigt lyckade ⇒ OKAND:ovantad-konklusion" "OKAND:ovantad-konklusion" \
    '{"jobs":[{"name":"Test suite / Pure + Build","conclusion":"success"},{"name":"Test suite / Acceptance (hermetisk) (1)","conclusion":"failure"}]}'

fall "T8 gh run view svarar inte ⇒ API_FEL" "API_FEL" '{}' "1"

printf '%.0s─' {1..60}; printf '\n'
printf '  %d gröna, %d röda\n\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]]
