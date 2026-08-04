#!/usr/bin/env bash
# scripts/test-check-obesvarade-larm.sh — tvåsidigt bevis för
# larm-ärende-avstämningen (T119 arbetslista (b), S97).
#
# TVÅSIDIGT: ärenden bortom tröskeln ska FÄLLA, färska ärenden och tom mängd
# ska SLÄPPAS — och ett misslyckat anrop ska ge ANROPSFEL, aldrig grönt.
#
# Det sista fallet är kärnan. Grinden räknar öppna ärenden, och ett `gh`-anrop
# som failar ger tom utdata. En naiv räkning hade läst tomheten som "inga
# ärenden" = grönt, vilket är exakt den fail-open som fällde en CI-vakt vid
# S97:s paus-landning ("ALLA KLARA" beräknat ur en tom lista). Testet skiljer
# därför "svarade tomt" från "svarade inte" och kräver olika utfall.
#
# Riggen matar ärenden ur en JSON-fil (LARM_FAKE_JSON) i stället för att fråga
# GitHub — testet ska pröva grindens logik, inte nätverket, och ska kunna köra
# i CI utan issues-läsrättigheter.
#
# Körs: bash scripts/test-check-obesvarade-larm.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND="${SCRIPT_DIR}/check-obesvarade-larm.sh"

ANTAL=0
FEL=0

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

# Riggens policy speglar produktionsvärdet: ENDAST ci-post-merge bevakas.
# `ci-natt` och `lankrota` är medvetet utelämnade i produktion (loop-risk
# respektive stående-ärende-design, motiverat i .sanningsavstamning-policy.conf)
# — riggen prövar därför att de ignoreras oavsett ålder, vilket är precis det
# beteendet de utelämningarna kräver.
POLICY="${TMP}/policy.conf"
cat > "${POLICY}" <<'CONF'
LARM_ARENDE_TROSKLAR=(
    "ci-post-merge:24"
)
LARM_ARENDE_REPO=""
CONF

# iso <timmar-sedan>
iso() {
    local nu
    nu="$(date +%s)"
    date -u -r "$(( nu - $1 * 3600 ))" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
        || date -u -d "$1 hours ago" +%Y-%m-%dT%H:%M:%SZ
}

# arenden <fil> <json>
arenden() { printf '%s' "$2" > "$1"; }

kor() {
    local json_fil="$1" policy="${2:-${POLICY}}" kod=0
    LARM_POLICY="${policy}" LARM_FAKE_JSON="${json_fil}" bash "${GRIND}" >/dev/null 2>&1 || kod=$?
    case "${kod}" in
        0) printf 'GRON' ;;
        1) printf 'DRIFT' ;;
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
        printf '  ✅ %-56s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-56s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ Larm-ärende-avstämningen — tvåsidigt bevis ═══"
echo

echo "SIDA 1 — obesvarade larm ska FÄLLA"

F="${TMP}/a1.json"
T1_0="$(iso 42)"
arenden "${F}" "[{\"number\":616,\"title\":\"Post-merge rott pa main\",\"createdAt\":\"${T1_0}\",\"labels\":[\"ci-post-merge\"]}]"
forvanta DRIFT "#616-fallet: 42 h öppet mot tröskel 24 h" "${F}"

F="${TMP}/a2.json"
T2_0="$(iso 72)"
arenden "${F}" "[{\"number\":700,\"title\":\"Rod natt\",\"createdAt\":\"${T2_0}\",\"labels\":[\"ci-natt\"]}]"
forvanta GRON "ci-natt bevakas INTE här (loop-risk, se policyn)" "${F}"

F="${TMP}/a3.json"
T3_0="$(iso 100)"
T3_1="$(iso 2)"
arenden "${F}" "[{\"number\":1,\"title\":\"gammal\",\"createdAt\":\"${T3_0}\",\"labels\":[\"ci-post-merge\"]},{\"number\":2,\"title\":\"farsk\",\"createdAt\":\"${T3_1}\",\"labels\":[\"ci-post-merge\"]}]"
forvanta DRIFT "blandat: en gammal fäller trots att en är färsk" "${F}"

echo
echo "SIDA 2 — färska larm och tom mängd ska SLÄPPAS"

F="${TMP}/b1.json"
arenden "${F}" "[]"
forvanta GRON "tom mängd (giltigt svar) är grönt" "${F}"

F="${TMP}/b2.json"
T4_0="$(iso 3)"
arenden "${F}" "[{\"number\":800,\"title\":\"nyss\",\"createdAt\":\"${T4_0}\",\"labels\":[\"ci-post-merge\"]}]"
forvanta GRON "färskt ärende inom tröskeln fäller inte" "${F}"

F="${TMP}/b3.json"
T5_0="$(iso 30)"
arenden "${F}" "[{\"number\":801,\"title\":\"natt-arende 30h\",\"createdAt\":\"${T5_0}\",\"labels\":[\"ci-natt\"]}]"
forvanta GRON "ci-natt rör aldrig utfallet, oavsett ålder" "${F}"

F="${TMP}/b4.json"
T6_0="$(iso 500)"
arenden "${F}" "[{\"number\":900,\"title\":\"standande lankrota\",\"createdAt\":\"${T6_0}\",\"labels\":[\"lankrota\"]}]"
forvanta GRON "lankrota är MEDVETET utanför bevakningen (ADR-082)" "${F}"

echo
echo "SIDA 3 — tystnad får aldrig bli grönt"

forvanta ANROPSFEL "svarade INTE (saknad datafil) ⇒ anropsfel, ej grönt" "${TMP}/finns-inte.json"

TRASIG="${TMP}/trasig.json"
printf 'inte json alls' > "${TRASIG}"
forvanta ANROPSFEL "otolkbart svar ⇒ anropsfel, ej grönt" "${TRASIG}"

TOMPOLICY="${TMP}/tom.conf"
printf 'LARM_ARENDE_TROSKLAR=()\n' > "${TOMPOLICY}"
F="${TMP}/c1.json"; arenden "${F}" "[]"
forvanta ANROPSFEL "tom tröskel-lista ⇒ anropsfel, ej 'inget att bevaka'" "${F}" "${TOMPOLICY}"

BADPOLICY="${TMP}/bad.conf"
printf 'LARM_ARENDE_TROSKLAR=(\n    "ci-post-merge:inte-ett-tal"\n)\n' > "${BADPOLICY}"
forvanta ANROPSFEL "ogiltig tröskel ⇒ anropsfel, ej tyst hoppa över" "${F}" "${BADPOLICY}"

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
