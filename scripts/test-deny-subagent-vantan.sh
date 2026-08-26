#!/usr/bin/env bash
# scripts/test-deny-subagent-vantan.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-subagent-vantan.sh (TASK-148.2,
# ADR-096 § Beslut del 2 — "PreToolUse-spärren"). AC #4-kravet: fäller-fall
# (Monitor + agent_id, run_in_background + agent_id) NEKAS (exit 2),
# släpper-fall (samma anrop UTAN agent_id, orelaterade verktyg) SLÄPPS
# (exit 0), fail-closed-fall (oparsbar indata) NEKAR.
#
#   D1–D4   Fäller: Monitor + agent_id, run_in_background:true + agent_id,
#           båda i EN AV DE TVÅ subagent-typerna (bakgrunds-subagent har
#           samma agent_id-fält som en synkron — se hooks.md, § "agent_id"
#           saknar villkor på foreground/background)
#   A1–A6   Släpper: samma anrop UTAN agent_id (huvudsession), Bash utan
#           run_in_background i subagent-kontext (den vanliga synkrona
#           formen ska ALDRIG träffas), Monitor-liknande men orelaterat
#           tool_name, ett helt orelaterat verktyg (Read) med agent_id satt
#   F1–F6   FAIL-CLOSED: jq saknas, trasig JSON, tom stdin, tool_name saknas
#           — samtliga NEKAR (exit 2) OAVSETT kontext. Policyfilen saknas /
#           tom regel-mängd NEKAR ENDAST i subagent-kontext (§ SCOPE-GRÄNS
#           i skriptets eget huvud) — F5/F6 bevisar båda halvorna av den
#           gränsen: subagent-kontext nekas, huvudsession släpps ändå igenom.
#   E1      Exit-koden på en deny-väg är EXAKT 2, inte "vilken icke-noll kod
#           som helst" — den enda kod Claude Code garanterat tolkar som
#           blockerande (samma krav som test-deny-resend-send.sh E1).
#
# Test-isolering: TEST_DIR mirrorar produktionslayouten (skriptet på
# scripts/deny-subagent-vantan.sh, policyn på .subagent-vantan-policy.conf
# i samma relativa position) så SUBAGENT_VANTAN_POLICY:s default-upplösning
# (${SCRIPT_DIR}/../.subagent-vantan-policy.conf) faktiskt prövas — samma
# disciplin som test-deny-resend-send.sh. F1 (jq saknas) simuleras genom att
# ta bort katalogen som äger den RIKTIGA jq-binären ur PATH.
#
# Användning: bash scripts/test-deny-subagent-vantan.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-148.2 · scripts/deny-subagent-vantan.sh ·
#        scripts/test-deny-resend-send.sh (mönster-förebild)
# Etablerad: TASK-148.2, 2026-08-07

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task148-2-test-deny-subagent-vantan"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-subagent-vantan.sh"
POLICY_SRC="${REPO_ROOT}/.subagent-vantan-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-subagent-vantan.sh"
POLICY="${TEST_DIR}/.subagent-vantan-policy.conf"

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

# PATH utan katalogen som äger den riktiga jq-binären (F1). Beräknas en gång
# i setup mot den FAKTISKA jq-platsen — ingen hårdkodning av en specifik
# katalog, eftersom platsen är miljöspecifik.
PATH_NO_JQ=""
compute_path_no_jq() {
    local jq_path jq_dir out="" seg segs
    jq_path="$(command -v jq)"
    jq_dir="$(dirname "${jq_path}")"
    IFS=':' read -r -a segs <<< "${PATH}"
    for seg in "${segs[@]}"; do
        [[ "${seg}" == "${jq_dir}" ]] && continue
        out="${out:+${out}:}${seg}"
    done
    PATH_NO_JQ="${out}"
}

# run_case <namn> <väntad exit> <json-input> [env-tilldelningar...]
# EXPECT_OUT / NOT_EXPECT_OUT sätts FÖRE anropet, nollställs av run_case.
EXPECT_OUT=""
NOT_EXPECT_OUT=""

run_case() {
    local name="$1" want="$2" json="$3"; shift 3
    local got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    # printf '%s' (inte en <<<-herestring) — herestrings lägger alltid till
    # en avslutande newline, vilket gör F3 (genuint tom stdin) omöjlig att
    # uttrycka.
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
printf 'test-deny-subagent-vantan: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# D1–D4 — Fäller: subagent-kontext (agent_id satt) NEKAS.
JSON="$(json 'Monitor' '{}' 'agent-abc123')"
EXPECT_OUT="levereras aldrig till en subagent"
run_case "D1  Monitor + agent_id satt NEKAS" 2 "${JSON}"

JSON="$(json 'Bash' '{"command":"npm run verify:ci-parity","run_in_background":true}' 'agent-abc123')"
EXPECT_OUT="samma väckningslösa hål som Monitor"
run_case "D2  Bash run_in_background:true + agent_id satt NEKAS" 2 "${JSON}"

# En agent_id-sträng med annat format (mätt exempel ur SubagentStart-hookens
# JSON, hooks.md: "agent-abc123" / "def456") — spärren ska inte förutsätta
# ett specifikt agent_id-format, bara närvaro.
JSON="$(json 'Monitor' '{}' 'def456')"
EXPECT_OUT="levereras aldrig till en subagent"
run_case "D3  Monitor + agent_id (kort numerisk-liknande form) NEKAS" 2 "${JSON}"

JSON="$(json 'Bash' '{"command":"bash scripts/check-lifecycle.sh","run_in_background":true}' 'agent-abc123')"
EXPECT_OUT="Riskerar det bli långt"
run_case "D4  Bash run_in_background:true, annat kommando, NEKAS" 2 "${JSON}"

# ============================================================
# A1–A6 — Släpper: den viktigare halvan. Falsklarm här kostar friktion på
# VARJE Bash/Monitor-anrop i hela repot.
echo ""
JSON="$(json 'Monitor' '{}')"
NOT_EXPECT_OUT="VÄNTEKONTRAKT"
run_case "A1  Monitor UTAN agent_id (huvudsession) SLÄPPS" 0 "${JSON}"

JSON="$(json 'Bash' '{"command":"npm run test","run_in_background":true}')"
NOT_EXPECT_OUT="VÄNTEKONTRAKT"
run_case "A2  Bash run_in_background:true UTAN agent_id (huvudsession) SLÄPPS" 0 "${JSON}"

JSON="$(json 'Bash' '{"command":"npm run test"}' 'agent-abc123')"
NOT_EXPECT_OUT="VÄNTEKONTRAKT"
run_case "A3  Bash SYNKRONT (run_in_background ej satt) + agent_id satt SLÄPPS — subagentens vanliga arbetsform" 0 "${JSON}"

JSON="$(json 'Bash' '{"command":"npm run test","run_in_background":false}' 'agent-abc123')"
NOT_EXPECT_OUT="VÄNTEKONTRAKT"
run_case "A4  Bash run_in_background:false EXPLICIT + agent_id satt SLÄPPS" 0 "${JSON}"

JSON="$(json 'Read' '{"file_path":"/tmp/x"}' 'agent-abc123')"
NOT_EXPECT_OUT="VÄNTEKONTRAKT"
run_case "A5  Helt orelaterat verktyg (Read) + agent_id satt SLÄPPS" 0 "${JSON}"

JSON="$(json 'MonitorSomething' '{}' 'agent-abc123')"
NOT_EXPECT_OUT="VÄNTEKONTRAKT"
run_case "A6  Verktygsnamn som BARA delvis liknar Monitor (exakt-match, ej prefix) SLÄPPS" 0 "${JSON}"

# ============================================================
# F1–F6 — FAIL-CLOSED. § SCOPE-GRÄNS i skriptets huvud: jq/tomt/oparsbart
# NEKAR OAVSETT kontext (kan inte ens avgöra kontext) — policy-fel NEKAR
# BARA i subagent-kontext.
echo ""
JSON="$(json 'Monitor' '{}')"
EXPECT_OUT="jq saknas"
run_case "F1  fail-closed: jq saknas i PATH → NEKAS ÄVEN huvudsession (exit 2)" 2 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

EXPECT_OUT="gick inte att tolka"
run_case "F2  fail-closed: trasig JSON på stdin → NEKAS (exit 2)" 2 \
    '{"tool_name": detta är inte giltig json'

EXPECT_OUT="tom eller oläsbar"
run_case "F3  fail-closed: tom stdin → NEKAS (exit 2)" 2 \
    ""

EXPECT_OUT="saknar tool_name"
run_case "F4  fail-closed: giltig JSON UTAN tool_name → NEKAS (exit 2)" 2 \
    '{"agent_id":"agent-abc123","tool_input":{}}'

# F5: policyfilen saknas — ska NEKA i subagent-kontext ...
JSON="$(json 'Monitor' '{}' 'agent-abc123')"
EXPECT_OUT="policyfilen"
run_case "F5  fail-closed: policyfilen saknas + agent_id satt → NEKAS (exit 2)" 2 "${JSON}" \
    "SUBAGENT_VANTAN_POLICY=/finns/inte/.subagent-vantan-policy.conf"

# ... men INTE i huvudsession — det är § SCOPE-GRÄNSENS hela poäng: ett
# trasigt regelverk för subagent-kontext ska inte kunna stoppa ALL Bash-
# användning i huvudsessionen.
JSON="$(json 'Monitor' '{}')"
NOT_EXPECT_OUT="policyfilen"
run_case "F6  policyfilen saknas MEN agent_id ej satt (huvudsession) → SLÄPPS ändå (exit 0)" 0 "${JSON}" \
    "SUBAGENT_VANTAN_POLICY=/finns/inte/.subagent-vantan-policy.conf"

# F7: en policyfil med TOMMA listor i båda — ett urvattnat regelverk ska
# nekas, inte tolkas som "inget att neka" (samma princip som
# deny-resend-send.sh redan använder).
TOM_POLICY="${TEST_DIR}/.tom-policy.conf"
{
    printf 'SUBAGENT_VANTAN_ALLTID=()\n'
    printf 'SUBAGENT_VANTAN_BAKGRUND=()\n'
} > "${TOM_POLICY}"
JSON="$(json 'Monitor' '{}' 'agent-abc123')"
EXPECT_OUT="noll verktyg i båda listorna"
run_case "F7  fail-closed: policyn definierar noll verktyg i båda listorna → NEKAS (exit 2)" 2 "${JSON}" \
    "SUBAGENT_VANTAN_POLICY=${TOM_POLICY}"

# ============================================================
# E1 — exit-koden på en deny-väg är EXAKT 2.
echo ""
JSON="$(json 'Monitor' '{}' 'agent-abc123')"
( cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}" ) > /dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2 (Claude Codes enda garanterat blockerande kod)\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$((FAILED + 1))
fi

printf '\ntest-deny-subagent-vantan: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
