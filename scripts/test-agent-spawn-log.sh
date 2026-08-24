#!/usr/bin/env bash
# scripts/test-agent-spawn-log.sh
#
# Empirisk test-suite för scripts/agent-spawn-log.sh (spawn-mätarens skrivare).
#
# 10 testfall i två grupper:
#   Mätriktigheten  — T1 frontmatter-isolerad, T2 oisolerad typ, T3 param,
#                     T4 param före frontmatter, T5 frontmatter utan nyckeln,
#                     T6 citerat YAML-värde, T7 `isolation:` i brödtexten
#   Aldrig-blockera — T8 trasig stdin, T9 sökvägs-spärr, T10 append-only
#
# T1 mot T2 är det tvåsidiga beviset: en agenttyp MED `isolation: worktree` i
# frontmatter ska loggas isolerad, en UTAN ska loggas oisolerad. Före
# rättningen (restlistans A7:2) gav BÅDA `null` — mätaren kunde alltså inte
# skilja fallen åt, och pekade åt det farliga hållet.
#
# Test-isolering: skapar /tmp/s91-test-agent-spawn-log/ med egen .claude/-rot,
# agentkatalog och logg. Återställer (rm -rf) via trap. INGEN ändring av
# real-repots logg — CLAUDE_PROJECT_DIR pekas på sandlådan.
#
# Användning: bash scripts/test-agent-spawn-log.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Etablerad: Session 91 (restlistans A7:2).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${0}")/.." && pwd)"
TEST_DIR="/tmp/s91-test-agent-spawn-log"
SRC="${REPO_ROOT}/scripts/agent-spawn-log.sh"
LOGG="${TEST_DIR}/.claude/agent-spawn-log.jsonl"

PASSED=0
FAILED=0
EC=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts/lib" "${TEST_DIR}/.claude/agents"
    cp "${SRC}" "${TEST_DIR}/scripts/agent-spawn-log.sh"
    # jq-guard.sh (TASK-312) sourcas nu av skriptet.
    cp "${REPO_ROOT}/scripts/lib/jq-guard.sh" "${TEST_DIR}/scripts/lib/jq-guard.sh"
    cp "${REPO_ROOT}/.jq-version-policy.conf" "${TEST_DIR}/.jq-version-policy.conf"
    : > "${LOGG}"
}

# skriv_agent <namn> <frontmatter-kropp>
skriv_agent() {
    printf -- '---\nname: %s\n%s---\n\nBrödtext.\n' "${1}" "${2}" \
        > "${TEST_DIR}/.claude/agents/${1}.md"
}

# payload <subagent_type> [isolation] [cwd]
payload() {
    local typ="${1}" iso="${2:-}" cwd="${3:-/Users/x/repo}"
    if [[ -n "${iso}" ]]; then
        printf '{"session_id":"abcdef12-9999","cwd":"%s","hook_event_name":"PreToolUse","tool_name":"Agent","tool_input":{"description":"d","prompt":"p","subagent_type":"%s","run_in_background":true,"isolation":"%s"}}' \
            "${cwd}" "${typ}" "${iso}"
    else
        printf '{"session_id":"abcdef12-9999","cwd":"%s","hook_event_name":"PreToolUse","tool_name":"Agent","tool_input":{"description":"d","prompt":"p","subagent_type":"%s","run_in_background":true}}' \
            "${cwd}" "${typ}"
    fi
}

# kor_ra <rå stdin> — kör hooken exakt som settings.json gör: bytes på stdin.
kor_ra() {
    printf '%s' "${1}" > "${TEST_DIR}/payload.json"
    CLAUDE_PROJECT_DIR="${TEST_DIR}" bash "${TEST_DIR}/scripts/agent-spawn-log.sh" \
        < "${TEST_DIR}/payload.json" \
        > "${TEST_DIR}/stdout.txt" \
        2> "${TEST_DIR}/stderr.txt"
    EC=$?
}

# kor <subagent_type> [isolation] [cwd] — bygger payloaden och kör.
# Payloaden byggs inuti funktionen i stället för vid anropet: en command
# substitution som argument maskerar returvärdet (SC2312), och husets idiom är
# att bryta ut den kedjan (check-lesson-numbers.sh rad 62).
kor() {
    local ra
    ra="$(payload "${@}")"
    kor_ra "${ra}"
}

check_exit() {
    local label="${1}" forvantat="${2}" faktiskt="${3}"
    if [[ "${faktiskt}" = "${forvantat}" ]]; then
        echo "  ✅ ${label}: exit=${faktiskt}"
        return 0
    fi
    echo "  ❌ ${label}: exit=${faktiskt} (förväntat ${forvantat})"
    return 1
}

# check_falt <label> <nyckel> <förväntat> — läser SISTA raden i loggen.
check_falt() {
    local label="${1}" nyckel="${2}" forvantat="${3}"
    local rad faktiskt
    rad="$(tail -n 1 "${LOGG}" 2> /dev/null || true)"
    faktiskt="$(jq -r --arg k "${nyckel}" '.[$k] // "null" | tostring' <<< "${rad}" 2> /dev/null || true)"
    if [[ "${faktiskt}" = "${forvantat}" ]]; then
        echo "  ✅ ${label}: .${nyckel} = ${faktiskt}"
        return 0
    fi
    echo "  ❌ ${label}: .${nyckel} = ${faktiskt} (förväntat ${forvantat})"
    echo "     rad: ${rad}"
    return 1
}

check_tyst_stdout() {
    local label="${1}"
    local storlek
    storlek="$(wc -c < "${TEST_DIR}/stdout.txt" 2> /dev/null || true)"
    if [[ "${storlek// /}" = "0" ]]; then
        echo "  ✅ ${label}: stdout tom (kan inte tolkas som hook-beslut)"
        return 0
    fi
    echo "  ❌ ${label}: stdout var ${storlek} byte — en hook som skriver på"
    echo "     stdout kan neka anropet."
    cat "${TEST_DIR}/stdout.txt"
    return 1
}

check_radantal() {
    local label="${1}" forvantat="${2}"
    local antal
    antal="$(wc -l < "${LOGG}" 2> /dev/null || true)"
    if [[ "${antal// /}" = "${forvantat}" ]]; then
        echo "  ✅ ${label}: ${antal} rad(er) i loggen"
        return 0
    fi
    echo "  ❌ ${label}: ${antal// /} rad(er) (förväntat ${forvantat})"
    return 1
}

mark() {
    if [[ "${1}" -eq 0 ]]; then
        PASSED=$((PASSED + 1)); echo "  → PASS"
    else
        FAILED=$((FAILED + 1)); echo "  → FAIL"
    fi
}

# ============================================================
echo "═══ T1: typad agent med isolation: worktree → isolerad, källa frontmatter ═══"
setup
skriv_agent "bygg-agent" "isolation: worktree
"
kor "bygg-agent"
ok=0
check_exit "T1" 0 "${EC}" || ok=1
check_falt "T1" "isolation" "worktree" || ok=1
check_falt "T1" "isolation_kalla" "frontmatter" || ok=1
check_falt "T1" "type" "bygg-agent" || ok=1
check_tyst_stdout "T1" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: inbyggd typ utan agentfil → oisolerad (andra riktningen) ═══"
setup
skriv_agent "bygg-agent" "isolation: worktree
"
kor "general-purpose"
ok=0
check_exit "T2" 0 "${EC}" || ok=1
check_falt "T2" "isolation" "null" || ok=1
check_falt "T2" "isolation_kalla" "null" || ok=1
check_falt "T2" "type" "general-purpose" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: explicit spawn-parameter på filfri typ → källa param ═══"
setup
kor "general-purpose" "worktree"
ok=0
check_exit "T3" 0 "${EC}" || ok=1
check_falt "T3" "isolation" "worktree" || ok=1
check_falt "T3" "isolation_kalla" "param" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: parameter före frontmatter när båda finns ═══"
setup
skriv_agent "bygg-agent" "isolation: worktree
"
kor "bygg-agent" "remote"
ok=0
check_exit "T4" 0 "${EC}" || ok=1
check_falt "T4" "isolation" "remote" || ok=1
check_falt "T4" "isolation_kalla" "param" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T5: agentfil med frontmatter men utan isolation-nyckeln → null ═══"
setup
skriv_agent "las-agent" "description: rent läsande, behöver ingen worktree
"
kor "las-agent"
ok=0
check_exit "T5" 0 "${EC}" || ok=1
check_falt "T5" "isolation" "null" || ok=1
check_falt "T5" "isolation_kalla" "null" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T6: citerat YAML-värde → avciteras ═══"
setup
skriv_agent "citerad" 'isolation: "worktree"
'
kor "citerad"
ok=0
check_exit "T6" 0 "${EC}" || ok=1
check_falt "T6" "isolation" "worktree" || ok=1
check_falt "T6" "isolation_kalla" "frontmatter" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T7: isolation: enbart i brödtexten → räknas INTE ═══"
setup
printf -- '---\nname: brodtext\ndescription: d\n---\n\nisolation: worktree\n' \
    > "${TEST_DIR}/.claude/agents/brodtext.md"
kor "brodtext"
ok=0
check_exit "T7" 0 "${EC}" || ok=1
check_falt "T7" "isolation" "null" || ok=1
check_falt "T7" "isolation_kalla" "null" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T8: trasig stdin → exit 0, ingen rad, tyst stdout (blockerar aldrig) ═══"
setup
kor_ra "detta är inte JSON {{{"
ok=0
check_exit "T8" 0 "${EC}" || ok=1
check_radantal "T8" 0 || ok=1
check_tyst_stdout "T8" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T9: sökvägs-spärr — subagent_type utanför agentkatalogen ═══"
setup
mkdir -p "${TEST_DIR}/utanfor"
printf -- '---\nname: smugglad\nisolation: worktree\n---\n' \
    > "${TEST_DIR}/utanfor/smugglad.md"
kor "../utanfor/smugglad"
ok=0
check_exit "T9" 0 "${EC}" || ok=1
check_falt "T9" "isolation" "null" || ok=1
check_falt "T9" "isolation_kalla" "null" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T10: append-only — befintlig historik rörs aldrig ═══"
setup
skriv_agent "bygg-agent" "isolation: worktree
"
{
    printf '{"ts":"2026-07-28T11:45:43Z","session":"1bd277c2","type":"Explore","isolation":null,"bg":false,"fran_worktree":false}\n'
    printf '{"ts":"2026-07-28T12:16:33Z","session":"68a8e538","type":"bygg-agent","isolation":null,"bg":true,"fran_worktree":false}\n'
} > "${LOGG}"
cp "${LOGG}" "${TEST_DIR}/fore.jsonl"
kor "bygg-agent"
ok=0
check_exit "T10" 0 "${EC}" || ok=1
check_radantal "T10" 3 || ok=1
check_falt "T10" "isolation" "worktree" || ok=1
if head -n 2 "${LOGG}" | diff -q - "${TEST_DIR}/fore.jsonl" > /dev/null 2>&1; then
    echo "  ✅ T10: de två historiska raderna är byte-identiska"
else
    echo "  ❌ T10: historiska rader ändrades"
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
