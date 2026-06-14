#!/usr/bin/env bash
# check-lifecycle.sh — validerar lifecycle:-frontmatter-fältet på sessionsdok.
# ADR-052 beslut 4: dedikerad lätt grind, SKILD från frontmatter-governing-regimen
#   (sessionsdok dras EJ in i FRONTMATTER_GOVERNING_DOCS — review_by/updated-checkar
#    mot immutabla arkiverade dok, ADR-023).
# Validerar (a) lifecycle ∈ {active,paused,closed} och (b) konsistens fält↔kropp.
# Frånvaro av fältet = "ej livscykel-spårat" = GILTIGT (ADR-052 beslut 6) → skip.
# KANONISK paus-markör (ADR-052 beslut 4 + session-paus-skillen): den FÖRANKRADE
#   rubriken  ^## PAUSLÄGE — Session <N> pausad
#   ALDRIG bar substräng "PAUSLÄGE" (falskpositiv på t.ex. "## Del 2 — Förlopp och
#   PAUSLÄGE" i en STÄNGD session vars ARBETE pausades — session-18-fällan).
#
# Idiom speglar scripts/check-frontmatter.sh (awk-frontmatter-extraktion,
# EXIT_CODE-ackumulering, set -euo pipefail, explicit exit). Som check-skripten
# i detta repo förlitar sig grinden på cwd=repo-root (ingen cd) — CI kör från
# repo-roten; testsviten cd:ar in i sin /tmp-sandbox före anrop.
#
# TRÅD-KORT (ADR-053, K3): grinden validerar även tråd-kort tasks/threads/T*.md.
#   (a) samma enum + frånvaro=skip som sessioner; (b) INGEN PAUSLÄGE-markör
#   (kategori-skillnad — se tråd-loopen); (c) fält↔INDEX-konsistens: kortets
#   lifecycle måste matcha dess rad i tasks/threads/README.md (passiv drift-vakt;
#   fäller, auto-rättar ALDRIG). README.md är indexet, ej ett kort (T*-globben
#   exkluderar det).
#
# Exit 0 om alla sessionsdok + tråd-kort passerar (eller saknar fältet). Exit 1 vid drift.
#
# Källa: docs/decisions/ADR-052-lifecycle-frontmatter-falt.md (sessioner)
#        docs/decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md (trådar)
# Etablerad: Session 20 inkrement 2b (sessioner); Session 21 K3 (trådar)

set -euo pipefail

VALID_LIFECYCLE=("active" "paused" "closed")
EXIT_CODE=0

for file in tasks/sessions/*.md; do
    [[ -e "${file}" ]] || continue

    # Isolera frontmatter-blocket (rader mellan första två ---) — samma idiom
    # som check-frontmatter.sh.
    FRONTMATTER=$(awk '/^---$/{c++; if(c==1)next; if(c==2)exit} c==1' "${file}")
    LIFECYCLE=$(echo "${FRONTMATTER}" | grep -E "^lifecycle:" \
        | sed -E 's/^lifecycle:[[:space:]]*([a-z]+).*/\1/' || echo "")

    # Frånvaro = "ej livscykel-spårat" = giltigt (ADR-052 beslut 6).
    [[ -z "${LIFECYCLE}" ]] && continue

    # (a) enum
    enum_ok=0
    for v in "${VALID_LIFECYCLE[@]}"; do [[ "${LIFECYCLE}" == "${v}" ]] && enum_ok=1; done
    if [[ "${enum_ok}" -eq 0 ]]; then
        echo "❌ ${file} — lifecycle: '${LIFECYCLE}' ogiltigt (förväntat: active|paused|closed)"
        echo "   Fix: sätt enum-giltigt värde, eller ta bort fältet (frånvaro = ej spårat)."
        EXIT_CODE=1
        continue
    fi

    # (b) konsistens: förankrad paus-markör  ⟺  lifecycle == paused
    if grep -qE '^## PAUSLÄGE — Session [0-9]+ pausad' "${file}"; then PAUS=1; else PAUS=0; fi
    if [[ "${LIFECYCLE}" == "paused" && "${PAUS}" -eq 0 ]]; then
        echo "❌ ${file} — lifecycle: paused men ingen förankrad paus-markör i kroppen"
        echo "   Förväntat: en '## PAUSLÄGE — Session <N> pausad'-rubrik (session-paus-output)."
        EXIT_CODE=1
    elif [[ "${LIFECYCLE}" != "paused" && "${PAUS}" -eq 1 ]]; then
        echo "❌ ${file} — förankrad paus-markör i kroppen men lifecycle: ${LIFECYCLE} (förväntat: paused)"
        echo "   Fix: sätt lifecycle: paused, eller ta bort markören om sessionen ej är pausad."
        EXIT_CODE=1
    fi
done

# ── Tråd-kort (ADR-053): lifecycle-fält + fält↔index-konsistens ──────────────
# KORT-GLOB = tasks/threads/T*.md (README.md är INDEXET, ej ett kort → exkluderas).
# KATEGORI-SKILLNAD mot sessioner (medvetet, ej glömd kontroll): tråd-kort har
# INGEN självständig prosa-tillståndsmarkör. Sessionsdokets förankrade
# ^## PAUSLÄGE-rubrik portas DÄRFÖR INTE hit — kortets kropp pekar på fältet, och
# tråd-typens drift-yta är en annan: fält↔INDEX (inte fält↔kropp). Varje dok-typ
# vaktas på sin egen drift-dimension.
THREAD_INDEX="tasks/threads/README.md"
BT='`'  # backtick-token för förankrad (ej bar-substräng) matchning i indexet

for file in tasks/threads/T*.md; do
    [[ -e "${file}" ]] || continue

    # TID = ledande T+siffror ur filnamnet (T<NN>). Saknas → ej ett kort → skip.
    TID=$(basename "${file}" | grep -oE '^T[0-9]+' || echo "")
    [[ -z "${TID}" ]] && continue

    FRONTMATTER=$(awk '/^---$/{c++; if(c==1)next; if(c==2)exit} c==1' "${file}")
    LIFECYCLE=$(echo "${FRONTMATTER}" | grep -E "^lifecycle:" \
        | sed -E 's/^lifecycle:[[:space:]]*([a-z]+).*/\1/' || echo "")

    # Frånvaro = "ej livscykel-spårat" = giltigt (ADR-052 beslut 6, schema-on-read).
    [[ -z "${LIFECYCLE}" ]] && continue

    # (a) enum
    enum_ok=0
    for v in "${VALID_LIFECYCLE[@]}"; do [[ "${LIFECYCLE}" == "${v}" ]] && enum_ok=1; done
    if [[ "${enum_ok}" -eq 0 ]]; then
        echo "❌ ${file} — lifecycle: '${LIFECYCLE}' ogiltigt (förväntat: active|paused|closed)"
        echo "   Fix: sätt enum-giltigt värde, eller ta bort fältet (frånvaro = ej spårat)."
        EXIT_CODE=1
        continue
    fi

    # (b) INGET PAUSLÄGE-ankare för trådar — se KATEGORI-SKILLNAD ovan.

    # (c) fält↔index-konsistens (passiv drift-vakt; fäller, auto-rättar ALDRIG).
    if [[ ! -f "${THREAD_INDEX}" ]]; then
        echo "❌ ${file} — tråd-kort finns men indexet ${THREAD_INDEX} saknas (bruten ryggrad)"
        echo "   Fix: återställ ${THREAD_INDEX} (registrets navigerbara ryggrad)."
        EXIT_CODE=1
        continue
    fi
    # Förankrad TID-rad i indexet — backtickad token (ej bar substräng: `T01`
    # matchar EJ `T010`, och kolliderar ej med länk-pathen T01-...md).
    INDEX_ROW=$(grep -F "${BT}${TID}${BT}" "${THREAD_INDEX}" || true)
    if [[ -z "${INDEX_ROW}" ]]; then
        echo "❌ ${file} — ${TID} saknas i indexet ${THREAD_INDEX} (föräldralöst kort, ej navigerbar)"
        echo "   Fix: lägg en rad för ${TID} i indexet (Tråd-ID | Titel | Tillstånd | Ingång)."
        EXIT_CODE=1
        continue
    fi
    # Tillstånds-token på SAMMA rad (backtickad) ⟺ kort↔index överens.
    if ! echo "${INDEX_ROW}" | grep -qF "${BT}${LIFECYCLE}${BT}"; then
        echo "❌ ${file} — lifecycle: ${LIFECYCLE} men index-raden för ${TID} saknar ${BT}${LIFECYCLE}${BT} (tillstånds-drift kort↔index)"
        echo "   Fix: synka index-radens tillstånd med kortets lifecycle-fält."
        EXIT_CODE=1
    fi
done

[[ "${EXIT_CODE}" -eq 0 ]] && echo "✅ lifecycle-validering OK (enum + fält↔kropp [sessioner] + fält↔index [trådar])"
exit "${EXIT_CODE}"
