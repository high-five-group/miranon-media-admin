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
# ═══ DENY, INTE ASK — RIVET 2026-08-04 (S97), MARCUS-GO ═══
#
#   Hooken returnerade tidigare `ask`, motiverat med att det finns ett legitimt
#   fall (utdatan är allt som betyder något) och att valet därför skulle bli
#   MEDVETET. Motiveringen föll på mätning samma dag den skrevs.
#
#   FELET VAR MOTTAGAREN, INTE BESLUTET. `ask` skickar frågan till Marcus, men
#   frågan är "spelar exitkoden roll i just detta kommando?" — och det kan bara
#   den veta som skrev kommandot. Marcus 2026-08-04, verbatim: "Dels är jobbigt
#   att få de där frågorna och dels så förstår jag ju knappt det som står där."
#   Han fick fyra prompts på en timme, varav en på ett rent `grep`-kommando.
#
#   DRIFTBILDEN GÖR DET STRUKTURELLT, INTE BARA JOBBIGT: mekanismen finns för
#   att parallella sessioner med subagenter ska fungera. I den driften blir
#   `ask` N sessioner × M agenter som alla köar på en människa — en flaskhals
#   som växer med precis det den skulle möjliggöra.
#
#   REGELN SOM FALLER UT, generell för hela hook-ytan: `ask` endast när Marcus
#   är RÄTT BESLUTSFATTARE — irreversibelt, utanför repot, kräver hans mandat
#   (så `deny-resend-send.sh`, som skickar mail, förblir `ask`). Kan maskinen
#   avgöra saken: `deny`, med ett skäl skrivet till AGENTEN som kan åtgärda det.
#   Branschformen är densamma — pre-commit `exit 1`, admission controllers
#   avslår med `message`; ingen av dem frågar en människa.
#
#   PRISET FÖR `deny` ÄR ATT FALSKA POSITIVA BLIR HÅRDA STOPP. Därför landade
#   kommando-positions-kravet nedan i SAMMA ändring — utan det hade den mätta
#   falska positiven (`grep … scripts/check-x.sh | head`) blivit en vägg i
#   stället för en fråga. Deny och smalare mönster är en enhet, inte två steg.
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
# Fällnings-logg (T120): varje nekande appenderar en rad till
#   .claude/hook-fallningar.jsonl — delad med deny-frammande-huvudkatalog.sh,
#   skild på fältet `hook`. Se § FÄLLNINGS-LOGG nedan.
#
# Testsvit: scripts/test-deny-grind-genom-pipe.sh (tvåsidigt bevis).
#
# Källa: L440 + L441 · T119 arbetslista (d) item 5 · T120 (fällnings-logg) ·
#        .grind-exitkod-policy.conf · code.claude.com/docs/en/hooks.md
# Etablerad: S97, 2026-08-04. Fällnings-logg: S97 (T120).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND_POLICY="${GRIND_POLICY:-${SCRIPT_DIR}/../.grind-exitkod-policy.conf}"
HOOK_LOGG="${HOOK_LOGG:-${SCRIPT_DIR}/../.claude/hook-fallningar.jsonl}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

neka() {
    jq -nc --arg skal "$1" '{
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: $skal
        }
    }' 2>/dev/null || exit 0
    exit 0
}

# ═══ FÄLLNINGS-LOGG (T120, observerbarhet) ═══
#
# En rad JSONL per NEKANDE till en delad, .gitignore:ad logg — samma fil som
# deny-frammande-huvudkatalog.sh skriver till, åtskild på fältet `hook`.
# Skälet: vi vet i dag inte hur ofta spärrarna fyrar, och det talet avgör om
# de sinkar arbetet mer än de skyddar mot fel. Kontraktet lånas av
# scripts/agent-spawn-log.sh: får ALDRIG påverka hookens exit eller stdout.
logga_fallning() {
    local skalnyckel="$1" kommando_kort
    # Bar presence-check, MEDVETET INTE jq_version_ok (TASK-312): denna
    # helper anropas alltid EFTER huvudgrinden nedan redan passerat
    # jq_version_ok — en version-koll här vore en redundant andra
    # jq --version-process i en logg-väg som redan ska vara best-effort-
    # billig (§ FÄLLNINGS-LOGG ovan: "får ALDRIG påverka hookens exit
    # eller stdout").
    command -v jq >/dev/null 2>&1 || return 0
    mkdir -p "$(dirname "${HOOK_LOGG}")" 2>/dev/null || return 0
    kommando_kort="${COMMAND:0:120}"
    jq -nc \
        --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" \
        --arg hook "deny-grind-genom-pipe" \
        --arg kmd "${kommando_kort}" \
        --arg skal "${skalnyckel}" \
        '{ts: $ts, hook: $hook, kommando: $kmd, skal_nyckel: $skal}' \
        >> "${HOOK_LOGG}" 2>/dev/null || true
    return 0
}

jq_version_ok > /dev/null 2>&1 || exit 0
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

    # Grinden måste stå FÖRE piperör-tecknet för att dess exitkod ska gå
    # förlorad. Står den efter är den pipens sista led och äger exitkoden
    # själv. Och bara det SISTA kommandot före pipen kan drabbas — står en
    # grind tidigare i en `&&`-kedja är dess exitkod redan konsumerad där.
    FORE_PIPE="${RAD_UTAN_OR%%|*}"
    SEGMENT="${FORE_PIPE##*&&}"
    SEGMENT="${SEGMENT##*;}"

    # Skala av ledande blanksteg, `./` och interpreter-ord tills det som står
    # kvar är ordet som FAKTISKT EXEKVERAS.
    while :; do
        FORE_SKAL="${SEGMENT}"
        SEGMENT="${SEGMENT#"${SEGMENT%%[![:space:]]*}"}"
        SEGMENT="${SEGMENT#./}"
        for interpreter in "bash " "sh " "npx " "node " "time " "env "; do
            SEGMENT="${SEGMENT#"${interpreter}"}"
        done
        [[ "${SEGMENT}" = "${FORE_SKAL}" ]] && break
    done

    for monster in "${GRIND_MONSTER[@]}"; do
        [[ -n "${monster}" ]] || continue
        [[ "${SEGMENT}" =~ ${monster} ]] || continue

        # KOMMANDO-POSITION, inte argument-position. Matchningen måste INLEDA
        # segmentet. `grep -n "x" scripts/check-y.sh | head` nämner en grind
        # men kör den aldrig — den läser dess källkod. Utan detta krav fälldes
        # den formen (mätt falskt positivt 2026-08-04, orkestreraren), och som
        # `deny` hade den blivit ett hårt stopp på en ofarlig läsning.
        # Jämförelsen görs på matchad text i stället för med en ^-förankrad
        # regex, eftersom flera mönster i policyfilen bär ett eget ledande
        # `(^|[[:space:]/])`-alternativ som inte komponerar med ett yttre `^`.
        TRAFFEN="${BASH_REMATCH[0]}"
        TRIMMAD="${TRAFFEN#"${TRAFFEN%%[![:space:]]*}"}"
        if [[ "${SEGMENT}" = "${TRIMMAD}"* ]]; then
            TRAFF_GRIND="${TRIMMAD}"
            TRAFF_RAD="${rad}"
            break 2
        fi
    done
done <<< "${COMMAND}"

[[ -n "${TRAFF_GRIND}" ]] || exit 0

logga_fallning "PIPE_SVALJER_EXITKOD"
neka "L440 — GRINDENS EXITKOD GÅR FÖRLORAD I PIPEN. Kommandot kör '${TRAFF_GRIND}' och pipar vidare: \"${TRAFF_RAD}\". En pipe returnerar SISTA ledets exitkod, så en röd grind blir grön för skalet — och nästa steg (commit, push, armering) kör som om allt vore bra. Detta är den mest frekventa felklassen i repot: minst sju dokumenterade instanser över fyra sessioner, varav två ledde till armerade PR:er på röda grindar. SKRIV OM KOMMANDOT — någon av dessa former fungerar och släpps igenom: (1) kör grinden naket och läs exitkoden direkt · (2) 'grind > fil; KOD=\$?' och läs sedan filen · (3) 'if grind; then ...; else stanna; fi' · (4) inled med 'set -o pipefail' — då returnerar pipen första icke-nollan och exitkoden överlever · (5) läs PIPESTATUS explicit. Behöver du GENUINT bara utdatan och exitkoden saknar all betydelse: använd form (2) och ignorera KOD. Detta är ett maskinellt beslut riktat till dig som skrev kommandot — eskalera det inte till Marcus, du har all information som krävs för att välja rätt form."
