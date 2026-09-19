#!/usr/bin/env bash
# scripts/check-beroendekanal-dodmansgrepp.sh — beroendekanalens EGNA
# dödmansgrepp (TASK-467), i samma mönster som scripts/check-nattvakt-dedup.sh.
#
# ═══ VAD DEN PRÖVAR ═══
# K1 (b) (`TASK-450.5`) gjorde beroendekanalen (`nightly-audit` →
# `beroende-arende`, etikett `beroendevarning`) LASTBÄRANDE: den är sedan dess
# den ENDA vägen en ny extern sårbarhetsvarning mot ett oförändrat träd når en
# människa. Om `beroende-arende` FALLERAR TYST — dess `gh issue`-anrop
# misslyckas, eller jobbet av någon annan anledning inte når `success` trots
# att `nightly-audit` var rött — finns i dag ingenting som märker det.
# `nightly-watchdog.yml` (`nightly-watchdog.yml` § BEVIS-LÄGE / CONTRIBUTING.md
# § Nattnätet, "Vakten vaktar bara produktkanalen") kände bara PRODUKTKANALEN;
# bokförings- och beroendekanalen stod skrivet som "känd lucka".
#
# Skriptet stänger den för BEROENDEKANALEN specifikt: gavs granskningsjobbet
# (`nightly-audit`, "Bredare sårbarhetsgranskning") ett RÖTT resultat, MÅSTE
# ärendejobbet (`beroende-arende`, "Beroendevarning — stående ärende") ha
# `conclusion: success` — annars fallerade ärendeskapandet tyst.
#
# ═══ VARFÖR EXAKT DENNA FORM ═══
# Prometheus Watchdog-mönstret (ett larm som ALLTID ska fyra; TYSTNAD är
# felet) applicerat på en TVÅLEDS-relation i stället för en ensam heartbeat:
# "om A var rött måste B ha lyckats" — samma healthchecks.io/Cronitor-idé
# ("did the expected follow-up actually happen?") applicerad på TVÅ jobb i
# SAMMA körning i stället för på en extern klocka. Formen återanvänder
# `.nattvakt-kanal-policy.conf`s BEFINTLIGA `NATTVAKT_OFARLIGA_CONCLUSIONS`
# (samma negations-logik som produktkanalens dödmansgrepp redan bär, se den
# filens § VÄRDENA) i stället för att uppfinna en andra rödhets-definition —
# config-driven, ingen ny handhållen lista.
#
# ═══ EXIT-KODERNA ═══
#   exit 0 = TYST. Antingen var granskningsjobbet inte rött (inget att pröva),
#            eller så lyckades ärendejobbet (kanalen larmade korrekt).
#   exit 1 = TYSTNAD. Granskningsjobbet var rött men ärendejobbet nådde inte
#            `success` — beroendekanalens ärendeskapande fallerade tyst.
#            Anroparen SKA larma.
#   exit 2 = ANROPSFEL. Jobblistan kunde inte hämtas/tolkas, eller ett
#            förväntat jobb saknas i den (namnet har glidit ur nightly.yml).
#            FAIL-CLOSED (samma hållning som check-nattvakt-dedup.sh och
#            L322): anroparen SKA larma, "vet inte" får aldrig bli tyst.
#
# ═══ ANVÄNDNING ═══
#   REPO=<ägare/repo> NATTVAKT_BEROENDE_RUN_ID=<run-id> \
#       bash scripts/check-beroendekanal-dodmansgrepp.sh
#   NATTVAKT_KANAL_POLICY=<fil> bash scripts/...              # egen policy (testrigg)
#   NATTVAKT_BEROENDE_FAKE_JOBS_JSON=<fil> bash scripts/...   # testrigg: läs
#                                                              # jobblistan ur fil
#                                                              # i stället för att
#                                                              # fråga GitHub
#
# Testsvit: scripts/test-check-beroendekanal-dodmansgrepp.sh (tvåsidigt bevis).
#
# Källa: backlog/tasks/task-467 · TASK-450.5 (K1 (b), beroendekanalen
#        lastbärande) · TASK-450.10 (3A, samma dödmansgrepp-mönster för
#        produktkanalen) · .github/workflows/nightly-watchdog.yml §
#        Kontrollera senaste schemalagda nattkörning · CONTRIBUTING.md §
#        Nattnätet · .nattvakt-kanal-policy.conf (NATTVAKT_OFARLIGA_CONCLUSIONS,
#        återanvänd, inte duplicerad)
# Etablerad: S126, 2026-09-19

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROT="${REPO_ROT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
NATTVAKT_KANAL_POLICY="${NATTVAKT_KANAL_POLICY:-${REPO_ROT}/.nattvakt-kanal-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/gh-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/gh-guard.sh"

anropsfel() {
    printf '::error::check-beroendekanal-dodmansgrepp: ANROPSFEL — %s\n' "$1" >&2
    printf '   Beroendekanalens läge är OPRÖVAT. Anroparen ska larma (fail-closed), aldrig tysta.\n' >&2
    exit 2
}

jq_version_ok || anropsfel "jq saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf)."
[[ -f "${NATTVAKT_KANAL_POLICY}" ]] || anropsfel "kanal-policy-filen ${NATTVAKT_KANAL_POLICY} saknas."

NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN=""
NATTVAKT_BEROENDE_ARENDE_JOBBNAMN=""
NATTVAKT_OFARLIGA_CONCLUSIONS=()
# shellcheck source=/dev/null
source "${NATTVAKT_KANAL_POLICY}" || anropsfel "kanal-policy-filen gick inte att läsa."

[[ -n "${NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN}" ]] \
    || anropsfel "policyn saknar NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN."
[[ -n "${NATTVAKT_BEROENDE_ARENDE_JOBBNAMN}" ]] \
    || anropsfel "policyn saknar NATTVAKT_BEROENDE_ARENDE_JOBBNAMN."
(( ${#NATTVAKT_OFARLIGA_CONCLUSIONS[@]} > 0 )) \
    || anropsfel "policyn saknar NATTVAKT_OFARLIGA_CONCLUSIONS."

# hamta_jobb — skriver jobblistans JSON-array (.jobs, EJ hela run view-svaret)
# på stdout, returnerar icke-noll om ANROPET failade. Tom array vore ett
# strukturellt trasigt svar (nightly.yml har alltid minst åtta jobb) och
# fångas separat nedan — skillnaden mellan "svarade tomt" och "svarade inte"
# bärs av EXITKODEN, aldrig av utdatans längd (samma disciplin som
# check-nattvakt-dedup.sh och check-obesvarade-larm.sh).
hamta_jobb() {
    if [[ -n "${NATTVAKT_BEROENDE_FAKE_JOBS_JSON:-}" ]]; then
        [[ -f "${NATTVAKT_BEROENDE_FAKE_JOBS_JSON}" ]] || return 1
        cat "${NATTVAKT_BEROENDE_FAKE_JOBS_JSON}" 2>/dev/null || return 1
        return 0
    fi
    gh_version_ok >/dev/null 2>&1 || return 1
    [[ -n "${NATTVAKT_BEROENDE_RUN_ID:-}" ]] || return 1
    if [[ -n "${REPO:-}" ]]; then
        gh run view "${NATTVAKT_BEROENDE_RUN_ID}" --repo "${REPO}" --json jobs --jq '.jobs' 2>/dev/null \
            || return 1
    else
        gh run view "${NATTVAKT_BEROENDE_RUN_ID}" --json jobs --jq '.jobs' 2>/dev/null || return 1
    fi
}

JOBS_JSON=""
if ! JOBS_JSON="$(hamta_jobb)"; then
    anropsfel "kunde inte hämta jobblistan (NATTVAKT_BEROENDE_RUN_ID saknas, gh-anropet misslyckades, eller testriggens fil saknas)."
fi
printf '%s' "${JOBS_JSON}" | jq -e 'type == "array"' >/dev/null 2>&1 \
    || anropsfel "jobblistan var inte en JSON-array."

# hamta_conclusion <jobbnamn> — kräver EXAKT en träff (namnet är inte ett
# uses:-anrops barnprefix som produktkanalens "Nattlig fullsvit", utan ett
# fristående jobb — se .nattvakt-kanal-policy.conf § NATTVAKT_BEROENDE_*).
# Noll eller fler än en träff är ett ANROPSFEL: namnet har glidit ur
# nightly.yml, precis den tysta klassen dödmansgreppet finns för att stänga.
hamta_conclusion() {
    local jobbnamn="$1" traff
    traff="$(printf '%s' "${JOBS_JSON}" | jq -r --arg namn "${jobbnamn}" \
        '[.[] | select(.name == $namn)] | length')" || return 1
    [[ "${traff}" == "1" ]] || return 1
    printf '%s' "${JOBS_JSON}" | jq -r --arg namn "${jobbnamn}" \
        '.[] | select(.name == $namn) | (.conclusion // "")'
}

GRANSKNING_CONCLUSION=""
if ! GRANSKNING_CONCLUSION="$(hamta_conclusion "${NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN}")"; then
    anropsfel "granskningsjobbet \"${NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN}\" finns inte (eller finns mer än en gång) i jobblistan — namnet kan ha glidit ur nightly.yml."
fi

ARENDE_CONCLUSION=""
if ! ARENDE_CONCLUSION="$(hamta_conclusion "${NATTVAKT_BEROENDE_ARENDE_JOBBNAMN}")"; then
    anropsfel "ärendejobbet \"${NATTVAKT_BEROENDE_ARENDE_JOBBNAMN}\" finns inte (eller finns mer än en gång) i jobblistan — namnet kan ha glidit ur nightly.yml."
fi

# ar_ofarlig <conclusion> — samma negations-logik som nightly-watchdog.yml:s
# produktkanal-check (.nattvakt-kanal-policy.conf § NATTVAKT_OFARLIGA_CONCLUSIONS),
# återanvänd rakt av. Tom sträng (`null` i JSON, jobbet PÅGÅR eller
# instansierades aldrig) är INTE ett rött påstående — ett faktapåstående utan
# fakta vore L322-klassen — och räknas därför som ofarlig (tyst).
ar_ofarlig() {
    local c="$1" o
    [[ -z "${c}" ]] && return 0
    for o in "${NATTVAKT_OFARLIGA_CONCLUSIONS[@]}"; do
        [[ "${c}" == "${o}" ]] && return 0
    done
    return 1
}

if ar_ofarlig "${GRANSKNING_CONCLUSION}"; then
    printf 'TYST — granskningsjobbet ("%s") var inte rött (conclusion: "%s") — beroendekanalen har inget att larma om.\n' \
        "${NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN}" "${GRANSKNING_CONCLUSION}"
    exit 0
fi

if [[ "${ARENDE_CONCLUSION}" == "success" ]]; then
    printf 'TYST — granskningsjobbet ("%s") var rött (conclusion: "%s") men ärendejobbet ("%s") lyckades (success) — kanalen larmade korrekt.\n' \
        "${NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN}" "${GRANSKNING_CONCLUSION}" "${NATTVAKT_BEROENDE_ARENDE_JOBBNAMN}"
    exit 0
fi

printf 'TYSTNAD — granskningsjobbet ("%s") var rött (conclusion: "%s") men ärendejobbet ("%s") hade conclusion "%s" (inte "success") — beroendekanalens ärendeskapande fallerade tyst.\n' \
    "${NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN}" "${GRANSKNING_CONCLUSION}" "${NATTVAKT_BEROENDE_ARENDE_JOBBNAMN}" "${ARENDE_CONCLUSION}"
exit 1
