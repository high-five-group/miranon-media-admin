#!/usr/bin/env bash
# scripts/deny-prod-airtable.sh — mekaniskt lås mot agent-kommandon riktade
# mot Airtable-produktionsbasen via MCP (TASK-419).
#
# VARFÖR SKRIPTET FINNS: mätt 2026-09-06 (S123, tasks/lessons.d/prod-basen-
#   last-av-tva-agenter-ett-prosa-forbud-utan-mekanism-haller-inte-under-
#   fleet.md) — research-passet om förvärmning och review-agenten på PR
#   #2400 anropade `mcp__airtable__`-verktyg mot prod-bas-ID:t
#   (app8uGPrVCVOm6LfD), read-only, för fältdata staging bar identiskt.
#   Doktrinen "prod är förbjuden" bars dittills ENBART av prosa
#   (agentkontrakten, .claude/agents/*.md) — Bash-ytan hade redan sitt
#   mekaniska lås för Supabase-prod (scripts/deny-prod-ref.sh, TASK-203),
#   men ingen motsvarighet täckte Airtable-MCP-ytan. Detta skript är den
#   motsvarigheten, byggt i SAMMA form (config-driven grindvakt, CLAUDE.md
#   § Custom CI-grindvakts-logik).
#
# VAD DEN PRÖVAR: förekomst av prod-bas-ID:t (PROD_AIRTABLE_BASE_ID,
#   .prod-airtable-policy.conf) NÅGONSTANS i den serialiserade
#   `tool_input`-payloaden — samma MEDVETET BREDA substräng-matchning som
#   deny-prod-ref.sh gör mot Bash-kommandoraden (se den filens § MATCHER
#   för den fulla motiveringen): ett Airtable-bas-ID är en opraktiskt
#   omöjlig-att-nämna-av-misstag 17-teckens sträng, och en fält-specifik
#   match (bara `tool_input.baseId`) hade missat varje verktyg vars
#   payload bär basreferensen på ett annat sätt (nästlat i en
#   `filterByFormula`, en URL, en framtida verktygsparameter). En hel-
#   payload-substräng-match behöver inte hållas i synk med varje ny
#   Airtable-MCP-verktygssignatur.
#
# ═══ TVÅ FAMILJER, TVÅ REGLER — LÄS DETTA INNAN DU ÄNDRAR NÅGOT HÄR ═══
#
#   `mcp__airtable__*` (PAT-servern, PROD_AIRTABLE_ALWAYS_PREFIXES) NEKAS
#   OVILLKORLIGT — huvudsession såväl som subagent-kontext. Denna server
#   ligger kvar i VARJE agents verktygspool (legitim STAGING-verifiering)
#   och bär inget dokumenterat HITL-undantag för prod.
#
#   `mcp__claude_ai_Airtable__*` (claude.ai-connectorn,
#   PROD_AIRTABLE_AGENT_ONLY_PREFIXES) NEKAS ENDAST I AGENT-KONTEXT.
#   Marcus egen interaktiva huvudsession använder denna connector MEDVETET
#   mot prod i HITL-läge för automations-/interface-introspektion som
#   PAT-servern inte kan göra alls (~/.claude/CLAUDE.md § Verktygsfakta,
#   "Airtable-MCP:erna är TVÅ, med olika räckvidd"). Uppdraget till detta
#   kort frågade uttryckligen om huvudsession går att SKILJA från
#   agent-anrop — svaret är JA, och är PRÖVAT, inte antaget:
#
#     `agent_id` är ett bekräftat "common input field" i PreToolUse-
#     hook-indatan, satt ENDAST i subagent-kontext. Verifierat ORDAGRANT
#     2026-09-07 mot code.claude.com/docs/en/hooks.md (rå `curl` mot
#     .md-varianten, INTE en WebFetch-sammanfattning — samma teknik
#     scripts/deny-subagent-vantan.sh's premiss-pass använde för att
#     undvika sammanfattningsrisk): "agent_id — Unique identifier for the
#     subagent. Present only when the hook fires inside a subagent call.
#     Use this to distinguish subagent hook calls from main-thread
#     calls." Lokalt installerad `claude 2.1.263` (nyare än
#     deny-subagent-vantan.sh's 2.1.224 vid dess byggtillfälle) — samma
#     fält, ingen version-drift. Detta ÄR redan SKARPT i bruk i detta repo
#     (scripts/deny-subagent-vantan.sh, TASK-148.2) — ingen ny hypotes,
#     samma bekräftade mekanism återanvänd för en ny riskklass.
#
#   Följden: huvudsessionens (Marcus, HITL) anrop mot
#   `mcp__claude_ai_Airtable__*` med prod-bas-ID:t SLÄPPS IGENOM (`agent_id`
#   saknas), men SAMMA anrop från en subagent (bygg-agent, review-agent,
#   research-pass — eller en `general-purpose`/`claude`-catchall som INTE
#   har servern strukturellt borttagen via `disallowedTools`) NEKAS.
#
# ═══ FAIL-CLOSED-KONTRAKTET — se deny-prod-ref.sh för fullt resonemang ═══
#
#   Samma motivering som deny-prod-ref.sh: en obehörig prod-läsning/skrivning
#   är oåterkallelig i den bemärkelsen att datan redan lämnat basen (Lottas
#   skarpa miljö) — även read-only är exponering. `set -uo pipefail`, INTE
#   `-e` (samma skäl som deny-prod-ref.sh/deny-resend-send.sh: varje
#   riskabel operation kontrolleras explicit och rutas till `deny()` vid
#   fel, i stället för att låta `-e` avbryta med en icke-2 exitkod som
#   enligt hooks.md:s dokumenterade kontrakt är FAIL-OPEN).
#
# MATCHER: registrerad i .claude/settings.json på matchern
#   `^mcp__airtable__.*$|^mcp__claude_ai_Airtable__.*$` (samma
#   `mcp__<server>__.*`-form som code.claude.com/docs/en/hooks.md § MCP
#   tool naming föreskriver för att träffa VARJE verktyg från en server —
#   en bar `mcp__airtable` utan `.*` matchar ingenting, se samma dokument
#   § "Hyphens in the exact-match set"/matcher-tabellen).
#
# INPUT: PreToolUse hook-JSON på stdin, `tool_name`, `tool_input` och
#   (villkorat) `agent_id` — samtliga bekräftade common/event-fält.
#
# ═══ SIDO-/INTERFACE-VERKTYGEN (list_records_for_page m.fl.) — PRÖVAT ═══
#
#   Granskningsrunda 1 (PR #2442) befarade att claude.ai-connectorns sido-
#   /interface-verktyg (`list_records_for_page`, `get_record_for_page`,
#   `list_pages_for_base`) kan sakna `baseId` i `tool_input` och därmed
#   slinka förbi hel-payload-substräng-matchningen. Orkestreraren mätte
#   detta 2026-09-07 mot verktygens FAKTISKA JSON-scheman (denna agent har
#   inte `mcp__claude_ai_Airtable__*` i sin egen verktygspool —
#   `disallowedTools` i bygg-agent.md/review-agent.md/research-pass.md —
#   och kan därför inte introspektera schemat själv; mätningen är
#   ORKESTRERARENS, sourcad, inte omprövad av denna agent): samtliga tre
#   har `baseId` som `required` med mönstret `^app[A-Za-z0-9]{14}$`. Hålet
#   finns alltså INTE för dem — se D6/D7/A7 i testsviten för fixturer med
#   sido-verktygens payload-form (`pageId`/`interfaceId` vid sidan av
#   `baseId`).
#
# SCOPE, ÖPPET AVGRÄNSAT: detta skript täcker ENDAST MCP-verktygsanropen.
#   En rå `curl`/`wget` mot Airtables REST-API med prod-bas-ID:t i URL:en
#   ligger UTANFÖR denna hooks matcher (den är inte registrerad på `Bash`)
#   — kortets uppdrag bad uttryckligen bara om MCP-matchern, och ingen
#   agent har i praktiken Airtable-API-nyckeln i sin miljö för att kunna
#   konstruera ett sådant anrop. Skrivs öppet, inte tyst, per samma
#   ADR-083-disciplin resten av filen följer.
#
# Testsvit: scripts/test-deny-prod-airtable.sh (tvåsidigt bevis: PAT-
#   servern nekas ovillkorligt, claude.ai-connectorn nekas bara i
#   agent-kontext och släpps i huvudsession, staging/bas-lösa anrop
#   släpps, fail-closed på trasig indata).
#
# Källa: TASK-419 · .prod-airtable-policy.conf ·
#        scripts/deny-prod-ref.sh (formmall, substräng-matchning) ·
#        scripts/deny-subagent-vantan.sh (agent_id-mönstret, redan skarpt) ·
#        tasks/lessons.d/prod-basen-last-av-tva-agenter-ett-prosa-forbud-
#          utan-mekanism-haller-inte-under-fleet.md ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: TASK-419, 2026-09-07

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_AIRTABLE_POLICY="${PROD_AIRTABLE_POLICY:-${SCRIPT_DIR}/../.prod-airtable-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# deny <skäl> — se deny-prod-ref.sh för samma kontrakt: SKRIVER skälet till
# stderr (det agenten ser) och avslutar med exit 2, den enda väg som
# garanterat blockerar verktygsanropet oavsett vad stdout innehåller.
deny() {
    printf 'PROD-AIRTABLE-LÅS (%s): %s\n' "${PROD_AIRTABLE_TASK_ID:-TASK-419}" "$1" >&2
    printf 'Doktrin: agenter läser/skriver ALDRIG Airtable-produktionsbasen (app8uGPrVCVOm6LfD) — staging (apphjj8Q7lkXCMsL4) bär identisk fältdata för verifieringssyfte. Väg förbi: (1) byt baseId till staging-basen i anropet, ELLER (2) om detta är Marcus egen huvudsession i HITL-läge som medvetet vill läsa prod via claude.ai-connectorn: den vägen är redan öppen (denna hook nekar bara agent/subagent-anrop mot den connectorn) — se scripts/deny-prod-airtable.sh § TVÅ FAMILJER.\n' >&2
    exit 2
}

jq_version_ok || deny "jq saknas eller är för gammal i PATH — hooken kan inte verifiera anropet (TASK-312, .jq-version-policy.conf)."

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || deny "tom eller oläsbar hook-input på stdin."

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ -n "${TOOL_NAME}" ]] || deny "hook-input gick inte att tolka som JSON, eller saknar tool_name."

[[ -f "${PROD_AIRTABLE_POLICY}" ]] || deny "policyfilen ${PROD_AIRTABLE_POLICY} saknas."
# shellcheck source=/dev/null
source "${PROD_AIRTABLE_POLICY}" || deny "policyfilen ${PROD_AIRTABLE_POLICY} gick inte att läsa (syntaxfel?)."

[[ -n "${PROD_AIRTABLE_BASE_ID:-}" ]] || deny "policyn definierar ingen PROD_AIRTABLE_BASE_ID — ett tomt värde är inte 'inget att neka', det är ett trasigt lås."
[[ -n "${PROD_AIRTABLE_ALWAYS_PREFIXES[*]:+x}" || -n "${PROD_AIRTABLE_AGENT_ONLY_PREFIXES[*]:+x}" ]] || deny "policyn definierar noll verktygsprefix i båda familjerna — ett tomt regelverk är inte 'inget att neka', det är ett trasigt lås."

# Avgör vilken familj TOOL_NAME hör till. Matchar den INGENDERA (hooken
# anropad utanför sin egen matcher, t.ex. i manuell testkörning) — släpp:
# det är inte denna hooks jobb att gata verktyg den inte finns för att
# skydda (samma "release fast utanför scope"-mönster som deny-prod-ref.sh's
# `[[ "${TOOL_NAME}" = "Bash" ]] || exit 0`).
FAMILJ=""
for prefix in "${PROD_AIRTABLE_ALWAYS_PREFIXES[@]:-}"; do
    [[ -n "${prefix}" ]] || continue
    if [[ "${TOOL_NAME}" == "${prefix}"* ]]; then
        FAMILJ="alltid"
        break
    fi
done
if [[ -z "${FAMILJ}" ]]; then
    for prefix in "${PROD_AIRTABLE_AGENT_ONLY_PREFIXES[@]:-}"; do
        [[ -n "${prefix}" ]] || continue
        if [[ "${TOOL_NAME}" == "${prefix}"* ]]; then
            FAMILJ="agent-endast"
            break
        fi
    done
fi
[[ -n "${FAMILJ}" ]] || exit 0

# Serialisera HELA tool_input-payloaden (kompakt JSON) och sök
# prod-bas-ID:t som substräng — täcker `baseId`-fältet OCH varje annat
# ställe basreferensen kan dyka upp (nästlat i en formel, en framtida
# parameter). Ingen träff → inget att neka (täcker staging, bas-lösa
# anrop som list_bases, och varje annat legitimt bruk).
TOOL_INPUT_JSON="$(printf '%s' "${INPUT}" | jq -c '.tool_input // {}' 2>/dev/null)"
[[ "${TOOL_INPUT_JSON}" == *"${PROD_AIRTABLE_BASE_ID}"* ]] || exit 0

if [[ "${FAMILJ}" == "alltid" ]]; then
    deny "MCP-verktyget ${TOOL_NAME} (PAT-servern) anropas mot Airtable-produktionsbasen. Denna familj nekas ovillkorligt, oavsett huvudsession eller agent-kontext."
fi

# FAMILJ == "agent-endast": neka bara i subagent-kontext. `agent_id` är
# ett bekräftat common input field, satt ENDAST när hooken körs inuti ett
# subagent-anrop (se filhuvudets § TVÅ FAMILJER för källbeläggningen).
AGENT_ID="$(printf '%s' "${INPUT}" | jq -r '.agent_id // empty' 2>/dev/null)"
if [[ -n "${AGENT_ID}" ]]; then
    deny "MCP-verktyget ${TOOL_NAME} (claude.ai-connectorn) anropas mot Airtable-produktionsbasen i AGENT-KONTEXT (agent_id=${AGENT_ID}). Denna familj nekas i subagent-anrop — huvudsessionens (Marcus, HITL) egna anrop mot samma connector och bas är en medveten, dokumenterad undantag (~/.claude/CLAUDE.md § Verktygsfakta)."
fi

# Huvudsession (agent_id saknas): medvetet designat undantag, inte en
# lucka. Loggas synligt till stderr för efterhandsgranskning (samma
# observerbarhets-princip som deny-prod-ref.sh's "BYPASS ANVÄND"-rad) —
# stderr på en exit-0-väg når bara debug-loggen, aldrig transkriptet
# (hooks.md § Exit code 0), så detta är ett spår, inte en varning till
# modellen.
printf 'PROD-AIRTABLE-LÅS (%s): mcp__claude_ai_Airtable__-anrop mot prod-basen SLÄPPS — huvudsession (agent_id saknas), avsedd HITL-användning.\n' \
    "${PROD_AIRTABLE_TASK_ID:-TASK-419}" >&2
exit 0
