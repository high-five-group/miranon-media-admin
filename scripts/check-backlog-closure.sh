#!/usr/bin/env bash
# check-backlog-closure.sh — fångar kort vars ARBETE är klart men vars STATUS inte är det.
#
# ═══ VARFÖR GRINDEN FINNS ═══
#
# 2026-07-29 (S91, femtonde resumen) landade TASK-77, TASK-78 och TASK-82 med
# gröna grindar och noll öppna PR:er — och alla tre stod kvar som `To Do` tills
# Marcus frågade varför ingenting hände. Orkestreraren hade sagt sig ta svansen
# "när PR:erna landat", och gjorde det inte.
#
# Samma dag skrevs lärdomen `registret-mot-disk-ar-den-obevakade-axeln`
# [UNIVERSAL] efter att TASK-72 hittats färdigbyggt men obockat. Den lärdomen
# namngav till och med signalen som skulle ha fångat detta:
#
#     "alla AC bockade + DoD obockad + status To Do är ett internt
#      inkonsistent kort"
#
# Lärdomen skrevs, landade — och fyra timmar senare gick samma aktör i samma
# fälla tre gånger. Det är beviset för att en nedskriven regel utan mekanism
# inte efterlevs (jfr L328, samma slutsats för landnings-ordningen).
#
# ═══ VAD GRINDEN FAKTISKT PRÖVAR ═══
#
# Invariant: ett kort där SAMTLIGA acceptanskriterier är avbockade men vars
# status inte är Done är internt inkonsistent. Någon har gjort arbetet och
# bevisat det — men aldrig stängt kortet.
#
# Den omvända riktningen prövas också: status Done med obockat AC eller DoD.
#
# ═══ VARFÖR NATTEN OCH INTE PR-GRINDEN ═══
#
# Repots stängning är TVÅSTEGS (ADR-073 beslut 5): leverans-commiten bär kod +
# AC-bockar, stängnings-commiten bär final-summary + Done och kommer EFTER
# CI-verifiering. Ett kort som är obockat direkt efter landning är alltså
# NORMALT, inte ett fel. Felet är när det FÖRBLIR obockat.
#
# Detta är därför en inaktuellt-tillstånd-kontroll, inte en "denna ändring är
# fel"-kontroll. Den hör i natten, där larmkedjan redan öppnar ett tilldelat
# ärende — inte i PR-grinden, där den hade fällt varje korrekt leverans-commit.
#
# ═══ L226 OCH VERKTYGSÄGD YTA ═══
#
# `backlog/` är medvetet undantagen från PROSA-lintning (markdownlint/Vale) —
# att grinda ett annat verktygs output-format. L226 räknar samtidigt upp
# klassens RIKTIGA grindar, och en av dem är ordagrant "mall-/DoD-nivåns
# semantiska grind". Det är exakt vad detta är. Ingen konflikt.
#
# Kortens innehåll läses via backlog-CLI:t, aldrig genom att parsa task-filer.
#
# Exit 0 = inga inkonsistenta kort. Exit 1 = drift funnen. Exit 2 = anropsfel.
#
# Config: .backlog-closure-policy.conf (per-projekt; skriptets logik är universell)

set -uo pipefail

POLICY_FIL="${BACKLOG_CLOSURE_POLICY:-.backlog-closure-policy.conf}"
BACKLOG_CMD="${BACKLOG_CMD:-npx backlog}"

if [[ ! -f "${POLICY_FIL}" ]]; then
    echo "❌ policy-fil saknas: ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilka statusar som räknas som öppna." >&2
    exit 2
fi
# shellcheck source=/dev/null
. "${POLICY_FIL}"

: "${BACKLOG_KLAR_STATUS:?BACKLOG_KLAR_STATUS saknas i ${POLICY_FIL}}"
BACKLOG_UNDANTAGNA_STATUSAR="${BACKLOG_UNDANTAGNA_STATUSAR-}"

EXIT_CODE=0
antal_kort=0
antal_fel=0

# Kort-ID:n ur EN listning — aldrig ett CLI-anrop per kort för att hitta dem.
#
# PORTABILITET: `mapfile`/`readarray` finns först i bash 4. macOS levererar
# bash 3.2, så en mapfile-form hade fungerat i CI och aldrig lokalt — alltså en
# grind ingen kan pröva på sin egen maskin före push. Den `while read`-form som
# används här kör i båda.
KORT=()
lista_ut=""
lista_ut="$(${BACKLOG_CMD} task list --plain 2>/dev/null)" || true
rader=""
rader="$(printf '%s\n' "${lista_ut}" | grep -oE 'TASK-[0-9]+(\.[0-9]+)?' | sort -u -V)" || true
while IFS= read -r rad; do
    [[ -z "${rad}" ]] && continue
    KORT+=("${rad#TASK-}")   # parameterexpansion, inte sed (SC2001)
done <<< "${rader}"

if [[ "${#KORT[@]}" -eq 0 ]]; then
    echo "❌ noll kort hittades — CLI:t svarade inte som väntat" >&2
    echo "   Fail-closed: en tom lista är ett anropsfel, aldrig 'allt är bra'." >&2
    exit 2
fi

for id in "${KORT[@]}"; do
    utdata="$(${BACKLOG_CMD} task "${id}" --plain 2>/dev/null)" || continue
    [[ -z "${utdata}" ]] && continue
    antal_kort=$((antal_kort + 1))

    status_rad=""
    status_rad="$(grep -m1 '^Status:' <<< "${utdata}")" || true
    status="${status_rad#Status:}"
    status="${status#"${status%%[![:space:]]*}"}"   # trimma inledande blanksteg
    [[ -z "${status}" ]] && continue

    # AC-blocket är raderna mellan "Acceptance Criteria:" och "Definition of Done:".
    # DoD-blocket är raderna efter "Definition of Done:". Båda använder samma
    # kryssruteform, så de MÅSTE avgränsas — annars räknas de ihop och grinden
    # blir osann i båda riktningar.
    ac_block=""
    ac_block="$(awk '/^Acceptance Criteria:/{f=1;next} /^Definition of Done:/{f=0} f' <<< "${utdata}")" || true
    dod_block=""
    dod_block="$(awk '/^Definition of Done:/{f=1;next} f' <<< "${utdata}")" || true

    ac_totalt=0;   ac_totalt="$(grep -cE '^- \[[ x]\] ' <<< "${ac_block}")"   || ac_totalt=0
    ac_obockat=0;  ac_obockat="$(grep -cE '^- \[ \] '   <<< "${ac_block}")"   || ac_obockat=0
    dod_obockat=0; dod_obockat="$(grep -cE '^- \[ \] '  <<< "${dod_block}")"  || dod_obockat=0

    ar_klar=0
    case "${status}" in *"${BACKLOG_KLAR_STATUS}"*) ar_klar=1 ;; *) ;; esac

    # Allt som inte är KLAR räknas som öppet — ingen andra lista att drifta.
    ar_oppet=$(( ar_klar == 1 ? 0 : 1 ))
    for s in ${BACKLOG_UNDANTAGNA_STATUSAR}; do
        case "${status}" in *"${s}"*) ar_oppet=0 ;; *) ;; esac
    done

    # Invariant 1 — arbetet bevisat klart, kortet inte stängt.
    if [[ "${ar_oppet}" -eq 1 && "${ac_totalt}" -gt 0 && "${ac_obockat}" -eq 0 ]]; then
        echo "❌ TASK-${id} — samtliga ${ac_totalt} AC avbockade men status är '${status}'"
        echo "   Arbetet är gjort och bevisat; kortet är aldrig stängt."
        echo "   Fix: npx backlog task edit ${id} --check-dod … -s Done --final-summary '…'"
        antal_fel=$((antal_fel + 1))
        EXIT_CODE=1
    fi

    # Invariant 2 — kortet stängt utan att arbetet är bevisat.
    if [[ "${ar_klar}" -eq 1 && ( "${ac_obockat}" -gt 0 || "${dod_obockat}" -gt 0 ) ]]; then
        echo "❌ TASK-${id} — status '${status}' men ${ac_obockat} AC och ${dod_obockat} DoD står obockade"
        echo "   Kortet är stängt utan att kraven är kvitterade."
        antal_fel=$((antal_fel + 1))
        EXIT_CODE=1
    fi
done

if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ backlog-stängning konsekvent: ${antal_kort} kort prövade, 0 inkonsistenta."
else
    echo ""
    echo "${antal_fel} inkonsistenta kort av ${antal_kort} prövade."
    echo "Grinden finns för att en nedskriven regel utan mekanism inte efterlevs —"
    echo "se skriptets huvud för incidenten som gav den dess form."
fi

exit "${EXIT_CODE}"
