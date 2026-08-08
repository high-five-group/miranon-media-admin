#!/usr/bin/env bash
# scripts/test-check-lesson-numbers.sh
#
# Empirisk test-suite för scripts/check-lesson-numbers.sh (ADR-081-grind).
# 8 testfall: T1 rent, T2 dubblett (samma fil), T3 numrerat fragment,
# T4 nummerlöst fragment, T5 README-exklusion, T6 config saknas,
# T7 dubblett TVÄRS ÖVER två volymfiler, T8 unika nummer spridda över tre
# volymfiler → exit 0. T7/T8 tillagda TASK-161.9 (2026-08-08) när
# LESSON_FILE_GLOB ersatte LESSON_FILE — den nya kapaciteten (skanna flera
# filer som EN mängd) är annars obevisad i endera riktningen.
#
# Test-isolering: skapar /tmp/s91-test-lesson-numbers/ med lessons-fixtur +
# fragment-katalog. Återställer (rm -rf) via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-lesson-numbers.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-081-nummer-tilldelas-vid-landning.md
# Etablerad: Session 91 (mekaniseringens punkt 6)
# Utökad: TASK-161.9 (glob-stöd, ADR-085-volymformen)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s91-test-lesson-numbers"
GATE_SRC="${REPO_ROOT}/scripts/check-lesson-numbers.sh"

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
    mkdir -p "${TEST_DIR}/scripts" "${TEST_DIR}/tasks"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-lesson-numbers.sh"
    chmod +x "${TEST_DIR}/scripts/check-lesson-numbers.sh"
    write_config
}

write_config() {
    cat > "${TEST_DIR}/.lesson-policy.conf" <<'CONF'
LESSON_FILE_GLOB="tasks/lessons.md"
LESSON_HEADING_PREFIX="L"
LESSON_FRAGMENT_DIR="tasks/lessons.d"
LESSON_EXCLUDE_BASENAMES=("README.md")
CONF
}

# write_volume_config — samma som write_config men glob matchar FLERA filer
# (ADR-085-formen), för T7/T8:s multi-fil-fall.
write_volume_config() {
    cat > "${TEST_DIR}/.lesson-policy.conf" <<'CONF'
LESSON_FILE_GLOB="tasks/lessons/vol-*.md"
LESSON_HEADING_PREFIX="L"
LESSON_FRAGMENT_DIR="tasks/lessons.d"
LESSON_EXCLUDE_BASENAMES=("README.md")
CONF
}

# write_lessons <n> — skapar n unika lesson-poster
write_lessons() {
    local n=$1 i
    : > "${TEST_DIR}/tasks/lessons.md"
    for ((i = 1; i <= n; i++)); do
        printf '### L%d\n\n**Post %d.**\n\n' "${i}" "${i}" \
            >> "${TEST_DIR}/tasks/lessons.md"
    done
}

# write_volume <file> <first> <last> — skriver ### L<first>..### L<last> till
# tasks/lessons/<file>, för multi-fil-testfallen.
write_volume() {
    local file=$1 first=$2 last=$3 i
    mkdir -p "${TEST_DIR}/tasks/lessons"
    : > "${TEST_DIR}/tasks/lessons/${file}"
    for ((i = first; i <= last; i++)); do
        printf '### L%d\n\n**Post %d.**\n\n' "${i}" "${i}" \
            >> "${TEST_DIR}/tasks/lessons/${file}"
    done
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-lesson-numbers.sh 2>&1 )
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
echo "═══ T1: unika nummer, ingen fragment-katalog → exit 0 ═══"
setup
write_lessons 3
out=$(run_gate); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1" "Lesson-numrering OK" "${out}" || ok=1
check_contains "T1" "3 unika poster" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: samma nummer två gånger → exit 1 ═══"
setup
write_lessons 3
printf '### L2\n\n**Kollisionen — andra aktören antog samma nästa-lediga.**\n' \
    >> "${TEST_DIR}/tasks/lessons.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T2" 1 "${ec}" || ok=1
check_contains "T2" "Duplicerade lesson-nummer" "${out}" || ok=1
check_contains "T2" "L2 —" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: fragment bär numrerad rubrik → exit 1 ═══"
setup
write_lessons 3
mkdir -p "${TEST_DIR}/tasks/lessons.d"
printf '### L99\n\n**Fragment som felaktigt tilldelat sig ett nummer.**\n' \
    > "${TEST_DIR}/tasks/lessons.d/kandidat.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T3" 1 "${ec}" || ok=1
check_contains "T3" "bär en numrerad rubrik" "${out}" || ok=1
check_contains "T3" "kandidat.md" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: nummerlöst fragment → exit 0 (den sanktionerade formen) ═══"
setup
write_lessons 3
mkdir -p "${TEST_DIR}/tasks/lessons.d"
printf '**Nummerlös kandidat — numret sätts vid konsolidering.**\n' \
    > "${TEST_DIR}/tasks/lessons.d/kandidat.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T4" 0 "${ec}" || ok=1
check_contains "T4" "1 nummerlösa fragment" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T5: fragment-katalogens README får citera rubriker → exit 0 ═══"
setup
write_lessons 3
mkdir -p "${TEST_DIR}/tasks/lessons.d"
printf '# Konventionen\n\nEn konsoliderad post ser ut så här:\n\n### L123\n' \
    > "${TEST_DIR}/tasks/lessons.d/README.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T5" 0 "${ec}" || ok=1
check_contains "T5" "0 nummerlösa fragment" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T6: config saknas → exit 3 (felkonfigurerad, ej invariant-brott) ═══"
setup
write_lessons 3
rm "${TEST_DIR}/.lesson-policy.conf"
out=$(run_gate); ec=$?
ok=0
check_exit "T6" 3 "${ec}" || ok=1
check_contains "T6" "saknas" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T7: samma nummer i TVÅ OLIKA volymfiler → exit 1 (cross-fil-dubblett) ═══"
setup
write_volume_config
write_volume "vol-01.md" 1 3
write_volume "vol-02.md" 4 6
# Kollisionen: vol-02 antar (felaktigt) att L2 fortfarande är ledigt.
printf '### L2\n\n**Kollisionen — andra volymen antog samma nästa-lediga.**\n' \
    >> "${TEST_DIR}/tasks/lessons/vol-02.md"
out=$(run_gate); ec=$?
ok=0
check_exit "T7" 1 "${ec}" || ok=1
check_contains "T7" "Duplicerade lesson-nummer" "${out}" || ok=1
check_contains "T7" "L2 —" "${out}" || ok=1
check_contains "T7" "vol-01.md" "${out}" || ok=1
check_contains "T7" "vol-02.md" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T8: unika nummer spridda över tre volymfiler → exit 0 (släpper) ═══"
setup
write_volume_config
write_volume "vol-01.md" 1 3
write_volume "vol-02.md" 4 6
write_volume "vol-03.md" 7 9
out=$(run_gate); ec=$?
ok=0
check_exit "T8" 0 "${ec}" || ok=1
check_contains "T8" "Lesson-numrering OK" "${out}" || ok=1
check_contains "T8" "9 unika poster i 3 fil" "${out}" || ok=1
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
