#!/usr/bin/env bash
# scripts/test-vale-regression.sh
#
# Vale L_X.2 regression test-suite (AssertFlip-mönster för upstream-bug
# lift-trigger). 3 testfall: T1 L_X.2-reproduktion (inverterad assertion),
# T2 helfil-disable suppression, T3 Brand-rule ej maskerad.
#
# Test-isolering: tests/vale-regression/ är permanent location (inte /tmp)
# för regression-skydd. .vale.ini i samma katalog gör Vale isolerad från
# real-repo config.
#
# Användning: bash scripts/test-vale-regression.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Lift-trigger: när T1 FAIL (Vale rapporterar inte längre fel),
# upstream-fix har landat → ADR-032 § Lift-protokoll aktiveras.
#
# Källa: ADR-032 § Regression-skydd
# Etablerad: Session 6.6.6 K3.6 (2026-05-20)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_DIR="${REPO_ROOT}/tests/vale-regression"

PASSED=0
FAILED=0

check_count_gte() {
    local label=$1 min=$2 actual=$3
    if [[ "${actual}" -ge "${min}" ]]; then
        echo "  ✅ ${label}: count=${actual} (≥${min})"
        return 0
    fi
    echo "  ❌ ${label}: count=${actual} (expected ≥${min})"
    return 1
}

check_count_eq() {
    local label=$1 expected=$2 actual=$3
    if [[ "${actual}" -eq "${expected}" ]]; then
        echo "  ✅ ${label}: count=${actual}"
        return 0
    fi
    echo "  ❌ ${label}: count=${actual} (expected ${expected})"
    return 1
}

mark() {
    if [[ "$1" -eq 0 ]]; then
        PASSED=$((PASSED + 1))
        echo "  → PASS"
    else
        FAILED=$((FAILED + 1))
        echo "  → FAIL"
    fi
}

cd "${FIXTURE_DIR}" || { echo "❌ kunde ej cd till ${FIXTURE_DIR}"; exit 1; }

# Pre-allocate temp-files INSIDE fixture-dir (single trap-statement per
# Revision 2). Vale .vale.ini-patterns matchar CWD-relative tree; temp-
# filer i /tmp ligger utanför tree → .vale.ini plockas inte upp och Vale
# rapporterar "in 0 files". Empirisk fångst K3.6-A V.A test-iteration #1.
tmp_disabled=$(mktemp .tmp-t2-XXXXXX.md)
tmp_brand=$(mktemp .tmp-t3-XXXXXX.md)
# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    rm -f "${tmp_disabled}" "${tmp_brand}"
}
trap cleanup EXIT

# ============================================================
# T1: L_X.2-reproduktion (inverterad assertion / AssertFlip)
# Pass-kriterium: Vale rapporterar fynd (bug bekräftad) på case-d4 + case-d6
# När detta FAIL (0 fynd) = upstream-fix landat = lift-trigger
# ============================================================
echo ""
echo "═══ T1: L_X.2-reproduktion (inverterad assertion) ═══"
ok=0
t1_fynd=$(vale --no-exit case-d4.md case-d6.md 2>&1 | grep -cE "error|warning|suggestion" || true)
check_count_gte "T1 (Vale rapporterar L_X.2-fynd = bug bekräftad)" 1 "${t1_fynd}" || ok=1
if [[ "${t1_fynd}" -eq 0 ]]; then
    echo "  ⚠️  T1 LIFT-TRIGGER: Vale rapporterar 0 fynd på L_X.2-fixtures."
    echo "  ⚠️  Detta INDIKERAR att upstream-fix kan ha landat i nuvarande Vale-version."
    echo "  ⚠️  AKTIVERA ADR-032 § Lift-protokoll. Se docs/decisions/ADR-032-*.md"
fi
mark "${ok}"

# ============================================================
# T2: Helfil-disable suppression
# Pass-kriterium: post-disable-insertion = 0 Vale.Terms-fynd
# ============================================================
echo ""
echo "═══ T2: Helfil-disable suppression ═══"
ok=0
{
    echo "<!-- vale Vale.Terms = NO -->"
    echo "<!-- T2 test: helfil-disable suppression -->"
    echo ""
    cat case-d6.md
} > "${tmp_disabled}"
t2_fynd=$(vale --no-exit "${tmp_disabled}" 2>&1 | grep -c "Vale.Terms" || true)
check_count_eq "T2 (post-disable Vale.Terms-fynd)" 0 "${t2_fynd}" || ok=1
mark "${ok}"

# ============================================================
# T3: Brand-rule ej maskerad av Vale.Terms-disable
# Pass-kriterium: Brand-fel rapporteras på case-brand.md med helfil-Vale.Terms-disable
# ============================================================
echo ""
echo "═══ T3: Brand-rule ej maskerad av Vale.Terms-disable ═══"
ok=0
{
    echo "<!-- vale Vale.Terms = NO -->"
    echo "<!-- T3 test: Brand ska INTE maskeras -->"
    echo ""
    cat case-brand.md
} > "${tmp_brand}"
t3_fynd=$(vale --no-exit "${tmp_brand}" 2>&1 | grep -c "Miranon.Brand" || true)
check_count_gte "T3 (Brand-fel rapporteras trots Vale.Terms-disable)" 1 "${t3_fynd}" || ok=1
mark "${ok}"

# ============================================================
# Final summary
# ============================================================
total=$((PASSED + FAILED))
echo ""
echo "═══════════════════════════════════════════"
echo "Vale L_X.2 regression test-suite: ${PASSED}/${total} PASS, ${FAILED} FAIL"
echo "═══════════════════════════════════════════"

if [[ "${FAILED}" -gt 0 ]]; then
    exit 1
fi
exit 0
