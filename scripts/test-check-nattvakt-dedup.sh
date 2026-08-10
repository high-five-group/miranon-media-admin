#!/usr/bin/env bash
# scripts/test-check-nattvakt-dedup.sh — tvåsidigt bevis för
# nightly-watchdog.yml:s dedup-beslut (TASK-180).
#
# TVÅSIDIGT: en genuint obesvarad avvikelse ska fortfarande larma (SIDA 1);
# ett ärende som redan täcker avvikelsen — öppet, ELLER stängt inom fönstret
# MED en skriven motivering — ska INTE larma (SIDA 2). SIDA 2:s andra fall
# är #1042-scenariot ordagrant: #1028 stängdes med en rotorsaksmotivering och
# vakten larmade ändå, eftersom den bara frågade efter ÖPPNA ärenden.
#
# Riggen matar ärenden ur en JSON-fil (NATTVAKT_DEDUP_FAKE_JSON) i stället för
# att fråga GitHub — testet ska pröva grindens logik, inte nätverket, och ska
# kunna köra i CI utan issues-läsrättigheter. Samma rigg-mönster som
# scripts/test-check-obesvarade-larm.sh.
#
# Körs: bash scripts/test-check-nattvakt-dedup.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND="${SCRIPT_DIR}/check-nattvakt-dedup.sh"

ANTAL=0
FEL=0

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

POLICY="${TMP}/policy.conf"
cat >"${POLICY}" <<'CONF'
NATTVAKT_DEDUP_ETIKETT="ci-natt"
NATTVAKT_DEDUP_FONSTER_TIMMAR=26
CONF

# iso <timmar-sedan> — samma helper som test-check-obesvarade-larm.sh.
iso() {
    local nu
    nu="$(date +%s)"
    date -u -r "$((nu - $1 * 3600))" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
        || date -u -d "$1 hours ago" +%Y-%m-%dT%H:%M:%SZ
}

# arenden <fil> <json>
arenden() { printf '%s' "$2" >"$1"; }

kor() {
    local json_fil="$1" policy="${2:-${POLICY}}" repo="${3:-}" kod=0
    REPO="${repo}" NATTVAKT_DEDUP_POLICY="${policy}" NATTVAKT_DEDUP_FAKE_JSON="${json_fil}" \
        bash "${GRIND}" >/dev/null 2>&1 || kod=$?
    case "${kod}" in
        0) printf 'DEDUP' ;;
        1) printf 'LARMA' ;;
        2) printf 'ANROPSFEL' ;;
        *) printf 'OKAND-%s' "${kod}" ;;
    esac
}

forvanta() {
    local vantat="$1" desc="$2" json_fil="$3" policy="${4:-${POLICY}}"
    ANTAL=$((ANTAL + 1))
    local faktiskt
    faktiskt="$(kor "${json_fil}" "${policy}")"
    if [[ "${faktiskt}" == "${vantat}" ]]; then
        printf '  ✅ %-64s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-64s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ Nattvaktens dedup-beslut — tvåsidigt bevis (TASK-180) ═══"
echo

echo "SIDA 1 — genuint obesvarat ska LARMA"

F="${TMP}/a1.json"
arenden "${F}" "[]"
forvanta LARMA "inga ci-natt-ärenden alls (tom mängd)" "${F}"

F="${TMP}/a2.json"
T1="$(iso 4)"
arenden "${F}" "[{\"number\":900,\"state\":\"CLOSED\",\"closedAt\":\"${T1}\",\"comments\":[]}]"
forvanta LARMA "stängt 4 h sedan UTAN kommentar — bryter stängningsregeln, räknas inte" "${F}"

F="${TMP}/a3.json"
T2="$(iso 40)"
arenden "${F}" "[{\"number\":901,\"state\":\"CLOSED\",\"closedAt\":\"${T2}\",\"comments\":[{\"body\":\"motivering\"}]}]"
forvanta LARMA "stängt MED motivering men 40 h sedan — utanför 26 h-fönstret" "${F}"

F="${TMP}/a4.json"
T3="$(iso 5)"
T4="$(iso 200)"
arenden "${F}" "[{\"number\":902,\"state\":\"CLOSED\",\"closedAt\":\"${T3}\",\"comments\":[]},{\"number\":903,\"state\":\"CLOSED\",\"closedAt\":\"${T4}\",\"comments\":[{\"body\":\"gammal motivering\"}]}]"
forvanta LARMA "blandat: färskt-utan-kommentar + gammalt-med-kommentar — inget täcker" "${F}"

echo
echo "SIDA 2 — täckt avvikelse ska INTE larma (DEDUP)"

F="${TMP}/b1.json"
arenden "${F}" "[{\"number\":1000,\"state\":\"OPEN\",\"closedAt\":null,\"comments\":[]}]"
forvanta DEDUP "öppet ärende dedupar alltid, oavsett kommentarer (oförändrat beteende)" "${F}"

F="${TMP}/b2.json"
T5="$(iso 3)"
arenden "${F}" "[{\"number\":1028,\"state\":\"CLOSED\",\"closedAt\":\"${T5}\",\"comments\":[{\"body\":\"Rotorsak diagnostiserad (S93 2026-08-09 morgon): enda röda jobbet var Backlog-stängningen ...\"}]}]"
forvanta DEDUP "#1042-scenariot ordagrant: #1028 stängt 3 h sedan MED rotorsaksmotivering" "${F}"

F="${TMP}/b3.json"
T6="$(iso 25)"
arenden "${F}" "[{\"number\":1004,\"state\":\"CLOSED\",\"closedAt\":\"${T6}\",\"comments\":[{\"body\":\"motivering\"},{\"body\":\"uppföljning\"}]}]"
forvanta DEDUP "stängt 25 h sedan (precis innanför 26 h-fönstret) med två kommentarer" "${F}"

F="${TMP}/b4.json"
T7="$(iso 100)"
arenden "${F}" "[{\"number\":1005,\"state\":\"CLOSED\",\"closedAt\":\"${T7}\",\"comments\":[]},{\"number\":1006,\"state\":\"OPEN\",\"closedAt\":null,\"comments\":[]}]"
forvanta DEDUP "blandat: en icke-täckande stängning + ett öppet ärende — det öppna dedupar" "${F}"

echo
echo "SIDA 3 — tystnad får aldrig bli DEDUP"

forvanta ANROPSFEL "svarade INTE (saknad datafil) ⇒ anropsfel, ej dedup" "${TMP}/finns-inte.json"

TRASIG="${TMP}/trasig.json"
printf 'inte json alls' >"${TRASIG}"
forvanta ANROPSFEL "otolkbart svar ⇒ anropsfel, ej dedup" "${TRASIG}"

TOMPOLICY="${TMP}/tom.conf"
printf 'NATTVAKT_DEDUP_ETIKETT=""\nNATTVAKT_DEDUP_FONSTER_TIMMAR=26\n' >"${TOMPOLICY}"
F="${TMP}/c1.json"
arenden "${F}" "[]"
forvanta ANROPSFEL "policyn saknar etikett ⇒ anropsfel, ej tyst larma" "${F}" "${TOMPOLICY}"

BADPOLICY="${TMP}/bad.conf"
printf 'NATTVAKT_DEDUP_ETIKETT="ci-natt"\nNATTVAKT_DEDUP_FONSTER_TIMMAR="inte-ett-tal"\n' >"${BADPOLICY}"
forvanta ANROPSFEL "ogiltigt fönstervärde ⇒ anropsfel, ej tyst larma" "${F}" "${BADPOLICY}"

SAKNAD_POLICY="${TMP}/saknas-inte-skapad.conf"
forvanta ANROPSFEL "saknad policyfil ⇒ anropsfel" "${F}" "${SAKNAD_POLICY}"

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
