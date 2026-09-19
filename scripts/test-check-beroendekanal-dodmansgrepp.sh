#!/usr/bin/env bash
# scripts/test-check-beroendekanal-dodmansgrepp.sh — tvåsidigt bevis för
# beroendekanalens dödmansgrepp (TASK-467).
#
# TVÅSIDIGT: en genuint TYSTNAD beroendekanal (granskningsjobbet rött,
# ärendejobbet nådde inte `success`) SKA larma (SIDA 1); en FRISK kanal
# (granskningsjobbet inte rött, ELLER ärendejobbet lyckades) SKA vara tyst
# (SIDA 2). SIDA 3 bevisar fail-closed: varje läge där skriptet inte KAN
# avgöra läget larmar (ANROPSFEL), aldrig tystar.
#
# Riggen matar jobblistan ur en JSON-fil (NATTVAKT_BEROENDE_FAKE_JOBS_JSON) i
# stället för att fråga GitHub — testet ska pröva grindens LOGIK, inte
# nätverket, och ska kunna köra i CI utan `actions: read`. Samma rigg-mönster
# som scripts/test-check-nattvakt-dedup.sh (NATTVAKT_DEDUP_FAKE_JSON).
#
# Körs: bash scripts/test-check-beroendekanal-dodmansgrepp.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND="${SCRIPT_DIR}/check-beroendekanal-dodmansgrepp.sh"

ANTAL=0
FEL=0

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

GRANSKNING_NAMN="Bredare sårbarhetsgranskning"
ARENDE_NAMN="Beroendevarning — stående ärende"

POLICY="${TMP}/policy.conf"
cat >"${POLICY}" <<CONF
NATTVAKT_OFARLIGA_CONCLUSIONS=(
    "success"
    "skipped"
    "neutral"
)
NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN="${GRANSKNING_NAMN}"
NATTVAKT_BEROENDE_ARENDE_JOBBNAMN="${ARENDE_NAMN}"
CONF

# jobbjson <granskning-conclusion-json> <arende-conclusion-json> — värdena är
# RÅ JSON (t.ex. '"failure"' eller 'null'), speglar gh run view --json jobs
# rakt av: en pågående/oinstansierad jobbs conclusion är JSON null, inte "".
jobbjson() {
    printf '[{"name":"%s","conclusion":%s},{"name":"%s","conclusion":%s}]' \
        "${GRANSKNING_NAMN}" "$1" "${ARENDE_NAMN}" "$2"
}

skriv_jobb() {
    local fil="$1" granskning="$2" arende="$3"
    jobbjson "${granskning}" "${arende}" >"${fil}"
}

kor() {
    local jobs_fil="$1" policy="${2:-${POLICY}}" kod=0
    NATTVAKT_KANAL_POLICY="${policy}" NATTVAKT_BEROENDE_FAKE_JOBS_JSON="${jobs_fil}" \
        bash "${GRIND}" >/dev/null 2>&1 || kod=$?
    case "${kod}" in
        0) printf 'TYST' ;;
        1) printf 'LARMA' ;;
        2) printf 'ANROPSFEL' ;;
        *) printf 'OKAND-%s' "${kod}" ;;
    esac
}

forvanta() {
    local vantat="$1" desc="$2" jobs_fil="$3" policy="${4:-${POLICY}}"
    ANTAL=$((ANTAL + 1))
    local faktiskt
    faktiskt="$(kor "${jobs_fil}" "${policy}")"
    if [[ "${faktiskt}" == "${vantat}" ]]; then
        printf '  ✅ %-72s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-72s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ Beroendekanalens dödmansgrepp — tvåsidigt bevis (TASK-467) ═══"
echo

echo "SIDA 1 — genuint TYSTNAD beroendekanal ska LARMA"

F="${TMP}/a1.json"
skriv_jobb "${F}" '"failure"' '"failure"'
forvanta LARMA "granskning=failure, ärende=failure — ärendejobbet föll också" "${F}"

F="${TMP}/a2.json"
skriv_jobb "${F}" '"failure"' '"skipped"'
forvanta LARMA "granskning=failure, ärende=skipped — ärendejobbet körde aldrig" "${F}"

F="${TMP}/a3.json"
skriv_jobb "${F}" '"failure"' '"cancelled"'
forvanta LARMA "granskning=failure, ärende=cancelled" "${F}"

F="${TMP}/a4.json"
skriv_jobb "${F}" '"cancelled"' 'null'
forvanta LARMA "granskning=cancelled (också rött), ärende=null (aldrig instansierat)" "${F}"

F="${TMP}/a5.json"
skriv_jobb "${F}" '"timed_out"' 'null'
forvanta LARMA "granskning=timed_out (okänt värde, negation ⇒ rött), ärende=null" "${F}"

F="${TMP}/a6.json"
skriv_jobb "${F}" '"action_required"' '"failure"'
forvanta LARMA "granskning=action_required (okänt värde ⇒ rött), ärende=failure" "${F}"

echo
echo "SIDA 2 — FRISK kanal ska vara TYST"

F="${TMP}/b1.json"
skriv_jobb "${F}" '"success"' '"skipped"'
forvanta TYST "granskning=success — inget att pröva, ärendejobbet skippades korrekt" "${F}"

F="${TMP}/b2.json"
skriv_jobb "${F}" '"failure"' '"success"'
forvanta TYST "granskning=failure MEN ärende=success — kanalen larmade korrekt" "${F}"

F="${TMP}/b3.json"
skriv_jobb "${F}" '"skipped"' '"skipped"'
forvanta TYST "granskning=skipped (ofarligt) — hela kedjan tyst" "${F}"

F="${TMP}/b4.json"
skriv_jobb "${F}" '"neutral"' '"skipped"'
forvanta TYST "granskning=neutral (ofarligt) — hela kedjan tyst" "${F}"

F="${TMP}/b5.json"
skriv_jobb "${F}" 'null' 'null'
forvanta TYST "granskning=null (pågår/oinstansierat) — inget rött påstående utan fakta (L322)" "${F}"

echo
echo "SIDA 3 — tystnad/osäkerhet får ALDRIG bli TYST (fail-closed ⇒ ANROPSFEL)"

forvanta ANROPSFEL "svarade INTE (saknad datafil) ⇒ anropsfel, ej tyst" "${TMP}/finns-inte.json"

TRASIG="${TMP}/trasig.json"
printf 'inte json alls' >"${TRASIG}"
forvanta ANROPSFEL "otolkbart svar ⇒ anropsfel, ej tyst" "${TRASIG}"

SAKNAR_GRANSKNING="${TMP}/saknar-granskning.json"
printf '[{"name":"%s","conclusion":"success"}]' "${ARENDE_NAMN}" >"${SAKNAR_GRANSKNING}"
forvanta ANROPSFEL "granskningsjobbet saknas i jobblistan (namn glidit) ⇒ anropsfel" "${SAKNAR_GRANSKNING}"

DUBBEL_GRANSKNING="${TMP}/dubbel-granskning.json"
printf '[{"name":"%s","conclusion":"failure"},{"name":"%s","conclusion":"failure"},{"name":"%s","conclusion":"success"}]' \
    "${GRANSKNING_NAMN}" "${GRANSKNING_NAMN}" "${ARENDE_NAMN}" >"${DUBBEL_GRANSKNING}"
forvanta ANROPSFEL "granskningsjobbet finns TVÅ gånger i jobblistan ⇒ anropsfel, ej gissa" "${DUBBEL_GRANSKNING}"

SAKNAR_ARENDE="${TMP}/saknar-arende.json"
printf '[{"name":"%s","conclusion":"failure"}]' "${GRANSKNING_NAMN}" >"${SAKNAR_ARENDE}"
forvanta ANROPSFEL "ärendejobbet saknas i jobblistan (namn glidit) ⇒ anropsfel" "${SAKNAR_ARENDE}"

TOMPOLICY_G="${TMP}/tom-granskning.conf"
cat >"${TOMPOLICY_G}" <<CONF
NATTVAKT_OFARLIGA_CONCLUSIONS=("success" "skipped" "neutral")
NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN=""
NATTVAKT_BEROENDE_ARENDE_JOBBNAMN="${ARENDE_NAMN}"
CONF
F="${TMP}/c1.json"
skriv_jobb "${F}" '"success"' '"success"'
forvanta ANROPSFEL "policyn saknar NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN ⇒ anropsfel" "${F}" "${TOMPOLICY_G}"

TOMPOLICY_A="${TMP}/tom-arende.conf"
cat >"${TOMPOLICY_A}" <<CONF
NATTVAKT_OFARLIGA_CONCLUSIONS=("success" "skipped" "neutral")
NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN="${GRANSKNING_NAMN}"
NATTVAKT_BEROENDE_ARENDE_JOBBNAMN=""
CONF
forvanta ANROPSFEL "policyn saknar NATTVAKT_BEROENDE_ARENDE_JOBBNAMN ⇒ anropsfel" "${F}" "${TOMPOLICY_A}"

TOMPOLICY_OFARLIGA="${TMP}/tom-ofarliga.conf"
cat >"${TOMPOLICY_OFARLIGA}" <<CONF
NATTVAKT_OFARLIGA_CONCLUSIONS=()
NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN="${GRANSKNING_NAMN}"
NATTVAKT_BEROENDE_ARENDE_JOBBNAMN="${ARENDE_NAMN}"
CONF
forvanta ANROPSFEL "policyn saknar NATTVAKT_OFARLIGA_CONCLUSIONS (tom array) ⇒ anropsfel" "${F}" "${TOMPOLICY_OFARLIGA}"

SAKNAD_POLICY="${TMP}/finns-inte.conf"
forvanta ANROPSFEL "saknad policyfil ⇒ anropsfel" "${F}" "${SAKNAD_POLICY}"

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
