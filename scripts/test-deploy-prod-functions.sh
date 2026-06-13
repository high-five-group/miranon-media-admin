#!/usr/bin/env bash
# scripts/test-deploy-prod-functions.sh
#
# Empirisk test-suite för scripts/deploy-prod-functions.sh (ADR-050 steg 2,
# Fas 7-skuld). Bevisar fail-closed-egenskapen utan att faktiskt deploya:
#   T1 happy — 5 prod-funktioner i deploy-set; test-auth + okänd ny funktion
#      hamnar som EXKLUDERAD (fail-closed) → exit 0.
#   T2 allowlistad funktion saknas på disk (typo/rename) → abort, exit 1.
#   T3 allowlist-fil saknas → exit 1.
#   T4 ingen flagga (varken --list eller --project-ref) → usage-fel, exit 1.
#
# Test-isolering: skapar /tmp/s19-test-deploy-allowlist/ med supabase/functions/
# + .prod-functions-allowlist.conf-fixturer. Återställer (rm -rf) via trap.
# INGEN ändring av real-repo, INGEN faktisk deploy (endast --list/felvägar körs).
#
# Användning: bash scripts/test-deploy-prod-functions.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-050-isolerad-staging-miljo.md (steg 2).
# Etablerad: Session 19 (2026-06-13)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s19-test-deploy-allowlist"
SCRIPT_SRC="${REPO_ROOT}/scripts/deploy-prod-functions.sh"

PASSED=0
FAILED=0

PROD_FNS=(create-admin-user get-events get-persons get-registrations update-record)

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

# setup — bygger en fixtur med prod-funktioner + test-auth + en okänd ny
# funktion + _shared. Allowlisten skrivs av anroparen efteråt.
setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts"
    mkdir -p "${TEST_DIR}/supabase/functions"
    cp "${SCRIPT_SRC}" "${TEST_DIR}/scripts/deploy-prod-functions.sh"
    chmod +x "${TEST_DIR}/scripts/deploy-prod-functions.sh"
    local fn
    for fn in "${PROD_FNS[@]}" test-auth _shared sneaky-new-fn; do
        mkdir -p "${TEST_DIR}/supabase/functions/${fn}"
    done
}

write_allowlist() {
    printf '%s\n' "$@" > "${TEST_DIR}/.prod-functions-allowlist.conf"
}

run_script() {
    ( cd "${TEST_DIR}" && bash scripts/deploy-prod-functions.sh "$@" 2>&1 )
}

check_exit() {
    local label=$1 expected=$2 actual=$3
    if [[ "${actual}" = "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"
        return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (expected ${expected})"
    return 1
}

check_contains() {
    local label=$1 needle=$2 hay=$3
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ✅ ${label} contains: '${needle}'"
        return 0
    fi
    echo "  ❌ ${label} missing: '${needle}'"
    # shellcheck disable=SC2001  # sed på multi-line är klarast här
    echo "${hay}" | sed 's/^/    /'
    return 1
}

check_absent() {
    local label=$1 needle=$2 hay=$3
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ❌ ${label} should NOT contain: '${needle}'"
        return 1
    fi
    echo "  ✅ ${label} correctly absent: '${needle}'"
    return 0
}

mark() {
    if [[ "$1" -eq 0 ]]; then
        PASSED=$((PASSED + 1)); echo "  → PASS"
    else
        FAILED=$((FAILED + 1)); echo "  → FAIL"
    fi
}

# ============================================================
echo "═══ T1: --list — 5 prod i deploy-set, test-auth + okänd fn EXKLUDERAD → exit 0 ═══"
setup
write_allowlist "# prod-allowlist" "${PROD_FNS[@]}"
out=$(run_script --list); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1 deploy update-record" "[prod]        update-record" "${out}" || ok=1
check_contains "T1 deploy create-admin-user" "[prod]        create-admin-user" "${out}" || ok=1
check_contains "T1 test-auth exkluderad" "[EXKLUDERAD]  test-auth" "${out}" || ok=1
check_contains "T1 okänd fn exkluderad" "[EXKLUDERAD]  sneaky-new-fn" "${out}" || ok=1
check_absent "T1 test-auth aldrig i prod-set" "[prod]        test-auth" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: allowlistad funktion saknas på disk → abort, exit 1 ═══"
setup
write_allowlist "${PROD_FNS[@]}" "fn-som-inte-finns"
out=$(run_script --list); ec=$?
ok=0
check_exit "T2" 1 "${ec}" || ok=1
check_contains "T2" "saknas på disk: fn-som-inte-finns" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: allowlist-fil saknas → exit 1 ═══"
setup
rm -f "${TEST_DIR}/.prod-functions-allowlist.conf"
out=$(run_script --list); ec=$?
ok=0
check_exit "T3" 1 "${ec}" || ok=1
check_contains "T3" "allowlist saknas" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: ingen flagga → usage-fel, exit 1 (deployar aldrig utan explicit val) ═══"
setup
write_allowlist "${PROD_FNS[@]}"
out=$(run_script); ec=$?
ok=0
check_exit "T4" 1 "${ec}" || ok=1
check_contains "T4" "Ange --list eller --project-ref" "${out}" || ok=1
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
