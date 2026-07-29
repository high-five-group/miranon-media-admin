#!/usr/bin/env bash
# scripts/test-staging-semaphore.sh
#
# Empirisk testsvit för scripts/staging-semaphore.sh (TASK-77).
# 19 testfall — tyngdpunkt på att mekanismen FÄLLER när den ska OCH släpper
# igenom när den ska. En grind som bara bevisats grön är inte bevisad:
#
#   T1  CI tyst → 0                       (negativt självtest, AC#3)
#   T2  Staging (API + E2E) in_progress, nästlat namn → 76
#   T3  samma jobb queued (väntar på mutexen) → 76
#   T4  docs-landning: svit-raden completed/skipped → 0   ← falsk-positiv-vakten
#   T5  Staging sentinel purge in_progress → 76
#   T6  svit-raden in_progress, nästlade jobb ej expanderade än → 76
#   T7  Nattlig fullsvit queued → 76
#   T8  Kontraktsvakten in_progress → 76
#   T9  ENBART icke-staging-jobb igång (A11y, Pure + Build) → 0   (precision, AC#3)
#   T10 gh run list failar → 77, aldrig 0        (fail-closed)
#   T11 gh api .../jobs failar → 77, aldrig 0    (fail-closed)
#   T12 MM_STAGING_PREFLIGHT=off trots hållet staging → 0  (AC#4)
#   T13 policy-filen saknas → 64
#   T14 policy-filens listor tomma → 64          (tyst grön får inte gå)
#   T15 preflight utan ägare → 64
#   T16 hållaren ligger i den ANDRA workflowen → 76
#   T17 acquire/release-paret opåverkat → 0 + låset borta
#   T18 release med fel ägare → 74               (befintligt kontrakt orört)
#   T19 status utan lås → "LEDIGT"               (befintligt kontrakt orört)
#
# Test-isolering: /tmp/t77-test-staging-semaphore/ med en gh-stub som svarar
# ur ett scenario-katalog. INGEN nätverkstrafik, inget riktigt gh-anrop, ingen
# ändring i real-repot, eget MM_STAGING_LOCK_DIR (rör aldrig det riktiga låset).
#
# LAYOUTEN SPEGLAR PRODUKTIONEN: skriptet kopieras till
# ${TEST_DIR}/scripts/ och policy-filen till
# ${TEST_DIR}/.staging-semaphore-policy.conf — samma relation som i repot, så
# den FAKTISKA default-upplösningen av policy-sökvägen provas.
# STAGING_SEMAPHORE_POLICY används bara där frånvaro ÄR testfallet.
#
# STUBBENS GRÄNS, öppet skriven: gh:s `--jq` körs inne i gh, så stubben
# levererar redan filtrerad utdata. Sviten bevisar därmed skriptets LOGIK, inte
# att jq-uttrycken matchar det verkliga API-svaret. Den kopplingen är i stället
# bevisad skarpt mot live-API:t (TASK-77 PR-body: exit 76 mot körning
# 30442315955 med `Staging (API + E2E)` in_progress, och exit 0 när samma
# körning var completed). Ändras jq-uttrycken ska den skarpa körningen göras om.
#
# Användning: bash scripts/test-staging-semaphore.sh
# Exit 0 om alla testfall passerar, 1 annars.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/t77-test-staging-semaphore"
SKRIPT_SRC="${REPO_ROOT}/scripts/staging-semaphore.sh"
POLICY_SRC="${REPO_ROOT}/.staging-semaphore-policy.conf"

SKRIPT="${TEST_DIR}/scripts/staging-semaphore.sh"
SCEN="${TEST_DIR}/scenario"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # anropas via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/bin" "${TEST_DIR}/scripts" "${SCEN}"
    cp "${SKRIPT_SRC}" "${SKRIPT}"
    chmod +x "${SKRIPT}"
    cp "${POLICY_SRC}" "${TEST_DIR}/.staging-semaphore-policy.conf"

    # gh-stub. Svarar ur ${SCEN}: filen runs-<workflow> ger körnings-ID:n
    # (redan status-filtrerade, som gh:s --jq hade gjort), jobs-<id> ger
    # rader på formen "<status><TAB><jobbnamn>".
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
SCEN="${T77_SCEN}"
if [ "${1:-}" = "run" ] && [ "${2:-}" = "list" ]; then
    if [ -f "${SCEN}/fail-runlist" ]; then exit 1; fi
    wf=""
    while [ "$#" -gt 0 ]; do
        if [ "$1" = "--workflow" ]; then wf="${2:-}"; fi
        shift
    done
    if [ -f "${SCEN}/runs-${wf}" ]; then cat "${SCEN}/runs-${wf}"; fi
    exit 0
fi
if [ "${1:-}" = "api" ]; then
    if [ -f "${SCEN}/fail-jobs" ]; then exit 1; fi
    sokvag="${2:-}"
    id="${sokvag#*/actions/runs/}"
    id="${id%/jobs}"
    if [ -f "${SCEN}/jobs-${id}" ]; then cat "${SCEN}/jobs-${id}"; fi
    exit 0
fi
exit 1
STUB
    chmod +x "${TEST_DIR}/bin/gh"
}

nollstall_scenario() {
    rm -rf "${SCEN}"
    mkdir -p "${SCEN}"
}

# Kör preflight mot stubben och jämför exit-koden. Exit-koden fångas SEPARAT
# från utdatan — aldrig genom en pipe, som hade läst sista kommandots kod.
prova() {
    namn="$1"
    vantad="$2"
    shift 2
    ut="${TEST_DIR}/ut.txt"
    rc=0
    env "$@" T77_SCEN="${SCEN}" GH_BIN="${TEST_DIR}/bin/gh" MM_STAGING_LOCK_DIR="${TEST_DIR}/lock" \
        bash "${SKRIPT}" preflight "testagare" > "${ut}" 2>&1 || rc=$?
    if [[ "${rc}" -eq "${vantad}" ]]; then
        PASSED=$((PASSED + 1))
        echo "  ok   ${namn} (exit ${rc})"
    else
        FAILED=$((FAILED + 1))
        echo "  FAIL ${namn}: väntade exit ${vantad}, fick ${rc}"
        sed 's/^/       | /' "${ut}"
    fi
}

setup
echo "TASK-77 — testsvit för staging-semaforens preflight"
echo ""

# ── T1: CI tyst. Inga icke-completed körningar alls. ──────────────────────
nollstall_scenario
prova "T1  CI tyst → släpper igenom" 0 IGNORERA=1

# ── T2: staging-jobbet igång, nästlat reusable-namn. ──────────────────────
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
printf 'in_progress\tVerifierande svit på det mergade trädet / Staging (API + E2E)\n' \
    > "${SCEN}/jobs-30442315955"
prova "T2  Staging (API + E2E) in_progress → fäller" 76 IGNORERA=1

# ── T3: samma jobb köat bakom mutexen — håller lika mycket. ───────────────
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
printf 'queued\tVerifierande svit på det mergade trädet / Staging (API + E2E)\n' \
    > "${SCEN}/jobs-30442315955"
prova "T3  Staging (API + E2E) queued → fäller" 76 IGNORERA=1

# ── T4: docs-landning. Svit-raden completed/skipped ⇒ ingen staging. ──────
# Den viktigaste falsk-positiv-vakten: utan den hade VARJE landning på main
# blockerat lokalt arbete i minuter, vilket är precis den ständiga broms
# AC#3 varnar för. Formen är verifierad mot körning 30440662509.
nollstall_scenario
printf '30440662509\n' > "${SCEN}/runs-post-merge.yml"
{
    printf 'completed\tÄrvd klassning — körde PR-grinden sviten?\n'
    printf 'completed\tVerifierande svit på det mergade trädet\n'
} > "${SCEN}/jobs-30440662509"
prova "T4  docs-landning (svit skipped) → släpper igenom" 0 IGNORERA=1

# ── T5: purge-jobbet muterar staging utan mutex (TASK-50). ────────────────
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
printf 'in_progress\tVerifierande svit på det mergade trädet / Staging sentinel purge\n' \
    > "${SCEN}/jobs-30442315955"
prova "T5  Staging sentinel purge in_progress → fäller" 76 IGNORERA=1

# ── T6: anropar-raden igång, nästlade jobb ej expanderade än. ─────────────
# Frånvaro av staging-raden får inte läsas som grönt ljus (L322).
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
{
    printf 'completed\tÄrvd klassning — körde PR-grinden sviten?\n'
    printf 'in_progress\tVerifierande svit på det mergade trädet\n'
} > "${SCEN}/jobs-30442315955"
prova "T6  svit-raden in_progress, jobb ej expanderade → fäller" 76 IGNORERA=1

# ── T7: natten. ──────────────────────────────────────────────────────────
nollstall_scenario
printf '30500000001\n' > "${SCEN}/runs-nightly.yml"
printf 'queued\tNattlig fullsvit\n' > "${SCEN}/jobs-30500000001"
prova "T7  Nattlig fullsvit queued → fäller" 76 IGNORERA=1

# ── T8: kontraktsvakten läser staging (nightly.yml, utan mutex). ──────────
nollstall_scenario
printf '30500000002\n' > "${SCEN}/runs-nightly.yml"
printf 'in_progress\tKontraktsvakt (fixtur mot skarp staging)\n' > "${SCEN}/jobs-30500000002"
prova "T8  Kontraktsvakt in_progress → fäller" 76 IGNORERA=1

# ── T9: precisionen. Icke-staging-jobb ska INTE fälla. ────────────────────
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
{
    printf 'completed\tVerifierande svit på det mergade trädet / Staging (API + E2E)\n'
    printf 'in_progress\tVerifierande svit på det mergade trädet / A11y (axe-runner)\n'
    printf 'in_progress\tVerifierande svit på det mergade trädet / Pure + Build\n'
    printf 'in_progress\tVerifierande svit på det mergade trädet / Acceptance (hermetisk)\n'
} > "${SCEN}/jobs-30442315955"
prova "T9  enbart icke-staging-jobb igång → släpper igenom" 0 IGNORERA=1

# ── T10/T11: sonden svarar inte. Fail-closed, aldrig tyst grön. ───────────
nollstall_scenario
touch "${SCEN}/fail-runlist"
prova "T10 gh run list failar → 77 (ej 0)" 77 IGNORERA=1

nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
touch "${SCEN}/fail-jobs"
prova "T11 gh api jobs failar → 77 (ej 0)" 77 IGNORERA=1

# ── T12: den medvetna vägen förbi (AC#4). ────────────────────────────────
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
printf 'in_progress\tVerifierande svit på det mergade trädet / Staging (API + E2E)\n' \
    > "${SCEN}/jobs-30442315955"
prova "T12 MM_STAGING_PREFLIGHT=off trots hållet staging → 0" 0 MM_STAGING_PREFLIGHT=off

# ── T13/T14: policy-filen. ───────────────────────────────────────────────
nollstall_scenario
prova "T13 policy-filen saknas → 64" 64 STAGING_SEMAPHORE_POLICY="${TEST_DIR}/finns-inte.conf"

printf 'STAGING_CI_WORKFLOWS=()\nSTAGING_CI_JOBS=()\n' > "${TEST_DIR}/tom.conf"
prova "T14 policy-filens listor tomma → 64" 64 STAGING_SEMAPHORE_POLICY="${TEST_DIR}/tom.conf"

# ── T15: bruksfel. ───────────────────────────────────────────────────────
rc=0
env T77_SCEN="${SCEN}" GH_BIN="${TEST_DIR}/bin/gh" bash "${SKRIPT}" preflight \
    > /dev/null 2>&1 || rc=$?
if [[ "${rc}" -eq 64 ]]; then
    PASSED=$((PASSED + 1)); echo "  ok   T15 preflight utan ägare → 64"
else
    FAILED=$((FAILED + 1)); echo "  FAIL T15 preflight utan ägare: väntade 64, fick ${rc}"
fi

# ── T16: hållaren i den ANDRA workflowen fångas också. ───────────────────
nollstall_scenario
printf '30442315955\n' > "${SCEN}/runs-post-merge.yml"
printf 'completed\tVerifierande svit på det mergade trädet\n' > "${SCEN}/jobs-30442315955"
printf '30500000003\n' > "${SCEN}/runs-nightly.yml"
printf 'in_progress\tNattlig fullsvit\n' > "${SCEN}/jobs-30500000003"
prova "T16 hållare i nightly medan post-merge är klar → fäller" 76 IGNORERA=1

# ── T17–T19: befintligt kontrakt orört. ──────────────────────────────────
LOCK="${TEST_DIR}/lock"
rc=0
MM_STAGING_LOCK_DIR="${LOCK}" bash "${SKRIPT}" acquire "agare-a" 5 > /dev/null 2>&1 || rc=$?
rc2=0
MM_STAGING_LOCK_DIR="${LOCK}" bash "${SKRIPT}" release "agare-a" > /dev/null 2>&1 || rc2=$?
LOCK_KVAR="nej"
if [[ -d "${LOCK}" ]]; then LOCK_KVAR="ja"; fi
if [[ "${rc}" -eq 0 ]] && [[ "${rc2}" -eq 0 ]] && [[ "${LOCK_KVAR}" == "nej" ]]; then
    PASSED=$((PASSED + 1)); echo "  ok   T17 acquire+release opåverkat, låset borta"
else
    FAILED=$((FAILED + 1)); echo "  FAIL T17 acquire=${rc} release=${rc2} lock-kvar=${LOCK_KVAR}"
fi

rc=0
MM_STAGING_LOCK_DIR="${LOCK}" bash "${SKRIPT}" acquire "agare-a" 5 > /dev/null 2>&1 || rc=$?
rc2=0
MM_STAGING_LOCK_DIR="${LOCK}" bash "${SKRIPT}" release "agare-b" > /dev/null 2>&1 || rc2=$?
if [[ "${rc}" -eq 0 ]] && [[ "${rc2}" -eq 74 ]]; then
    PASSED=$((PASSED + 1)); echo "  ok   T18 release med fel ägare → 74"
else
    FAILED=$((FAILED + 1)); echo "  FAIL T18 acquire=${rc} release=${rc2} (väntade 0 och 74)"
fi
MM_STAGING_LOCK_DIR="${LOCK}" bash "${SKRIPT}" release "agare-a" > /dev/null 2>&1

status_ut=""
status_ut="$(MM_STAGING_LOCK_DIR="${LOCK}" bash "${SKRIPT}" status 2>&1)"
if [[ "${status_ut}" == "LEDIGT" ]]; then
    PASSED=$((PASSED + 1)); echo "  ok   T19 status utan lås → LEDIGT"
else
    FAILED=$((FAILED + 1)); echo "  FAIL T19 status gav '${status_ut}', väntade 'LEDIGT'"
fi

echo ""
echo "PASSED: ${PASSED}   FAILED: ${FAILED}"
[[ "${FAILED}" -eq 0 ]]
