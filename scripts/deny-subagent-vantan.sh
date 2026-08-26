#!/usr/bin/env bash
# scripts/deny-subagent-vantan.sh — ADR-096 § Beslut del 2, "PreToolUse-spärren".
#
# VARFÖR SKRIPTET FINNS: en subagent har ingen framtida tur att vakna i.
#   `Monitor`-verktygets callback levereras aldrig till en subagent (L340,
#   mätt), och samma väckningslösa hål nås av `Bash` med
#   `run_in_background: true`. Tre mätta instanser av samma felklass innan
#   detta skript fanns (L323, L340, tre agenter samma dag som tillsammans
#   brände ~700k tokens på väntan som strukturellt aldrig kunde brytas,
#   2026-08-05). Anthropic har redan mekaniserat bort FYRA av fem
#   async-vägar för subagenter — `ScheduleWakeup`, `TaskOutput`,
#   `WaitForMcpServers`, `Workflow` är strukturellt borttagna ur varje
#   subagents verktygslista, "even when listed in the `tools` field"
#   (sub-agents.md). `Monitor` är den enda kvarlämnade luckan. Detta skript
#   fullföljer samma mönster med samma medel för just den luckan.
#
# VAD DEN PRÖVAR OCH GÖR: matchar `tool_name` mot policyns två listor —
#   SUBAGENT_VANTAN_ALLTID (nekas ovillkorligt, t.ex. `Monitor`) och
#   SUBAGENT_VANTAN_BAKGRUND (nekas ENDAST när
#   `tool_input.run_in_background === true`, t.ex. `Bash`) — men BARA när
#   hook-indatan bär `agent_id`. Ur code.claude.com/docs/en/hooks.md,
#   verifierad ordagrant mot lokalt installerad `claude 2.1.224` (premiss-
#   passet nedan): "`agent_id` — Unique identifier for the subagent. Present
#   only when the hook fires inside a subagent call. Use this to distinguish
#   subagent hook calls from main-thread calls." Huvudsessionens egna
#   anrop (`agent_id` saknas) släpps igenom OMEDELBART, innan policyn ens
#   läses — se § SCOPE-GRÄNS nedan för varför det är en medveten gräns, inte
#   en genväg.
#
# ═══ PREMISS-PASSET (ADR-086, obligatoriskt per varje TASK-148-skiva) ═══
#
#   Research-underlaget (docs/research/subagent-parkering-handoff-kontrakt-
#   2026-08-05.md § 1.1) mättes mot `claude 2.1.222`. Omverifierat vid
#   byggtillfället (2026-08-07) mot LOKALT INSTALLERAD `claude 2.1.224` och
#   RÅ förstapartsdokumentation (curl mot .md-varianten, samma teknik
#   research-passet använde för att undvika WebFetch-sammanfattningsrisk):
#     (a) `agent_id` i PreToolUse-indata i subagent-kontext — BEKRÄFTAT,
#         hooks.md rad ~264 + fälttabellen rad ~714.
#     (b) `Monitor` fortsatt listat/anropbart för subagenter (andra filtret,
#         bakgrunds-subagentens verktygslista) — BEKRÄFTAT, sub-agents.md
#         rad ~341, ordagrant identisk lista mot research-passets citat.
#     (c) `permissionDecision: "deny"` fortsatt formen för PreToolUse-block
#         — BEKRÄFTAT, hooks.md rad ~980–981, ~1663–1664.
#   INGEN DIVERGENS mot uppdragets premisser. Versionsglidningen (2.1.222 →
#   2.1.224) ändrade inget av de tre citerade beteendena.
#
# ═══ FAIL-CLOSED, MEN SCOPAT TILL SUBAGENT-KONTEXT ═══
#
#   Claude Codes PreToolUse-hookar är fail-OPEN by design om hooken kraschar
#   (annan exitkod än 2 låter anropet fortsätta, dokumenterat i hooks.md §
#   exit-koder). `exit 2` är den enda väg som GARANTERAT blockerar oavsett
#   stdout — samma kontrakt scripts/deny-resend-send.sh redan bygger på och
#   som denna hook återanvänder rakt av.
#
#   VAD SOM SKILJER DENNA HOOK FRÅN deny-resend-send.sh: den senare nekar
#   (exit 2) på VARJE internt fel, oavsett om anropet ens är i Resend-
#   relaterad kontext — motiverat av att skadan (skickat mail) är
#   irreversibel. Skadan HÄR (en subagent parkerar strukturellt) är allvarlig
#   och mätt dyr (~700k tokens en session) men uppstår ENDAST i subagent-
#   kontext. Att fail-closed-blockera VARJE Bash-anrop i HELA repot
#   (huvudsession inräknad) om t.ex. policyfilen råkar bli trasig vore
#   oproportionerligt — det skulle stoppa allt arbete för ett fel som bara
#   är relevant i en delmängd av fallen. Därför:
#     - jq saknas, tom stdin, eller `tool_name` går inte att tolka ur
#       indatan → NEKAS (exit 2), oavsett kontext. Detta är den enda vägen
#       som är omöjlig att scopa: utan `tool_name` går det inte ens att
#       avgöra OM anropet är Bash/Monitor, och utan att kunna tolka NÅGOT av
#       indatan går det inte att avgöra om `agent_id` är satt. "Kan inte
#       avgöra" väger här mot att TYSTA ÅTERÖPPNA precis det hål detta
#       skript finns för att stänga — samma logik AC #4 (fail-closed-fall,
#       oparsbar indata) kräver.
#     - `agent_id` SAKNAS (huvudsession) → SLÄPPS igenom omedelbart (exit 0),
#       INNAN policyn ens läses. Detta är inte en felväg — det är den
#       normala, förväntade majoriteten av alla anrop, och den ska vara
#       friktionsfri.
#     - Policyfilen saknas, går inte att läsa, eller definierar en tom
#       lista → NEKAS (exit 2) — men BARA för anrop som redan är i
#       subagent-kontext (agent_id satt). Ett trasigt regelverk ska aldrig
#       tolkas som "inget att neka" (samma princip deny-resend-send.sh
#       redan använder), men blast-radien hålls till den delmängd av anrop
#       hooken faktiskt existerar för att skydda.
#
# ═══ VAD DEN INTE TÄCKER (ADR-096 § Konsekvenser, öppet buret) ═══
#
#   Auto-bakgrunds-fällan: ett SYNKRONT Bash-anrop som passerar sin timeout
#   konverteras av harnessen SJÄLV till bakgrundsläge, utan att subagenten
#   bad om `run_in_background: true` — och ingen PreToolUse-hook kan ångra
#   en konvertering som sker EFTER att anropet redan godkänts. Det täcks av
#   instruktionskompletteringen (TASK-148.3: explicit timeout på långa
#   kommandon), inte av denna mekanism.
#
# SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md § "En ny hook kan ALDRIG
#   skarpbevisas i sessionen som byggde den"): denna hook registreras i
#   .claude/settings.json i SAMMA session som bygger den, och tas därför
#   INTE i bruk förrän nästa session (filbevakaren kan ha missat ändringen;
#   ingen reload-väg finns). Logiken är bevisad tvåsidigt i byggsessionen
#   (scripts/test-deny-subagent-vantan.sh + manuell körning mot verkligt
#   tillstånd). Den faktiska fyrningen mot en LADDAD hook betalas som en av
#   nästa sessions första handlingar, med samma differentialmätning
#   ADR-087/L370 använde: provocera en REDAN laddad hook (t.ex.
#   deny-grind-genom-pipe.sh) parallellt för att skilja "fel logik" i denna
#   hook från "ej laddad än".
#
# INPUT: PreToolUse hook-JSON på stdin. Fälten `tool_name` (snake_case),
#   `tool_input.run_in_background` (bool) och `agent_id` (common input
#   field, satt endast i subagent-kontext) — samtliga verifierade ordagrant
#   mot code.claude.com/docs/en/hooks.md i premiss-passet ovan.
#
# Testsvit: scripts/test-deny-subagent-vantan.sh (tvåsidigt bevis: Monitor +
#   run_in_background NEKAS i subagent-kontext, samma anrop UTAN agent_id
#   SLÄPPS, fail-closed-fallen NEKAR).
#
# Källa: docs/decisions/ADR-096-subagentens-vantekontrakt.md § Beslut del 2 ·
#        docs/research/subagent-parkering-handoff-kontrakt-2026-08-05.md § 5 ·
#        tasks/lessons.md L340, L370 ·
#        scripts/deny-resend-send.sh (fail-closed-kontraktets förebild) ·
#        code.claude.com/docs/en/hooks.md · code.claude.com/docs/en/sub-agents.md
# Etablerad: TASK-148.2, 2026-08-07

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUBAGENT_VANTAN_POLICY="${SUBAGENT_VANTAN_POLICY:-${SCRIPT_DIR}/../.subagent-vantan-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# deny <skäl> — skriver deny-meddelandet till stderr (det agenten ser) och
# avslutar med exit 2, den enda väg som garanterat blockerar verktygsanropet
# oavsett vad stdout innehåller (se § FAIL-CLOSED ovan).
deny() {
    printf 'SUBAGENTENS VÄNTEKONTRAKT (ADR-096, TASK-148.2): %s\n' "$1" >&2
    exit 2
}

# jq krävs för att tolka hook-input. Denna gren träffar ALLA kontexter
# (huvudsession inräknad) eftersom vi inte ens kan avgöra vilken kontext det
# är utan jq — se § FAIL-CLOSED, MEN SCOPAT ovan.
jq_version_ok || deny "jq saknas eller är för gammal i PATH — hooken kan inte avgöra om anropet sker i subagent-kontext (TASK-312, .jq-version-policy.conf). Detta är hookens eget fel, inte ditt."

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || deny "tom eller oläsbar hook-input på stdin. Detta är hookens eget fel, inte ditt."

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2> /dev/null)"
[[ -n "${TOOL_NAME}" ]] || deny "hook-indatan gick inte att tolka som JSON, eller saknar tool_name — kan inte avgöra om detta är ett Monitor/Bash-anrop i subagent-kontext (fail-closed, AC 4). Detta är hookens eget fel, inte ditt."

# agent_id SAKNAS ⇒ huvudsession. Släpp omedelbart, INNAN policyn ens läses
# — detta är den normala, förväntade majoriteten av alla anrop och ska vara
# helt friktionsfri. Huvudsessionens egna bakgrundsmönster (Monitor,
# run_in_background) är exakt den väg harnessen FAKTISKT byggt en fungerande
# väckningsmekanism för (ADR-096 § Kontext) — den ska aldrig träffas här.
AGENT_ID="$(printf '%s' "${INPUT}" | jq -r '.agent_id // empty' 2> /dev/null)"
[[ -n "${AGENT_ID}" ]] || exit 0

# Från denna punkt: subagent-kontext bekräftad. Policyns fail-closed-krav
# gäller BARA härifrån och nedåt — se § FAIL-CLOSED, MEN SCOPAT ovan för
# varför blast-radien medvetet inte sträcker sig till huvudsessionen.
[[ -f "${SUBAGENT_VANTAN_POLICY}" ]] || deny "policyfilen ${SUBAGENT_VANTAN_POLICY} saknas — kan inte avgöra vilka verktyg som ska nekas i subagent-kontext (fail-closed). Detta är hookens eget fel, inte ditt."
# shellcheck source=/dev/null
source "${SUBAGENT_VANTAN_POLICY}" || deny "policyfilen ${SUBAGENT_VANTAN_POLICY} gick inte att läsa (syntaxfel?). Detta är hookens eget fel, inte ditt."

[[ "${#SUBAGENT_VANTAN_ALLTID[@]:-0}" -gt 0 || "${#SUBAGENT_VANTAN_BAKGRUND[@]:-0}" -gt 0 ]] || deny "policyn definierar noll verktyg i båda listorna — ett tomt regelverk är inte 'inget att neka', det är ett trasigt lås. Detta är hookens eget fel, inte ditt."

for verktyg in "${SUBAGENT_VANTAN_ALLTID[@]:-}"; do
    [[ -n "${verktyg}" ]] || continue
    if [[ "${TOOL_NAME}" == "${verktyg}" ]]; then
        deny "${TOOL_NAME}-anropets väckning levereras aldrig till en subagent (L340, mätt) — du har ingen framtida tur att vakna i. GÖR I STÄLLET: läs resultatet direkt med ett synkront/blockerande anrop, eller (för en bakgrundstask orkestreraren startat) Read på taskens output-fil. Har du redan färdigt arbete: committa + pusha det INNAN nästa anrop (persistens före väntan, ADR-096 § Beslut del 3) — så det överlever om din tur avslutas oväntat."
    fi
done

for verktyg in "${SUBAGENT_VANTAN_BAKGRUND[@]:-}"; do
    [[ -n "${verktyg}" ]] || continue
    if [[ "${TOOL_NAME}" == "${verktyg}" ]]; then
        RUN_IN_BACKGROUND="$(printf '%s' "${INPUT}" | jq -r '(.tool_input.run_in_background // false) | tostring' 2> /dev/null)"
        if [[ "${RUN_IN_BACKGROUND}" == "true" ]]; then
            deny "${TOOL_NAME} med run_in_background:true skickar kommandot in i samma väckningslösa hål som Monitor — ingen notifikation når dig, bara orkestreraren (L340, mätt). GÖR I STÄLLET: kör kommandot SYNKRONT i förgrunden. Riskerar det bli långt: sätt ett explicit timeout du accepterar (harnessens 2-minuters default konverterar annars automatiskt till bakgrund utan att du bad om det, ADR-096 § Beslut del 3), eller dela upp arbetet i en snävare delmängd. Har du redan färdigt arbete på disk: committa + pusha det INNAN du kör kommandot."
        fi
        break
    fi
done

exit 0
