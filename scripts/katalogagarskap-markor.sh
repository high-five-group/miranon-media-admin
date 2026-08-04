#!/usr/bin/env bash
# scripts/katalogagarskap-markor.sh — sätter ägarlappen på huvudkatalogen.
#
# VARFÖR SKRIPTET FINNS: ADR-090 beslut 2 (ägarskaps-regeln) fanns bara i
#   prosa och bröts tre gånger i ETT pass (S96 Del 8). Prövningen bor i
#   scripts/deny-frammande-huvudkatalog.sh; detta skript är dess
#   FÖRUTSÄTTNING — det som gör att en session över huvud taget VET vem som
#   äger huvudkatalogen.
#
# VARFÖR EN HOOK OCH INTE ETT SKILL-STEG: hela T119:s premiss är att regler i
#   ren prosa bryts av färska kontexter, ofta av orkestreraren själv. Om
#   lappen skulle sättas manuellt enligt en instruktion i session-start-skillen
#   vore halva mekanismen tillbaka i exakt det som inte fungerar. Formen är
#   lånad från pluginets hooks/session-facts.sh: en SessionStart-hook som
#   levererar FAKTA, inte uppmaningar.
#
# FAIL-OPEN, MEDVETET: varje internt fel här (jq saknas, inte ett git-repo,
#   oskrivbar .git-katalog) avslutar tyst med exit 0. Motivet står i
#   deny-frammande-huvudkatalog.sh § FAIL-OPEN-VALET och är Marcus-kvitterat
#   2026-08-04: en trasig ägarskaps-mekanism ska inte kunna låsa arbetet.
#   Detta AVVIKER medvetet från scripts/deny-resend-send.sh, som är
#   fail-closed därför att dess skada (skickat mail) är irreversibel.
#   Skadan här är återställbar — S96:s tre överträdelser gav rena träd och
#   rena fast-forwards.
#
# INPUT: SessionStart hook-JSON på stdin (fält `session_id`, `cwd`) —
#   bekräftat mot code.claude.com/docs/en/hooks.md 2026-08-04 och mot att
#   scripts/agent-spawn-log.sh:157-162 redan läser båda i drift.
#
# OUTPUT: `hookSpecificOutput.additionalContext` med ett rent faktapåstående
#   om ägarskapet. Förstaparten varnar för imperativ text i additionalContext
#   (kan trigga injektionsförsvaret) — därför påståenden, aldrig uppmaningar.
#   Samma hållning som session-facts.sh.
#
# Testsvit: scripts/test-deny-frammande-huvudkatalog.sh (täcker båda skripten).
#
# Källa: T119 arbetslista (a) · ADR-090 beslut 2 + 5 · S96 Del 8 ·
#        .katalogagarskap-policy.conf · code.claude.com/docs/en/hooks.md
# Etablerad: S97, 2026-08-04

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
KATALOG_POLICY="${KATALOG_POLICY:-${SCRIPT_DIR}/../.katalogagarskap-policy.conf}"

command -v jq >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0
[[ -f "${KATALOG_POLICY}" ]] || exit 0
# shellcheck source=/dev/null
source "${KATALOG_POLICY}" 2>/dev/null || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

SESSION_ID="$(printf '%s' "${INPUT}" | jq -r '.session_id // empty' 2>/dev/null)"
[[ -n "${SESSION_ID}" ]] || exit 0

# Kör i sessionens egen katalog. `cwd` ur hook-inputen är auktoritativ; utan
# den faller vi tillbaka på processens katalog.
HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2>/dev/null)"
if [[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]]; then
    cd "${HOOK_CWD}" 2>/dev/null || exit 0
fi

GIT_DIR="$(git rev-parse --path-format=absolute --git-dir 2>/dev/null)" || exit 0
COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || exit 0
[[ -n "${GIT_DIR}" && -n "${COMMON_DIR}" ]] || exit 0

# Sessioner som kör i en worktree sätter ingen lapp — de gör inga anspråk på
# huvudkatalogen. Se policyfilen § VARFÖR LAPPEN BOR I --git-common-dir för
# mätningen bakom denna jämförelse.
[[ "${GIT_DIR}" = "${COMMON_DIR}" ]] || exit 0

HUVUDKATALOG="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN:-katalogagarskap-agare.json}"
NU_EPOCH="$(date +%s 2>/dev/null)" || exit 0
NU_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || exit 0

skriv_markor() {
    jq -n \
        --arg sid "${SESSION_ID}" \
        --arg huvud "${HUVUDKATALOG}" \
        --arg iso "${NU_ISO}" \
        --argjson epoch "${NU_EPOCH}" \
        '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch}' \
        > "${MARKOR}.tmp" 2>/dev/null || return 1
    mv -f "${MARKOR}.tmp" "${MARKOR}" 2>/dev/null || return 1
    return 0
}

fakta() {
    jq -nc --arg ctx "$1" \
        '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}' \
        2>/dev/null || true
    exit 0
}

# Ingen lapp → ta ägarskapet.
if [[ ! -f "${MARKOR}" ]]; then
    skriv_markor || exit 0
    fakta "Huvudkatalogen ${HUVUDKATALOG} är nu registrerad på denna session (katalogägarskaps-lappen satt ${NU_ISO})."
fi

AGARE="$(jq -r '.session_id // empty' "${MARKOR}" 2>/dev/null)"
AGARE_EPOCH="$(jq -r '.satt_vid_epoch // 0' "${MARKOR}" 2>/dev/null)"
AGARE_ISO="$(jq -r '.satt_vid // "okänt"' "${MARKOR}" 2>/dev/null)"

# Oläsbar lapp → behandla som frånvarande (fail-open) och ta över.
if [[ -z "${AGARE}" ]]; then
    skriv_markor || exit 0
    fakta "Huvudkatalogen ${HUVUDKATALOG} är nu registrerad på denna session (den tidigare ägarlappen gick inte att läsa och ersattes)."
fi

# Egen lapp → uppdatera tidsstämpeln så en levande session aldrig hinner bli
# stale-klassad.
if [[ "${AGARE}" = "${SESSION_ID}" ]]; then
    skriv_markor || exit 0
    exit 0
fi

# Annan sessions lapp. STJÄL ALDRIG ett färskt ägarskap — rapportera det som
# fakta, så detektionen blir synlig i sessionsstartens RAPPORTERA (ADR-090
# beslut 1 gör detta till ett FYND som Marcus avgör).
ALDER_TIMMAR=$(( (NU_EPOCH - AGARE_EPOCH) / 3600 ))
STALE_GRANS="${KATALOG_STALE_TIMMAR:-12}"

if (( AGARE_EPOCH > 0 && ALDER_TIMMAR >= STALE_GRANS )); then
    fakta "Huvudkatalogen ${HUVUDKATALOG} bär en katalogägarskaps-lapp från en annan session (satt ${AGARE_ISO}, ${ALDER_TIMMAR} timmar sedan, över stale-tröskeln ${STALE_GRANS} h). Lappen är kvar och orörd. Rensningskommandot är: rm ${MARKOR}"
fi

fakta "Huvudkatalogen ${HUVUDKATALOG} ägs av en annan session enligt katalogägarskaps-lappen (satt ${AGARE_ISO}). Denna session har inte tagit ägarskapet. ADR-090 beslut 2: den först startade sessionen behåller huvudträdet, den senare tar en worktree."
