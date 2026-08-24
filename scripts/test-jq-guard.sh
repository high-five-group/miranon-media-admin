#!/usr/bin/env bash
# scripts/test-jq-guard.sh
#
# Empirisk testsvit för scripts/lib/jq-guard.sh + .jq-version-policy.conf
# (TASK-312, 2026-08-24 — se scripts/lib/jq-guard.sh § VARFÖR FILEN FINNS:
# ~25 jq-anropsställen i hook-/grindlagret hade INGEN versionskontroll alls,
# bara en bar `command -v jq`-presence-check).
#
# TÄCKER, tvåsidigt:
#   T1  jq saknas i PATH                    → jq_version_ok FÄLLER
#   T2  policyfil saknas                    → jq_version_ok FÄLLER
#   T3  policy utan JQ_MIN_VERSION          → jq_version_ok FÄLLER
#   T4  version under floor (1.5 < 1.6)     → jq_version_ok FÄLLER, läsbart skäl
#   T5  version exakt på floor (1.6.0)      → jq_version_ok PASSERAR
#   T6  version över floor (1.7.1)          → jq_version_ok PASSERAR
#   T7  version STRIKT över på minor (2.0 > 1.99) → PASSERAR (numerisk, ej
#       lexikografisk — "2" > "19" hade fällt en sträng-jämförelse fel)
#   T8  ojämnt antal komponenter (1.6 vs 1.6.0) → PASSERAR (saknad komponent = 0)
#   T9  repots RIKTIGA .jq-version-policy.conf är läsbar och laddar ett
#       icke-tomt JQ_MIN_VERSION (sanity mot faktisk fil, inte bara fixturer)
#   T10 den lokalt installerade jq:n (verklig binär, ingen stub) klarar
#       repots RIKTIGA policy — sanity: floor är faktiskt satisfierbar
#       lokalt, inte bara i teorin
#   T11 default-policyvägen är LIB-RELATIV (räknad ur jq-guard.sh:s EGEN
#       BASH_SOURCE), INTE cwd-relativ — sourcad från en cwd långt från
#       repo-roten hittar guarden ändå repots RIKTIGA policy. Skiljer sig
#       medvetet från scripts/lib/supabase-cli.sh (cwd-relativ default) —
#       se jq-guard.sh § POLICYFILENS SÖKVÄG för varför.
#
# OFFLINE: stubbar `jq` på PATH (prependad temp-bin-katalog) för T1/T4–T8.
# Sandboxad i mktemp med trap-cleanup — rör ALDRIG repots riktiga
# .jq-version-policy.conf (T9/T10 LÄSER den, skriver aldrig).
#
# Källa: scripts/lib/jq-guard.sh · .jq-version-policy.conf
# Etablerad: TASK-312 (2026-08-24)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIB="${REPO_ROOT}/scripts/lib/jq-guard.sh"

TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-jq-guard.XXXXXX")"

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

# Stub jq på PATH — svarar STUB_JQ_VERSION på --version.
stub_jq() {
    local version="$1"
    mkdir -p "${TEST_DIR}/bin"
    cat > "${TEST_DIR}/bin/jq" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "--version" ]]; then
    echo "jq-${version}"
    exit 0
fi
exit 0
STUB
    chmod +x "${TEST_DIR}/bin/jq"
}

# Kör en isolerad sub-shell: källar libbet med given PATH + policyfil, kör
# jq_version_ok, ekar utfall+exitkod.
kor_isolerat() {
    local path_prefix="$1" policy_file="$2"
    (
        if [[ -n "${path_prefix}" ]]; then
            PATH="${path_prefix}:${PATH}"
            export PATH
        fi
        JQ_GUARD_POLICY_FILE="${policy_file}"
        export JQ_GUARD_POLICY_FILE
        # shellcheck source=/dev/null
        source "${LIB}"
        jq_version_ok
    )
}

echo "══ scripts/lib/jq-guard.sh — testsvit ══"

printf 'JQ_MIN_VERSION="1.6"\n' > "${TEST_DIR}/ratt.conf"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T1: jq saknas i PATH → jq_version_ok FÄLLER ───"
TOM_PATH_DIR="${TEST_DIR}/tom-path"
mkdir -p "${TOM_PATH_DIR}"
UT="$(
    (
        # shellcheck disable=SC2030  # avsiktligt: PATH-ändringen ska ENDAST
        # gälla denna engångs-subshell (testisolering) — den ska INTE
        # överleva ut i skriptets egen PATH.
        PATH="${TOM_PATH_DIR}"
        export PATH
        JQ_GUARD_POLICY_FILE="${TEST_DIR}/ratt.conf"
        export JQ_GUARD_POLICY_FILE
        # shellcheck source=/dev/null
        source "${LIB}"
        jq_version_ok
    ) 2>&1
)"
EC=$?
check "T1 exit" 1 "${EC}"
check_contains "T1 skäl" "jq saknas i PATH" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T2: policyfil saknas → jq_version_ok FÄLLER ───"
stub_jq "1.7.1"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/saknas-alls.conf" 2>&1)"
EC=$?
check "T2 exit" 1 "${EC}"
check_contains "T2 skäl" "policyn saknas" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T3: policy utan JQ_MIN_VERSION → jq_version_ok FÄLLER ───"
printf '# tom policy, ingen version\n' > "${TEST_DIR}/tom.conf"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/tom.conf" 2>&1)"
EC=$?
check "T3 exit" 1 "${EC}"
check_contains "T3 skäl" "saknar JQ_MIN_VERSION" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T4: version under floor (1.5 < 1.6) → FÄLLER med läsbart skäl ───"
stub_jq "1.5"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/ratt.conf" 2>&1)"
EC=$?
check "T4 exit" 1 "${EC}"
check_contains "T4 bär den upplösta versionen" "jq 1.5" "${UT}"
check_contains "T4 bär floor" "lägsta 1.6" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T5: version exakt på floor (1.6.0) → jq_version_ok PASSERAR ───"
stub_jq "1.6.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/ratt.conf" 2>&1)"
EC=$?
check "T5 exit" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T6: version över floor (1.7.1) → jq_version_ok PASSERAR ───"
stub_jq "1.7.1"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/ratt.conf" 2>&1)"
EC=$?
check "T6 exit" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T7: numerisk (ej lexikografisk) jämförelse — 2.0 > 1.99 ───"
printf 'JQ_MIN_VERSION="1.99"\n' > "${TEST_DIR}/hog-floor.conf"
stub_jq "2.0"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/hog-floor.conf" 2>&1)"
EC=$?
check "T7 exit (2.0 >= 1.99 numeriskt, en sträng-jämförelse hade fällt fel)" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T8: ojämnt antal komponenter (1.6 vs floor 1.6.0) → PASSERAR ───"
printf 'JQ_MIN_VERSION="1.6.0"\n' > "${TEST_DIR}/tre-komponenter.conf"
stub_jq "1.6"
UT="$(kor_isolerat "${TEST_DIR}/bin" "${TEST_DIR}/tre-komponenter.conf" 2>&1)"
EC=$?
check "T8 exit (saknad patch-komponent räknas som 0, 1.6 == 1.6.0)" 0 "${EC}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T9: repots RIKTIGA .jq-version-policy.conf är läsbar och giltig ───"
RIKTIG_POLICY="${REPO_ROOT}/.jq-version-policy.conf"
if [[ -f "${RIKTIG_POLICY}" ]]; then
    stub_jq "0.0.1"
    UT="$(kor_isolerat "${TEST_DIR}/bin" "${RIKTIG_POLICY}" 2>&1)"
    EC=$?
    # Guarden ska FÄLLA (stubben svarar en sentinel-version som aldrig
    # matchar) — men FELET ska vara ett MISSMATCH, inte "saknas"/"saknar
    # version". Det bevisar att den riktiga filen faktiskt laddade ett
    # icke-tomt JQ_MIN_VERSION.
    check "T9 exit (missmatch mot sentinel, förväntat)" 1 "${EC}"
    if [[ "${UT}" == *"policyn saknas"* ]] || [[ "${UT}" == *"saknar JQ_MIN_VERSION"* ]]; then
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
echo "─── T10: DEN VERKLIGA lokala jq:n klarar repots RIKTIGA policy ───"
if [[ -f "${RIKTIG_POLICY}" ]]; then
    UT="$(
        (
            JQ_GUARD_POLICY_FILE="${RIKTIG_POLICY}"
            export JQ_GUARD_POLICY_FILE
            # shellcheck source=/dev/null
            source "${LIB}"
            jq_version_ok
        ) 2>&1
    )"
    EC=$?
    check "T10 exit (verklig jq-binär, ingen stub)" 0 "${EC}"
else
    echo "  ❌ T10: ${RIKTIG_POLICY} saknas helt — kan inte köra sanity-checken"
    FAILED=$((FAILED + 1))
fi

# ══════════════════════════════════════════════════════════════════════════
echo "─── T11: default-policyn löses LIB-RELATIVT, inte cwd-relativt ───"
# Bevisar § POLICYFILENS SÖKVÄG: sourcar libbet UTAN JQ_GUARD_POLICY_FILE
# (ingen override) från en cwd LÅNGT från repo-roten (mktemp-katalogen) —
# om defaulten vore cwd-relativ ("${JQ_GUARD_POLICY_FILE:-.jq-version-
# policy.conf}") hade den letat efter en policy i TEST_DIR och FALLIT med
# "policyn saknas". Den ska i stället hitta repots RIKTIGA policy och gå
# lika långt som T9/T10 (missmatch mot sentinel, inte "saknas").
stub_jq "0.0.1"
UT="$(
    (
        cd "${TEST_DIR}" || exit 3
        unset JQ_GUARD_POLICY_FILE
        # shellcheck disable=SC2030,SC2031  # avsiktligt: PATH-ändringen ska
        # ENDAST gälla denna engångs-subshell (testisolering) — den ska
        # INTE överleva ut i skriptets egen PATH, och läsningen ovan
        # (${PATH}) avser med flit VÄRDET FÖRE denna tilldelning (prependar
        # testens stub-jq före det befintliga PATH:et).
        PATH="${TEST_DIR}/bin:${PATH}"
        export PATH
        # shellcheck source=/dev/null
        source "${LIB}"
        jq_version_ok
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
