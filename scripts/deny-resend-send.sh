#!/usr/bin/env bash
# scripts/deny-resend-send.sh — MAIL-LÅSET, lager 2 ("dubbel botten").
#
# VARFÖR SKRIPTET FINNS: Marcus-GO 2026-08-04 (S96 Del 10, PR #689) kräver
#   att Code/agenter ALDRIG kan skicka riktigt mail via Resend förrän
#   `resend@claude-plugins-official` medvetet aktiveras — och kravet är
#   uttryckligen MEKANISKT: "deny-regler + hook + nycklar utom räckhåll,
#   aldrig prosa" (Rogers krav). Detta skript är hooken; lager 1 är
#   `.claude/settings.json` → `permissions.deny` (se den filen och
#   TASK-137:s kortbeskrivning för hela tre-lagers-arkitekturen).
#
# VARFÖR TVÅ LAGER OCH INTE BARA ETT: Anthropics egen dokumentation säger
#   rakt ut att permission-systemet, INTE hooks, är den garanterat
#   fail-closed vägen (code.claude.com/docs/en/hooks.md, verifierat
#   2026-08-04). Denna hook är alltså INTE den primära spärren — den är
#   en oberoende andra kontroll som (a) täcker Bash-nivån (permission-
#   systemets Bash-regler matchar prefix som "git add:*", inte fri text
#   någonstans i en kommandorad, så en `curl` mot Resends API skulle inte
#   fångas av permissions.deny ensamt) och (b) dubbelkollar samma
#   MCP-verktygsnamn som lager 1, ifall listan där någonsin glider.
#
# ═══ FAIL-CLOSED-KONTRAKTET — läs innan du ändrar något här ═══
#
#   Claude Codes PreToolUse-hookar är FAIL-OPEN BY DESIGN om hooken
#   kraschar. Det dokumenterade exit-kod-kontraktet
#   (code.claude.com/docs/en/hooks.md, § exit-koder, hämtat 2026-08-04):
#     exit 0   → verktygsanropet FORTSÄTTER. stdout tolkas som JSON; ett
#                `hookSpecificOutput.permissionDecision` däri LÄSS och kan
#                neka — men bara på denna väg.
#     exit 2   → verktygsanropet BLOCKERAS ALLTID. stderr blir skälet
#                modellen ser; stdout ignoreras helt.
#     annat ≠0 → verktygsanropet FORTSÄTTER ändå (fail-OPEN) — även om
#                hooken kraschat på trasig JSON, saknad `jq`, timeout,
#                eller vad som helst annat. Detta gäller ordagrant citerat
#                ur dokumentationen: en hook som "errors" (exit annat än 2)
#                låter verktyget fortsätta; samma sak om hooken timeoutar
#                eller levererar ogiltig JSON.
#
#   KONSEKVENS FÖR DETTA SKRIPT: eftersom Rogers krav är noll-tolerans,
#   inte "bäst-ansträngning", MÅSTE VARJE nekande väg härifrån sluta i
#   `exit 2` — aldrig i JSON-på-stdout-med-exit-0 (den vägen har dessutom
#   en känd opålitlighets-instans för Edit-verktyget,
#   github.com/anthropics/claude-code/issues/37210, som gör exit-2-vägen
#   det enda dokumenterat garanterade valet). Detta skript avviker DÄRFÖR
#   MEDVETET från `scripts/deny-sweeping-git-add.sh`s konvention (som gör
#   `command -v jq >/dev/null 2>&1 || exit 0` — failar ÖPPET om jq saknas,
#   rimligt för den hookens syfte: en arbetsflödesnudge mot svepande
#   `git add`, inte Rogers hårda krav). Varje internt fel härifrån
#   (saknad `jq`, tom/trasig stdin, saknad eller trasig policyfil, tomma
#   regel-listor i policyn) NEKAR — se `deny()` nedan, som ALLTID slutar
#   i `exit 2`. Skriptet kör därför `set -uo pipefail`, INTE `-e`: med
#   `-e` skulle ett internt kommando som failar avbryta skriptet med DESS
#   EGEN exit-kod (oftast 1), vilket enligt ovanstående tabell är
#   FAIL-OPEN — exakt tvärtom mot avsikten. Varje riskabel operation nedan
#   kontrolleras därför explicit och rutas till `deny()` (exit 2) vid fel,
#   aldrig implicit via `-e`.
#
#   SCOPE-GRÄNS, öppet skriven: fail-closed-kontraktet ovan gäller
#   HOOKENS EGEN infrastruktur (jq finns, JSON går att tolka, tool_name
#   finns, policyfilen går att läsa och är icke-tom). Det gäller INTE
#   hypotetiska teckenkodningsfel i själva kommandosträngen som får `jq`
#   att råka extrahera en tom sträng ur ett i övrigt giltigt anrop — ett
#   sådant fall vore ett fel i Claude Codes egen hook-JSON, utanför denna
#   hooks hotmodell, och skulle (om det någonsin inträffade) resultera i
#   "inget mönster matchar en tom sträng" → släpp, inte nekande. Det är en
#   medveten, avgränsad lucka — inte en tyst sådan.
#
# VERKTYGSNAMNEN ÄR HYPOTES TILLS PLUGINET ÄR INSTALLERAT: se
#   .mail-lock-policy.conf § "NAMNEN NEDAN ÄR HYPOTES" och TASK-137:s
#   kortbeskrivning. Skriptets LOGIK är oberoende av om namnen stämmer
#   exakt — bara VÄRDENA i .mail-lock-policy.conf behöver uppdateras när
#   installationen sker.
#
# INPUT: PreToolUse hook-JSON på stdin, fältnamn `tool_name` (snake_case)
#   och `tool_input.command` för Bash-anrop — bekräftat mot
#   code.claude.com/docs/en/hooks.md § JSON-schemat, 2026-08-04.
#
# Testsvit: scripts/test-deny-resend-send.sh (tvåsidigt bevis: planterade
#   sänd-formade indata nekas, legitima indata släpps — båda riktningarna,
#   för Bash-vägen OCH för MCP-vägen, båda prefixformerna).
#
# Källa: TASK-137 · CLAUDE.md § "Mönster: befintliga hooks" ·
#        scripts/deny-sweeping-git-add.sh (mönster-precedent, med den
#        medvetna fail-open/fail-closed-avvikelsen ovan) ·
#        code.claude.com/docs/en/hooks.md · code.claude.com/docs/en/permissions.md
# Etablerad: TASK-137, 2026-08-04

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIL_LOCK_POLICY="${MAIL_LOCK_POLICY:-${SCRIPT_DIR}/../.mail-lock-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# deny <skäl> — skriver deny-meddelandet till stderr (det modellen ser)
# och avslutar med exit 2, den ENDA väg som garanterat blockerar
# verktygsanropet oavsett vad stdout innehåller (se § FAIL-CLOSED ovan).
deny() {
    printf 'MAIL-LÅS (%s): %s\n' "${MAIL_LOCK_TASK_ID:-TASK-137}" "$1" >&2
    printf 'Rogers krav (S96 Del 10, Marcus-GO 2026-08-04): Code/agenter får ALDRIG skicka mail via Resend mekaniskt. Förbudet hävs medvetet av Marcus vid installationen — kringgå det aldrig.\n' >&2
    exit 2
}

# jq krävs för att tolka hook-input. FAIL-CLOSED: "vet inte" nekar, det
# släpper inte igenom.
jq_version_ok || deny "jq saknas eller är för gammal i PATH — hooken kan inte verifiera anropet (TASK-312, .jq-version-policy.conf)."

# Läs hela stdin utan extern process (`read` är ett bash-inbyggt kommando,
# ingen `cat`-dependency). `read -d ''` returnerar icke-noll vid EOF (det
# normala fallet, ingen NUL-byte i indatan) — vi bryr oss bara om att
# INPUT blev ifylld, inte om `read`s egen exit-kod.
INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || deny "tom eller oläsbar hook-input på stdin."

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ -n "${TOOL_NAME}" ]] || deny "hook-input gick inte att tolka som JSON, eller saknar tool_name."

[[ -f "${MAIL_LOCK_POLICY}" ]] || deny "policyfilen ${MAIL_LOCK_POLICY} saknas."
# shellcheck source=/dev/null
source "${MAIL_LOCK_POLICY}" || deny "policyfilen ${MAIL_LOCK_POLICY} gick inte att läsa (syntaxfel?)."

[[ "${#MAIL_LOCK_SEND_TOOLS[@]:-0}" -gt 0 ]] || deny "policyn definierar noll sänd-klassade verktyg — ett tomt regelverk är inte 'inget att neka', det är ett trasigt lås."
[[ "${#MAIL_LOCK_MCP_PREFIXES[@]:-0}" -gt 0 ]] || deny "policyn definierar noll MCP-prefix."
[[ "${#MAIL_LOCK_ENDPOINT_PATTERNS[@]:-0}" -gt 0 ]] || deny "policyn definierar noll endpoint-mönster."

if [[ "${TOOL_NAME}" = "Bash" ]]; then
    COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
    shopt -s nocasematch
    for pattern in "${MAIL_LOCK_ENDPOINT_PATTERNS[@]}"; do
        if [[ "${COMMAND}" =~ ${pattern} ]]; then
            shopt -u nocasematch
            deny "Bash-kommandot träffar en Resend sänd-endpoint (mönster: ${pattern})."
        fi
    done
    shopt -u nocasematch
    exit 0
fi

# MCP-vägen: exakt-match mot <prefix><sänd-verktyg> för varje kombination
# — täcker båda namnformerna (fristående server + plugin-bunden) utan att
# anta något om TOOL_NAME:s struktur bortom en enkel strängjämförelse.
for prefix in "${MAIL_LOCK_MCP_PREFIXES[@]}"; do
    for tool in "${MAIL_LOCK_SEND_TOOLS[@]}"; do
        if [[ "${TOOL_NAME}" = "${prefix}${tool}" ]]; then
            deny "MCP-verktyget ${TOOL_NAME} är sänd-klassat (Resend e-post/broadcast/event-dispatch)."
        fi
    done
done

exit 0
