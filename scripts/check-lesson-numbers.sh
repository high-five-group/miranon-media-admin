#!/usr/bin/env bash
#
# check-lesson-numbers.sh
#
# Hävdar att lesson-nummer tilldelas VID LANDNING, inte vid skrivning.
#
# Två invarianter:
#   (a) Ingen numrerad rubrik förekommer mer än en gång i den konsoliderade
#       lesson-filen. Dubbletter är beviset på att två aktörer antagit samma
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

: "${LESSON_FILE:?LESSON_FILE är osatt i ${CONFIG}}"
: "${LESSON_HEADING_PREFIX:?LESSON_HEADING_PREFIX är osatt i ${CONFIG}}"
: "${LESSON_FRAGMENT_DIR:?LESSON_FRAGMENT_DIR är osatt i ${CONFIG}}"

HEADING_RE="^### ${LESSON_HEADING_PREFIX}[0-9]+"
FAILED=0

# --- (a) Dubbletter i den konsoliderade filen -----------------------------
if [[ ! -f "${LESSON_FILE}" ]]; then
    die "${LESSON_FILE} saknas — kontrollera LESSON_FILE i ${CONFIG}"
fi

# grep -oE ger en rubrik per rad; sort|uniq -d ger de som förekommer >1 gång.
DUPES=$(grep -oE "${HEADING_RE}" "${LESSON_FILE}" | sort | uniq -d || true)

if [[ -n "${DUPES}" ]]; then
    echo "❌ Duplicerade lesson-nummer i ${LESSON_FILE}:"
    while IFS= read -r dupe; do
        [[ -z "${dupe}" ]] && continue
        num="${dupe##*"${LESSON_HEADING_PREFIX}"}"
        echo "   ${LESSON_HEADING_PREFIX}${num} — rader: $(grep -nE "^### ${LESSON_HEADING_PREFIX}${num}\$" "${LESSON_FILE}" | cut -d: -f1 | paste -sd, -)"
    done <<< "${DUPES}"
    echo "   Orsak: två aktörer antog samma nästa-lediga-nummer."
    echo "   Fix: numrera om den senast landade posten och lägg nya kandidater"
    echo "        i ${LESSON_FRAGMENT_DIR}/ utan nummer."
    FAILED=1
fi

# --- (b) Fragment får inte bära nummer ------------------------------------
# Frånvarande katalog är GRÖNT, inte rött: fragment-vägen är tillgänglig,
# inte obligatorisk för en session som inte skördar något.
if [[ -d "${LESSON_FRAGMENT_DIR}" ]]; then
    while IFS= read -r frag; do
        [[ -z "${frag}" ]] && continue

        base=$(basename "${frag}")
        skip=0
        for excluded in "${LESSON_EXCLUDE_BASENAMES[@]:-}"; do
            [[ "${base}" == "${excluded}" ]] && skip=1 && break
        done
        [[ "${skip}" -eq 1 ]] && continue

        if grep -qE "${HEADING_RE}" "${frag}"; then
            echo "❌ ${frag} bär en numrerad rubrik."
            grep -nE "${HEADING_RE}" "${frag}" | sed 's/^/     /'
            echo "   Fragment är nummerlösa — numret tilldelas när posten"
            echo "   konsolideras in i ${LESSON_FILE}, vilket merge-grinden"
            echo "   serialiserar (ADR-076). Ta bort numret ur rubriken."
            FAILED=1
        fi
    done < <(find "${LESSON_FRAGMENT_DIR}" -type f -name '*.md' | sort)
fi

if [[ "${FAILED}" -ne 0 ]]; then
    exit 1
fi

total=$(grep -cE "${HEADING_RE}" "${LESSON_FILE}" || true)
frag_count=0
if [[ -d "${LESSON_FRAGMENT_DIR}" ]]; then
    frag_count=$(find "${LESSON_FRAGMENT_DIR}" -type f -name '*.md' \
        -not -name 'README.md' | wc -l | tr -d ' ')
fi

echo "✅ Lesson-numrering OK: ${total} unika poster i ${LESSON_FILE}, ${frag_count} nummerlösa fragment."
