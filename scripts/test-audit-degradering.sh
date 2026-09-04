#!/usr/bin/env bash
# scripts/test-audit-degradering.sh
#
# Empirisk, TVÅSIDIG testsvit för scripts/audit-ci-med-degradering.sh
# (TASK-395, 2026-09-04). Degraderingen släpper igenom en RÖD audit-körning,
# och en grind som kan släppa igenom något måste bevisas i BÅDA riktningarna —
# inte bara att den släpper när den ska, utan att den FÄLLER i varje läge där
# den inte får släppa.
#
# TÄCKER:
#   T1  audit-ci grönt på första försöket        → exit 0, INGEN ::warning::
#   T2  grönt först på försök 2                  → exit 0, INGEN ::warning::
#   T3  nätverksfel + OFÖRÄNDRAT beroendeträd    → exit 0 + ::warning:: med bas-SHA
#   T4  nätverksfel + ÄNDRAD package-lock.json   → exit 1 ("ÄNDRAT mot bas")
#   T5  nätverksfel + ÄNDRAD package.json        → exit 1 ("ÄNDRAT mot bas")
#   T6  sårbarhetstabell + oförändrat träd       → exit 1 ("sårbarhetsmarkören")
#   T7  sårbarhet i försök 1, nätverk i försök 2 → exit 1 (sårbarhet vinner alltid)
#   T8  okänd felklass + oförändrat träd         → exit 1 ("inget känt nätverksmönster")
#   T9  nätverk i 1, OKÄNT i 2                   → exit 1 (fail-closed: ALLA måste vara nätverk)
#   T10 nätverksfel + TOM bas-SHA (push mot main)→ exit 1 ("ingen bas-SHA")
#   T11 ENOAUDIT-formen + oförändrat träd        → exit 0 (mönsterlistans bredd)
#   T12 audit-ci:s VERKLIGT MÄTTA utdata verbatim (ANSI-kodat "code undefined: "
#       + "Exiting...", uppmätt 2026-09-04 10:51 UTC mot den nedgångna
#       endpointen) + oförändrat träd            → exit 0 (regressionsankare)
#   T13 "Found vulnerable advisory paths:"       → exit 1 (andra sårbarhetsmarkören)
#   T14 bas-commiten SAKNAS i checkouten (grund klon) → skriptet hämtar den
#       grunt ur origin och släpper                (fetch-grenen, hermetisk:
#       origin är ett LOKALT bart repo, ingen nätverkstrafik)
#   T15 loopen gör exakt AUDIT_MAX_FORSOK försök, inte fler eller färre
#
# HERMETISK: `npx` stubbas via en prependad PATH-katalog och svarar med en
# förskriven utdata + exitkod per försök; git-fixturerna byggs i mktemp.
# INGEN nätverkstrafik, inga secrets, repots eget träd rörs ALDRIG.
#
# Källa: scripts/audit-ci-med-degradering.sh
#        docs/decisions/ADR-028-supply-chain-incident-respons.md § Updates 2026-09-04
# Etablerad: TASK-395 (2026-09-04)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKRIPT="${REPO_ROOT}/scripts/audit-ci-med-degradering.sh"

TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-audit-degradering.XXXXXX")"
STUB_BIN="${TEST_DIR}/bin"
SVAR_DIR="${TEST_DIR}/svar"
RAKNARE="${TEST_DIR}/raknare"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

# Git-fixturerna får aldrig ärva användarens identitet, hookar eller signering.
export GIT_AUTHOR_NAME="Testfixtur"
export GIT_AUTHOR_EMAIL="testfixtur@example.invalid"
export GIT_COMMITTER_NAME="Testfixtur"
export GIT_COMMITTER_EMAIL="testfixtur@example.invalid"
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null

check() {
    local label="$1" expected="$2" actual="$3"
    if [[ "${actual}" -eq "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (förväntade ${expected})"
    echo "     utdata: ${UT}"
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

check_saknar() {
    local label="$1" needle="$2" hay="$3"
    if [[ "${hay}" != *"${needle}"* ]]; then
        echo "  ✅ ${label} saknar (som väntat): '${needle}'"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label} BÄR oväntat: '${needle}'"
    echo "     fick: ${hay}"
    FAILED=$((FAILED + 1))
    return 1
}

# ── Stub för `npx` ────────────────────────────────────────────────────────
# Svarar per försök ur ${SVAR_DIR}/svar-<n>: rad 1 = exitkod, resten = utdata.
# Räknaren ligger i fil, inte i env, eftersom varje anrop är en egen process.
mkdir -p "${STUB_BIN}"
cat > "${STUB_BIN}/npx" << 'STUB'
#!/usr/bin/env bash
set -uo pipefail
n="$(cat "${STUB_RAKNARE}")"
n=$((n + 1))
printf '%s\n' "${n}" > "${STUB_RAKNARE}"
svar="${STUB_SVAR_KATALOG}/svar-${n}"
[[ -f "${svar}" ]] || svar="${STUB_SVAR_KATALOG}/svar-sista"
kod="$(head -1 "${svar}")"
tail -n +2 "${svar}"
exit "${kod}"
STUB
chmod +x "${STUB_BIN}/npx"

# ── Git-fixturer ──────────────────────────────────────────────────────────
# En bas-commit med paketmanifest + låsfil, och tre huvuden ovanpå den.
bygg_fixtur() {
    local dir="$1" andring="$2"
    mkdir -p "${dir}"
    git -C "${dir}" init -q -b main
    printf '{"name":"fixtur","version":"1.0.0"}\n' > "${dir}/package.json"
    printf '{"lockfileVersion":3,"packages":{}}\n' > "${dir}/package-lock.json"
    printf 'bas\n' > "${dir}/README.md"
    git -C "${dir}" add -A
    git -C "${dir}" commit -q --no-verify -m "bas"
    git -C "${dir}" rev-parse HEAD > "${dir}/.bas-sha"

    case "${andring}" in
        readme) printf 'huvud\n' > "${dir}/README.md" ;;
        lockfil) printf '{"lockfileVersion":3,"packages":{"node_modules/x":{}}}\n' > "${dir}/package-lock.json" ;;
        manifest) printf '{"name":"fixtur","version":"1.0.1"}\n' > "${dir}/package.json" ;;
        *)
            echo "bygg_fixtur: okänd ändring '${andring}'" >&2
            exit 2
            ;;
    esac
    git -C "${dir}" add -A
    git -C "${dir}" commit -q --no-verify -m "huvud"
}

bygg_fixtur "${TEST_DIR}/oforandrad" readme
bygg_fixtur "${TEST_DIR}/andrad-lockfil" lockfil
bygg_fixtur "${TEST_DIR}/andrad-manifest" manifest

BAS_OFORANDRAD="$(cat "${TEST_DIR}/oforandrad/.bas-sha")"
BAS_LOCKFIL="$(cat "${TEST_DIR}/andrad-lockfil/.bas-sha")"
BAS_MANIFEST="$(cat "${TEST_DIR}/andrad-manifest/.bas-sha")"

# T14:s fixtur — ett bart origin plus en GRUND klon där bas-commiten saknas.
git -C "${TEST_DIR}" clone -q --bare "${TEST_DIR}/oforandrad" "${TEST_DIR}/origin.git"
git -C "${TEST_DIR}" clone -q --depth=1 "file://${TEST_DIR}/origin.git" "${TEST_DIR}/grund"

# ── Körhjälpare ───────────────────────────────────────────────────────────
# kor <fixturkatalog> <bas-sha> <spec…>   där spec = "<exitkod>:::<utdata>"
UT=""
EC=0
kor() {
    local fixtur="$1" bas="$2"
    shift 2
    rm -rf "${SVAR_DIR:?}"
    mkdir -p "${SVAR_DIR}"
    printf '0\n' > "${RAKNARE}"
    local n=0 spec
    for spec in "$@"; do
        n=$((n + 1))
        {
            printf '%s\n' "${spec%%:::*}"
            printf '%s\n' "${spec#*:::}"
        } > "${SVAR_DIR}/svar-${n}"
    done
    cp "${SVAR_DIR}/svar-${n}" "${SVAR_DIR}/svar-sista"
    UT="$(
        cd "${fixtur}" || exit 99
        PATH="${STUB_BIN}:${PATH}" \
            AUDIT_BAS_SHA="${bas}" \
            AUDIT_MAX_FORSOK="${n}" \
            AUDIT_PAUS_SEKUNDER=0 \
            GITHUB_EVENT_NAME=pull_request \
            STUB_RAKNARE="${RAKNARE}" \
            STUB_SVAR_KATALOG="${SVAR_DIR}" \
            bash "${SKRIPT}" 2>&1
    )"
    EC=$?
}

# Fel-utdata som mönstren ska känna igen respektive INTE känna igen.
NAT_TIMEOUT='npm warn audit network timeout at: https://registry.npmjs.org/-/npm/v1/security/advisories/bulk'
NAT_ENOAUDIT='Your configured registry (https://registry.npmjs.org/) does not support audit requests.'
SARB_TABELL='Failed security audit due to high vulnerabilities.
Vulnerable advisories are:
https://github.com/advisories/GHSA-xxxx-yyyy-zzzz'
SARB_PATHS='Found vulnerable advisory paths:
node_modules/foo > node_modules/bar'
OKANT='Cannot find module '"'"'audit-ci'"'"' — installationen är trasig'
# audit-ci 7.1.0:s VERKLIGA utdata mot den nedgångna endpointen, mätt lokalt
# 2026-09-04 10:51 UTC (`cat -v` gav ^[[31mcode undefined: ^[[0m / ^[[31mExiting...^[[0m).
MATT_VERBATIM=$'\033[31mcode undefined: \033[0m\n\033[31mExiting...\033[0m'

echo "▶ scripts/test-audit-degradering.sh"
echo ""

# ── T1 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" '0:::Passed npm security audit.'
check "T1 grönt på första försöket" 0 "${EC}"
check_contains "T1" "audit-ci grönt på försök 1/1" "${UT}"
check_saknar "T1" "::warning::" "${UT}"

# ── T2 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${NAT_TIMEOUT}" '0:::Passed npm security audit.'
check "T2 grönt på försök 2" 0 "${EC}"
check_contains "T2" "audit-ci grönt på försök 2/2" "${UT}"
check_saknar "T2" "::warning::" "${UT}"

# ── T3 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}"
check "T3 nätverksfel + oförändrat träd" 0 "${EC}"
check_contains "T3" "::warning::audit-ci: npm:s advisory-endpoint onåbar efter 2 försök" "${UT}"
check_contains "T3" "beroendeträdet oförändrat mot bas (${BAS_OFORANDRAD})" "${UT}"
check_contains "T3" "TASK-395" "${UT}"

# ── T4 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/andrad-lockfil" "${BAS_LOCKFIL}" \
    "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}"
check "T4 nätverksfel + ÄNDRAD package-lock.json" 1 "${EC}"
check_contains "T4" "::error::audit-ci: beroendeträdet är ÄNDRAT mot bas" "${UT}"
check_saknar "T4" "::warning::" "${UT}"

# ── T5 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/andrad-manifest" "${BAS_MANIFEST}" \
    "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}"
check "T5 nätverksfel + ÄNDRAD package.json" 1 "${EC}"
check_contains "T5" "::error::audit-ci: beroendeträdet är ÄNDRAT mot bas" "${UT}"

# ── T6 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${SARB_TABELL}" "1:::${SARB_TABELL}"
check "T6 sårbarhetstabell + oförändrat träd" 1 "${EC}"
check_contains "T6" "::error::audit-ci: sårbarhetsmarkören" "${UT}"
check_saknar "T6" "::warning::" "${UT}"

# ── T7 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${SARB_TABELL}" "1:::${NAT_TIMEOUT}"
check "T7 sårbarhet i försök 1, nätverk i försök 2" 1 "${EC}"
check_contains "T7" "::error::audit-ci: sårbarhetsmarkören" "${UT}"

# ── T8 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${OKANT}" "1:::${OKANT}"
check "T8 okänd felklass + oförändrat träd" 1 "${EC}"
check_contains "T8" "matchar inget känt nätverksmönster" "${UT}"
check_saknar "T8" "::warning::" "${UT}"

# ── T9 ────────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${NAT_TIMEOUT}" "1:::${OKANT}"
check "T9 nätverk i 1, OKÄNT i 2 (fail-closed)" 1 "${EC}"
check_contains "T9" "försök 2:s utdata matchar inget känt nätverksmönster" "${UT}"

# ── T10 ───────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "" \
    "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}"
check "T10 nätverksfel + TOM bas-SHA" 1 "${EC}"
check_contains "T10" "bär ingen bas-SHA att jämföra mot" "${UT}"
check_saknar "T10" "::warning::" "${UT}"

# ── T11 ───────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${NAT_ENOAUDIT}" "1:::${NAT_ENOAUDIT}"
check "T11 ENOAUDIT-formen + oförändrat träd" 0 "${EC}"
check_contains "T11" "::warning::audit-ci: npm:s advisory-endpoint onåbar" "${UT}"

# ── T12 ───────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${MATT_VERBATIM}" "1:::${MATT_VERBATIM}"
check "T12 audit-ci:s VERKLIGT MÄTTA utdata verbatim" 0 "${EC}"
check_contains "T12" 'nätverksklassat ("code undefined")' "${UT}"
check_contains "T12" "::warning::audit-ci: npm:s advisory-endpoint onåbar" "${UT}"

# ── T13 ───────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${SARB_PATHS}" "1:::${SARB_PATHS}"
check "T13 'Found vulnerable advisory paths:'" 1 "${EC}"
check_contains "T13" "::error::audit-ci: sårbarhetsmarkören" "${UT}"

# ── T14 ───────────────────────────────────────────────────────────────────
# Grund klon: bas-commiten finns i origin men INTE i checkouten. Skriptet ska
# hämta den grunt och sedan kunna jämföra. Fixturens origin är ett lokalt bart
# repo — ingen nätverkstrafik.
GRUND_BAS="$(git -C "${TEST_DIR}/origin.git" rev-parse HEAD~1)"
if git -C "${TEST_DIR}/grund" cat-file -e "${GRUND_BAS}^{commit}" 2> /dev/null; then
    echo "  ❌ T14 förutsättning: bas-commiten fanns REDAN i den grunda klonen — fallet prövar inget"
    FAILED=$((FAILED + 1))
else
    echo "  ✅ T14 förutsättning: bas-commiten saknas i den grunda klonen"
    PASSED=$((PASSED + 1))
    kor "${TEST_DIR}/grund" "${GRUND_BAS}" \
        "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}"
    check "T14 bas-commiten hämtas grunt ur origin" 0 "${EC}"
    check_contains "T14" "saknas i checkouten — hämtar den grunt" "${UT}"
    check_contains "T14" "::warning::audit-ci: npm:s advisory-endpoint onåbar" "${UT}"
fi

# ── T15 ───────────────────────────────────────────────────────────────────
kor "${TEST_DIR}/oforandrad" "${BAS_OFORANDRAD}" \
    "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}" "1:::${NAT_TIMEOUT}"
ANTAL="$(cat "${RAKNARE}")"
check_contains "T15 loggen namnger sista försöket" "audit-ci försök 3/3" "${UT}"
if [[ "${ANTAL}" -eq 3 ]]; then
    echo "  ✅ T15 loopen gjorde exakt 3 försök"
    PASSED=$((PASSED + 1))
else
    echo "  ❌ T15 loopen gjorde ${ANTAL} försök (förväntade 3)"
    FAILED=$((FAILED + 1))
fi

echo ""
TOTAL=$((PASSED + FAILED))
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
