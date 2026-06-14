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
# Exit 0 om alla sessionsdok passerar (eller saknar fältet). Exit 1 vid drift.
#
# Källa: docs/decisions/ADR-052-lifecycle-frontmatter-falt.md
# Etablerad: Session 20 inkrement 2b

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

[[ "${EXIT_CODE}" -eq 0 ]] && echo "✅ lifecycle-validering OK (enum + konsistens fält↔kropp)"
exit "${EXIT_CODE}"
