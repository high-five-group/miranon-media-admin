#!/usr/bin/env bash
# scripts/check-nattvakt-dedup.sh — dedup-beslutet för nightly-watchdog.yml:s
# jobb "Kom natten igång?" (TASK-180).
#
# VAD DEN PRÖVAR: om en kandidat-avvikelse redan är TÄCKT av ett existerande
#   ci-natt-ärende — antingen ÖPPET, eller STÄNGT inom fönstret MED minst en
#   kommentar (= skriven motivering, CONTRIBUTING.md § Nattnätet
#   stängningsregel). Är den täckt: vakten ska INTE skapa ett nytt ärende.
#   Är den inte täckt: vakten ska larma.
#
# VARFÖR DEN FINNS — instansen är skarp, inte hypotetisk (issue #1042,
#   2026-08-09): nightly.yml:s eget larm-jobb skapade #1028 kl 03:12 för en
#   röd natt; Marcus stängde det 07:19 MED en skriven rotorsaksmotivering
#   (task-169 äger skulden). Vaktens nästa körning (run 31308855918, kl
#   10:39) frågade bara efter ÖPPNA ci-natt-ärenden, hittade inget (#1028 var
#   redan stängt) och skapade #1042 — ett falsklarm. Checken skilde inte
#   "obesvarat" (inget ärende alls, eller ett stängt UTAN motivering) från
#   "stängt MED motivering" (#1028:s faktiska tillstånd). Marcus stängde
#   #1042 manuellt med den motiveringen och gav design-luckan ett eget kort:
#   TASK-180.
#
# ═══ VARFÖR "MED KOMMENTAR", INTE BARA "STÄNGT" ═══
#   CONTRIBUTING.md § Nattnätet: "ett nattärende stängs ALDRIG tyst" — antingen
#   (a) åtgärdas grundorsaken, eller (b) skrivs en öppen motivering ut innan
#   det stängs. Ett ärende stängt UTAN kommentar bryter mot den regeln och kan
#   inte skiljas från ett ärende som stängdes av misstag — det räknas därför
#   INTE som täckning. Kravet på minst en kommentar är hur skriptet läser
#   "motivering" mekaniskt: det finns ingen annan maskinläsbar signal.
#
# ═══ VARFÖR FÖNSTRET GÄLLER STÄNGNINGSTIDPUNKTEN, INTE SKAPELSETIDPUNKTEN ═══
#   Ett ärende kan ligga öppet länge innan det stängs; det är tiden SEDAN
#   STÄNGNING (dvs. hur länge sedan svaret skrevs) som avgör om motiveringen
#   fortfarande är en rimlig förklaring till en FÄRSK avvikelse.
#
# ═══ EXIT-KODERNA ═══
#   exit 0 = DEDUP. Ett täckande ärende hittades. Anroparen ska INTE larma.
#   exit 1 = INGEN TÄCKNING. Inget ärende täcker avvikelsen. Anroparen SKA
#            larma.
#   exit 2 = ANROPSFEL. Ärendelistan kunde inte hämtas eller tolkas.
#            FAIL-CLOSED (samma hållning som check-obesvarade-larm.sh och
#            L322): anroparen ska behandla detta som "larma", aldrig som
#            tyst dedup — "vet inte" får aldrig bli grönt/tyst.
#
# ═══ FAIL-CLOSED PÅ TOM MÄNGD ═══
#   Ett `gh`-anrop som misslyckas ger tom utdata, och en naiv tolkning hade
#   läst tomheten som "inga ärenden" (giltigt, exit 1). Skriptet skiljer
#   därför "svarade tomt" (giltigt) från "svarade inte" (exit 2) på anropets
#   EGEN exitkod, aldrig på utdatans längd — samma disciplin som
#   check-obesvarade-larm.sh.
#
# ANVÄNDNING:
#   REPO=<ägare/repo> bash scripts/check-nattvakt-dedup.sh
#   NATTVAKT_DEDUP_POLICY=<fil> bash scripts/...       # egen policy (testrigg)
#   NATTVAKT_DEDUP_FAKE_JSON=<fil> bash scripts/...    # testrigg: läs ärenden
#                                                        # ur fil i stället för
#                                                        # att fråga GitHub
#
# Testsvit: scripts/test-check-nattvakt-dedup.sh (tvåsidigt bevis).
#
# Källa: backlog/tasks/task-180 · issue #1042 (2026-08-09) ·
#        .github/workflows/nightly-watchdog.yml § Kontrollera senaste
#        schemalagda nattkörning · CONTRIBUTING.md § Nattnätet
#        (stängningsregeln) · scripts/check-obesvarade-larm.sh (mönster:
#        LARM_FAKE_JSON-rigg, fail-closed-disciplin)
# Etablerad: S102, 2026-08-10

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROT="${REPO_ROT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
NATTVAKT_DEDUP_POLICY="${NATTVAKT_DEDUP_POLICY:-${REPO_ROT}/.nattvakt-dedup-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/gh-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/gh-guard.sh"

anropsfel() {
    printf '::error::check-nattvakt-dedup: ANROPSFEL — %s\n' "$1" >&2
    printf '   Täckningen är OPRÖVAD. Anroparen ska larma (fail-closed), aldrig tysta.\n' >&2
    exit 2
}

jq_version_ok || anropsfel "jq saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf)."
[[ -f "${NATTVAKT_DEDUP_POLICY}" ]] || anropsfel "policyfilen ${NATTVAKT_DEDUP_POLICY} saknas."

NATTVAKT_DEDUP_ETIKETT=""
NATTVAKT_DEDUP_FONSTER_TIMMAR=""
# shellcheck source=/dev/null
source "${NATTVAKT_DEDUP_POLICY}" || anropsfel "policyfilen ${NATTVAKT_DEDUP_POLICY} gick inte att läsa."

[[ -n "${NATTVAKT_DEDUP_ETIKETT}" ]] || anropsfel "policyn saknar NATTVAKT_DEDUP_ETIKETT."
[[ "${NATTVAKT_DEDUP_FONSTER_TIMMAR}" =~ ^[0-9]+$ ]] \
    || anropsfel "NATTVAKT_DEDUP_FONSTER_TIMMAR ('${NATTVAKT_DEDUP_FONSTER_TIMMAR}') är inte ett heltal."

NU_EPOCH="$(date +%s 2>/dev/null)" || anropsfel "date +%s svarade inte."

# hamta_arenden — skriver JSON-array på stdout, returnerar icke-noll om
# ANROPET failade. Tom array är ett GILTIGT svar; ett misslyckat anrop är
# det inte. Skillnaden bärs av exitkoden, aldrig av utdatans längd.
hamta_arenden() {
    if [[ -n "${NATTVAKT_DEDUP_FAKE_JSON:-}" ]]; then
        [[ -f "${NATTVAKT_DEDUP_FAKE_JSON}" ]] || return 1
        cat "${NATTVAKT_DEDUP_FAKE_JSON}" 2>/dev/null || return 1
        return 0
    fi
    gh_version_ok >/dev/null 2>&1 || return 1
    if [[ -n "${REPO:-}" ]]; then
        gh issue list --repo "${REPO}" --label "${NATTVAKT_DEDUP_ETIKETT}" --state all \
            --limit 50 --json number,state,closedAt,comments 2>/dev/null || return 1
    else
        gh issue list --label "${NATTVAKT_DEDUP_ETIKETT}" --state all \
            --limit 50 --json number,state,closedAt,comments 2>/dev/null || return 1
    fi
}

# epoch_av <ISO8601> — macOS (BSD date) och Linux (GNU date, CI-runnern) i en
# rad, samma form som check-obesvarade-larm.sh redan använder.
epoch_av() {
    date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null \
        || date -u -d "$1" +%s 2>/dev/null
}

JSON=""
if ! JSON="$(hamta_arenden)"; then
    anropsfel "kunde inte hämta ärenden med etiketten '${NATTVAKT_DEDUP_ETIKETT}'."
fi
printf '%s' "${JSON}" | jq -e 'type == "array"' >/dev/null 2>&1 \
    || anropsfel "svaret var inte en JSON-array."

# jq-utfallet fångas i en variabel först — en kommandosubstitution i en
# process-substitution maskerar jq:s returvärde (SC2312), och ett tyst
# jq-fel hade blivit noll rader = "ingen täckning", vilket är exakt fail-open.
RADER="$(printf '%s' "${JSON}" | jq -r '
    .[] | [(.number|tostring), .state, (.closedAt // ""), ((.comments // []) | length | tostring)] | @tsv
')" || anropsfel "jq kunde inte tolka ärendelistan."

TACKANDE_ARENDE=""
TACKANDE_SKAL=""

while IFS=$'\t' read -r nummer state closed_at kommentar_antal; do
    [[ -n "${nummer}" ]] || continue

    if [[ "${state}" == "OPEN" ]]; then
        TACKANDE_ARENDE="${nummer}"
        TACKANDE_SKAL="öppet"
        break
    fi

    if [[ "${state}" == "CLOSED" && -n "${closed_at}" && "${kommentar_antal}" -ge 1 ]]; then
        CLOSED_EPOCH="$(epoch_av "${closed_at}")"
        if [[ -n "${CLOSED_EPOCH}" ]]; then
            ALDER_H=$(( (NU_EPOCH - CLOSED_EPOCH) / 3600 ))
            if (( ALDER_H < NATTVAKT_DEDUP_FONSTER_TIMMAR )); then
                TACKANDE_ARENDE="${nummer}"
                TACKANDE_SKAL="stängt för ${ALDER_H} h sedan med ${kommentar_antal} kommentar(er) (motivering), inom fönstret ${NATTVAKT_DEDUP_FONSTER_TIMMAR} h"
                break
            fi
        fi
    fi
done <<<"${RADER}"

if [[ -n "${TACKANDE_ARENDE}" ]]; then
    printf 'DEDUP — ärende #%s täcker redan avvikelsen (%s).\n' "${TACKANDE_ARENDE}" "${TACKANDE_SKAL}"
    exit 0
fi

printf 'INGEN TÄCKNING — inget öppet eller nyligen stängt-med-motivering %s-ärende hittades (fönster %d h).\n' \
    "${NATTVAKT_DEDUP_ETIKETT}" "${NATTVAKT_DEDUP_FONSTER_TIMMAR}"
exit 1
