#!/usr/bin/env bash
# scripts/deny-hemlighet-utskrift.sh — mekaniskt lås mot kommandon som
# skriver ut hemligheters VÄRDE (TASK-203).
#
# VARFÖR SKRIPTET FINNS: Marcus-order 2026-08-12, verbatim: "Fixa skiten
#   för gott, så det aldrig händer varken staging eller prod. Gör det
#   PROFFSIGT!" — efter att `npx supabase projects api-keys --project-ref
#   pqtshyierkdgwdnxuirz -o json` skrev ut en fullständig legacy
#   service_role-JWT i klartext, UTAN --reveal, i ett agent-transkript.
#   Nyckeln fanns varken i `~/.zshrc` eller i någon `.env`-fil — CLI:t
#   hämtade den LIVE och skrev ut den. Det som saknades var en spärr i
#   första ledet.
#
# NÄRMASTE SLÄKTING: scripts/deny-resend-send.sh (TASK-137, MAIL-LÅSET).
#   Samma form, samma fail-closed-motivering: skadan (ett hemligt värde i
#   ett agent-transkript) är IRREVERSIBEL — transkriptet kan inte
#   "otryckas". Det gör detta lås till samma riskklass som mail-sändning,
#   inte samma klass som t.ex. deny-grind-genom-pipe.sh (vars skada är
#   återställbar och som DÄRFÖR medvetet failar öppet).
#
# ═══ FAIL-CLOSED-KONTRAKTET — se deny-resend-send.sh för fullt resonemang ═══
#
#   Claude Codes PreToolUse-hookar är FAIL-OPEN BY DESIGN om hooken
#   kraschar (code.claude.com/docs/en/hooks.md § exit-koder): exit 2 är
#   den ENDA väg som garanterat blockerar verktygsanropet oavsett vad
#   stdout innehåller. Varje nekande väg härifrån slutar därför i exit 2 —
#   aldrig i JSON-på-stdout-med-exit-0. Varje internt fel (saknad jq, tom
#   stdin, saknad/trasig policyfil, tom regel-array) NEKAR också. Skriptet
#   kör `set -uo pipefail`, INTE `-e` (samma skäl som deny-resend-send.sh:
#   `-e` skulle avbryta med kommandots EGEN exit-kod vid internt fel,
#   vilket enligt exit-kod-tabellen är FAIL-OPEN — tvärtom mot avsikten).
#
# ═══ SCOPE-GRÄNS, öppet skriven ═══
#
#   Matchningen är FRI SUBSTRÄNG/ERE mot HELA Bash-kommandosträngen —
#   samma enkla form som deny-resend-send.sh:s endpoint-mönster, INTE
#   position-ankrad som deny-grind-genom-pipe.sh:s grind-mönster (som
#   behövde ankringen för att skilja "kör X" från "nämner X i en grep").
#   Mönstren här (t.ex. "supabase projects api-keys", "gh auth token") är
#   tillräckligt specifika flerordskombinationer att risken för att de
#   råkar förekomma som oskyldig prosa i ETT Bash-kommando är låg — men
#   INTE noll. Känt, accepterat gap (samma klass som deny-resend-send.sh:s
#   egen § SCOPE-GRÄNS): ett kommando som ENDAST citerar en av frascerna
#   (t.ex. en `git commit -m "..."` som beskriver just denna ändring)
#   skulle träffas. Byggaren av detta skript undvek det genom att aldrig
#   skriva dessa exakta fraser i ett eget Bash-kommando under bygget
#   (policy- och dokumentationstext skrevs via Write/Edit-verktyget, som
#   denna hook inte matchar — se § MATCHER nedan).
#
#   MEDVETET INTE MED: `.env*`-filläsning (cat/grep mot lokala env-filer).
#   Se .hemlighet-utskrift-policy.conf § MEDVETET INTE MED för hela
#   motiveringen — annan riskklass (statisk lokal fil, inte en live-
#   hämtning från ett valv), och att blockera den bryter etablerade,
#   legitima flöden.
#
# MATCHER: registrerad i .claude/settings.json på matcher "Bash" ENDAST.
#   Edit/Write-anrop (t.ex. att skriva denna fil, eller ett kort som
#   beskriver låset i prosa) matchar aldrig denna hook.
#
# INPUT: PreToolUse hook-JSON på stdin, `tool_name` + `tool_input.command`.
#
# Testsvit: scripts/test-deny-hemlighet-utskrift.sh (tvåsidigt bevis).
#
# Källa: TASK-203 · .hemlighet-utskrift-policy.conf ·
#        scripts/deny-resend-send.sh (formmall, TASK-137) ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: TASK-203, 2026-08-12

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEMLIGHET_POLICY="${HEMLIGHET_POLICY:-${SCRIPT_DIR}/../.hemlighet-utskrift-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# deny <skäl> — skriver deny-meddelandet till stderr (det modellen ser)
# och avslutar med exit 2, den ENDA väg som garanterat blockerar
# verktygsanropet oavsett vad stdout innehåller (se § FAIL-CLOSED ovan).
deny() {
    printf 'HEMLIGHETS-LÅS (%s): %s\n' "${HEMLIGHET_TASK_ID:-TASK-203}" "$1" >&2
    printf 'Marcus-order 2026-08-12 (verbatim): "Fixa skiten för gott, så det aldrig händer varken staging eller prod. Gör det PROFFSIGT!" Detta kommando skriver ut en hemlighets VÄRDE, inte bara dess existens. Behöver du verifiera att en hemlighet finns: använd en existens-/digest-form (t.ex. "security find-generic-password -s <tjänst>" utan -w/-g, eller "gh secret list") — de är INTE nekade. Behöver du GENUINT värdet: det är Marcus beslut, inte agentens — fråga honom.\n' >&2
    exit 2
}

# jq krävs för att tolka hook-input. FAIL-CLOSED: "vet inte" nekar.
jq_version_ok || deny "jq saknas eller är för gammal i PATH — hooken kan inte verifiera anropet (TASK-312, .jq-version-policy.conf)."

# Läs hela stdin utan extern process (samma `read -d ''`-form som
# deny-resend-send.sh — `read`s egen exit-kod vid EOF är förväntad och
# irrelevant, bara att INPUT blev ifylld spelar roll).
INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || deny "tom eller oläsbar hook-input på stdin."

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ -n "${TOOL_NAME}" ]] || deny "hook-input gick inte att tolka som JSON, eller saknar tool_name."

# Endast Bash-anrop kan över huvud taget matcha — övriga verktyg släpps
# direkt (detta är INTE ett internt fel, så det nekar inte).
[[ "${TOOL_NAME}" = "Bash" ]] || exit 0

[[ -f "${HEMLIGHET_POLICY}" ]] || deny "policyfilen ${HEMLIGHET_POLICY} saknas."
# shellcheck source=/dev/null
source "${HEMLIGHET_POLICY}" || deny "policyfilen ${HEMLIGHET_POLICY} gick inte att läsa (syntaxfel?)."

[[ -n "${HEMLIGHET_KOMMANDO_MONSTER[*]:+x}" ]] || deny "policyn definierar noll kommando-mönster — ett tomt regelverk är inte 'inget att neka', det är ett trasigt lås."

COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[[ -n "${COMMAND}" ]] || exit 0

shopt -s nocasematch
for pattern in "${HEMLIGHET_KOMMANDO_MONSTER[@]}"; do
    if [[ "${COMMAND}" =~ ${pattern} ]]; then
        shopt -u nocasematch
        deny "Bash-kommandot matchar ett hemlighets-utskrivande mönster (${pattern})."
    fi
done
shopt -u nocasematch

exit 0
