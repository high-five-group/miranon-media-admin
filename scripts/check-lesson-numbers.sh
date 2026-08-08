#!/usr/bin/env bash
#
# check-lesson-numbers.sh
#
# Hävdar att lesson-nummer tilldelas VID LANDNING, inte vid skrivning.
#
# Två invarianter:
#   (a) Ingen numrerad rubrik förekommer mer än en gång bland de
#       konsoliderade lesson-filerna — TVÄRS ÖVER filer, inte bara inom en.
#       Dubbletter är beviset på att två aktörer antagit samma
#       nästa-lediga-nummer.
#   (b) Inget fragment i fragment-katalogen bär en numrerad rubrik. Fragment
#       är per definition nummerlösa — numret sätts när orkestreraren
#       konsoliderar, vilket merge-grinden (ADR-076) redan serialiserar.
#
# Bakgrund: 2026-07-26 mintade två parallella agenter båda L354 och L355, var
# och en omedveten om den andra; kollisionen löstes för hand vid landningen
# (hover-grenens fyra numrerades om till L356–L359). Med fler parallella
# agenter är kollisionen garanterad, inte osannolik.
#
# Formen är towncrier-mönstret (Twisted, pytest, pip, BuildBot, attrs): i
# stället för att alla skriver i EN fil med antagna ID:n skapar varje bidrag
# ett eget fragment, och identiteten sätts vid konsolidering. Rust RFC 0002
# använder samma princip på numret självt — "don't assign an RFC number yet;
# this is going to be the PR number".
#
# GLOB, INTE EN FIL (TASK-161.9, 2026-08-08). Den konsoliderade lesson-ytan
# kan vara EN monolit-fil eller flera volymfiler (ADR-085-formen: tunt index
# + frysta volymer + en aktiv volym) — LESSON_FILE_GLOB expanderas till en
# lista och samtliga matchande filer skannas TILLSAMMANS för invariant (a),
# så att samma nummer i två OLIKA volymer fångas precis som samma nummer två
# gånger i en fil. En spoke utan split sätter glob till en enda literal
# filnamn ("tasks/lessons.md") — bash-glob-expansion av en befintlig literal
# path returnerar bara den, så formen är bakåtkompatibel utan ändring där.
#
# Config: .lesson-policy.conf (projekt-specifika värden; denna logik är
# universell och kan dupliceras till andra spokes utan refactor).
#
# Exit: 0 = grönt, 1 = invariant bruten, 3 = felkonfigurerad/körd från fel plats.

set -euo pipefail

CONFIG=".lesson-policy.conf"

die() { printf 'check-lesson-numbers: %s\n' "$1" >&2; exit "${2:-3}"; }

[[ -f "${CONFIG}" ]] || die "${CONFIG} saknas — körs grinden från repo-roten?"
# shellcheck source=/dev/null
source "${CONFIG}"

: "${LESSON_FILE_GLOB:?LESSON_FILE_GLOB är osatt i ${CONFIG}}"
: "${LESSON_HEADING_PREFIX:?LESSON_HEADING_PREFIX är osatt i ${CONFIG}}"
: "${LESSON_FRAGMENT_DIR:?LESSON_FRAGMENT_DIR är osatt i ${CONFIG}}"

HEADING_RE="^### ${LESSON_HEADING_PREFIX}[0-9]+"
FAILED=0
FRAG_COUNT=0

# --- (a) Dubbletter tvärs över de konsoliderade lesson-filerna ------------
# shellcheck disable=SC2206  # avsiktlig ordsplittring: LESSON_FILE_GLOB är
# ett glob-uttryck, inte en enskild sträng att citera.
LESSON_FILES=(${LESSON_FILE_GLOB})

if [[ "${#LESSON_FILES[@]}" -eq 0 ]]; then
    die "Ingen fil matchar LESSON_FILE_GLOB (${LESSON_FILE_GLOB}) — kontrollera ${CONFIG}"
fi
for f in "${LESSON_FILES[@]}"; do
    [[ -f "${f}" ]] || die "${f} (matchad av LESSON_FILE_GLOB men saknas) — kontrollera ${CONFIG}"
done

# -h/-o: en rubrik per rad, utan filnamn-prefix — dubblett-mängden är
# filoberoende per invariant (a):s definition.
DUPES=$(grep -hoE "${HEADING_RE}" "${LESSON_FILES[@]}" | sort | uniq -d || true)

if [[ -n "${DUPES}" ]]; then
    echo "❌ Duplicerade lesson-nummer i ${LESSON_FILE_GLOB}:"
    while IFS= read -r dupe; do
        [[ -z "${dupe}" ]] && continue
        num="${dupe##*"${LESSON_HEADING_PREFIX}"}"
        # Pipe-kedjan bryts ut per husets idiom (check-adr-count.sh rad 44):
        # command substitution med pipe maskerar returvärdet (SC2312).
        # -H tvingar filnamn-prefix även när bara en fil träffar, så
        # träff-listan alltid pekar ut VILKEN volym dubbletten bor i.
        hits=$(grep -nHE "^### ${LESSON_HEADING_PREFIX}${num}\$" "${LESSON_FILES[@]}" || true)
        lines=$(echo "${hits}" | paste -sd, - || true)
        echo "   ${LESSON_HEADING_PREFIX}${num} — träffar: ${lines}"
    done <<< "${DUPES}"
    echo "   Orsak: två aktörer antog samma nästa-lediga-nummer."
    echo "   Fix: numrera om den senast landade posten och lägg nya kandidater"
    echo "        i ${LESSON_FRAGMENT_DIR}/ utan nummer."
    FAILED=1
fi

# --- (b) Fragment får inte bära nummer ------------------------------------
# Frånvarande katalog är GRÖNT, inte rött: fragment-vägen är tillgänglig,
# inte obligatorisk för en session som inte skördar något.
# Glob-iteration per husets idiom (check-lifecycle.sh rad 37/82) i stället för
# find-pipe i process substitution — samma SC2312-skäl som ovan.
for frag in "${LESSON_FRAGMENT_DIR}"/*.md; do
    [[ -e "${frag}" ]] || continue

    base="${frag##*/}"
    skip=0
    for excluded in "${LESSON_EXCLUDE_BASENAMES[@]:-}"; do
        [[ "${base}" == "${excluded}" ]] && skip=1 && break
    done
    [[ "${skip}" -eq 1 ]] && continue

    FRAG_COUNT=$((FRAG_COUNT + 1))

    if grep -qE "${HEADING_RE}" "${frag}"; then
        echo "❌ ${frag} bär en numrerad rubrik."
        offenders=$(grep -nE "${HEADING_RE}" "${frag}" || true)
        # shellcheck disable=SC2001  # sed på multi-line är klarast här
        echo "${offenders}" | sed 's/^/     /'
        echo "   Fragment är nummerlösa — numret tilldelas när posten"
        echo "   konsolideras in i den aktiva volymen (${LESSON_FILE_GLOB}),"
        echo "   vilket merge-grinden serialiserar (ADR-076). Ta bort numret"
        echo "   ur rubriken."
        FAILED=1
    fi
done

if [[ "${FAILED}" -ne 0 ]]; then
    exit 1
fi

# -h/-o summerar över alla matchande filer (redan verifierat dubblettfria ovan).
total=$(grep -hoE "${HEADING_RE}" "${LESSON_FILES[@]}" | wc -l | tr -d ' ')

echo "✅ Lesson-numrering OK: ${total} unika poster i ${#LESSON_FILES[@]} fil(er) (${LESSON_FILE_GLOB}), ${FRAG_COUNT} nummerlösa fragment."
