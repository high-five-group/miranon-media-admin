#!/usr/bin/env bash
# scripts/test-check-frontmatter.sh
#
# Empirisk test-suite för scripts/check-frontmatter.sh.
# 14 testfall: T1 all-pass, T2-T7 per-check-fel, T8 multi-fel, T9
# config-saknas, T10-T12 shallow-clone-detection, T13 UTF-8-filnamn.
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
VALIDATOR_SRC="${REPO_ROOT}/scripts/check-frontmatter.sh"
CONFIG_SRC="${REPO_ROOT}/.frontmatter-policy.conf"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    # K4.2 (Session 6.6.7): explicit suffix-lista för shallow-clone-fixturer.
    # Per Chat-mediated 11/10 SKÄRPNING 2: explicit > wildcard (auditerbart,
    # inga wildcard-överreach-risker).
    rm -rf "${TEST_DIR}" \
        "${TEST_DIR}-shallow" \
        "${TEST_DIR}-shallow-override" \
        "${TEST_DIR}-shallow-250"
}
trap cleanup EXIT

# ==============================================================================
# DORMANCY-NOTE (Session 9 DEL 2 arkiverad 2026-05-29)
# ==============================================================================
# Race-fixen i setup_repo() nedan (git config gc.auto 0 + maintenance.auto 0)
# och T11b-blockets `git repack -ad` är verifierade 10/10 grön i CI på commit
# 32c953f mot ett reellt git upload-pack/pack-objects race på Ubuntu-24.04 +
# git 2.54.0. Förstapartskälla för mekanismen: git-gc(1)
# (https://git-scm.com/docs/git-gc).
#
# Testsviten själv är OWIRAD från CI sedan revert fba2624 (Session 9 DEL 2 →
# egen session). Orsak: separat CI-state-drift upptäckt 2026-05-29 — main-CI
# rapporterade deterministisk frontmatter-drift (4 filer, '2026-05-17 driftar
# från git log 2026-05-18') som inte reproducerades lokalt (5/5 CI-röd vs
# konstant lokalt grön). Bedöms som samma mönsterklass som T11b-racet:
# CI-grindar interagerar med environment-state utanför vår kontroll →
# kandidat-ADR-042-territorium för framtida session.
#
# Lesson→grind-wiring återupptas i egen session med full uppmärksamhet.
# Race-fixen vilar i scriptet — körs ej på CI efter revert, men representerar
# verifierad mekanism + förstapartskälla mot reellt race. Disciplin L53:
# öppen falsifierings/paus-trail, INTE tyst rivning.
# ==============================================================================
setup_repo() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}"
    cd "${TEST_DIR}" || { echo "❌ kunde ej cd till ${TEST_DIR}"; exit 1; }
    git init -q
    git config user.email "test@example.com"
    git config user.name "K7B Test"
    # Race-mitigering (Session 9 DEL 2 STEG 3a, VERIFIERAD MEN OATTRIBUERAD fix).
    #
    # MEKANISM (förstapartskälla, git-gc(1) verbatim):
    #   "when git gc runs concurrently with another process, there is a
    #    risk of it deleting an object that the other process is using
    #    but hasn't created a reference to. This may just cause the other
    #    process to fail."  (https://git-scm.com/docs/git-gc)
    # Matchar exakt felmodet ("remote: fatal: unable to read <SHA>" mid
    # pack-objects-streaming, olika SHA per körning). Modern git (≥2.30;
    # Ubuntu-24.04 CI runner kör 2.54.0) har TVÅ separata gc-mekanismer:
    # klassisk gc.auto + modern maintenance.auto, båda med autoDetach=true
    # som default. Båda kan triggas i bakgrund av porcelain-kommandon
    # (tight git-commit-loop) och race:a med upload-pack/pack-objects-
    # subprocess under clone.
    #
    # EMPIRI (CI-runs, samma kod, olika runner-instanser):
    #   - Före fix (commit 50b91e6, endast repack-mitigering): 8/10 grön
    #     över 10 reruns; 2/10 failure med "unable to read <SHA>"-mod.
    #   - Efter fix (commit 32c953f, båda config-raderna): 10/10 grön över
    #     10 reruns. Bortom statistisk slump.
    #
    # ÖPPEN OBEGRIPENHET (erkänd, EJ omformulerad som begripenhet):
    # Attribuering mellan gc.auto och maintenance.auto är OBESVARAD. Försök
    # till isolering på separat branch via draft-PR (DEL 2 STEG 3a-isolering,
    # variant A: bara gc.auto 0) blockerades av pull_request-mode-checkout-
    # artefakt: actions/checkout@v6 på pull_request-trigger checkar ut
    # refs/pull/N/merge (simulated merge commit) → git log -1 --format=%cs
    # ger committer-datum för simulated-merge istället för fil-edit-datum
    # → check-frontmatter-validatorn failade tidigt i lint-jobbet → T11b
    # kördes aldrig → inga attribuerings-datapunkter. PR-mekanismen för
    # isolering är operativt blockerad.
    #
    # Båda raderna behålls utan att hävda att redundansen är förstådd:
    # verifierad fix utan attribuering ≠ begripen determinism. Vi vet att
    # KOMBINATIONEN eliminerar racet (10/10); vi vet INTE vilken av de två
    # som är dominant eller om båda krävs. Detta erkänns öppet.
    git config gc.auto 0
    git config maintenance.auto 0
    mkdir -p scripts
    cp "${VALIDATOR_SRC}" scripts/check-frontmatter.sh
    chmod +x scripts/check-frontmatter.sh
    cp "${CONFIG_SRC}" .frontmatter-policy.conf
}

write_doc() {
    local path=$1 owner=$2 updated=$3 review_by=$4 status=$5
    mkdir -p "$(dirname "${path}")"
    {
        echo "---"
        echo "owner: ${owner}"
        echo "updated: ${updated}"
        echo "review_by: ${review_by}"
        echo "status: ${status}"
        echo "---"
        echo ""
        echo "# ${path}"
    } > "${path}"
}

write_doc_no_field() {
    # Skapar doc med 3 fält av 4 — utelämnar ett fält per parameter
    local path=$1 omit=$2
    local today; today=$(date +%F)
    mkdir -p "$(dirname "${path}")"
    {
        echo "---"
        [[ "${omit}" != "owner" ]] && echo "owner: marcus803"
        [[ "${omit}" != "updated" ]] && echo "updated: ${today}"
        [[ "${omit}" != "review_by" ]] && echo "review_by: 2027-12-31"
        [[ "${omit}" != "status" ]] && echo "status: stable"
        echo "---"
        echo ""
        echo "# ${path}"
    } > "${path}"
}

write_doc_no_frontmatter() {
    local path=$1
    mkdir -p "$(dirname "${path}")"
    echo "# ${path} — no frontmatter at top" > "${path}"
}

write_all_valid() {
    local today; today=$(date +%F)
    write_doc "CLAUDE.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "ORDLISTA.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/byggplan.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/specs/KVALITETSDEFINITIONER-11-REACT.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/specs/SECURITY-SPEC.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/reference/hur-systemet-funkar.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/reference/data-model.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/reference/airtable-constraints.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/reference/airtable-interaction.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/reference/systemet.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/reference/segment-arkitektur.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "tasks/lessons.md" "marcus803" "${today}" "2027-12-31" "stable"
    write_doc "docs/decisions/README.md" "marcus803" "${today}" "2027-12-31" "stable"
}

run_validator() {
    bash scripts/check-frontmatter.sh 2>&1
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
    # `--` terminerar grep-options; mönster kan börja med `-` (BSD grep)
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ✅ ${label} contains: '${needle}'"
        return 0
    fi
    echo "  ❌ ${label} missing: '${needle}'"
    echo "  ----- output -----"
    # shellcheck disable=SC2001  # sed på multi-line är klarast här
    echo "${hay}" | sed 's/^/    /'
    echo "  ------------------"
    return 1
}

check_not_contains() {
    local label=$1 needle=$2 hay=$3
    # K4.2 (Session 6.6.7): NOT-match-assertion för shallow-detection-regressions-skydd
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ❌ ${label} NOT-match failed: '${needle}' found unexpectedly"
        echo "  ----- output -----"
        # shellcheck disable=SC2001  # sed på multi-line är klarast här
        echo "${hay}" | sed 's/^/    /'
        echo "  ------------------"
        return 1
    fi
    echo "  ✅ ${label} NOT-match: '${needle}' correctly absent"
    return 0
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

# ============================================================
# T1: all-pass — alla 14 styrande docs valid
# ============================================================
echo ""
echo "═══ T1: all-pass — alla 14 styrande docs har valid frontmatter ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t1" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1" "Frontmatter-validering: alla 14 styrande docs passerar" "${out}" || ok=1
mark "${ok}"

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
check_exit "T2" 1 "${ec}" || ok=1
check_contains "T2" "CLAUDE.md:1 — Check 1 (existens): frontmatter saknas" "${out}" || ok=1
mark "${ok}"

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
check_exit "T3" 1 "${ec}" || ok=1
check_contains "T3" "CLAUDE.md — Check 2 (updated): fält saknas" "${out}" || ok=1
mark "${ok}"

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
check_exit "T4" 1 "${ec}" || ok=1
check_contains "T4" "CLAUDE.md — Check 2 (updated): '2026-04-01' driftar från git log" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T5: review_by passerat
# ============================================================
echo ""
echo "═══ T5: review_by passerat — Check 3 (review_by har passerat) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "marcus803" "${TODAY}" "2025-01-01" "stable"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t5" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T5" 1 "${ec}" || ok=1
check_contains "T5" "CLAUDE.md — Check 3 (review_by): '2025-01-01' har passerat" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T6: status-enum invalid
# ============================================================
echo ""
echo "═══ T6: status-enum invalid — Check 4 (status enum) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "marcus803" "${TODAY}" "2027-12-31" "published"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t6" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T6" 1 "${ec}" || ok=1
check_contains "T6" "CLAUDE.md — Check 4 (status): 'published'" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T7: owner-enum invalid
# ============================================================
echo ""
echo "═══ T7: owner-enum invalid — Check 5 (owner enum) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "someone-else" "${TODAY}" "2027-12-31" "stable"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t7" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T7" 1 "${ec}" || ok=1
check_contains "T7" "CLAUDE.md — Check 5 (owner): 'someone-else'" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T8: multipla fel — 3 olika fel samtidigt på en fil
# ============================================================
echo ""
echo "═══ T8: multipla fel — owner-bad + status-bad + review_by-past ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "CLAUDE.md" "wrong-user" "${TODAY}" "2024-01-01" "published"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t8" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T8" 1 "${ec}" || ok=1
check_contains "T8 (owner)" "CLAUDE.md — Check 5 (owner): 'wrong-user'" "${out}" || ok=1
check_contains "T8 (status)" "CLAUDE.md — Check 4 (status): 'published'" "${out}" || ok=1
check_contains "T8 (review_by)" "CLAUDE.md — Check 3 (review_by): '2024-01-01' har passerat" "${out}" || ok=1
mark "${ok}"

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
check_exit "T9" 1 "${ec}" || ok=1
check_contains "T9" "Config saknas: .frontmatter-policy.conf" "${out}" || ok=1
check_contains "T9 (actionable)" "Fix: skapa .frontmatter-policy.conf" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T10: unsafe-shallow hard-fail (depth=1, explicit override threshold=250)
# ============================================================
# K4.2 (Session 6.6.7): testar K4.1.1 hybrid-detection count-check.
# is-shallow=true, count=1, threshold=250 → hard-fail.
# Session 22 (ADR-054): live-default är nu 0 (no-op shallow-detektion). Testet
# självförsörjer en explicit positiv tröskel (250) så hard-fail-LOGIKEN — som
# står kvar i koden tills tråd T08 avvecklar apparaten — förblir regression-
# testad oberoende av live-värdet, utan att ljuga om sin testperson.
echo ""
echo "═══ T10: unsafe-shallow hard-fail (depth=1, explicit override threshold=250) ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t10" >/dev/null 2>&1

# Skapa shallow clone (depth=1) från fixture.
# Härdning per Session 9 DEL 2 STEG 2a: explicit clone-exit-check + stderr-
# fångst. Stderr får ALDRIG sväljas; ett test vars felmeddelande pekar på
# fel steg (t.ex. "cd failed" när orsaken är clone-fail) döljer sin egen
# defekt och är icke-deterministiskt för CI-grindar (ADR-039).
rm -rf "${TEST_DIR}-shallow"
T10_CLONE_ERR=$(mktemp)
if ! git clone --depth=1 "file://${TEST_DIR}" "${TEST_DIR}-shallow" >/dev/null 2>"${T10_CLONE_ERR}"; then
    echo "❌ T10 clone failed:"
    sed 's/^/    /' "${T10_CLONE_ERR}"
    rm -f "${T10_CLONE_ERR}"
    exit 1
fi
rm -f "${T10_CLONE_ERR}"
cp "${VALIDATOR_SRC}" "${TEST_DIR}-shallow/scripts/check-frontmatter.sh"
# Explicit override-tröskel 250 (frikopplad från live-default, som är 0 sedan
# ADR-054). Behåller testpersonen för hard-fail-logiken vid värde-skiftet.
cat > "${TEST_DIR}-shallow/.frontmatter-policy.conf" << 'EOF'
# shellcheck shell=bash
# shellcheck disable=SC2034
FRONTMATTER_GOVERNING_DOCS=(
    "CLAUDE.md"
    "docs/byggplan.md"
    "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md"
    "docs/specs/KVALITETSDEFINITIONER-11-REACT.md"
    "docs/specs/SECURITY-SPEC.md"
    "docs/reference/hur-systemet-funkar.md"
    "docs/reference/data-model.md"
    "tasks/lessons.md"
    "docs/decisions/README.md"
)
FRONTMATTER_VALID_OWNER="marcus803"
FRONTMATTER_VALID_STATUS=("draft" "stable" "deprecated")
FRONTMATTER_MIN_HISTORY_DEPTH=250
EOF

cd "${TEST_DIR}-shallow" || { echo "❌ T10 cd failed (post-clone — clone returnerade 0 men dest saknas)"; exit 1; }
out=$(bash scripts/check-frontmatter.sh 2>&1); ec=$?
cd "${TEST_DIR}" || exit 1

ok=0
check_exit "T10" 1 "${ec}" || ok=1
check_contains "T10 (unsafe-msg)" "Unsafe-shallow clone detected (depth=1 < 250)" "${out}" || ok=1
# SKÄRPNING 1: success-message ska INTE finnas (hard-fail före success-rad)
check_not_contains "T10 (success-absent)" "Frontmatter-validering: alla 9 styrande docs passerar" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T11a: threshold-config-respekt (depth=1, override threshold=1)
# ============================================================
# K4.2 (Session 6.6.7): testar K4.1.1 hybrid-detection threshold-respekt.
# is-shallow=true, count=1, threshold=1 (override) → NOT-unsafe (count NOT-lt threshold).
echo ""
echo "═══ T11a: threshold-config-respekt (depth=1, override threshold=1) ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t11a" >/dev/null 2>&1

rm -rf "${TEST_DIR}-shallow-override"
# Härdning per Session 9 DEL 2 STEG 2a (se T10-block för rationale).
T11A_CLONE_ERR=$(mktemp)
if ! git clone --depth=1 "file://${TEST_DIR}" "${TEST_DIR}-shallow-override" >/dev/null 2>"${T11A_CLONE_ERR}"; then
    echo "❌ T11a clone failed:"
    sed 's/^/    /' "${T11A_CLONE_ERR}"
    rm -f "${T11A_CLONE_ERR}"
    exit 1
fi
rm -f "${T11A_CLONE_ERR}"
cp "${VALIDATOR_SRC}" "${TEST_DIR}-shallow-override/scripts/check-frontmatter.sh"
# Override-config: threshold=1 (count=1 NOT-lt 1 → INTE unsafe)
cat > "${TEST_DIR}-shallow-override/.frontmatter-policy.conf" << 'EOF'
# shellcheck shell=bash
# shellcheck disable=SC2034
FRONTMATTER_GOVERNING_DOCS=(
    "CLAUDE.md"
    "docs/byggplan.md"
    "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md"
    "docs/specs/KVALITETSDEFINITIONER-11-REACT.md"
    "docs/specs/SECURITY-SPEC.md"
    "docs/reference/hur-systemet-funkar.md"
    "docs/reference/data-model.md"
    "tasks/lessons.md"
    "docs/decisions/README.md"
)
FRONTMATTER_VALID_OWNER="marcus803"
FRONTMATTER_VALID_STATUS=("draft" "stable" "deprecated")
FRONTMATTER_MIN_HISTORY_DEPTH=1
EOF

cd "${TEST_DIR}-shallow-override" || { echo "❌ T11a cd failed"; exit 1; }
out=$(bash scripts/check-frontmatter.sh 2>&1); ec=$?
cd "${TEST_DIR}" || exit 1

ok=0
check_exit "T11a" 0 "${ec}" || ok=1
check_not_contains "T11a (no-unsafe)" "Unsafe-shallow clone detected" "${out}" || ok=1
check_contains "T11a (success)" "Frontmatter-validering: alla 9 styrande docs passerar" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T11b: safe-shallow edge-case (depth=250, explicit override threshold=250)
# ============================================================
# K4.2 (Session 6.6.7) + K0.S2 + Session 9 DEL 2.5: testar K4.1.1 hybrid-
# detection safe-shallow. is-shallow=true, count=250, threshold=250
# → NOT-unsafe (count NOT-lt 250). count == MIN_DEPTH testar edge-case
# "safe-shallow vid exakt tröskel".
#
# Session 22 (ADR-054): live-default är nu 0 (no-op shallow-detektion). Testet
# självförsörjer en explicit tröskel (250) som matchar dess 250-commit-fixtur,
# så edge-case-logiken förblir testad oberoende av live-värdet — testet ljuger
# inte om sin testperson efter värde-skiftet (250 → 0).
echo ""
echo "═══ T11b: safe-shallow edge-case (depth=250, explicit override threshold=250) ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t11b-base" >/dev/null 2>&1

# Bygg 249 extra commits → total 250 (safe-shallow vid tröskel 250, Session 9)
for i in $(seq 1 249); do
    echo "commit-${i}" >> .commit-counter
    git add .commit-counter >/dev/null 2>&1
    git commit -q -m "extra-${i}" >/dev/null 2>&1
done

# Verifiera count = 250
ACTUAL_COUNT=$(git rev-list --count HEAD)
if [[ "${ACTUAL_COUNT}" -ne 250 ]]; then
    echo "❌ T11b fixture-setup-fel: förvänta 250 commits, fick ${ACTUAL_COUNT}"
    exit 1
fi

# Race-mitigering före clone (Session 9 DEL 2 STEG 3, rotorsak verifierad).
# Tight commit-loop ovan skapar ~750 loose objects (3 per commit × 250).
# file://-URL-form (vi använder URL specifikt för att UNDVIKA --local-
# optimering och simulera transport-semantik per T11b:s testsyfte) får
# git-clone att spawna git-upload-pack som SUBPROCESS på src-repot. Race-
# fönster: upload-pack kan försöka läsa ett loose object som ännu inte är
# fs-synkat → "fatal: unable to read <SHA>" → fetch-pack early EOF →
# invalid index-pack.
# Empiriskt fångat run 26573910841 attempt 3 (1/6 = ~17% failure rate vid
# 100-commit-loop; samma race-mekanism gäller vid 250-commit-loop).
# Mitigering: packa alla loose objects till en single pack-fil atomiskt
# FÖRE clone — upload-pack läser då deterministiskt från pack-fil istället
# för 750+ loose objects.
# Källa: git-clone(1), --local-sektionen verbatim: "this operation can race
# with concurrent modification to the source repository, similar to running
# cp -r <src> <dst> while modifying <src>" (git-scm.com/docs/git-clone).
git repack -ad >/dev/null

rm -rf "${TEST_DIR}-shallow-250"
# Härdning per Session 9 DEL 2 STEG 2a (se T10-block för rationale).
# Stderr får ALDRIG sväljas; "cd failed" får inte vara förklädnad för
# clone-fail. Detta var bug:en som flappade i run 26573059441.
T11B_CLONE_ERR=$(mktemp)
if ! git clone --depth=250 "file://${TEST_DIR}" "${TEST_DIR}-shallow-250" >/dev/null 2>"${T11B_CLONE_ERR}"; then
    echo "❌ T11b clone failed:"
    sed 's/^/    /' "${T11B_CLONE_ERR}"
    rm -f "${T11B_CLONE_ERR}"
    exit 1
fi
rm -f "${T11B_CLONE_ERR}"
cp "${VALIDATOR_SRC}" "${TEST_DIR}-shallow-250/scripts/check-frontmatter.sh"
# Explicit override-tröskel 250 (frikopplad från live-default, som är 0 sedan
# ADR-054) — matchar 250-commit-fixturen så edge-caset "count == tröskel" består.
cat > "${TEST_DIR}-shallow-250/.frontmatter-policy.conf" << 'EOF'
# shellcheck shell=bash
# shellcheck disable=SC2034
FRONTMATTER_GOVERNING_DOCS=(
    "CLAUDE.md"
    "docs/byggplan.md"
    "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md"
    "docs/specs/KVALITETSDEFINITIONER-11-REACT.md"
    "docs/specs/SECURITY-SPEC.md"
    "docs/reference/hur-systemet-funkar.md"
    "docs/reference/data-model.md"
    "tasks/lessons.md"
    "docs/decisions/README.md"
)
FRONTMATTER_VALID_OWNER="marcus803"
FRONTMATTER_VALID_STATUS=("draft" "stable" "deprecated")
FRONTMATTER_MIN_HISTORY_DEPTH=250
EOF

cd "${TEST_DIR}-shallow-250" || { echo "❌ T11b cd failed (post-clone — clone returnerade 0 men dest saknas)"; exit 1; }
out=$(bash scripts/check-frontmatter.sh 2>&1); ec=$?
cd "${TEST_DIR}" || exit 1

ok=0
check_exit "T11b" 0 "${ec}" || ok=1
check_not_contains "T11b (no-unsafe)" "Unsafe-shallow clone detected" "${out}" || ok=1
check_contains "T11b (success)" "Frontmatter-validering: alla 9 styrande docs passerar" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T12: full clone edge-case (count=1, is-shallow=false)
# ============================================================
# K4.2 (Session 6.6.7): testar K4.1.1 hybrid-detection is-shallow-check.
# is-shallow=false (nytt repo), count=1, threshold=250 → NOT-unsafe.
# Regressions-skydd för K4.1-bug-mönstret (is-shallow=false ska
# ALDRIG trigga hard-fail oavsett count).
echo ""
echo "═══ T12: full clone edge-case (count=1, is-shallow=false) ═══"
setup_repo
write_all_valid
git add . >/dev/null 2>&1
git commit -q -m "fixture-t12" >/dev/null 2>&1

out=$(run_validator); ec=$?
ok=0
check_exit "T12" 0 "${ec}" || ok=1
check_not_contains "T12 (no-unsafe)" "Unsafe-shallow clone detected" "${out}" || ok=1
check_contains "T12 (success)" "Frontmatter-validering: alla 14 styrande docs passerar" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T13: UTF-8-filnamn — v3.md valideras (ej tyst skippad)
# ============================================================
# Regression-skydd för UTF-8-blind-spot-klass (Session 6.6.6 K0.3).
# Bevisar att check-frontmatter.sh faktiskt validerar svensk-tecken-
# paths — INTE bara att exit 0 nås. T1 täcker redan valid-v3.md →
# exit 0, men kan ej skilja "validerad" från "tyst skippad" (en
# skippad fil ger också "inget fel"). T13 introducerar ett deliberat
# Check 5-fel i ENBART v3.md → felet MÅSTE flaggas med v3.md-specifik
# path. Om UTF-8-iteration regresserar (fil tyst skippad) → inget
# fel rapporteras → T13 fångar det.
# ============================================================
echo ""
echo "═══ T13: UTF-8-filnamn — v3.md valideras (ej tyst skippad) ═══"
setup_repo
write_all_valid
TODAY=$(date +%F)
write_doc "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md" "wrong-owner" "${TODAY}" "2027-12-31" "stable"
git add . >/dev/null 2>&1
git commit -q -m "fixture-t13" >/dev/null 2>&1
out=$(run_validator); ec=$?
ok=0
check_exit "T13" 1 "${ec}" || ok=1
check_contains "T13 (v3.md flaggad)" "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md — Check 5 (owner): 'wrong-owner'" "${out}" || ok=1
mark "${ok}"

# ============================================================
# Slutrapport
# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
echo "═══════════════════════════════════════════════════════════════"

if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
