#!/usr/bin/env bash
# scripts/arbetsform-tillstand.sh — sätt/rensa/läs för arbetsform-
# tillståndsfilen (ADR-097 § Beslut del 2, TASK-149.3 AC 2).
#
# VARFÖR SKRIPTET FINNS: EN gemensam väg att sätta/rensa/läsa
# tillståndsfilen scripts/deny-arbetsform-push.sh (hooken) läser — så
# skills (TASK-149.4), agenter och människor delar EXAKT samma
# sökvägsupplösning och JSON-form. Två oberoende implementationer av samma
# "var ligger filen" hade varit precis den typ av glapp premiss-passet i
# scripts/deny-arbetsform-push.sh:s huvud dokumenterar (CLAUDE_PROJECT_DIR
# vs. cwd) — bara på sättar-sidan i stället för läsar-sidan.
#
# VARFÖR pwd/git rev-parse OCH INTE CLAUDE_PROJECT_DIR: detta skript körs
# som ett VANLIGT Bash-anrop (av en agent, en skill, eller en människa) —
# INTE som en hook. En agents vanliga Bash-anrop har `CLAUDE_PROJECT_DIR`
# OSATT i sin miljö (verifierat: `printenv CLAUDE_PROJECT_DIR` gav exit 1 i
# byggsessionens egna Bash-anrop, TASK-149.3 premiss-passet). `pwd`/
# `git rev-parse --show-toplevel` är däremot ALLTID korrekt för det
# anropande skalet — och det är EXAKT samma mekanism hooken använder (via
# `cwd` ur hook-JSON:et i stället för `pwd`, men samma `git rev-parse
# --show-toplevel`-upplösning från DEN katalogen). Se
# scripts/deny-arbetsform-push.sh § ARBETSTRÄDETS ROT för hela resonemanget.
#
# ANVÄNDNING:
#   bash scripts/arbetsform-tillstand.sh satt <arbetsform> <sattare>
#   bash scripts/arbetsform-tillstand.sh rensa
#   bash scripts/arbetsform-tillstand.sh las
#
#   satt   — skriver tillståndsfilen ATOMISKT (temp+mv, samma mönster som
#            scripts/deny-frammande-huvudkatalog.sh:s ta_over_lappen) med
#            {arbetsform, satt_vid (UTC ISO 8601), sattare}. <arbetsform>
#            och <sattare> är BÅDA obligatoriska — ett tyst default hade
#            gjort tillståndet svårt att spåra till sin källa.
#   rensa  — tar bort tillståndsfilen om den finns. Idempotent: att rensa
#            en redan rensad/aldrig satt fil är INTE ett fel (exit 0).
#   las    — skriver ut tillståndets innehåll människoläsbart, eller
#            "Inget arbetsform-läge aktivt." om filen saknas. Exit 0 om
#            filen saknas ELLER är giltig; exit 1 om filen finns men är
#            korrupt (så anroparen kan skilja "inget läge" från "trasigt
#            läge" utan att själv parsa JSON).
#
# Policy: samma .arbetsform-push-policy.conf som hooken — ETT filnamn,
# EN sanning (ARBETSFORM_TILLSTAND_FILNAMN).
#
# Testsvit: scripts/test-deny-arbetsform-push.sh täcker hookens läsning av
# filer denna sida skriver (samma kontrakt, mätt end-to-end). Detta skriptet
# har inget separat enhetstest — det är en tunn, direkt jq/mv-operation utan
# förgreningslogik att fälla/släppa; dess KONTRAKT (filnamn, JSON-form,
# rotupplösning) är exakt det testsviten redan verifierar genom att skriva
# tillståndsfiler i samma form för hand.
#
# Källa: ADR-097-arbetsformens-tillstandsbarare.md § Beslut del 2 ·
#        scripts/deny-arbetsform-push.sh · .arbetsform-push-policy.conf
# Etablerad: TASK-149.3, 2026-08-07

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARBETSFORM_POLICY="${ARBETSFORM_POLICY:-${SCRIPT_DIR}/../.arbetsform-push-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

fel() {
    printf 'arbetsform-tillstand.sh: %s\n' "$1" >&2
    exit 1
}

[[ -f "${ARBETSFORM_POLICY}" ]] || fel "policyfilen ${ARBETSFORM_POLICY} saknas."
# shellcheck source=/dev/null
source "${ARBETSFORM_POLICY}" || fel "policyfilen ${ARBETSFORM_POLICY} gick inte att läsa."
FILNAMN="${ARBETSFORM_TILLSTAND_FILNAMN:-}"
[[ -n "${FILNAMN}" ]] || fel "policyn definierar inget ARBETSFORM_TILLSTAND_FILNAMN."

command -v git > /dev/null 2>&1 || fel "git saknas i PATH."
jq_version_ok || fel "jq saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf)."

ARBETSTRAD_ROT="$(git rev-parse --show-toplevel 2> /dev/null)" || fel "inte i ett git-arbetsträd — kan inte avgöra var tillståndsfilen ska ligga."
TILLSTANDSFIL="${ARBETSTRAD_ROT}/${FILNAMN}"

satt() {
    local arbetsform="${1:-}" sattare="${2:-}" nu_iso
    [[ -n "${arbetsform}" ]] || fel "användning: satt <arbetsform> <sattare> — arbetsform saknas."
    [[ -n "${sattare}" ]] || fel "användning: satt <arbetsform> <sattare> — sattare saknas (vem/vad satte läget, t.ex. 'prototype-skill', 'session-paus', 'manuell')."
    nu_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ 2> /dev/null)" || fel "kunde inte läsa systemklockan."
    mkdir -p "$(dirname "${TILLSTANDSFIL}")" || fel "kunde inte skapa katalogen $(dirname "${TILLSTANDSFIL}")."
    jq -n \
        --arg arbetsform "${arbetsform}" \
        --arg satt_vid "${nu_iso}" \
        --arg sattare "${sattare}" \
        '{arbetsform: $arbetsform, satt_vid: $satt_vid, sattare: $sattare}' \
        > "${TILLSTANDSFIL}.tmp" || fel "kunde inte bygga tillstånds-JSON."
    mv -f "${TILLSTANDSFIL}.tmp" "${TILLSTANDSFIL}" || fel "kunde inte skriva ${TILLSTANDSFIL}."
    printf 'Arbetsform satt: %s (av %s, %s) — %s\n' "${arbetsform}" "${sattare}" "${nu_iso}" "${TILLSTANDSFIL}" >&2
}

rensa() {
    if [[ -f "${TILLSTANDSFIL}" ]]; then
        rm -f "${TILLSTANDSFIL}" || fel "kunde inte ta bort ${TILLSTANDSFIL}."
        printf 'Arbetsform-tillstånd rensat: %s\n' "${TILLSTANDSFIL}" >&2
    else
        printf 'Inget arbetsform-läge att rensa (%s finns inte).\n' "${TILLSTANDSFIL}" >&2
    fi
}

las() {
    if [[ ! -f "${TILLSTANDSFIL}" ]]; then
        printf 'Inget arbetsform-läge aktivt.\n'
        exit 0
    fi
    if ! jq -e '.arbetsform and .satt_vid and .sattare' < "${TILLSTANDSFIL}" > /dev/null 2>&1; then
        printf 'Tillståndsfilen %s finns men är korrupt eller ofullständig.\n' "${TILLSTANDSFIL}" >&2
        exit 1
    fi
    jq -r '"Arbetsform: \(.arbetsform)\nSatt: \(.satt_vid)\nAv: \(.sattare)"' < "${TILLSTANDSFIL}"
}

case "${1:-}" in
    satt) satt "${2:-}" "${3:-}" ;;
    rensa) rensa ;;
    las) las ;;
    *) fel "användning: $0 satt <arbetsform> <sattare> | rensa | las" ;;
esac
