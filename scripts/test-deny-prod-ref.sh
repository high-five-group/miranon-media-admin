#!/usr/bin/env bash
# scripts/test-deny-prod-ref.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-prod-ref.sh (TASK-203).
# Planterade kommandon som nämner produktions-Supabase-refen NEKAS
# (exit 2), staging-kommandon och korrekt bypass-form SLÄPPS (exit 0).
#
#   D1–D6   Kommandon som nämner prod-refen (CLI, wrapper-script, rå curl)
#           NEKAS (exit 2)
#   D7–D8   Bypass-formen med FEL/saknat värde NEKAS ändå (exit 2)
#   A1–A5   Staging-kommandon och orelaterade kommandon SLÄPPS (exit 0)
#   A6–A7   Korrekt bypass-form SLÄPPS (exit 0), inkl. logg-raden
#   F1–F5   FAIL-CLOSED: jq saknas, trasig JSON, tom stdin, saknad
#           policyfil, tomt PROD_REF_PROD-värde — samtliga NEKAR (exit 2)
#   E1      Exit-koden på en deny-väg är EXAKT 2
#
# Test-isolering: samma TEST_DIR-mönster som test-deny-hemlighet-utskrift.sh.
# Prod-refen (lvjsfnphlauldxqlncpl) är INTE en hemlighet — den är ett
# publikt projekt-ID, redan i klartext i docs/reference/atkomst-och-
# nycklar.md m.fl. Ingen testfixtur här innehåller ett äkta hemligt värde.
#
# Användning: bash scripts/test-deny-prod-ref.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-203 · scripts/deny-prod-ref.sh ·
#        scripts/test-deny-resend-send.sh (mönster, TASK-137)
# Etablerad: TASK-203, 2026-08-12

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task203-test-deny-prod-ref"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-prod-ref.sh"
POLICY_SRC="${REPO_ROOT}/.prod-ref-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-prod-ref.sh"
POLICY="${TEST_DIR}/.prod-ref-policy.conf"

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
printf 'test-deny-prod-ref: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

PROD="lvjsfnphlauldxqlncpl"
STAGING="pqtshyierkdgwdnxuirz"

# ============================================================
# D1–D6 — PLANTERAT: kommandon som nämner prod-refen NEKAS.
echo "D1-D6 — kommandon riktade mot prod NEKAS:"
JSON="$(bash_json "supabase link --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D1  supabase link --project-ref <prod> NEKAS" 2 "${JSON}"

JSON="$(bash_json "supabase db push --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D2  supabase db push --project-ref <prod> NEKAS" 2 "${JSON}"

JSON="$(bash_json "supabase functions deploy get-events --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D3  supabase functions deploy --project-ref <prod> NEKAS" 2 "${JSON}"

JSON="$(bash_json "supabase secrets set FOO=bar --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D4  supabase secrets set --project-ref <prod> NEKAS" 2 "${JSON}"

JSON="$(bash_json "bash scripts/deploy-prod-functions.sh --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D5  deploy-prod-functions.sh --project-ref <prod> (wrapper-anropet) NEKAS" 2 "${JSON}"

JSON="$(bash_json "curl -X POST https://api.supabase.com/v1/projects/${PROD}/functions -d @x.json")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D6  rå curl mot Management API med prod-ref i URL:en NEKAS" 2 "${JSON}"

# ============================================================
# D7–D8 — bypass-form med FEL/saknat värde NEKAS ändå.
echo ""
echo "D7-D8 — bypass-form med fel/saknat värde NEKAS ändå:"
JSON="$(bash_json "PROD_REF_GODKAND_AV_MARCUS=yes supabase functions deploy get-events --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
NOT_EXPECT_OUT="BYPASS ANVÄND"
run_case "D7  bypass-var satt till 'yes' (fel värde, inte refen) NEKAS" 2 "${JSON}"

JSON="$(bash_json "PROD_REF_GODKAND_AV_MARCUS=${STAGING} supabase functions deploy get-events --project-ref ${PROD}")"
EXPECT_OUT="PROD-REF-LÅS"
run_case "D8  bypass-var satt till STAGING-refen (fel ref) NEKAS" 2 "${JSON}"

# ============================================================
# A1–A5 — staging + orelaterade kommandon SLÄPPS.
echo ""
echo "A1-A5 — staging/orelaterade kommandon SLÄPPS:"
JSON="$(bash_json "supabase functions deploy get-events --project-ref ${STAGING}")"
NOT_EXPECT_OUT="PROD-REF-LÅS"
run_case "A1  supabase functions deploy --project-ref <staging> SLÄPPS" 0 "${JSON}"

JSON="$(bash_json "supabase link --project-ref ${STAGING}")"
NOT_EXPECT_OUT="PROD-REF-LÅS"
run_case "A2  supabase link --project-ref <staging> SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'bash scripts/deploy-prod-functions.sh --list')"
NOT_EXPECT_OUT="PROD-REF-LÅS"
run_case "A3  deploy-prod-functions.sh --list (ingen ref alls) SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'npx supabase projects list')"
NOT_EXPECT_OUT="PROD-REF-LÅS"
run_case "A4  supabase projects list (ingen specifik ref) SLÄPPS" 0 "${JSON}"

NOT_EXPECT_OUT="PROD-REF-LÅS"
run_case "A5  helt orelaterat tool_name (Read) SLÄPPS" 0 \
    '{"tool_name":"Read","tool_input":{"file_path":"/tmp/x"}}'

# ============================================================
# A6–A7 — korrekt bypass-form SLÄPPS, och loggas synligt.
echo ""
echo "A6-A7 — korrekt bypass-form SLÄPPS och loggas synligt:"
JSON="$(bash_json "PROD_REF_GODKAND_AV_MARCUS=${PROD} supabase functions deploy get-events --project-ref ${PROD}")"
EXPECT_OUT="BYPASS ANVÄND"
run_case "A6  bypass-var = exakt prod-refen SLÄPPS igenom" 0 "${JSON}"

JSON="$(bash_json "bash scripts/deploy-prod-functions.sh --project-ref ${PROD} PROD_REF_GODKAND_AV_MARCUS=${PROD}")"
EXPECT_OUT="BYPASS ANVÄND"
run_case "A7  bypass-var som suffix på samma rad SLÄPPS igenom" 0 "${JSON}"

# ============================================================
# F1–F5 — FAIL-CLOSED.
echo ""
echo "F1-F5 — internt fel NEKAR (fail-closed):"
JSON="$(bash_json "supabase db push --project-ref ${PROD}")"
EXPECT_OUT="jq saknas"
run_case "F1  fail-closed: jq saknas i PATH → NEKAS (exit 2)" 2 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

EXPECT_OUT="gick inte att tolka"
run_case "F2  fail-closed: trasig JSON på stdin → NEKAS (exit 2)" 2 \
    '{"tool_name": detta är inte giltig json'

EXPECT_OUT="tom eller oläsbar"
run_case "F3  fail-closed: tom stdin → NEKAS (exit 2)" 2 \
    ""

JSON="$(bash_json "supabase db push --project-ref ${PROD}")"
EXPECT_OUT="saknas"
run_case "F4  fail-closed: policyfilen saknas → NEKAS (exit 2)" 2 "${JSON}" \
    "PROD_REF_POLICY=/finns/inte/.prod-ref-policy.conf"

TOM_POLICY="${TEST_DIR}/.tom-policy.conf"
printf 'PROD_REF_PROD=""\nPROD_REF_BYPASS_VAR="X"\n' > "${TOM_POLICY}"
JSON="$(bash_json "supabase db push --project-ref ${PROD}")"
EXPECT_OUT="PROD_REF_PROD"
run_case "F5  fail-closed: tomt PROD_REF_PROD-värde → NEKAS (exit 2)" 2 "${JSON}" \
    "PROD_REF_POLICY=${TOM_POLICY}"

# ============================================================
# E1 — exit-koden är EXAKT 2.
echo ""
JSON="$(bash_json "supabase db push --project-ref ${PROD}")"
( cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}" ) >/dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2\n'
    PASSED=$(( PASSED + 1 ))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$(( FAILED + 1 ))
fi

printf '\ntest-deny-prod-ref: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
