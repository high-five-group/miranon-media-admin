#!/usr/bin/env bash
# scripts/test-deny-hemlighet-utskrift.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-hemlighet-utskrift.sh
# (TASK-203). Planterade hemlighets-utskrivande kommandon NEKAS (exit 2),
# legitima existens-/digest-kommandon SLÄPPS (exit 0).
#
#   D1–D9   Planterade hemlighets-utskrivande kommandon NEKAS (exit 2)
#   A1–A9   Legitima kommandon SLÄPPS (exit 0), inkl. de exakta formerna
#           redan i skarpt bruk (scripts/atkomst-diagnos.sh,
#           docs/reference/atkomst-och-nycklar.md)
#   F1–F5   FAIL-CLOSED: jq saknas, trasig JSON, tom stdin, saknad
#           policyfil, tom mönster-array — samtliga NEKAR (exit 2)
#   E1      Exit-koden på en deny-väg är EXAKT 2
#
# Test-isolering: TEST_DIR mirrorar produktionslayouten (samma disciplin
# som test-deny-resend-send.sh). F1 (jq saknas) simuleras genom att ta
# bort katalogen som äger den RIKTIGA jq-binären ur PATH.
#
# Ingen testfixtur i denna svit innehåller ett äkta hemligt värde — alla
# kommandosträngar är antingen frågor UTAN värden (subkommando-nivå) eller
# uppenbart fejkade platshållarvärden.
#
# Användning: bash scripts/test-deny-hemlighet-utskrift.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-203 · scripts/deny-hemlighet-utskrift.sh ·
#        scripts/test-deny-resend-send.sh (mönster, TASK-137)
# Etablerad: TASK-203, 2026-08-12

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task203-test-deny-hemlighet-utskrift"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-hemlighet-utskrift.sh"
POLICY_SRC="${REPO_ROOT}/.hemlighet-utskrift-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-hemlighet-utskrift.sh"
POLICY="${TEST_DIR}/.hemlighet-utskrift-policy.conf"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # anropas via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts/lib"
    cp "${SKRIPT_SRC}" "${SKRIPT}"
    chmod +x "${SKRIPT}"
    cp "${POLICY_SRC}" "${POLICY}"
    # jq-guard.sh (TASK-312) sourcas nu av skriptet.
    cp "${REPO_ROOT}/scripts/lib/jq-guard.sh" "${TEST_DIR}/scripts/lib/jq-guard.sh"
    cp "${REPO_ROOT}/.jq-version-policy.conf" "${TEST_DIR}/.jq-version-policy.conf"
}

PATH_NO_JQ=""
compute_path_no_jq() {
    local jq_path jq_dir
    jq_path="$(command -v jq)"
    jq_dir="$(dirname "${jq_path}")"
    local out="" seg
    IFS=':' read -r -a segs <<< "${PATH}"
    for seg in "${segs[@]}"; do
        [[ "${seg}" == "${jq_dir}" ]] && continue
        out="${out:+${out}:}${seg}"
    done
    PATH_NO_JQ="${out}"
}

EXPECT_OUT=""
NOT_EXPECT_OUT=""

run_case() {
    local name="$1" want="$2" json="$3"; shift 3
    local got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    ( cd "${TEST_DIR}" && printf '%s' "${json}" | env "$@" bash "${SKRIPT}" ) >"${TEST_DIR}/out.txt" 2>&1
    got=$?

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$(( PASSED + 1 ))
}

bash_json() {
    printf '{"tool_name":"Bash","tool_input":{"command":"%s"}}' "$1"
}

setup
compute_path_no_jq
printf 'test-deny-hemlighet-utskrift: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# D1–D9 — PLANTERAT: hemlighets-utskrivande kommandon NEKAS.
echo "D1-D9 — hemlighets-utskrivande kommandon NEKAS:"
JSON="$(bash_json 'npx supabase projects api-keys --project-ref pqtshyierkdgwdnxuirz -o json')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D1  supabase projects api-keys UTAN --reveal (den faktiska incidenten) NEKAS" 2 "${JSON}"

JSON="$(bash_json 'supabase projects api-keys --reveal --output json --project-ref lvjsfnphlauldxqlncpl')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D2  supabase projects api-keys MED --reveal NEKAS" 2 "${JSON}"

JSON="$(bash_json 'npx supabase secrets list --project-ref pqtshyierkdgwdnxuirz --reveal')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D3  supabase secrets list --reveal NEKAS (defensivt mönster)" 2 "${JSON}"

JSON="$(bash_json 'security find-generic-password -s RESEND_SMTP_PASS -w')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D4  security find-generic-password -w (värde only) NEKAS" 2 "${JSON}"

JSON="$(bash_json 'security find-generic-password -s RESEND_SMTP_PASS_PROD -g')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D5  security find-generic-password -g (värde+attribut) NEKAS" 2 "${JSON}"

JSON="$(bash_json 'security dump-keychain -d')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D6  security dump-keychain -d (hela nyckelringen dekrypterad) NEKAS" 2 "${JSON}"

JSON="$(bash_json 'security dump-keychain -ad')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D7  security dump-keychain -ad (kombinerad flagga med d) NEKAS" 2 "${JSON}"

JSON="$(bash_json 'gh auth token')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D8  gh auth token NEKAS" 2 "${JSON}"

JSON="$(bash_json 'gh auth status --show-token')"
EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "D9  gh auth status --show-token NEKAS" 2 "${JSON}"

# ============================================================
# A1–A9 — legitima kommandon SLÄPPS.
echo ""
echo "A1-A9 — legitima existens-/digest-kommandon SLÄPPS:"
JSON="$(bash_json 'security find-generic-password -s RESEND_SMTP_PASS >/dev/null 2>&1')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A1  security find-generic-password -s (existens only, atkomst-diagnos.sh:s egen form) SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'gh secret list')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A2  gh secret list (API returnerar aldrig värden) SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'npx supabase secrets list --project-ref pqtshyierkdgwdnxuirz')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A3  supabase secrets list UTAN --reveal SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'security dump-keychain')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A4  security dump-keychain UTAN -d (metadata only) SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'security dump-keychain -i')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A5  security dump-keychain -i (interaktiv ACL, ingen d) SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'gh auth status')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A6  gh auth status UTAN -t SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'npx supabase projects list')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A7  supabase projects list (inga nycklar inblandade) SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'ls -1 .env* | wc -l')"
NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A8  ls -1 .env* (lokal filläsning, medvetet utanför scope) SLÄPPS" 0 "${JSON}"

NOT_EXPECT_OUT="HEMLIGHETS-LÅS"
run_case "A9  helt orelaterat tool_name (Read) SLÄPPS" 0 \
    '{"tool_name":"Read","tool_input":{"file_path":"/tmp/x"}}'

# ============================================================
# F1–F5 — FAIL-CLOSED.
echo ""
echo "F1-F5 — internt fel NEKAR (fail-closed):"
JSON="$(bash_json 'security dump-keychain -d')"
EXPECT_OUT="jq saknas"
run_case "F1  fail-closed: jq saknas i PATH → NEKAS (exit 2)" 2 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

EXPECT_OUT="gick inte att tolka"
run_case "F2  fail-closed: trasig JSON på stdin → NEKAS (exit 2)" 2 \
    '{"tool_name": detta är inte giltig json'

EXPECT_OUT="tom eller oläsbar"
run_case "F3  fail-closed: tom stdin → NEKAS (exit 2)" 2 \
    ""

JSON="$(bash_json 'security dump-keychain -d')"
EXPECT_OUT="saknas"
run_case "F4  fail-closed: policyfilen saknas → NEKAS (exit 2)" 2 "${JSON}" \
    "HEMLIGHET_POLICY=/finns/inte/.hemlighet-utskrift-policy.conf"

TOM_POLICY="${TEST_DIR}/.tom-policy.conf"
printf 'HEMLIGHET_KOMMANDO_MONSTER=()\n' > "${TOM_POLICY}"
JSON="$(bash_json 'security dump-keychain -d')"
EXPECT_OUT="noll kommando-mönster"
run_case "F5  fail-closed: policyn definierar noll mönster → NEKAS (exit 2)" 2 "${JSON}" \
    "HEMLIGHET_POLICY=${TOM_POLICY}"

# ============================================================
# E1 — exit-koden är EXAKT 2, inte "vilken icke-noll kod som helst".
echo ""
JSON="$(bash_json 'gh auth token')"
( cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}" ) >/dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2\n'
    PASSED=$(( PASSED + 1 ))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$(( FAILED + 1 ))
fi

printf '\ntest-deny-hemlighet-utskrift: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
