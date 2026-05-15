#!/usr/bin/env bash
# scripts/test-check-frontmatter.sh
#
# Empirisk test-suite för scripts/check-frontmatter.sh.
# 9 testfall: T1 all-pass, T2-T7 per-check-fel, T8 multi-fel, T9 config-saknas.
#
# Test-isolering: skapar /tmp/k7b-test-validator/ med git-repo + fixtures.
# Återställer (rm -rf) efter via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-frontmatter.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: ADR-030 § Del 3, K7.B-spec.
# Etablerad: Session 6.6 K7 (2026-05-14)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/k7b-test-validator"
VALIDATOR_SRC="$REPO_ROOT/scripts/check-frontmatter.sh"
CONFIG_SRC="$REPO_ROOT/.frontmatter-policy.conf"

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
    git config user.name "K7B Test"
    mkdir -p scripts
    cp "$VALIDATOR_SRC" scripts/check-frontmatter.sh
    chmod +x scripts/check-frontmatter.sh
    cp "$CONFIG_SRC" .frontmatter-policy.conf
}

write_doc() {
    local path=$1 owner=$2 updated=$3 review_by=$4 status=$5
    mkdir -p "$(dirname "$path")"
    {
        echo "---"
        echo "owner: $owner"
        echo "updated: $updated"
        echo "review_by: $review_by"
        echo "status: $status"
        echo "---"
        echo ""
        echo "# $path"
    } > "$path"
}

write_doc_no_field() {
    # Skapar doc med 3 fält av 4 — utelämnar ett fält per parameter
    local path=$1 omit=$2
    local today; today=$(date +%F)
    mkdir -p "$(dirname "$path")"
    {
        echo "---"
        [ "$omit" != "owner" ] && echo "owner: marcus803"
        [ "$omit" != "updated" ] && echo "updated: $today"
        [ "$omit" != "review_by" ] && echo "review_by: 2027-12-31"
        [ "$omit" != "status" ] && echo "status: stable"
        echo "---"
        echo ""
        echo "# $path"
    } > "$path"
}

write_doc_no_frontmatter() {
    local path=$1
    mkdir -p "$(dirname "$path")"
    echo "# $path — no frontmatter at top" > "$path"
}

write_all_valid() {
    local today; today=$(date +%F)
    write_doc "CLAUDE.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/byggplan.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/specs/KVALITETSDEFINITIONER-11-REACT.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/specs/SECURITY-SPEC.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/reference/hur-systemet-funkar.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/reference/data-model.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "tasks/lessons.md" "marcus803" "$today" "2027-12-31" "stable"
    write_doc "docs/decisions/README.md" "marcus803" "$today" "2027-12-31" "stable"
}

run_validator() {
    bash scripts/check-frontmatter.sh 2>&1
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
    # `--` terminerar grep-options; mönster kan börja med `-` (BSD grep)
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
# T1: all-pass — alla 9 styrande docs valid
# ============================================================
echo ""
echo "═══ T1: all-pass — alla 9 styrande docs har valid frontmatter ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t1" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T1" 0 "$ec" || ok=1
check_contains "T1" "Frontmatter-validering: alla 9 styrande docs passerar" "$out" || ok=1
mark $ok

# ============================================================
# T2: saknad frontmatter — CLAUDE.md utan --- top-block
# ============================================================
echo ""
echo "═══ T2: saknad frontmatter — Check 1 (existens) ═══"
setup_repo
write_all_valid
write_doc_no_frontmatter "CLAUDE.md"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t2" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T2" 1 "$ec" || ok=1
check_contains "T2" "CLAUDE.md:1 — Check 1 (existens): frontmatter saknas" "$out" || ok=1
mark $ok

# ============================================================
# T3: saknat updated-fält
# ============================================================
echo ""
echo "═══ T3: saknat updated-fält — Check 2 (updated fält saknas) ═══"
setup_repo
write_all_valid
write_doc_no_field "CLAUDE.md" "updated"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t3" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T3" 1 "$ec" || ok=1
check_contains "T3" "CLAUDE.md — Check 2 (updated): fält saknas" "$out" || ok=1
mark $ok

# ============================================================
# T4: updated driftar — gammal updated vs nyare git log
# ============================================================
echo ""
echo "═══ T4: updated driftar — Check 2 (updated driftar) ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t4-base" >/dev/null 2>&1
# Modifiera CLAUDE.md till gammalt datum (working tree only, INTE commitad)
write_doc "CLAUDE.md" "marcus803" "2026-04-01" "2027-12-31" "stable"
out=$(run_validator); ec=$?
ok=0
check_exit "T4" 1 "$ec" || ok=1
check_contains "T4" "CLAUDE.md — Check 2 (updated): '2026-04-01' driftar från git log" "$out" || ok=1
mark $ok

# ============================================================
# T5: review_by passerat
# ============================================================
echo ""
echo "═══ T5: review_by passerat — Check 3 (review_by har passerat) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "marcus803" "$TODAY" "2025-01-01" "stable"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t5" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T5" 1 "$ec" || ok=1
check_contains "T5" "CLAUDE.md — Check 3 (review_by): '2025-01-01' har passerat" "$out" || ok=1
mark $ok

# ============================================================
# T6: status-enum invalid
# ============================================================
echo ""
echo "═══ T6: status-enum invalid — Check 4 (status enum) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "marcus803" "$TODAY" "2027-12-31" "published"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t6" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T6" 1 "$ec" || ok=1
check_contains "T6" "CLAUDE.md — Check 4 (status): 'published'" "$out" || ok=1
mark $ok

# ============================================================
# T7: owner-enum invalid
# ============================================================
echo ""
echo "═══ T7: owner-enum invalid — Check 5 (owner enum) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "someone-else" "$TODAY" "2027-12-31" "stable"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t7" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T7" 1 "$ec" || ok=1
check_contains "T7" "CLAUDE.md — Check 5 (owner): 'someone-else'" "$out" || ok=1
mark $ok

# ============================================================
# T8: multipla fel — 3 olika fel samtidigt på en fil
# ============================================================
echo ""
echo "═══ T8: multipla fel — owner-bad + status-bad + review_by-past ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "wrong-user" "$TODAY" "2024-01-01" "published"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t8" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T8" 1 "$ec" || ok=1
check_contains "T8 (owner)" "CLAUDE.md — Check 5 (owner): 'wrong-user'" "$out" || ok=1
check_contains "T8 (status)" "CLAUDE.md — Check 4 (status): 'published'" "$out" || ok=1
check_contains "T8 (review_by)" "CLAUDE.md — Check 3 (review_by): '2024-01-01' har passerat" "$out" || ok=1
mark $ok

# ============================================================
# T9: saknad config — .frontmatter-policy.conf borttagen (K7 Lesson #6)
# ============================================================
echo ""
echo "═══ T9: saknad config — actionable error per portabilitets-disciplin ═══"
setup_repo
write_all_valid
rm .frontmatter-policy.conf
out=$(run_validator); ec=$?
ok=0
check_exit "T9" 1 "$ec" || ok=1
check_contains "T9" "Config saknas: .frontmatter-policy.conf" "$out" || ok=1
check_contains "T9 (actionable)" "Fix: skapa .frontmatter-policy.conf" "$out" || ok=1
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
