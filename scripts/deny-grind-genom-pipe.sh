#!/usr/bin/env bash
# scripts/deny-grind-genom-pipe.sh — L440 som mekanism, inte som prosa.
#
# VAD DEN PRÖVAR: att en grinds exitkod inte tyst går förlorad i en pipe.
#   `grind | tail` returnerar TAIL:s exitkod, inte grindens. En röd grind blir
#   grön för skalet, och nästa steg (commit, push, armering) kör som om allt
#   var bra.
#
# VARFÖR EN HOOK OCH INTE EN REGEL — L441 svarar:
#   "En regel mekaniserad för en roll-yta lämnar de andra ytorna oskyddade."
#   L440 stod ORDAGRANT i bygg-agent-kontraktet och bröts ändå av
#   ORKESTRERAREN dagen efter att den mintades. Kunskapen fanns; bäraren
#   fanns inte på den ytan. En PreToolUse-hook binder alla ytor samtidigt —
#   agenter, orkestrerare, framtida kontexter — utan att någon behöver minnas.
#
# INSTANSFREKVENSEN ÄR DEN HÖGSTA I HELA T119-INVENTERINGEN: minst sju
#   dokumenterade fall över fyra sessioner (S91 ×2, S93, S94, S96, S97 ×2),
#   och klassen slog till under själva utredningsdagen. Full lista med
#   källhänvisning i .grind-exitkod-policy.conf.
#
# ═══ VAD SOM MEDVETET INTE FÄLLS ═══
#
#   - OMDIRIGERING (`grind > fil`). Exitkoden överlever en omdirigering.
#     Detta är den korrekta formen och ska vara helt friktionsfri — den
#     användes genomgående i S97 utan problem.
#   - `if grind; then ... fi`. Exitkoden ÄR villkoret.
#   - Kommandon som nämner PIPESTATUS eller fångar $? explicit. Skribenten är
#     bevisligen medveten om problemet.
#   - Allt som inte matchar den smala grind-listan i policyfilen. En bred
#     lista hade gjort hooken till en falsklarmsmaskin, och husregeln —
#     skriven i nightly-watchdog.yml:s eget huvud — är att ett falsklarm är
#     värre än ingen vakt.
#
# ═══ ASK, INTE DENY ═══
#
#   Utfallet är `permissionDecision: "ask"`, inte exit 2. Det finns ett
#   legitimt fall: när utdatan är det enda intressanta och exitkoden genuint
#   saknar betydelse. Skillnaden mot ett fel är att valet blir MEDVETET —
#   och i alla sju bokförda instanser var det just medvetenheten som saknades,
#   aldrig kunskapen. En hård blockering hade dessutom brutit legitima
#   felsöknings-kommandon mitt i en incident.
#
# ═══ FAIL-OPEN, MEDVETET ═══
#
#   Varje internt fel (jq saknas, ingen policyfil, tom stdin) ger exit 0.
#   Skadan hooken skyddar mot är en missad röd grind — allvarlig men
#   ÅTERSTÄLLBAR, och CI fångar den i nästa led (det gjorde den i S91:s fall,
#   via #584-kedjan). En trasig hook som nekar allt vore värre. Detta AVVIKER
#   medvetet från deny-resend-send.sh, vars skada (skickat mail) är
#   irreversibel och som därför failar slutet.
#
# INPUT: PreToolUse hook-JSON på stdin (`tool_name`, `tool_input.command`).
#
# Testsvit: scripts/test-deny-grind-genom-pipe.sh (tvåsidigt bevis).
#
# Källa: L440 + L441 · T119 arbetslista (d) item 5 ·
#        .grind-exitkod-policy.conf · code.claude.com/docs/en/hooks.md
# Etablerad: S97, 2026-08-04

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND_POLICY="${GRIND_POLICY:-${SCRIPT_DIR}/../.grind-exitkod-policy.conf}"

fraga() {
    jq -nc --arg skal "$1" '{
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "ask",
            permissionDecisionReason: $skal
        }
    }' 2>/dev/null || exit 0
    exit 0
}

command -v jq >/dev/null 2>&1 || exit 0
[[ -f "${GRIND_POLICY}" ]] || exit 0

GRIND_MONSTER=()
GRIND_UNDANTAG=()
# shellcheck source=/dev/null
source "${GRIND_POLICY}" 2>/dev/null || exit 0
[[ "${#GRIND_MONSTER[@]}" -gt 0 ]] || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ "${TOOL_NAME}" = "Bash" ]] || exit 0

COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[[ -n "${COMMAND}" ]] || exit 0

# Undantagen först — billigast, och de gör resten av prövningen onödig.
for undantag in "${GRIND_UNDANTAG[@]:-}"; do
    [[ -n "${undantag}" ]] || continue
    [[ "${COMMAND}" =~ ${undantag} ]] && exit 0
done

# Leta rad för rad. En pipe binder inom EN rad; att leta i hela strängen
# hade gett falska träffar när en grind står på en rad och en orelaterad
# pipe på nästa.
TRAFF_GRIND=""
TRAFF_RAD=""
while IFS= read -r rad; do
    [[ -n "${rad//[[:space:]]/}" ]] || continue

    # `if grind; then` — exitkoden ÄR villkoret, aldrig ett problem.
    [[ "${rad}" =~ ^[[:space:]]*(if|while|until)[[:space:]] ]] && continue

    # Ingen pipe på raden ⇒ ingenting kan svälja exitkoden.
    # `|| ` och `|&` är inte pipes i den mening som gäller här; `||` bevarar
    # exitkoden och är dessutom den rekommenderade formen (`grind || KOD=$?`).
    RAD_UTAN_OR="${rad//||/}"
    [[ "${RAD_UTAN_OR}" == *"|"* ]] || continue

    for monster in "${GRIND_MONSTER[@]}"; do
        [[ -n "${monster}" ]] || continue
        if [[ "${rad}" =~ ${monster} ]]; then
            # Grinden måste stå FÖRE piperör-tecknet för att dess exitkod ska
            # gå förlorad. Står den efter är den pipens sista led och äger
            # exitkoden själv.
            FORE_PIPE="${RAD_UTAN_OR%%|*}"
            if [[ "${FORE_PIPE}" =~ ${monster} ]]; then
                TRAFF_GRIND="${BASH_REMATCH[0]}"
                TRAFF_RAD="${rad}"
                break 2
            fi
        fi
    done
done <<< "${COMMAND}"

[[ -n "${TRAFF_GRIND}" ]] || exit 0

fraga "L440 — GRINDENS EXITKOD GÅR FÖRLORAD I PIPEN. Kommandot kör '${TRAFF_GRIND}' och pipar vidare: \"${TRAFF_RAD}\". En pipe returnerar SISTA ledets exitkod, så en röd grind blir grön för skalet — och nästa steg (commit, push, armering) kör som om allt vore bra. Detta är den mest frekventa felklassen i repot: minst sju dokumenterade instanser över fyra sessioner, varav två ledde till armerade PR:er på röda grindar. Rätt former: kör grinden naket och läs exitkoden direkt · 'grind > fil; KOD=\$?' · 'if grind; then ...; else stanna; fi' · eller läs PIPESTATUS explicit. Är utdatan det enda du bryr dig om och exitkoden genuint ointressant — godkänn, men gör det medvetet."
