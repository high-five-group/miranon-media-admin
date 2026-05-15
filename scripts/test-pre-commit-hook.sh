#!/usr/bin/env bash
# scripts/test-pre-commit-hook.sh
#
# Empirisk test-suite för .githooks/pre-commit.
# 8 testfall: T1 idempotent, T2 bump, T3 non-styrande, T4 multi-fil,
# T5 --amend, T6 --no-verify, T7 utan frontmatter, T8 config saknas.
#
# Test-isolering: skapar /tmp/k7b-test-hook/ med git-repo + hook-fixture.
# Sätter `git config core.hooksPath .githooks` LOKALT i test-repo,
# INTE i real-repo. Återställer (rm -rf) efter via trap.
#
# Användning: bash scripts/test-pre-commit-hook.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: ADR-030 § Del 3, K7.B-spec.
# Etablerad: Session 6.6 K7 (2026-05-14)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/k7b-test-hook"
HOOK_SRC="$REPO_ROOT/.githooks/pre-commit"
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
    local include_config=${1:-yes}
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR" || { echo "❌ kunde ej cd till $TEST_DIR"; exit 1; }
    git init -q
    git config user.email "test@example.com"
    git config user.name "K7B Test"
    # Init-commit så HEAD existerar (krävs av T5 --amend)
    echo "init" > .gitinit
    git add .gitinit >/dev/null 2>&1
    # --no-verify på init-commit för att slippa hook innan setup färdig
    git commit -q --no-verify -m "init" >/dev/null 2>&1
    rm .gitinit
    mkdir -p .githooks
    cp "$HOOK_SRC" .githooks/pre-commit
    chmod +x .githooks/pre-commit
    git config core.hooksPath .githooks
    if [ "$include_config" = "yes" ]; then
        cp "$CONFIG_SRC" .frontmatter-policy.conf
    fi
}

write_doc() {
    local path=$1 updated=$2
    mkdir -p "$(dirname "$path")"
    {
        echo "---"
        echo "owner: marcus803"
        echo "updated: $updated"
        echo "review_by: 2027-12-31"
        echo "status: stable"
        echo "---"
        echo ""
        echo "# $path"
    } > "$path"
}

write_doc_no_frontmatter() {
    local path=$1
    mkdir -p "$(dirname "$path")"
    echo "# $path — without frontmatter" > "$path"
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

check_not_contains() {
    local label=$1 needle=$2 hay=$3
    if echo "$hay" | grep -qF -- "$needle"; then
        echo "  ❌ $label unexpectedly contains: '$needle'"
        return 1
    fi
    echo "  ✅ $label does NOT contain: '$needle'"
    return 0
}

check_head_updated() {
    local label=$1 path=$2 expected=$3
    local actual
    actual=$(git show "HEAD:$path" 2>/dev/null | grep -E "^updated:" | head -1 | sed -E 's/^updated:[[:space:]]*//')
    if [ "$actual" = "$expected" ]; then
        echo "  ✅ $label: HEAD:$path updated=$actual"
        return 0
    fi
    echo "  ❌ $label: HEAD:$path updated=$actual (expected $expected)"
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

TODAY=$(date +%F)

# ============================================================
# T1: idempotent — updated:TODAY redan, hook gör inget
# ============================================================
echo ""
echo "═══ T1: idempotent — updated:$TODAY redan, ingen bump ═══"
setup_repo
write_doc "CLAUDE.md" "$TODAY"
git add CLAUDE.md >/dev/null 2>&1
out=$(git commit -m "t1" 2>&1); ec=$?
ok=0
check_exit "T1" 0 "$ec" || ok=1
check_not_contains "T1 (hook silent)" "auto-bumpade" "$out" || ok=1
check_head_updated "T1" "CLAUDE.md" "$TODAY" || ok=1
mark $ok

# ============================================================
# T2: bump — updated:2026-04-01, hook bumpar till TODAY
# ============================================================
echo ""
echo "═══ T2: bump — gammalt updated, hook bumpar till $TODAY ═══"
setup_repo
write_doc "CLAUDE.md" "2026-04-01"
git add CLAUDE.md >/dev/null 2>&1
out=$(git commit -m "t2" 2>&1); ec=$?
ok=0
check_exit "T2" 0 "$ec" || ok=1
check_contains "T2 (bump rapport)" "auto-bumpade 'updated' → $TODAY" "$out" || ok=1
check_contains "T2 (fil listad)" "- CLAUDE.md" "$out" || ok=1
check_head_updated "T2" "CLAUDE.md" "$TODAY" || ok=1
mark $ok

# ============================================================
# T3: non-styrande skip — random.md ignoreras
# ============================================================
echo ""
echo "═══ T3: non-styrande skip — random.md i staged, ingen bump ═══"
setup_repo
echo "# Random non-governing file" > random.md
git add random.md >/dev/null 2>&1
out=$(git commit -m "t3" 2>&1); ec=$?
ok=0
check_exit "T3" 0 "$ec" || ok=1
check_not_contains "T3 (hook ignorerar)" "auto-bumpade" "$out" || ok=1
mark $ok

# ============================================================
# T4: multi-fil — 2 styrande docs med olika gamla datum
# ============================================================
echo ""
echo "═══ T4: multi-fil — 2 styrande docs bumpas oberoende ═══"
setup_repo
write_doc "CLAUDE.md" "2026-04-01"
write_doc "docs/byggplan.md" "2026-03-15"
git add CLAUDE.md docs/byggplan.md >/dev/null 2>&1
out=$(git commit -m "t4" 2>&1); ec=$?
ok=0
check_exit "T4" 0 "$ec" || ok=1
check_contains "T4 (rapport CLAUDE)" "- CLAUDE.md" "$out" || ok=1
check_contains "T4 (rapport byggplan)" "- docs/byggplan.md" "$out" || ok=1
check_head_updated "T4 (CLAUDE)" "CLAUDE.md" "$TODAY" || ok=1
check_head_updated "T4 (byggplan)" "docs/byggplan.md" "$TODAY" || ok=1
mark $ok

# ============================================================
# T5: --amend — nytt fil staged via amend bumpas
# ============================================================
echo ""
echo "═══ T5: --amend — nytt fil staged via --amend bumpas ═══"
setup_repo
# Steg 1: commita CLAUDE.md med TODAY (ingen bump)
write_doc "CLAUDE.md" "$TODAY"
git add CLAUDE.md >/dev/null 2>&1
git commit -q -m "t5-base" >/dev/null 2>&1
# Steg 2: staga byggplan.md med gammalt datum + --amend
write_doc "docs/byggplan.md" "2026-04-01"
git add docs/byggplan.md >/dev/null 2>&1
out=$(git commit --amend --no-edit 2>&1); ec=$?
ok=0
check_exit "T5" 0 "$ec" || ok=1
check_contains "T5 (rapport byggplan)" "- docs/byggplan.md" "$out" || ok=1
check_head_updated "T5 (byggplan)" "docs/byggplan.md" "$TODAY" || ok=1
check_head_updated "T5 (CLAUDE oförändrad)" "CLAUDE.md" "$TODAY" || ok=1
mark $ok

# ============================================================
# T6: --no-verify bypass — hook körs INTE
# ============================================================
echo ""
echo "═══ T6: --no-verify bypass — hook körs ej, gammalt datum bevaras ═══"
setup_repo
write_doc "CLAUDE.md" "2026-04-01"
git add CLAUDE.md >/dev/null 2>&1
out=$(git commit --no-verify -m "t6" 2>&1); ec=$?
ok=0
check_exit "T6" 0 "$ec" || ok=1
check_not_contains "T6 (hook ej körts)" "auto-bumpade" "$out" || ok=1
check_head_updated "T6 (gammalt datum bevarat)" "CLAUDE.md" "2026-04-01" || ok=1
mark $ok

# ============================================================
# T7: ingen frontmatter — styrande doc utan --- block
# ============================================================
echo ""
echo "═══ T7: ingen frontmatter — styrande doc utan ---, hook skippar ═══"
setup_repo
write_doc_no_frontmatter "CLAUDE.md"
git add CLAUDE.md >/dev/null 2>&1
out=$(git commit -m "t7" 2>&1); ec=$?
ok=0
check_exit "T7" 0 "$ec" || ok=1
check_not_contains "T7 (hook skippar)" "auto-bumpade" "$out" || ok=1
# Verifiera filen committad orörd
head_content=$(git show HEAD:CLAUDE.md 2>/dev/null)
if echo "$head_content" | grep -qF "without frontmatter"; then
    echo "  ✅ T7: fil committad orörd (utan frontmatter)"
else
    echo "  ❌ T7: fil modifierad oväntat"
    ok=1
fi
mark $ok

# ============================================================
# T8: saknad config — ingen .frontmatter-policy.conf, hook tyst skip
# ============================================================
echo ""
echo "═══ T8: saknad config — hook tyst skip (säker fail-mode) ═══"
setup_repo "no"
write_doc "CLAUDE.md" "2026-04-01"
git add CLAUDE.md >/dev/null 2>&1
out=$(git commit -m "t8" 2>&1); ec=$?
ok=0
check_exit "T8" 0 "$ec" || ok=1
check_not_contains "T8 (hook tyst)" "auto-bumpade" "$out" || ok=1
check_head_updated "T8 (gammalt datum bevarat)" "CLAUDE.md" "2026-04-01" || ok=1
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
