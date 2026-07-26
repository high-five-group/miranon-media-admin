#!/usr/bin/env bash
# scripts/test-ci-wait.sh
#
# Empirisk test-suite för scripts/ci-wait.sh (S87 städ-vågen; utökad S91).
# 15 testfall:
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
#   T12 superseddad ≠ röd (S91), fyra fall:
#       a topp-conclusion cancelled + nyare körning finns  → 4
#       b cancelled UTAN nyare körning                     → 1  (fail-closed)
#       c cancelled + aggregator-failure + nyare           → 4  (verklighetsfallet)
#       d topp-conclusion failure + nyare finns            → 1  (bara avbrutna supersederas)
#
# Test-isolering: /tmp/s87-test-ci-wait/ med en gh-stub på PATH som läser ett
# tillståndsfil-scenario. Återställer via trap. INGEN nätverkstrafik, inget
# riktigt gh-anrop, INGEN ändring av real-repo.
#
# STUBBENS GRÄNS (S91, dyrköpt): en grön stubbsvit bevisar LOGIKEN, inte att
# den möter verkligheten. Superseddad-fixens första version var grön mot alla
# stubbfall och föll ändå direkt mot skarpt API, därför att stubben inte
# speglade att aggregatorn "CI Passed or Skipped" failar by design vid avbrott.
# T12c bär det fallet nu — men lärdomen är att en ändring i denna svit ska
# följas av skarpa körningar mot verkliga run-ID:n innan den anses bevisad.
#
# Användning: bash scripts/test-ci-wait.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: tasks/sessions/2026-07-25-session-86.md Del 4 (tidsforensiken)
#        tasks/sessions/2026-07-26-session-91.md (superseddad-klassen)
# Etablerad: Session 87 städ-vågen; T12 tillagd Session 91

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
    #   GH_NEWER_RUN       (S91) svar på superseddad-frågan: ID för en NYARE
    #                      körning på samma branch, eller tomt = ingen nyare
    #   GH_RUN_META        (S91) "branch<TAB>createdAt<TAB>workflowName"
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
        # S91: superseddad-frågan känns igen på createdAt i --json-fälten;
        # run-upplösningens listanrop begär bara databaseId.
        if [[ "$*" == *"createdAt"* ]]; then
            printf '%s\n' "${GH_NEWER_RUN:-}"; exit 0
        fi
        n="$(bump runlist)"
        if [[ "${n}" -le "${GH_RUNLIST_MISSES:-0}" ]]; then printf '\n'; else printf '4242\n'; fi
        exit 0 ;;
      view)
        # Skilj avläsningarna på vilka --json-fält som begärs.
        if [[ "$*" == *"jobs"* ]]; then
            printf '%b\n' "${GH_JOBS:-Lint\tsuccess}"
        elif [[ "$*" == *"headBranch"* ]]; then
            printf '%b\n' "${GH_RUN_META:-feat/x\t2026-07-26T12:00:00Z\tCI}"
        elif [[ "$*" == *"headSha"* ]]; then
            # Egen gren sedan S91: föll tidigare igenom till status-grenen och
            # gav "completed success" som SHA — trasig stub, harmlöst utfall.
            printf 'deadbeefcafe0123\n'
        else
            n="$(bump statusread)"
            if [[ "${n}" -le "${GH_PENDING_READS:-0}" ]]; then
                printf 'in_progress -\n'
            else
                printf 'completed %s\n' "${GH_CONCLUSION:-success}"
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
printf 'test-ci-wait: kör 15 testfall mot %s\n\n' "${GATE_SRC}"

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
    env GH_JOBS='Lint\tsuccess\nDeploy\ttimed_out' \
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

# T12 — SUPERSEDDAD ≠ RÖD (S91, mekaniserings-punkt 3).
# cancel-in-progress avbryter föregående körning vid varje ny push, och en
# orkestrerare som kör update-branch på en agents gren gör samma sak. Utfallet
# blev tidigare "RÖD" och skickade läsaren att felsöka en körning som aldrig
# hade något fel — den var bara inaktuell.
#
# NYCKELN ÄR TOPP-NIVÅNS conclusion, INTE jobb-mönstret. Första versionen av
# fixen prövade superseddad-frågan på jobb med conclusion "cancelled" och var
# grön mot stubben — men föll direkt mot verkligheten: aggregatorn
# "CI Passed or Skipped" failar BY DESIGN när jobb avbryts (S77:s fail-closed-
# form), så en avbruten körning bär nästan alltid ett failure-jobb och
# failure-grenen träffade före superseddad-prövningen. Empirisk kartläggning av
# fyra verkliga avbrutna körningar (30202493540, 30201694815, 30201501825,
# 30201387903, alla 2026-07-26) visade att jobb-mönstren varierar helt medan
# topp-conclusion är "cancelled" i samtliga. T12c nedan är det fall som hade
# fångat felet direkt.
#
# GitHubs API bär INGET fält för avbrottsorsaken (verifierat mot 30201494270:
# varken run_attempt, event eller tidsstämplar skiljer concurrency-avbrott från
# manuellt), så frågan blir den enda som spelar roll för beslutet: FINNS en
# nyare körning på samma branch och workflow? Då är utfallet inaktuellt oavsett
# varför det dog.
run_case "T12a topp-conclusion cancelled + nyare finns → 4 (superseddad)" 4 - \
    env GH_CONCLUSION=cancelled GH_JOBS='Lint\tsuccess\nTest suite\tcancelled' \
    GH_NEWER_RUN=9999 \
    bash ./ci-wait.sh --run 4242 --quiet

run_case "T12b cancelled UTAN nyare körning → 1 (fail-closed, oförändrat)" 1 - \
    env GH_CONCLUSION=cancelled GH_JOBS='Lint\tsuccess\nTest suite\tcancelled' \
    GH_NEWER_RUN= \
    bash ./ci-wait.sh --run 4242 --quiet

# T12c — VERKLIGHETSFALLET. Aggregatorn failar som konsekvens av avbrottet;
# dess failure är inte oberoende information. Detta är fallet som sänkte v1.
run_case "T12c cancelled + aggregator-failure + nyare → 4 (aggregatorn är följd, ej orsak)" 4 - \
    env GH_CONCLUSION=cancelled \
    GH_JOBS='Detect changed files\tsuccess\nLint\tcancelled\nCI Passed or Skipped\tfailure' \
    GH_NEWER_RUN=9999 \
    bash ./ci-wait.sh --run 4242 --quiet

# T12d — bara AVBRUTNA körningar kan supersederas. En körning som genuint
# FAILADE behåller sitt röda utfall även om en nyare körning finns.
run_case "T12d topp-conclusion failure + nyare finns → 1 (bara avbrutna supersederas)" 1 - \
    env GH_CONCLUSION=failure GH_JOBS='Lint\tsuccess\nTest\tfailure' \
    GH_NEWER_RUN=9999 \
    bash ./ci-wait.sh --run 4242 --quiet

printf '\ntest-ci-wait: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
