#!/usr/bin/env bash
# scripts/test-check-adr-count.sh
#
# Empirisk test-suite för scripts/check-adr-count.sh (ADR-039-grind).
# 4 testfall: T1 match, T2 antal-drift, T3 token saknas, T4 token icke-unik.
#
# Test-isolering: skapar /tmp/k0b-test-adr-count/ med docs/decisions/ +
# README.md-fixturer. Återställer (rm -rf) via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-adr-count.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-039-konsistens-grindar-kadens.md
# Etablerad: Session 8 K0b (2026-05-27)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/k0b-test-adr-count"
GATE_SRC="${REPO_ROOT}/scripts/check-adr-count.sh"

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
    mkdir -p "${TEST_DIR}/docs/decisions" "${TEST_DIR}/scripts"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-adr-count.sh"
    chmod +x "${TEST_DIR}/scripts/check-adr-count.sh"
}

# write_adrs <n> — skapar n ADR-*.md-filer i docs/decisions/
write_adrs() {
    local n=$1 i
    for ((i = 1; i <= n; i++)); do
        printf '# ADR-%03d\n' "${i}" > "${TEST_DIR}/docs/decisions/ADR-$(printf '%03d' "${i}")-x.md"
    done
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-adr-count.sh 2>&1 )
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

mark() {
    if [[ "$1" -eq 0 ]]; then
        PASSED=$((PASSED + 1)); echo "  → PASS"
    else
        FAILED=$((FAILED + 1)); echo "  → FAIL"
    fi
}

# ============================================================
echo "═══ T1: antal matchar (3 ADR-filer, README '3 arkitekturbeslut') → exit 0 ═══"
setup
write_adrs 3
printf '**Arkitekturbeslut:** 3 arkitekturbeslut (ADR:er) totalt.\n' > "${TEST_DIR}/README.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1" "konsistent" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: antal-drift (3 ADR-filer, README '2 arkitekturbeslut') → exit 1 ═══"
setup
write_adrs 3
printf '**Arkitekturbeslut:** 2 arkitekturbeslut (ADR:er) totalt.\n' > "${TEST_DIR}/README.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T2" 1 "${ec}" || ok=1
check_contains "T2" "ADR-räknings-drift" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: token saknas helt i README → exit 1 ═══"
setup
write_adrs 3
printf '# Projekt utan ADR-räknings-token.\n' > "${TEST_DIR}/README.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T3" 1 "${ec}" || ok=1
check_contains "T3" "exakt 1" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: token icke-unik (2 rader med '<N> arkitekturbeslut') → exit 1 ═══"
setup
write_adrs 3
{
    printf '**Arkitekturbeslut:** 3 arkitekturbeslut (ADR:er) totalt.\n'
    printf 'Se katalogen — 3 arkitekturbeslut listade.\n'
} > "${TEST_DIR}/README.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T4" 1 "${ec}" || ok=1
check_contains "T4" "exakt 1" "${out}" || ok=1
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
