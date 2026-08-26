#!/usr/bin/env bash
# scripts/test-deny-resend-send.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-resend-send.sh (TASK-137,
# MAIL-LÅSET). Uppdragets AC#3-krav: planterade sänd-formade indata NEKAS
# (exit 2), legitima indata SLÄPPS (exit 0) — för VARJE väg (Bash-endpoint,
# MCP-verktyg i båda namnformerna) och för hookens egna fail-closed-krav
# (§ FAIL-CLOSED-KONTRAKTET i scripts/deny-resend-send.sh).
#
#   D1–D5   Bash-vägen: planterade sänd-endpoints NEKAS (exit 2)
#   D6–D11  MCP-vägen: planterade sänd-verktyg, båda prefixformerna, NEKAS
#   A1–A3   Bash-vägen: legitima kommandon SLÄPPS (exit 0), inkl. Resend-
#           DOMÄN-endpoint (måste INTE nekas — Grind 0-behovet)
#   A4–A9   MCP-vägen: legitima Resend-läs/domän/admin-verktyg samt
#           medvetet-INTE-nekade sänd-angränsande verktyg (cancel-email,
#           create-broadcast) SLÄPPS, plus ett helt orelaterat tool_name
#   F1–F5   FAIL-CLOSED: jq saknas, trasig JSON, tom stdin, saknad
#           policyfil, tom regel-array i policyn — samtliga NEKAR (exit 2)
#   E1      Exit-koden är EXAKT 2 på en deny-väg, inte "vilken icke-noll
#           kod som helst" — det är den enda kod Claude Code garanterat
#           tolkar som blockerande (se skriptets § FAIL-CLOSED-KONTRAKTET)
#
# Test-isolering: TEST_DIR mirrorar produktionslayouten (skriptet på
# scripts/deny-resend-send.sh, policyn på .mail-lock-policy.conf i samma
# relativa position) så MAIL_LOCK_POLICY:s default-upplösning
# (${SCRIPT_DIR}/../.mail-lock-policy.conf) faktiskt prövas — samma
# disciplin som scripts/test-heartbeat-svep.sh. F1 (jq saknas) simuleras
# genom att ta bort katalogen som äger den RIKTIGA jq-binären ur PATH
# (verifierat 2026-08-04: jq finns ENDAST i /usr/bin på denna maskin,
# bash i /bin — att utesluta /usr/bin ur PATH gör jq oresolverbart utan
# att göra bash själv oresolverbart).
#
# Användning: bash scripts/test-deny-resend-send.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-137 · scripts/deny-resend-send.sh · scripts/test-heartbeat-svep.sh (mönster)
# Etablerad: TASK-137, 2026-08-04

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task137-test-deny-resend-send"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-resend-send.sh"
POLICY_SRC="${REPO_ROOT}/.mail-lock-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-resend-send.sh"
POLICY="${TEST_DIR}/.mail-lock-policy.conf"

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

# PATH utan katalogen som äger den riktiga jq-binären (F1). Beräknas en
# gång i setup mot den FAKTISKA jq-platsen — ingen hårdkodning av
# "/usr/bin", eftersom den platsen är miljöspecifik.
# TASK-185 (2026-08-26): en-katalogs-borttagningen (ovan, ursprunglig form)
# döljer bara den FÖRSTA träffen `command -v jq` råkar resolva till —
# otillräckligt på ubuntu-latest, som rutinmässigt exponerar jq via mer än
# en PATH-katalog. Att STRYKA hela katalogen (en tidigare, redan
# förkastad fix) är ÄNNU farligare på merged-usr-plattformar (`/bin` är
# symlänk till `/usr/bin`, samma fysiska katalog som TVÅ PATH-segment):
# den katalogen håller inte bara jq utan ALLA coreutils — att stryka den
# tar bort `dirname`/`bash` också och kraschar hela körningen (exit 127).
# Se scripts/test-deny-facit-godkand-skrivning.sh:s path_utan() § FIXEN
# för fullständig historik + kontrollerad repro. Fixen här: shimma en
# FILTRERAD symlänk-kopia (allt UTOM jq) i stället för att stryka hela
# segmentet.
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

# run_case <namn> <väntad exit> <json-input> [env-tilldelningar...]
# EXPECT_OUT / NOT_EXPECT_OUT sätts FÖRE anropet (samma kontrakt som
# test-heartbeat-svep.sh), nollställs av run_case.
EXPECT_OUT=""
NOT_EXPECT_OUT=""

run_case() {
    local name="$1" want="$2" json="$3"; shift 3
    local got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    # printf '%s' (inte en <<<-herestring) — herestrings lägger alltid till
    # en avslutande newline, vilket gör F3 (genuint tom stdin) omöjlig att
    # uttrycka. printf '%s' "" ger exakt noll byte.
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
    # $1 = kommandosträng, JSON-inbäddad (enkla citattecken i input undviks
    # i testfallen nedan, ingen escaping behövs för dessa konstruerade fall)
    printf '{"tool_name":"Bash","tool_input":{"command":"%s"}}' "$1"
}

mcp_json() {
    printf '{"tool_name":"%s","tool_input":{}}' "$1"
}

setup
compute_path_no_jq
printf 'test-deny-resend-send: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# D1–D5 — Bash-vägen, PLANTERAT: sänd-endpoints NEKAS.
#
# JSON byggs i ett EGET, standalone kommandosubstitutions-steg innan
# run_case anropas (aldrig "$(fn ...)" direkt som argument) — annars
# maskerar run_case:s egen (irrelevanta) exit-kod byggfunktionens, vilket
# är precis SC2312-varningen shellcheck-strict (--enable=all) fäller på.
JSON="$(bash_json 'curl -s https://api.resend.com/emails -d @payload.json')"
EXPECT_OUT="sänd-endpoint"
run_case "D1  Bash: curl POST api.resend.com/emails NEKAS" 2 "${JSON}"

JSON="$(bash_json 'curl -X POST https://api.resend.com/emails/batch -d @batch.json')"
EXPECT_OUT="sänd-endpoint"
run_case "D2  Bash: curl api.resend.com/emails/batch NEKAS" 2 "${JSON}"

JSON="$(bash_json 'curl -X POST https://api.resend.com/broadcasts/abc123/send')"
EXPECT_OUT="sänd-endpoint"
run_case "D3  Bash: curl api.resend.com/broadcasts/id/send NEKAS" 2 "${JSON}"

JSON="$(bash_json 'openssl s_client -connect smtp.resend.com:465')"
EXPECT_OUT="sänd-endpoint"
run_case "D4  Bash: SMTP-anrop mot smtp.resend.com NEKAS" 2 "${JSON}"

JSON="$(bash_json 'curl -X POST https://API.RESEND.COM/EMAILS -d @x.json')"
EXPECT_OUT="sänd-endpoint"
run_case "D5  Bash: skiftläges-variant API.RESEND.COM/EMAILS NEKAS" 2 "${JSON}"

# ============================================================
# D6–D11 — MCP-vägen, PLANTERAT: sänd-verktyg NEKAS, båda prefixformerna.
echo ""
JSON="$(mcp_json 'mcp__resend__send-email')"
EXPECT_OUT="är sänd-klassat"
run_case "D6  MCP: mcp__resend__send-email NEKAS" 2 "${JSON}"

JSON="$(mcp_json 'mcp__resend__send-batch-emails')"
EXPECT_OUT="är sänd-klassat"
run_case "D7  MCP: mcp__resend__send-batch-emails NEKAS" 2 "${JSON}"

JSON="$(mcp_json 'mcp__resend__send-broadcast')"
EXPECT_OUT="är sänd-klassat"
run_case "D8  MCP: mcp__resend__send-broadcast NEKAS" 2 "${JSON}"

JSON="$(mcp_json 'mcp__resend__send-event')"
EXPECT_OUT="är sänd-klassat"
run_case "D9  MCP: mcp__resend__send-event NEKAS" 2 "${JSON}"

JSON="$(mcp_json 'mcp__plugin_resend_resend__send-email')"
EXPECT_OUT="är sänd-klassat"
run_case "D10 MCP: mcp__plugin_resend_resend__send-email (plugin-form) NEKAS" 2 "${JSON}"

JSON="$(mcp_json 'mcp__plugin_resend_resend__send-broadcast')"
EXPECT_OUT="är sänd-klassat"
run_case "D11 MCP: mcp__plugin_resend_resend__send-broadcast (plugin-form) NEKAS" 2 "${JSON}"

# ============================================================
# D12–D13 — S105-utvidgningen: egna mail-EF:er är sänd-vägar (se
# .mail-lock-policy.conf § S105-utvidgningen).
echo ""
JSON="$(bash_json 'curl -s https://abc123.supabase.co/functions/v1/send-receipt-email -d @payload.json')"
EXPECT_OUT="sänd-endpoint"
run_case "D12 Bash: curl mot functions/v1/send-receipt-email NEKAS (S105)" 2 "${JSON}"

JSON="$(bash_json 'supabase functions invoke send-registration-confirmation --body {}')"
EXPECT_OUT="sänd-endpoint"
run_case "D13 Bash: supabase functions invoke send-* NEKAS (S105)" 2 "${JSON}"

# ============================================================
# A1–A3 — Bash-vägen, legitima kommandon SLÄPPS.
echo ""
JSON="$(bash_json 'curl -s https://api.github.com/repos/high-five-group/miranon-media-admin')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A1  Bash: vanlig curl mot GitHub API SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'gh pr create --title x --body y')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A2  Bash: gh pr create SLÄPPS" 0 "${JSON}"

JSON="$(bash_json 'curl -s https://api.resend.com/domains')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A3  Bash: curl mot Resend DOMÄN-endpoint (ej sänd) SLÄPPS (Grind 0)" 0 "${JSON}"

# ============================================================
# A4–A9 — MCP-vägen, legitima/medvetet-ej-nekade verktyg SLÄPPS.
echo ""
JSON="$(mcp_json 'mcp__resend__list-domains')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A4  MCP: mcp__resend__list-domains SLÄPPS" 0 "${JSON}"

JSON="$(mcp_json 'mcp__resend__verify-domain')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A5  MCP: mcp__resend__verify-domain SLÄPPS (Grind 0)" 0 "${JSON}"

JSON="$(mcp_json 'mcp__plugin_resend_resend__get-domain')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A6  MCP: mcp__plugin_resend_resend__get-domain SLÄPPS" 0 "${JSON}"

JSON="$(mcp_json 'mcp__resend__cancel-email')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A7  MCP: mcp__resend__cancel-email SLÄPPS (medvetet ej sänd-klassat)" 0 "${JSON}"

JSON="$(mcp_json 'mcp__resend__create-broadcast')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A8  MCP: mcp__resend__create-broadcast SLÄPPS (utkast, ingen dispatch)" 0 "${JSON}"

NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A9  MCP: helt orelaterat tool_name (Read) SLÄPPS" 0 \
    '{"tool_name":"Read","tool_input":{"file_path":"/tmp/x"}}'

# ============================================================
# A10–A11 — S105-utvidgningen, andra riktningen: legitima EF-/testformer
# får INTE fällas av de nya mönstren.
echo ""
JSON="$(bash_json 'supabase functions deploy send-registration-confirmation --project-ref abc123')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A10 Bash: supabase functions deploy send-* SLÄPPS (deploy skickar inget)" 0 "${JSON}"

JSON="$(bash_json 'npx playwright test atgarder-bekraftelsemail.staging.test.ts')"
NOT_EXPECT_OUT="MAIL-LÅS"
run_case "A11 Bash: playwright-test med mail-namn i filnamnet SLÄPPS" 0 "${JSON}"

# ============================================================
# F1–F5 — FAIL-CLOSED. Varje internt fel NEKAR (exit 2), aldrig fail-open.
echo ""
JSON="$(mcp_json 'mcp__resend__list-domains')"
EXPECT_OUT="jq saknas"
run_case "F1  fail-closed: jq saknas i PATH → NEKAS (exit 2)" 2 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

EXPECT_OUT="gick inte att tolka"
run_case "F2  fail-closed: trasig JSON på stdin → NEKAS (exit 2)" 2 \
    '{"tool_name": detta är inte giltig json'

EXPECT_OUT="tom eller oläsbar"
run_case "F3  fail-closed: tom stdin → NEKAS (exit 2)" 2 \
    ""

# F4: peka MAIL_LOCK_POLICY på en sökväg som inte finns.
JSON="$(mcp_json 'mcp__resend__list-domains')"
EXPECT_OUT="saknas"
run_case "F4  fail-closed: policyfilen saknas → NEKAS (exit 2)" 2 "${JSON}" \
    "MAIL_LOCK_POLICY=/finns/inte/.mail-lock-policy.conf"

# F5: en policyfil med en TOM sänd-verktygs-array — ett trasigt/urvattnat
# regelverk ska nekas, inte tolkas som "inget att neka".
TOM_POLICY="${TEST_DIR}/.tom-policy.conf"
{
    printf 'MAIL_LOCK_MCP_PREFIXES=("mcp__resend__")\n'
    printf 'MAIL_LOCK_SEND_TOOLS=()\n'
    printf 'MAIL_LOCK_ENDPOINT_PATTERNS=("api\\.resend\\.com/emails")\n'
} > "${TOM_POLICY}"
JSON="$(mcp_json 'mcp__resend__list-domains')"
EXPECT_OUT="noll sänd-klassade"
run_case "F5  fail-closed: policyn definierar noll sänd-verktyg → NEKAS (exit 2)" 2 "${JSON}" \
    "MAIL_LOCK_POLICY=${TOM_POLICY}"

# ============================================================
# E1 — exit-koden på en deny-väg är EXAKT 2 (redan verifierat av D1-D11:s
# `want=2`, men gör kravet EXPLICIT och oberoende av run_case:s interna
# jämförelse som ett sista, läsbart kvitto).
echo ""
JSON="$(mcp_json 'mcp__resend__send-email')"
( cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}" ) >/dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2 (Claude Codes enda garanterat blockerande kod)\n'
    PASSED=$(( PASSED + 1 ))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$(( FAILED + 1 ))
fi

printf '\ntest-deny-resend-send: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
