#!/usr/bin/env bash
# scripts/test-ci-wait.sh
#
# Empirisk test-suite för scripts/ci-wait.sh (S87 städ-vågen).
# 11 testfall:
#   T1  terminal-kontroll FÖRE första sömnen  ← regressionsvakten för cykel-3-buggen
#   T2  grön körning, alla jobb success → 0
#   T3  failande jobb → 1 (fail-closed)
#   T4  skippat jobb rapporteras men fäller inte → 0
#   T5  okänd jobb-conclusion fäller (fail-closed) → 1
#   T6  in_progress → completed: pollar och avslutar när villkoret håller
#   T7  aldrig terminal → 2 (timeout, inte hängning)
#   T8  run saknas först, dyker upp: pollar upp den → 0
#   T9  run dyker aldrig upp → 2
#   T10 --pr-upplösning via headRefOid → 0
#   T11 användningsfel (ingen/dubbel mode, ogiltigt intervall) → 3
#
# Test-isolering: /tmp/s87-test-ci-wait/ med en gh-stub på PATH som läser ett
# tillståndsfil-scenario. Återställer via trap. INGEN nätverkstrafik, inget
# riktigt gh-anrop, INGEN ändring av real-repo.
#
# Användning: bash scripts/test-ci-wait.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: tasks/sessions/2026-07-25-session-86.md Del 4 (tidsforensiken)
# Etablerad: Session 87 städ-vågen

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s87-test-ci-wait"
GATE_SRC="${REPO_ROOT}/scripts/ci-wait.sh"

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
    mkdir -p "${TEST_DIR}/bin"
    cp "${GATE_SRC}" "${TEST_DIR}/ci-wait.sh"
    chmod +x "${TEST_DIR}/ci-wait.sh"

    # gh-stub: läser scenariot ur miljövariabler + en räknarfil.
    #   GH_RUNLIST_MISSES  antal `run list`-anrop som ska ge tomt svar först
    #   GH_PENDING_READS   antal `run view --json status`-anrop som ska ge in_progress
    #   GH_JOBS            per-jobb-rader, "namn<TAB>conclusion", en per rad
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
COUNTER_DIR="${GH_COUNTER_DIR:-/tmp/s87-test-ci-wait}"
bump() { # bump <namn> -> skriver ut nytt värde
    local f="${COUNTER_DIR}/.count-$1" n=0
    [[ -f "${f}" ]] && n="$(cat "${f}")"
    n=$(( n + 1 )); printf '%s' "${n}" > "${f}"; printf '%s' "${n}"
}
case "$1" in
  pr)   printf 'deadbeefcafe\n'; exit 0 ;;
  run)
    case "$2" in
      list)
        n="$(bump runlist)"
        if [[ "${n}" -le "${GH_RUNLIST_MISSES:-0}" ]]; then printf '\n'; else printf '4242\n'; fi
        exit 0 ;;
      view)
        # Skilj status-avläsning från jobb-avläsning på -q-uttrycket.
        if [[ "$*" == *"jobs"* ]]; then
            printf '%b\n' "${GH_JOBS:-Lint\tsuccess}"
        else
            n="$(bump statusread)"
            if [[ "${n}" -le "${GH_PENDING_READS:-0}" ]]; then
                printf 'in_progress -\n'
            else
                printf 'completed success\n'
            fi
        fi
        exit 0 ;;
    esac ;;
esac
exit 0
STUB
    chmod +x "${TEST_DIR}/bin/gh"
    rm -f "${TEST_DIR}"/.count-*
}

# run_case <namn> <förväntad exit> <max sekunder eller "-"> <env-assignments...> -- <args...>
run_case() {
    local name="$1" want="$2" maxsec="$3"; shift 3
    rm -f "${TEST_DIR}"/.count-*
    local start elapsed got
    start="$(date +%s)"
    ( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" GH_COUNTER_DIR="${TEST_DIR}" \
        "$@" ) >"${TEST_DIR}/out.txt" 2>&1
    got=$?
    elapsed=$(( $(date +%s) - start ))

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -8
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ "${maxsec}" != "-" && "${elapsed}" -gt "${maxsec}" ]]; then
        printf '  ✗ %s — tog %ss, max %ss\n' "${name}" "${elapsed}" "${maxsec}"
        FAILED=$(( FAILED + 1 )); return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$(( PASSED + 1 ))
}

setup
printf 'test-ci-wait: kör 11 testfall mot %s\n\n' "${GATE_SRC}"

# T1 — REGRESSIONSVAKTEN. En redan avslutad körning får ALDRIG kosta en sömn.
#      Cykel 3 i S86:s fix-våg sov bort nio minuter på exakt detta.
run_case "T1  terminal-kontroll före första sömnen (redan grön → 0 s)" 0 2 \
    env GH_PENDING_READS=0 GH_JOBS='Lint\tsuccess' \
    bash ./ci-wait.sh --run 4242 --interval 30 --quiet

run_case "T2  grön körning, alla jobb success → 0" 0 - \
    env GH_JOBS='Lint\tsuccess\nBuild\tsuccess' \
    bash ./ci-wait.sh --run 4242 --quiet

run_case "T3  failande jobb → 1 (fail-closed)" 1 - \
    env GH_JOBS='Lint\tsuccess\nTest\tfailure' \
    bash ./ci-wait.sh --run 4242 --quiet

run_case "T4  skippat jobb fäller inte → 0" 0 - \
    env GH_JOBS='Lint\tsuccess\nTest suite\tskipped' \
    bash ./ci-wait.sh --run 4242 --quiet

run_case "T5  okänd conclusion fäller (fail-closed) → 1" 1 - \
    env GH_JOBS='Lint\tsuccess\nDeploy\tcancelled' \
    bash ./ci-wait.sh --run 4242 --quiet

run_case "T6  in_progress → completed, pollar klart → 0" 0 6 \
    env GH_PENDING_READS=2 GH_JOBS='Lint\tsuccess' \
    bash ./ci-wait.sh --run 4242 --interval 1 --quiet

run_case "T7  aldrig terminal → 2 (timeout, ej hängning)" 2 6 \
    env GH_PENDING_READS=9999 GH_JOBS='Lint\tsuccess' \
    bash ./ci-wait.sh --run 4242 --interval 1 --timeout 3 --quiet

run_case "T8  run saknas först, dyker upp → 0" 0 6 \
    env GH_RUNLIST_MISSES=2 GH_JOBS='Lint\tsuccess' \
    bash ./ci-wait.sh --commit deadbeef --interval 1 --quiet

run_case "T9  run dyker aldrig upp → 2" 2 6 \
    env GH_RUNLIST_MISSES=9999 \
    bash ./ci-wait.sh --commit deadbeef --interval 1 --timeout 3 --quiet

run_case "T10 --pr-upplösning via headRefOid → 0" 0 - \
    env GH_JOBS='Lint\tsuccess' \
    bash ./ci-wait.sh --pr 193 --quiet

run_case "T11a användningsfel: ingen mode → 3" 3 - env bash ./ci-wait.sh --quiet
run_case "T11b användningsfel: dubbel mode → 3" 3 - env bash ./ci-wait.sh --run 1 --pr 2
run_case "T11c användningsfel: ogiltigt intervall → 3" 3 - env bash ./ci-wait.sh --run 1 --interval 0

printf '\ntest-ci-wait: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
