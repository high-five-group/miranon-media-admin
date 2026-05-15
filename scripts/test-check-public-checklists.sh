#!/usr/bin/env bash
# scripts/test-check-public-checklists.sh
#
# Empirisk test-suite för scripts/check-public-checklists.sh.
# 5 testfall: T1 clean-state, T2 README inject, T3 CONTRIBUTING under
# DoD-sektion (exkluderad), T4 CONTRIBUTING under annan H2 efter DoD
# (Marcus' caveat-test från K5), T5 saknad config (K7 Lesson #6).
#
# Test-isolering: skapar /tmp/k7-5-test-validator/ med git-repo +
# fixtures. Återställer (rm -rf) efter via trap. INGEN ändring av
# real-repo.
#
# Användning: bash scripts/test-check-public-checklists.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: ADR-030 § Del 1 (position #5), K7.5-retroaktiv-refactor-spec.
# Etablerad: Session 6.6 fortsättning #2 K7.5 (2026-05-15)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/k7-5-test-validator"
VALIDATOR_SRC="$REPO_ROOT/scripts/check-public-checklists.sh"
CONFIG_SRC="$REPO_ROOT/.checklist-policy.conf"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

setup_repo() {
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR" || { echo "❌ kunde ej cd till $TEST_DIR"; exit 1; }
    git init -q
    git config user.email "test@example.com"
    git config user.name "K7.5 Test"
    mkdir -p scripts docs/specs
    cp "$VALIDATOR_SRC" scripts/check-public-checklists.sh
    chmod +x scripts/check-public-checklists.sh
    cp "$CONFIG_SRC" .checklist-policy.conf
}

write_doc_clean() {
    local path=$1
    mkdir -p "$(dirname "$path")"
    {
        echo "# $path"
        echo ""
        echo "Innehåll utan unchecked items."
    } > "$path"
}

write_all_clean() {
    # Alla 5 FILES_PLAIN + CONTRIBUTING.md med ren DoD-mall
    write_doc_clean "README.md"
    write_doc_clean "CHANGELOG.md"
    write_doc_clean "SECURITY.md"
    write_doc_clean "docs/byggplan.md"
    write_doc_clean "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md"
    # CONTRIBUTING.md: ingen Definition of Done — clean baseline
    write_doc_clean "CONTRIBUTING.md"
}

run_validator() {
    bash scripts/check-public-checklists.sh 2>&1
}

check_exit() {
    local label=$1 expected=$2 actual=$3
    if [ "$actual" = "$expected" ]; then
        echo "  ✅ $label: exit=$actual"
        return 0
    fi
    echo "  ❌ $label: exit=$actual (expected $expected)"
    return 1
}

check_contains() {
    local label=$1 needle=$2 hay=$3
    if echo "$hay" | grep -qF -- "$needle"; then
        echo "  ✅ $label contains: '$needle'"
        return 0
    fi
    echo "  ❌ $label missing: '$needle'"
    echo "  ----- output -----"
    # shellcheck disable=SC2001  # sed på multi-line är klarast här
    echo "$hay" | sed 's/^/    /'
    echo "  ------------------"
    return 1
}

mark() {
    if [ "$1" -eq 0 ]; then
        PASSED=$((PASSED + 1))
        echo "  → PASS"
    else
        FAILED=$((FAILED + 1))
        echo "  → FAIL"
    fi
}

# ============================================================
# T1: clean state — alla 5 FILES_PLAIN + CONTRIBUTING utan
# unchecked items → exit 0
# ============================================================
echo ""
echo "═══ T1: clean state — inga unchecked i publika docs ═══"
setup_repo
write_all_clean
out=$(run_validator); ec=$?
ok=0
check_exit "T1" 0 "$ec" || ok=1
check_contains "T1" "No unchecked checklist items in public docs" "$out" || ok=1
mark $ok

# ============================================================
# T2: README.md inject "- [ ] test-fynd-K7.5" → exit 1 +
# fil:rad-format + faktisk item-text
# ============================================================
echo ""
echo "═══ T2: README.md inject unchecked → exit 1 + actionable ═══"
setup_repo
write_all_clean
{
    echo ""
    echo "## Inject-zon"
    echo "- [ ] test-fynd-K7.5"
} >> README.md
out=$(run_validator); ec=$?
ok=0
check_exit "T2" 1 "$ec" || ok=1
check_contains "T2 (fil:rad)" "README.md:" "$out" || ok=1
check_contains "T2 (item-text)" "test-fynd-K7.5" "$out" || ok=1
check_contains "T2 (actionable)" "Fix:" "$out" || ok=1
mark $ok

# ============================================================
# T3: CONTRIBUTING.md "## Definition of Done" + "- [ ]" UNDER
# den → exit 0 (per-sektion-skopa exkluderar)
# ============================================================
echo ""
echo "═══ T3: CONTRIBUTING inject UNDER Definition of Done → exit 0 ═══"
setup_repo
write_all_clean
{
    echo ""
    echo "## Definition of Done"
    echo ""
    echo "- [ ] dod-item-1"
    echo "- [ ] dod-item-2"
} >> CONTRIBUTING.md
out=$(run_validator); ec=$?
ok=0
check_exit "T3" 0 "$ec" || ok=1
check_contains "T3" "No unchecked checklist items in public docs" "$out" || ok=1
mark $ok

# ============================================================
# T4: CONTRIBUTING.md "## Definition of Done" + annan "## " H2
# + "- [ ]" under den → exit 1 (Marcus' caveat-test från K5)
# ============================================================
echo ""
echo "═══ T4: CONTRIBUTING inject UNDER annan H2 efter DoD → exit 1 ═══"
setup_repo
write_all_clean
{
    echo ""
    echo "## Definition of Done"
    echo ""
    echo "- [ ] dod-item-OK"
    echo ""
    echo "## Annan sektion efter DoD"
    echo ""
    echo "- [ ] should-fail-item-K7.5"
} >> CONTRIBUTING.md
out=$(run_validator); ec=$?
ok=0
check_exit "T4" 1 "$ec" || ok=1
check_contains "T4 (fil:rad)" "CONTRIBUTING.md:" "$out" || ok=1
check_contains "T4 (item-text)" "should-fail-item-K7.5" "$out" || ok=1
mark $ok

# ============================================================
# T5: saknad config — .checklist-policy.conf borttagen (K7
# Lesson #6 portabilitets-disciplin)
# ============================================================
echo ""
echo "═══ T5: saknad config — actionable error per portabilitets-disciplin ═══"
setup_repo
write_all_clean
rm .checklist-policy.conf
out=$(run_validator); ec=$?
ok=0
check_exit "T5" 1 "$ec" || ok=1
check_contains "T5 (header)" "Config saknas: .checklist-policy.conf" "$out" || ok=1
check_contains "T5 (actionable)" "Fix: skapa .checklist-policy.conf" "$out" || ok=1
mark $ok

# ============================================================
# Slutrapport
# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "RESULT: $PASSED/$TOTAL PASS, $FAILED FAIL"
echo "═══════════════════════════════════════════════════════════════"

if [ "$FAILED" -eq 0 ]; then
    exit 0
fi
exit 1
