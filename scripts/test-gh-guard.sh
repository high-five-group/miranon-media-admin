#!/usr/bin/env bash
# scripts/test-gh-guard.sh
#
# Empirisk testsvit för scripts/lib/gh-guard.sh + .gh-version-policy.conf
# (TASK-312, 2026-08-24). Samma struktur och täckning som
# scripts/test-jq-guard.sh — se den filens header för den fulla
# metod-motiveringen (identisk här, applicerad på gh i stället för jq).
#
# TÄCKER, tvåsidigt:
#   T1  gh saknas i PATH                    → gh_version_ok FÄLLER
#   T2  policyfil saknas                    → gh_version_ok FÄLLER
#   T3  policy utan GH_MIN_VERSION          → gh_version_ok FÄLLER
#   T4  version under floor                 → gh_version_ok FÄLLER, läsbart skäl
#   T5  version exakt på floor              → gh_version_ok PASSERAR
#   T6  version över floor                  → gh_version_ok PASSERAR
#   T7  numerisk (ej lexikografisk) jämförelse
#   T8  ojämnt antal versionskomponenter
#   T9  repots RIKTIGA .gh-version-policy.conf är läsbar och giltig
#   T10 DEN VERKLIGA lokala gh-binären klarar repots RIKTIGA policy
#   T11 default-policyvägen är LIB-relativ, inte cwd-relativ
#
# OFFLINE: stubbar `gh` på PATH för T1/T4–T8/T11. Sandboxad i mktemp med
# trap-cleanup — rör ALDRIG repots riktiga .gh-version-policy.conf (T9/T10
# LÄSER den, skriver aldrig).
#
# Källa: scripts/lib/gh-guard.sh · .gh-version-policy.conf
# Etablerad: TASK-312 (2026-08-24)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIB="${REPO_ROOT}/scripts/lib/gh-guard.sh"

TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-gh-guard.XXXXXX")"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

check() {
    local label="$1" expected="$2" actual="$3"
    if [[ "${actual}" -eq "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (förväntade ${expected})"
    FAILED=$((FAILED + 1))
    return 1
}

check_contains() {
    local label="$1" needle="$2" hay="$3"
    if [[ "${hay}" == *"${needle}"* ]]; then
        echo "  ✅ ${label} innehåller: '${needle}'"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label} SAKNAR: '${needle}'"
    echo "     fick: ${hay}"
    FAILED=$((FAILED + 1))
    return 1
}

# Stub gh på PATH — svarar STUB_GH_VERSION på --version, i gh:s faktiska
# tvåradsformat.
stub_gh() {
    local version="$1"
    mkdir -p "${TEST_DIR}/bin"
    cat > "${TEST_DIR}/bin/gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "--version" ]]; then
    printf 'gh version %s (2026-07-02)\nhttps://github.com/cli/cli/releases/tag/v%s\n' "${version}" "${version}"
    exit 0
fi
exit 0
STUB
    chmod +x "${TEST_DIR}/bin/gh"
}

kor_isolerat() {
    local path_prefix="$1" policy_file="$2"
    (
        if [[ -n "${path_prefix}" ]]; then
            PATH="${path_prefix}:${PATH}"
            export PATH
        fi
        GH_GUARD_POLICY_FILE="${policy_file}"
        export GH_GUARD_POLICY_FILE
        # shellcheck source=/dev/null
        source "${LIB}"
        gh_version_ok
    )
}

echo "══ scripts/lib/gh-guard.sh — testsvit ══"

printf 'GH_MIN_VERSION="2.94.0"\n' > "${TEST_DIR}/ratt.conf"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T1: gh saknas i PATH → gh_version_ok FÄLLER ───"
TOM_PATH_DIR="${TEST_DIR}/tom-path"
mkdir -p "${TOM_PATH_DIR}"
UT="$(
    (
        # shellcheck disable=SC2030  # avsiktligt: engångs-subshell, se
        # scripts/test-jq-guard.sh T1 för samma mönster.
        PATH="${TOM_PATH_DIR}"
        export PATH
        GH_GUARD_POLICY_FILE="${TEST_DIR}/ratt.conf"
        export GH_GUARD_POLICY_FILE
        # shellcheck source=/dev/null
        source "${LIB}"
        gh_version_ok
    ) 2>&1
)"
EC=$?
check "T1 exit" 1 "${EC}"
check_contains "T1 skäl" "gh saknas i PATH" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T2: policyfil saknas → gh_version_ok FÄLLER ───"
stub_gh "2.96.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/saknas-alls.conf" 2>&1)"
EC=$?
check "T2 exit" 1 "${EC}"
check_contains "T2 skäl" "policyn saknas" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T3: policy utan GH_MIN_VERSION → gh_version_ok FÄLLER ───"
printf '# tom policy, ingen version\n' > "${TEST_DIR}/tom.conf"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/tom.conf" 2>&1)"
EC=$?
check "T3 exit" 1 "${EC}"
check_contains "T3 skäl" "saknar GH_MIN_VERSION" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T4: version under floor (2.93.0 < 2.94.0) → FÄLLER med läsbart skäl ───"
stub_gh "2.93.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/ratt.conf" 2>&1)"
EC=$?
check "T4 exit" 1 "${EC}"
check_contains "T4 bär den upplösta versionen" "gh 2.93.0" "${UT}"
check_contains "T4 bär floor" "lägsta 2.94.0" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T5: version exakt på floor (2.94.0) → gh_version_ok PASSERAR ───"
stub_gh "2.94.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/ratt.conf" 2>&1)"
EC=$?
check "T5 exit" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T6: version över floor (2.96.0) → gh_version_ok PASSERAR ───"
stub_gh "2.96.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/ratt.conf" 2>&1)"
EC=$?
check "T6 exit" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T7: numerisk (ej lexikografisk) jämförelse — 3.0.0 > 2.99.0 ───"
printf 'GH_MIN_VERSION="2.99.0"\n' > "${TEST_DIR}/hog-floor.conf"
stub_gh "3.0.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/hog-floor.conf" 2>&1)"
EC=$?
check "T7 exit (3.0.0 >= 2.99.0 numeriskt, en sträng-jämförelse hade fällt fel)" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T8: ojämnt antal komponenter (2.94 vs floor 2.94.0) → PASSERAR ───"
printf 'GH_MIN_VERSION="2.94.0"\n' > "${TEST_DIR}/tre-komponenter.conf"
stub_gh "2.94"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/tre-komponenter.conf" 2>&1)"
EC=$?
check "T8 exit (saknad patch-komponent räknas som 0, 2.94 == 2.94.0)" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T9: repots RIKTIGA .gh-version-policy.conf är läsbar och giltig ───"
RIKTIG_POLICY="${REPO_ROOT}/.gh-version-policy.conf"
if [[ -f "${RIKTIG_POLICY}" ]]; then
    stub_gh "0.0.1"
    UT="$(kor_isolerat "${TEST_DIR}/bin" "${RIKTIG_POLICY}" 2>&1)"
    EC=$?
    check "T9 exit (missmatch mot sentinel, förväntat)" 1 "${EC}"
    if [[ "${UT}" == *"policyn saknas"* ]] || [[ "${UT}" == *"saknar GH_MIN_VERSION"* ]]; then
        echo "  ❌ T9: riktiga policyn verkar saknas/tom — det ska den ALDRIG göra"
        FAILED=$((FAILED + 1))
    else
        echo "  ✅ T9: riktiga policyn laddade ett äkta versionsvärde"
        PASSED=$((PASSED + 1))
    fi
else
    echo "  ❌ T9: ${RIKTIG_POLICY} saknas helt — kan inte köra sanity-checken"
    FAILED=$((FAILED + 1))
fi

# ══════════════════════════════════════════════════════════════════════════
echo "─── T10: DEN VERKLIGA lokala gh:n klarar repots RIKTIGA policy ───"
if [[ -f "${RIKTIG_POLICY}" ]]; then
    UT="$(
        (
            GH_GUARD_POLICY_FILE="${RIKTIG_POLICY}"
            export GH_GUARD_POLICY_FILE
            # shellcheck source=/dev/null
            source "${LIB}"
            gh_version_ok
        ) 2>&1
    )"
    EC=$?
    check "T10 exit (verklig gh-binär, ingen stub)" 0 "${EC}"
else
    echo "  ❌ T10: ${RIKTIG_POLICY} saknas helt — kan inte köra sanity-checken"
    FAILED=$((FAILED + 1))
fi

# ══════════════════════════════════════════════════════════════════════════
echo "─── T11: default-policyn löses LIB-RELATIVT, inte cwd-relativt ───"
stub_gh "0.0.1"
UT="$(
    (
        cd "${TEST_DIR}" || exit 3
        unset GH_GUARD_POLICY_FILE
        # shellcheck disable=SC2030,SC2031  # avsiktligt: engångs-subshell,
        # se scripts/test-jq-guard.sh T11 för samma mönster.
        PATH="${TEST_DIR}/bin:${PATH}"
        export PATH
        # shellcheck source=/dev/null
        source "${LIB}"
        gh_version_ok
    ) 2>&1
)"
EC=$?
check "T11 exit (missmatch mot sentinel — policyn HITTADES trots främmande cwd)" 1 "${EC}"
if [[ "${UT}" == *"policyn saknas"* ]]; then
    echo "  ❌ T11: defaulten är cwd-relativ — hittade INTE repots policy från en främmande cwd"
    FAILED=$((FAILED + 1))
else
    echo "  ✅ T11: defaulten är lib-relativ — repots policy hittades trots cwd=${TEST_DIR}"
    PASSED=$((PASSED + 1))
fi

echo ""
TOTAL=$((PASSED + FAILED))
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
