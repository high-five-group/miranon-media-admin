#!/usr/bin/env bash
# scripts/test-deny-prod-airtable.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-prod-airtable.sh (TASK-419).
# Planterade MCP-anrop mot Airtable-produktionsbasen NEKAS (exit 2) enligt
# familjens regel; staging-anrop, bas-lösa anrop och (för claude.ai-
# connectorn) huvudsessionens egna prod-anrop SLÄPPS (exit 0).
#
#   D1–D2   mcp__airtable__* (PAT-servern) mot prod-bas-ID:t NEKAS,
#           OVILLKORLIGT — även UTAN agent_id (huvudsession)
#   D3      mcp__airtable__* mot prod-bas-ID:t NEKAS ÄVEN i agent-kontext
#           (agent_id satt) — familjen "alltid" ignorerar agent_id helt
#   D4      prod-bas-ID:t NÄSTLAT i en annan parameter (filterByFormula),
#           inte i baseId-fältet — NEKAS (hel-payload-substräng-matchning)
#   D5      mcp__claude_ai_Airtable__* mot prod-bas-ID:t I AGENT-KONTEXT
#           (agent_id satt) NEKAS
#   D6–D7   claude.ai-connectorns SIDO-/INTERFACE-verktyg
#           (list_records_for_page, get_record_for_page) mot prod-bas-ID:t
#           i agent-kontext NEKAS — samma familjeregel som D5, med
#           verktygens EGEN payload-form (baseId + pageId/interfaceId).
#           Orkestreraren mätte 2026-09-07 (granskningsrunda 1, PR #2442)
#           att baseId är REQUIRED (^app[A-Za-z0-9]{14}$) på dessa verktyg
#           OCH på list_pages_for_base — mätningen är sourcad från
#           orkestreraren, ej omprövad av denna agent (verktygen ligger
#           utanför bygg-agentens egen MCP-tillgång, disallowedTools).
#   A1–A2   mcp__airtable__* mot STAGING-bas-ID:t SLÄPPS
#   A3      mcp__claude_ai_Airtable__* mot STAGING-bas-ID:t SLÄPPS
#   A4      mcp__claude_ai_Airtable__* mot PROD-bas-ID:t UTAN agent_id
#           (huvudsession, Marcus HITL-undantaget) SLÄPPS
#   A5      mcp__airtable__list_bases UTAN baseId alls SLÄPPS
#   A6      helt orelaterat tool_name (Read) SLÄPPS
#   A7      sido-verktyg (list_records_for_page) mot STAGING-bas-ID:t,
#           agent-kontext, SLÄPPS
#   F1–F5   FAIL-CLOSED: jq saknas, trasig JSON, tom stdin, saknad
#           policyfil, tomt PROD_AIRTABLE_BASE_ID-värde — samtliga NEKAR
#           (exit 2)
#   E1      Exit-koden på en deny-väg är EXAKT 2
#
# Test-isolering: samma TEST_DIR-mönster som test-deny-prod-ref.sh.
# Bas-ID:na (app8uGPrVCVOm6LfD, apphjj8Q7lkXCMsL4) är INTE hemligheter —
# de är publika Airtable-bas-ID:n, redan i klartext i
# docs/reference/data-model.md m.fl. Ingen testfixtur här innehåller ett
# äkta hemligt värde.
#
# Användning: bash scripts/test-deny-prod-airtable.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-419 · scripts/deny-prod-airtable.sh ·
#        scripts/test-deny-prod-ref.sh (mönster-förebild, D/A/F/E-formen) ·
#        scripts/test-deny-subagent-vantan.sh (agent_id-fixturmönster)
# Etablerad: TASK-419, 2026-09-07

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task419-test-deny-prod-airtable"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-prod-airtable.sh"
POLICY_SRC="${REPO_ROOT}/.prod-airtable-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-prod-airtable.sh"
POLICY="${TEST_DIR}/.prod-airtable-policy.conf"

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
    # jq-guard.sh (TASK-312) sourcas av skriptet.
    cp "${REPO_ROOT}/scripts/lib/jq-guard.sh" "${TEST_DIR}/scripts/lib/jq-guard.sh"
    cp "${REPO_ROOT}/.jq-version-policy.conf" "${TEST_DIR}/.jq-version-policy.conf"
}

# Samma PATH_NO_JQ-teknik som test-deny-prod-ref.sh/test-deny-subagent-
# vantan.sh: shimma en FILTRERAD symlänk-kopia (allt UTOM jq) i stället för
# att stryka hela PATH-segmentet — se dessa skripts § FIXEN för den fulla
# motiveringen (merged-usr-plattformar kraschar annars på borttagen
# `dirname`/`bash`).
PATH_NO_JQ=""
compute_path_no_jq() {
    local out="" seg segs shim entry base
    IFS=':' read -r -a segs <<< "${PATH}"
    for seg in "${segs[@]}"; do
        if [[ -n "${seg}" && -x "${seg}/jq" ]]; then
            shim="$(mktemp -d "${TEST_DIR}/path-no-jq-XXXXXX")"
            for entry in "${seg}"/*; do
                [[ -e "${entry}" ]] || continue
                base="${entry##*/}"
                [[ "${base}" == "jq" ]] && continue
                ln -s "${entry}" "${shim}/${base}" 2> /dev/null
            done
            out="${out:+${out}:}${shim}"
        else
            out="${out:+${out}:}${seg}"
        fi
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
    ( cd "${TEST_DIR}" && printf '%s' "${json}" | env "$@" bash "${SKRIPT}" ) > "${TEST_DIR}/out.txt" 2>&1
    got=$?

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1)); return
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1)); return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1)); return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$((PASSED + 1))
}

# json <tool_name> <tool_input-json> [agent_id]
json() {
    local tool="$1" input="$2" agent="${3:-}"
    if [[ -n "${agent}" ]]; then
        printf '{"tool_name":"%s","tool_input":%s,"agent_id":"%s"}' "${tool}" "${input}" "${agent}"
    else
        printf '{"tool_name":"%s","tool_input":%s}' "${tool}" "${input}"
    fi
}

setup
compute_path_no_jq
printf 'test-deny-prod-airtable: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

PROD="app8uGPrVCVOm6LfD"
STAGING="apphjj8Q7lkXCMsL4"

# ============================================================
# D1–D5 — PLANTERAT: anrop mot prod NEKAS.
echo "D1-D5 — anrop mot prod NEKAS:"

JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${PROD}\",\"tableId\":\"tblX\"}")"
EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "D1  mcp__airtable__list_records baseId=<prod>, huvudsession, NEKAS" 2 "${JSON}"

JSON="$(json 'mcp__airtable__get_record' "{\"baseId\":\"${PROD}\",\"tableId\":\"tblX\",\"recordId\":\"recY\"}")"
EXPECT_OUT="PAT-servern"
run_case "D2  mcp__airtable__get_record baseId=<prod>, huvudsession, NEKAS" 2 "${JSON}"

JSON="$(json 'mcp__airtable__update_records' "{\"baseId\":\"${PROD}\",\"tableId\":\"tblX\"}" 'agent-abc123')"
EXPECT_OUT="ovillkorligt"
run_case "D3  mcp__airtable__* mot prod NEKAS ÄVEN i agent-kontext (familjen 'alltid' ignorerar agent_id)" 2 "${JSON}"

JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${STAGING}\",\"tableId\":\"tblX\",\"filterByFormula\":\"FIND('${PROD}', {Notering})\"}")"
EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "D4  prod-ID NÄSTLAT i filterByFormula (baseId=staging) NEKAS — hel-payload-matchning" 2 "${JSON}"

JSON="$(json 'mcp__claude_ai_Airtable__list_tables_for_base' "{\"baseId\":\"${PROD}\"}" 'agent-def456')"
EXPECT_OUT="AGENT-KONTEXT"
run_case "D5  mcp__claude_ai_Airtable__* mot prod I AGENT-KONTEXT (agent_id satt) NEKAS" 2 "${JSON}"

# D6-D7: granskningsrunda 1 (PR #2442) befarade att claude.ai-connectorns
# SIDO-/INTERFACE-verktyg (list_records_for_page m.fl.) saknar baseId och
# därmed slinker förbi. Orkestreraren mätte 2026-09-07 mot verktygens
# faktiska scheman: baseId är REQUIRED (mönster ^app[A-Za-z0-9]{14}$) på
# samtliga tre (list_records_for_page, get_record_for_page,
# list_pages_for_base) — fixturerna nedan speglar den payload-formen
# (baseId + pageId/interfaceId vid sidan av).
JSON="$(json 'mcp__claude_ai_Airtable__list_records_for_page' "{\"baseId\":\"${PROD}\",\"pageId\":\"pagXXXXXXXXXXXXXX\",\"interfaceId\":\"pagYYYYYYYYYYYYYY\"}" 'agent-ghi789')"
EXPECT_OUT="AGENT-KONTEXT"
run_case "D6  mcp__claude_ai_Airtable__list_records_for_page (sido-verktyg) baseId=<prod>, agent-kontext, NEKAS" 2 "${JSON}"

JSON="$(json 'mcp__claude_ai_Airtable__get_record_for_page' "{\"baseId\":\"${PROD}\",\"recordId\":\"recZ\",\"pageId\":\"pagXXXXXXXXXXXXXX\"}" 'agent-ghi789')"
EXPECT_OUT="AGENT-KONTEXT"
run_case "D7  mcp__claude_ai_Airtable__get_record_for_page (sido-verktyg) baseId=<prod>, agent-kontext, NEKAS" 2 "${JSON}"

# ============================================================
# A1–A6 — SLÄPPER: staging, bas-lösa anrop, huvudsessionens HITL-undantag,
# orelaterade verktyg.
echo ""
echo "A1-A6 — staging/bas-löst/HITL-undantag/orelaterat SLÄPPS:"

JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${STAGING}\",\"tableId\":\"tblX\"}")"
NOT_EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "A1  mcp__airtable__list_records baseId=<staging> SLÄPPS" 0 "${JSON}"

JSON="$(json 'mcp__airtable__create_record' "{\"baseId\":\"${STAGING}\",\"tableId\":\"tblX\",\"fields\":{}}")"
NOT_EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "A2  mcp__airtable__create_record baseId=<staging> SLÄPPS" 0 "${JSON}"

JSON="$(json 'mcp__claude_ai_Airtable__list_records_for_table' "{\"baseId\":\"${STAGING}\",\"tableId\":\"tblX\"}" 'agent-abc123')"
NOT_EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "A3  mcp__claude_ai_Airtable__* baseId=<staging>, agent-kontext, SLÄPPS" 0 "${JSON}"

JSON="$(json 'mcp__claude_ai_Airtable__list_tables_for_base' "{\"baseId\":\"${PROD}\"}")"
EXPECT_OUT="SLÄPPS"
run_case "A4  mcp__claude_ai_Airtable__* mot prod UTAN agent_id (huvudsession, HITL-undantag) SLÄPPS" 0 "${JSON}"

JSON="$(json 'mcp__airtable__list_bases' '{}')"
NOT_EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "A5  mcp__airtable__list_bases (ingen baseId alls) SLÄPPS" 0 "${JSON}"

NOT_EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "A6  helt orelaterat tool_name (Read) SLÄPPS" 0 \
    '{"tool_name":"Read","tool_input":{"file_path":"/tmp/x"}}'

JSON="$(json 'mcp__claude_ai_Airtable__list_records_for_page' "{\"baseId\":\"${STAGING}\",\"pageId\":\"pagXXXXXXXXXXXXXX\",\"interfaceId\":\"pagYYYYYYYYYYYYYY\"}" 'agent-ghi789')"
NOT_EXPECT_OUT="PROD-AIRTABLE-LÅS"
run_case "A7  mcp__claude_ai_Airtable__list_records_for_page (sido-verktyg) baseId=<staging>, agent-kontext, SLÄPPS" 0 "${JSON}"

# ============================================================
# F1–F5 — FAIL-CLOSED.
echo ""
echo "F1-F5 — internt fel NEKAR (fail-closed):"

JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${PROD}\"}")"
EXPECT_OUT="jq saknas"
run_case "F1  fail-closed: jq saknas i PATH → NEKAS (exit 2)" 2 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

EXPECT_OUT="gick inte att tolka"
run_case "F2  fail-closed: trasig JSON på stdin → NEKAS (exit 2)" 2 \
    '{"tool_name": detta är inte giltig json'

EXPECT_OUT="tom eller oläsbar"
run_case "F3  fail-closed: tom stdin → NEKAS (exit 2)" 2 \
    ""

JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${PROD}\"}")"
EXPECT_OUT="saknas"
run_case "F4  fail-closed: policyfilen saknas → NEKAS (exit 2)" 2 "${JSON}" \
    "PROD_AIRTABLE_POLICY=/finns/inte/.prod-airtable-policy.conf"

TOM_POLICY="${TEST_DIR}/.tom-policy.conf"
printf 'PROD_AIRTABLE_BASE_ID=""\nPROD_AIRTABLE_ALWAYS_PREFIXES=("mcp__airtable__")\nPROD_AIRTABLE_AGENT_ONLY_PREFIXES=()\n' > "${TOM_POLICY}"
JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${PROD}\"}")"
EXPECT_OUT="PROD_AIRTABLE_BASE_ID"
run_case "F5  fail-closed: tomt PROD_AIRTABLE_BASE_ID-värde → NEKAS (exit 2)" 2 "${JSON}" \
    "PROD_AIRTABLE_POLICY=${TOM_POLICY}"

# ============================================================
# E1 — exit-koden är EXAKT 2.
echo ""
JSON="$(json 'mcp__airtable__list_records' "{\"baseId\":\"${PROD}\"}")"
( cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}" ) > /dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$((FAILED + 1))
fi

printf '\ntest-deny-prod-airtable: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
