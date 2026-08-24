#!/usr/bin/env bash
# scripts/test-supabase-cli-policy.sh
#
# Empirisk testsvit för scripts/lib/supabase-cli.sh + .supabase-cli-policy.conf
# (S108, 2026-08-24 — se policyfilens § VARFÖR FILEN FINNS för incidenten:
# den globala Supabase CLI:n 2.75.0 avbröt en prod-EF-deploy efter 18 av 45
# funktioner eftersom deploy-vägen körde två olika, opinnade CLI-versioner).
#
# TÄCKER, tvåsidigt:
#   T1  policyfil saknas               → supabase_cli_guard FÄLLER
#   T2  policy utan SUPABASE_CLI_VERSION → supabase_cli_guard FÄLLER
#   T3  version-missmatch (upplöst ≠ policy) → supabase_cli_guard FÄLLER,
#       med LÄSBART skäl (bär både den upplösta och den förväntade strängen)
#   T4  korrekt version                → supabase_cli_guard PASSERAR (exit 0)
#   T5  supabase_cli() vägrar utan policy (samma fail-closed-egenskap som
#       guarden, men i den ENA anropsformen alla sju ställen använder)
#   T6  supabase_cli() anropar `npx --yes "supabase@<pinnad version>" <args>`
#       verbatim — bevisar att pinningen faktiskt NÅR npx, inte bara att
#       policyn kan läsas
#   T7  --yes finns med i varje npx-anrop (se lib-filens § --yes ÄR INTE
#       KOSMETISKT — en TTY-prompt hade sett ut som en hängning)
#   T8  repots RIKTIGA .supabase-cli-policy.conf är läsbar och laddar ett
#       icke-tomt SUPABASE_CLI_VERSION (sanity mot faktisk fil, inte bara
#       fixturer)
#
# OFFLINE: stubbar `npx` på PATH (prependad temp-bin-katalog). Ingen
# nätverkstrafik, ingen riktig Supabase-åtkomst, ingen prod-ref i
# kommandoraden. Sandboxad i mktemp med trap-cleanup — rör ALDRIG repots
# riktiga .supabase-cli-policy.conf (T8 LÄSER den, skriver aldrig).
#
# Källa: scripts/lib/supabase-cli.sh · .supabase-cli-policy.conf
# Etablerad: S108 (2026-08-24)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIB="${REPO_ROOT}/scripts/lib/supabase-cli.sh"

TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-supabase-cli-policy.XXXXXX")"
NPX_LOG="${TEST_DIR}/npx-anrop.log"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

# ── Stub npx på PATH ─────────────────────────────────────────────────────────
# Loggar varje anrop verbatim till NPX_LOG och svarar STUB_NPX_VERSION på
# --version. STUB_NPX_EXIT styr exitkoden (för att simulera "npx kunde inte
# köra CLI:t alls").
mkdir -p "${TEST_DIR}/bin"
cat > "${TEST_DIR}/bin/npx" <<'STUB'
#!/usr/bin/env bash
echo "$@" >> "${NPX_LOG}"
if [[ "${STUB_NPX_EXIT:-0}" -ne 0 ]]; then
    exit "${STUB_NPX_EXIT}"
fi
for a in "$@"; do
    if [[ "${a}" == "--version" ]]; then
        echo "${STUB_NPX_VERSION:-2.115.0}"
        exit 0
    fi
done
exit 0
STUB
chmod +x "${TEST_DIR}/bin/npx"
export PATH="${TEST_DIR}/bin:${PATH}"
export NPX_LOG

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

# Kör en isolerad sub-shell: källar libbet med given SUPABASE_CLI_POLICY_FILE
# och given STUB_NPX_*-miljö, kör given funktion, ekar utfall+exitkod.
kor_isolerat() {
    local policy_file="$1" fn="$2"
    shift 2
    (
        SUPABASE_CLI_POLICY_FILE="${policy_file}"
        SUPABASE_CLI_VERSION=""
        export SUPABASE_CLI_POLICY_FILE SUPABASE_CLI_VERSION
        # shellcheck source=/dev/null
        source "${LIB}"
        "${fn}" "$@"
    )
}

echo "══ scripts/lib/supabase-cli.sh — testsvit ══"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T1: policyfil saknas → supabase_cli_guard FÄLLER ───"
: > "${NPX_LOG}"
UT="$(kor_isolerat "${TEST_DIR}/saknas-alls.conf" supabase_cli_guard 2>&1)"
EC=$?
check "T1 exit" 1 "${EC}"
check_contains "T1 skäl" "policyn saknas" "${UT}"
if [[ ! -s "${NPX_LOG}" ]]; then
    echo "  ✅ T1: npx anropades ALDRIG (fail-closed innan nätverk)"
    PASSED=$((PASSED + 1))
else
    echo "  ❌ T1: npx anropades trots saknad policy"
    FAILED=$((FAILED + 1))
fi

# ══════════════════════════════════════════════════════════════════════════
echo "─── T2: policy utan SUPABASE_CLI_VERSION → supabase_cli_guard FÄLLER ───"
printf '# tom policy, ingen version\n' > "${TEST_DIR}/tom.conf"
: > "${NPX_LOG}"
UT="$(kor_isolerat "${TEST_DIR}/tom.conf" supabase_cli_guard 2>&1)"
EC=$?
check "T2 exit" 1 "${EC}"
check_contains "T2 skäl" "saknar SUPABASE_CLI_VERSION" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T3: version-missmatch (upplöst ≠ policy) → FÄLLER med läsbart skäl ───"
printf 'SUPABASE_CLI_VERSION="2.115.0"\n' > "${TEST_DIR}/ratt.conf"
: > "${NPX_LOG}"
UT="$(STUB_NPX_VERSION="9.9.9" kor_isolerat "${TEST_DIR}/ratt.conf" supabase_cli_guard 2>&1)"
EC=$?
check "T3 exit" 1 "${EC}"
check_contains "T3 bär den upplösta versionen" "9.9.9" "${UT}"
check_contains "T3 bär den förväntade versionen" "2.115.0" "${UT}"
check_contains "T3 skäl" "Stoppar hellre än att deploya med fel CLI-version" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T4: korrekt version → supabase_cli_guard PASSERAR ───"
: > "${NPX_LOG}"
UT="$(STUB_NPX_VERSION="2.115.0" kor_isolerat "${TEST_DIR}/ratt.conf" supabase_cli_guard 2>&1)"
EC=$?
check "T4 exit" 0 "${EC}"
check_contains "T4 bekräftelse" "verifierad: 2.115.0" "${UT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T5: supabase_cli() vägrar utan policy (samma fail-closed-egenskap) ───"
: > "${NPX_LOG}"
UT="$(kor_isolerat "${TEST_DIR}/saknas-alls.conf" supabase_cli functions list 2>&1)"
EC=$?
check "T5 exit" 1 "${EC}"
check_contains "T5 skäl" "policyn saknas" "${UT}"
if [[ ! -s "${NPX_LOG}" ]]; then
    echo "  ✅ T5: npx anropades ALDRIG"
    PASSED=$((PASSED + 1))
else
    echo "  ❌ T5: npx anropades trots saknad policy"
    FAILED=$((FAILED + 1))
fi

# ══════════════════════════════════════════════════════════════════════════
echo "─── T6: supabase_cli() anropar npx med pinnad paketspecifikation VERBATIM ───"
: > "${NPX_LOG}"
kor_isolerat "${TEST_DIR}/ratt.conf" supabase_cli functions deploy min-funktion --project-ref ZZ-TEST-REF > /dev/null 2>&1
LOGGAT="$(cat "${NPX_LOG}")"
check_contains "T6 pinnad paketspec" "supabase@2.115.0" "${LOGGAT}"
check_contains "T6 vidarebefordrar args" "functions deploy min-funktion --project-ref ZZ-TEST-REF" "${LOGGAT}"

# ══════════════════════════════════════════════════════════════════════════
echo "─── T7: --yes finns med i varje npx-anrop (ingen TTY-prompt-hängning) ───"
: > "${NPX_LOG}"
kor_isolerat "${TEST_DIR}/ratt.conf" supabase_cli link --project-ref ZZ-TEST-REF > /dev/null 2>&1
LOGG_CLI="$(cat "${NPX_LOG}")"
: > "${NPX_LOG}"
STUB_NPX_VERSION="2.115.0" kor_isolerat "${TEST_DIR}/ratt.conf" supabase_cli_guard > /dev/null 2>&1
LOGG_GUARD="$(cat "${NPX_LOG}")"
if [[ "${LOGG_CLI}" == "--yes "* ]] && [[ "${LOGG_GUARD}" == "--yes "* ]]; then
    echo "  ✅ T7: --yes leder BÅDA anropsformerna (supabase_cli + guarden)"
    PASSED=$((PASSED + 1))
else
    echo "  ❌ T7: --yes saknas i minst en anropsform (cli='${LOGG_CLI}', guard='${LOGG_GUARD}')"
    FAILED=$((FAILED + 1))
fi

# ══════════════════════════════════════════════════════════════════════════
echo "─── T8: repots RIKTIGA .supabase-cli-policy.conf är läsbar och giltig ───"
RIKTIG_POLICY="${REPO_ROOT}/.supabase-cli-policy.conf"
if [[ -f "${RIKTIG_POLICY}" ]]; then
    : > "${NPX_LOG}"
    UT="$(STUB_NPX_VERSION="0.0.0-sentinel" kor_isolerat "${RIKTIG_POLICY}" supabase_cli_guard 2>&1)"
    EC=$?
    # Guarden ska FÄLLA (stubben svarar en sentinel-version som aldrig
    # matchar riktiga policyn) — men FELET ska vara ett MISSMATCH, inte
    # "saknas"/"saknar version". Det bevisar att den riktiga filen faktiskt
    # laddade ett icke-tomt SUPABASE_CLI_VERSION.
    check "T8 exit (missmatch mot sentinel, förväntat)" 1 "${EC}"
    check_contains "T8 riktig policy laddade ett äkta versionsvärde" "policyn (${RIKTIG_POLICY})" "${UT}"
    if [[ "${UT}" == *"saknas"* ]] || [[ "${UT}" == *"saknar SUPABASE_CLI_VERSION"* ]]; then
        echo "  ❌ T8: riktiga policyn verkar saknas/tom — det ska den ALDRIG göra"
        FAILED=$((FAILED + 1))
    else
        echo "  ✅ T8: riktiga policyn laddade ett äkta versionsvärde"
        PASSED=$((PASSED + 1))
    fi
else
    echo "  ❌ T8: ${RIKTIG_POLICY} saknas helt — kan inte köra sanity-checken"
    FAILED=$((FAILED + 1))
fi

echo ""
TOTAL=$((PASSED + FAILED))
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
