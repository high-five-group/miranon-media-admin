#!/usr/bin/env bash
# scripts/test-deploy-prod-functions.sh
#
# Empirisk test-suite för scripts/deploy-prod-functions.sh (ADR-050 steg 2,
# Fas 7-skuld). Bevisar fail-closed-egenskapen utan att faktiskt deploya:
#   T1 happy — 5 prod-funktioner i deploy-set; test-auth + okänd ny funktion
#      hamnar som EXKLUDERAD (fail-closed) → exit 0.
#   T2 allowlistad funktion saknas på disk (typo/rename) → abort, exit 1.
#   T3 allowlist-fil saknas → exit 1.
#   T4 ingen flagga (varken --list eller --project-ref) → usage-fel, exit 1.
#
# T1–T4 kör alla --list eller felvägar FÖRE mode="deploy" — de rör aldrig
# Supabase CLI:t och behöver ingen extra fixtur.
#
# T5–T7 (S108, 2026-08-24) prövar DEPLOY-LÄGET specifikt — den pinnade
# CLI-vägen (scripts/lib/supabase-cli.sh + .supabase-cli-policy.conf) som
# ersatte den bara `supabase functions deploy` som avbröt en prod-deploy
# efter 18 av 45 funktioner (se .supabase-cli-policy.conf § VARFÖR FILEN
# FINNS). Egen fixtur (kopierar lib-filen + skriver en test-policy + stubbar
# `npx` på PATH) eftersom --list-läget MEDVETET aldrig rör detta — se
# run_script_pinned() nedan.
#   T5 deploy-läge, korrekt pinnad version → npx anropas EXAKT en gång per
#      funktion med `supabase@2.115.0 functions deploy <fn> --project-ref
#      <ref>` VERBATIM, plus EN guard-anrop (`--version`) FÖRE någon av dem.
#   T6 deploy-läge, guarden fäller (upplöst version ≠ policy) → INGEN
#      funktion "deployas" (noll functions-deploy-anrop i stub-loggen),
#      exit 1 — bevisar att felet blir högljutt FÖRE första funktionen.
#   T7 deploy-läge, policyfil saknas → samma fail-closed, exit 1, noll
#      npx-anrop alls.
#
# Test-isolering: skapar /tmp/s19-test-deploy-allowlist/ med supabase/functions/
# + .prod-functions-allowlist.conf-fixturer (T1–T4) resp. en utökad variant
# med scripts/lib/ + .supabase-cli-policy.conf + stubbad npx på PATH (T5–T7).
# Återställer (rm -rf) via trap. INGEN ändring av real-repo, INGEN faktisk
# deploy eller nätverkstrafik i något testfall.
#
# Användning: bash scripts/test-deploy-prod-functions.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-050-isolerad-staging-miljo.md (steg 2) ·
#        scripts/lib/supabase-cli.sh · .supabase-cli-policy.conf (S108).
# Etablerad: Session 19 (2026-06-13) · T5–T7 tillagda S108 (2026-08-24)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s19-test-deploy-allowlist"
SCRIPT_SRC="${REPO_ROOT}/scripts/deploy-prod-functions.sh"

PASSED=0
FAILED=0

PROD_FNS=(create-admin-user get-events get-persons get-registrations update-record)

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

# setup — bygger en fixtur med prod-funktioner + test-auth + en okänd ny
# funktion + _shared. Allowlisten skrivs av anroparen efteråt.
setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts"
    mkdir -p "${TEST_DIR}/supabase/functions"
    cp "${SCRIPT_SRC}" "${TEST_DIR}/scripts/deploy-prod-functions.sh"
    chmod +x "${TEST_DIR}/scripts/deploy-prod-functions.sh"
    local fn
    for fn in "${PROD_FNS[@]}" test-auth _shared sneaky-new-fn; do
        mkdir -p "${TEST_DIR}/supabase/functions/${fn}"
    done
}

write_allowlist() {
    printf '%s\n' "$@" > "${TEST_DIR}/.prod-functions-allowlist.conf"
}

run_script() {
    ( cd "${TEST_DIR}" && bash scripts/deploy-prod-functions.sh "$@" 2>&1 )
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

check_absent() {
    local label=$1 needle=$2 hay=$3
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ❌ ${label} should NOT contain: '${needle}'"
        return 1
    fi
    echo "  ✅ ${label} correctly absent: '${needle}'"
    return 0
}

mark() {
    if [[ "$1" -eq 0 ]]; then
        PASSED=$((PASSED + 1)); echo "  → PASS"
    else
        FAILED=$((FAILED + 1)); echo "  → FAIL"
    fi
}

# ============================================================
echo "═══ T1: --list — 5 prod i deploy-set, test-auth + okänd fn EXKLUDERAD → exit 0 ═══"
setup
write_allowlist "# prod-allowlist" "${PROD_FNS[@]}"
out=$(run_script --list); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1 deploy update-record" "[prod]        update-record" "${out}" || ok=1
check_contains "T1 deploy create-admin-user" "[prod]        create-admin-user" "${out}" || ok=1
check_contains "T1 test-auth exkluderad" "[EXKLUDERAD]  test-auth" "${out}" || ok=1
check_contains "T1 okänd fn exkluderad" "[EXKLUDERAD]  sneaky-new-fn" "${out}" || ok=1
check_absent "T1 test-auth aldrig i prod-set" "[prod]        test-auth" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: allowlistad funktion saknas på disk → abort, exit 1 ═══"
setup
write_allowlist "${PROD_FNS[@]}" "fn-som-inte-finns"
out=$(run_script --list); ec=$?
ok=0
check_exit "T2" 1 "${ec}" || ok=1
check_contains "T2" "saknas på disk: fn-som-inte-finns" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: allowlist-fil saknas → exit 1 ═══"
setup
rm -f "${TEST_DIR}/.prod-functions-allowlist.conf"
out=$(run_script --list); ec=$?
ok=0
check_exit "T3" 1 "${ec}" || ok=1
check_contains "T3" "allowlist saknas" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: ingen flagga → usage-fel, exit 1 (deployar aldrig utan explicit val) ═══"
setup
write_allowlist "${PROD_FNS[@]}"
out=$(run_script); ec=$?
ok=0
check_exit "T4" 1 "${ec}" || ok=1
check_contains "T4" "Ange --list eller --project-ref" "${out}" || ok=1
mark "${ok}"

# ============================================================
# T5–T7: DEPLOY-LÄGET, den pinnade CLI-vägen (S108). Egen fixtur — se
# filhuvudets § T5–T7 för varför --list-fixturen (setup() ovan) inte räcker.

STUB_BIN="${TEST_DIR}/bin"
NPX_LOG="${TEST_DIR}/npx-anrop.log"

# setup_pinned — bygger på setup() men lägger till det deploy-läget kräver:
# scripts/lib/supabase-cli.sh (kopierad, precis som scripts/deploy-prod-
# functions.sh redan kopieras av setup()), en test-lokal
# .supabase-cli-policy.conf, och en stubbad `npx` på PATH som loggar varje
# anrop och svarar STUB_NPX_VERSION på --version. Ingen nätverkstrafik.
setup_pinned() {
    setup
    write_allowlist "# prod-allowlist" "${PROD_FNS[@]}"
    mkdir -p "${TEST_DIR}/scripts/lib"
    cp "${REPO_ROOT}/scripts/lib/supabase-cli.sh" "${TEST_DIR}/scripts/lib/supabase-cli.sh"
    printf 'SUPABASE_CLI_VERSION="2.115.0"\n' > "${TEST_DIR}/.supabase-cli-policy.conf"
    mkdir -p "${STUB_BIN}"
    cat > "${STUB_BIN}/npx" <<'STUB'
#!/usr/bin/env bash
echo "$@" >> "${NPX_LOG}"
for a in "$@"; do
    if [[ "${a}" == "--version" ]]; then
        echo "${STUB_NPX_VERSION:-2.115.0}"
        exit 0
    fi
done
exit 0
STUB
    chmod +x "${STUB_BIN}/npx"
    : > "${NPX_LOG}"
}

# run_script_pinned — som run_script, men med stub-bin FÖRST på PATH så
# `npx` löser till stubben, inte den riktiga CLI:n. Ingen prod-ref, ingen
# nätverkstrafik.
run_script_pinned() {
    ( cd "${TEST_DIR}" && PATH="${STUB_BIN}:${PATH}" NPX_LOG="${NPX_LOG}" \
        bash scripts/deploy-prod-functions.sh "$@" 2>&1 )
}

# ============================================================
echo "═══ T5: deploy-läge, korrekt pinnad version → npx anropas pinnat per funktion, guard FÖRST ═══"
setup_pinned
out=$(STUB_NPX_VERSION="2.115.0" run_script_pinned --project-ref ZZ-TEST-REF); ec=$?
ok=0
check_exit "T5" 0 "${ec}" || ok=1
LOGGAT="$(cat "${NPX_LOG}")"
check_contains "T5 pinnad paketspec" "supabase@2.115.0" "${LOGGAT}" || ok=1
for fn in "${PROD_FNS[@]}"; do
    check_contains "T5 deploy ${fn}" "functions deploy ${fn} --project-ref ZZ-TEST-REF" "${LOGGAT}" || ok=1
done
# Guarden (--version) MÅSTE stå FÖRE första "functions deploy"-raden i loggen.
FORSTA_VERSION_RAD=$(grep -n -- '--version' "${NPX_LOG}" | head -1 | cut -d: -f1)
FORSTA_DEPLOY_RAD=$(grep -n 'functions deploy' "${NPX_LOG}" | head -1 | cut -d: -f1)
if [[ -n "${FORSTA_VERSION_RAD}" ]] && [[ -n "${FORSTA_DEPLOY_RAD}" ]] && [[ "${FORSTA_VERSION_RAD}" -lt "${FORSTA_DEPLOY_RAD}" ]]; then
    echo "  ✅ T5: guarden körde FÖRE första deploy (version-rad ${FORSTA_VERSION_RAD} < deploy-rad ${FORSTA_DEPLOY_RAD})"
else
    echo "  ❌ T5: guarden körde inte strukturellt före första deploy (version-rad ${FORSTA_VERSION_RAD:-saknas}, deploy-rad ${FORSTA_DEPLOY_RAD:-saknas})"
    ok=1
fi
mark "${ok}"

# ============================================================
echo "═══ T6: deploy-läge, guarden fäller (missmatch) → NOLL funktioner deployas, exit 1 ═══"
setup_pinned
out=$(STUB_NPX_VERSION="9.9.9" run_script_pinned --project-ref ZZ-TEST-REF); ec=$?
ok=0
check_exit "T6" 1 "${ec}" || ok=1
check_contains "T6 skäl" "Avbryter — fail-closed (ingen deploy utan verifierad CLI-version)" "${out}" || ok=1
LOGGAT="$(cat "${NPX_LOG}")"
check_absent "T6 ingen funktion deployad" "functions deploy" "${LOGGAT}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T7: deploy-läge, policyfil saknas → fail-closed, exit 1, noll npx-anrop ═══"
setup_pinned
rm -f "${TEST_DIR}/.supabase-cli-policy.conf"
out=$(run_script_pinned --project-ref ZZ-TEST-REF); ec=$?
ok=0
check_exit "T7" 1 "${ec}" || ok=1
check_contains "T7 skäl" "policyn saknas" "${out}" || ok=1
if [[ ! -s "${NPX_LOG}" ]]; then
    echo "  ✅ T7: npx anropades ALDRIG"
else
    echo "  ❌ T7: npx anropades trots saknad policy"
    ok=1
fi
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
