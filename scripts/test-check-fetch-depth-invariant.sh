#!/usr/bin/env bash
# scripts/test-check-fetch-depth-invariant.sh
#
# Empirisk test-suite för scripts/check-fetch-depth-invariant.sh (ADR-039-grind).
# 7 testfall:
#   T1 all-lika + errata → 0
#   T2 ci-bärar-drift → 1
#   T3 conf-drift → 1
#   T4 ADR-029 saknar erratum → 1
#   T5 ci.yml-KOMMENTAR säger annat värde men config-rader lika → 0
#      (bevisar att grinden EXKLUDERAR kommentarer / frusen text)
#   T6 erratum finns men nämner ej aktuellt levande värde → 1
#   T7 fel antal ci-bärare (3 i st f 4) → 1
#
# Test-isolering: /tmp/k0b-test-fetch-depth/ med ci.yml + conf + script +
# ADR-fixturer. Återställer via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-fetch-depth-invariant.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-039-konsistens-grindar-kadens.md
# Etablerad: Session 8 K0b (2026-05-27)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/k0b-test-fetch-depth"
GATE_SRC="${REPO_ROOT}/scripts/check-fetch-depth-invariant.sh"
ADR029_PATH="docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md"
ADR030_PATH="docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md"

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
    mkdir -p "${TEST_DIR}/.github/workflows" \
             "${TEST_DIR}/scripts" \
             "${TEST_DIR}/docs/decisions"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-fetch-depth-invariant.sh"
    chmod +x "${TEST_DIR}/scripts/check-fetch-depth-invariant.sh"
}

# write_ci <v_changed> <v_lint> <v_test> <v_docs> <comment_value> [omit_one]
# Om omit_one="omit" skrivs bara 3 config-rader (changed utelämnas).
write_ci() {
    local vc=$1 vl=$2 vt=$3 vd=$4 vcomment=$5 omit=${6:-}
    {
        echo "jobs:"
        echo "  changed:"
        echo "    steps:"
        echo "      - uses: actions/checkout@v6"
        echo "        with:"
        echo "          # K-kommentar som nämner fetch-depth: ${vcomment} (ska EXKLUDERAS)"
        [[ "${omit}" != "omit" ]] && echo "          fetch-depth: ${vc}"
        echo "  lint:"
        echo "        with:"
        echo "          fetch-depth: ${vl}"
        echo "  test:"
        echo "          fetch-depth: ${vt}"
        echo "  docs:"
        echo "          fetch-depth: ${vd}"
    } > "${TEST_DIR}/.github/workflows/ci.yml"
}

write_conf() {
    echo "FRONTMATTER_MIN_HISTORY_DEPTH=$1" > "${TEST_DIR}/.frontmatter-policy.conf"
}

write_script() {
    {
        echo "#!/usr/bin/env bash"
        echo "MIN_DEPTH=\"\${FRONTMATTER_MIN_HISTORY_DEPTH:-$1}\""
    } > "${TEST_DIR}/scripts/check-frontmatter.sh"
}

# write_adr <path> <has_erratum:0|1> <erratum_value>
write_adr() {
    local path=$1 has=$2 val=$3
    {
        echo "# ${path}"
        echo ""
        echo "- Status: Accepted"
        [[ "${has}" -eq 1 ]] && echo "> **Korrigering (test):** changed-jobbets fetch-depth: ${val} numera (frusen brödtext nedan orörd)."
        echo ""
        echo "## Kontext"
        echo "6. fetch-depth: 50 i changed-jobb. Beslut: låt stå."
    } > "${TEST_DIR}/${path}"
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-fetch-depth-invariant.sh 2>&1 )
}

check_exit() {
    local label=$1 expected=$2 actual=$3
    if [[ "${actual}" = "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"; return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (expected ${expected})"; return 1
}

check_contains() {
    local label=$1 needle=$2 hay=$3
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ✅ ${label} contains: '${needle}'"; return 0
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
echo "═══ T1: alla 6 lika (100) + båda errata pekar på 100 → exit 0 ═══"
setup
write_ci 100 100 100 100 100
write_conf 100
write_script 100
write_adr "${ADR029_PATH}" 1 100
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1" "alla 6 levande bärare == 100" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: ci-bärar-drift (lint 99) → exit 1 ═══"
setup
write_ci 100 99 100 100 100
write_conf 100
write_script 100
write_adr "${ADR029_PATH}" 1 100
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T2" 1 "${ec}" || ok=1
check_contains "T2" "fetch-depth-drift" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: conf-drift (50, övriga 100) → exit 1 ═══"
setup
write_ci 100 100 100 100 100
write_conf 50
write_script 100
write_adr "${ADR029_PATH}" 1 100
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T3" 1 "${ec}" || ok=1
check_contains "T3" "fetch-depth-drift" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: ADR-029 saknar erratum → exit 1 ═══"
setup
write_ci 100 100 100 100 100
write_conf 100
write_script 100
write_adr "${ADR029_PATH}" 0 100
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T4" 1 "${ec}" || ok=1
check_contains "T4" "saknar fetch-depth-erratum" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T5: ci.yml-KOMMENTAR säger 50 men config-rader alla 100 → exit 0 (exkluderings-bevis) ═══"
setup
write_ci 100 100 100 100 50
write_conf 100
write_script 100
write_adr "${ADR029_PATH}" 1 100
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T5" 0 "${ec}" || ok=1
check_contains "T5" "alla 6 levande bärare == 100" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T6: erratum finns men nämner ej aktuellt värde (säger 50, live=100) → exit 1 ═══"
setup
write_ci 100 100 100 100 100
write_conf 100
write_script 100
write_adr "${ADR029_PATH}" 1 50
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T6" 1 "${ec}" || ok=1
check_contains "T6" "nämner inte aktuellt levande värde" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T7: fel antal ci-bärare (3 i st f 4) → exit 1 ═══"
setup
write_ci 100 100 100 100 100 omit
write_conf 100
write_script 100
write_adr "${ADR029_PATH}" 1 100
write_adr "${ADR030_PATH}" 1 100
out=$(run_gate); ec=$?
ok=0
check_exit "T7" 1 "${ec}" || ok=1
check_contains "T7" "förväntat 4" "${out}" || ok=1
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
