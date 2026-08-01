#!/usr/bin/env bash
# scripts/test-stop-vakt.sh
#
# Empirisk test-suite för scripts/stop-vakt.sh (Stop/SubagentStop-vakten,
# TASK-113 / ADR-087). Payload-formerna är tagna ur research-passets FAKTISKT
# UPPMÄTTA hook-indata (docs/research/obevakade-tillstand-vaktens-form-
# 2026-07-30.md § mätning 2 och 4), inte ur antagen dokumentation.
#
# 16 testfall i fyra grupper:
#   Tvåsidigt bevis  — T1 planterat väntepåstående-fel FÄLLS, T2 korrekt
#                      avslut GRÖNT (paret är AC #6:s kärna)
#   Bärande mekanik  — T3 körande bakgrundsjobb bär, T4 completed bär INTE,
#                      T5 stop_hook_active=true släpps igenom (AC #3),
#                      T6 VÄNTLÄGE-deklaration bär, T7 motparts-väntan är
#                      undantag, T8 undantag strippas — inte global frisläppning,
#                      T9 engelskt väntepåstående fälls, T10 SubagentStop
#                      samma logik, T11 tomt meddelande släpps
#   Fail-closed      — T12 trasig stdin blockerar, T13 trasig stdin MED
#                      stop_hook_active=true släpps (degraderad läsning),
#                      T14 saknad policyfil blockerar, T15 ogiltig policy
#                      blockerar
#   Kontraktsrenhet  — T16 tillåt-vägen skriver EXAKT 0 byte på stdout
#                      (stdout är hook-beslutet; brus kan tolkas som beslut)
#
# Test-isolering: egen katalog under /tmp med kort-ID i namnet (delad
# scratchpad-namnrymd — två agenter har mätt fått samma sökväg 2026-07-30).
# Rör aldrig repo-rotens policyfil: STOP_VAKT_POLICY pekas om per fall.
#
# Användning: bash scripts/test-stop-vakt.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Etablerad: TASK-113 (2026-08-01).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${0}")/.." && pwd)"
TEST_DIR="/tmp/task-113-test-stop-vakt"
SRC="${REPO_ROOT}/scripts/stop-vakt.sh"
POLICY_SKARP="${REPO_ROOT}/.stop-vakt-policy.json"

PASSED=0
FAILED=0
EC=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}"
    cp "${POLICY_SKARP}" "${TEST_DIR}/policy.json"
}

# payload <event> <stop_hook_active> <meddelande-json-str> <background_tasks-json>
# Fältformen speglar mätning 2/4: hook_event_name, stop_hook_active,
# last_assistant_message, background_tasks.
payload() {
    printf '{"session_id":"abcdef12-9999","hook_event_name":"%s","stop_hook_active":%s,"last_assistant_message":%s,"background_tasks":%s}' \
        "${1}" "${2}" "${3}" "${4}"
}

# kor_ra <rå stdin> [policy-sökväg] — kör vakten exakt som harnesset: bytes på
# stdin, beslut på stdout.
kor_ra() {
    local policy="${2:-${TEST_DIR}/policy.json}"
    printf '%s' "${1}" > "${TEST_DIR}/payload.json"
    STOP_VAKT_POLICY="${policy}" \
    STOP_VAKT_LOGG="${TEST_DIR}/vakt.jsonl" \
        bash "${SRC}" \
        < "${TEST_DIR}/payload.json" \
        > "${TEST_DIR}/stdout.txt" \
        2> "${TEST_DIR}/stderr.txt"
    EC=$?
}

check_exit() {
    local label="${1}" forvantat="${2}" faktiskt="${3}"
    if [[ "${faktiskt}" = "${forvantat}" ]]; then
        echo "  ✅ ${label}: exit=${faktiskt}"
        return 0
    fi
    echo "  ❌ ${label}: exit=${faktiskt} (förväntat ${forvantat})"
    return 1
}

# check_block <label> — stdout ska vara giltig JSON med decision=block.
check_block() {
    local label="${1}"
    local beslut
    beslut="$(jq -r '.decision // ""' "${TEST_DIR}/stdout.txt" 2> /dev/null || true)"
    if [[ "${beslut}" = "block" ]]; then
        echo "  ✅ ${label}: decision=block"
        return 0
    fi
    echo "  ❌ ${label}: decision='${beslut}' (förväntat block)"
    cat "${TEST_DIR}/stdout.txt"
    return 1
}

# check_reason <label> <delsträng> — reason ska bära avstämningens resultat.
check_reason() {
    local label="${1}" del="${2}"
    local reason
    reason="$(jq -r '.reason // ""' "${TEST_DIR}/stdout.txt" 2> /dev/null || true)"
    if [[ "${reason}" == *"${del}"* ]]; then
        echo "  ✅ ${label}: reason bär '${del}'"
        return 0
    fi
    echo "  ❌ ${label}: reason saknar '${del}'"
    echo "     reason: ${reason}"
    return 1
}

# check_tillat <label> — tillåt = EXAKT 0 byte stdout (kontraktsrenhet).
check_tillat() {
    local label="${1}"
    local storlek
    storlek="$(wc -c < "${TEST_DIR}/stdout.txt" 2> /dev/null || true)"
    if [[ "${storlek// /}" = "0" ]]; then
        echo "  ✅ ${label}: stdout tom — avslutet släpps igenom"
        return 0
    fi
    echo "  ❌ ${label}: stdout var ${storlek} byte (förväntat 0 = tillåt)"
    cat "${TEST_DIR}/stdout.txt"
    return 1
}

# check_logg <label> <beslut> <skäl> — sista loggradens beslut+skäl.
check_logg() {
    local label="${1}" beslut="${2}" skal="${3}"
    local rad f_beslut f_skal
    rad="$(tail -n 1 "${TEST_DIR}/vakt.jsonl" 2> /dev/null || true)"
    f_beslut="$(jq -r '.beslut // ""' <<< "${rad}" 2> /dev/null || true)"
    f_skal="$(jq -r '.skal // ""' <<< "${rad}" 2> /dev/null || true)"
    if [[ "${f_beslut}" = "${beslut}" && "${f_skal}" = "${skal}" ]]; then
        echo "  ✅ ${label}: logg ${f_beslut}/${f_skal}"
        return 0
    fi
    echo "  ❌ ${label}: logg ${f_beslut}/${f_skal} (förväntat ${beslut}/${skal})"
    return 1
}

mark() {
    if [[ "${1}" -eq 0 ]]; then
        PASSED=$((PASSED + 1)); echo "  → PASS"
    else
        FAILED=$((FAILED + 1)); echo "  → FAIL"
    fi
}

# ============================================================
echo "═══ T1: RÖD SIDA — väntepåstående utan buren mekanism FÄLLS ═══"
# Planterat känt fel: exakt T108-empirins form ("väntar på att #439 landar")
# med tom background_tasks — påståendet bärs av ingenting.
setup
RA="$(payload "Stop" "false" '"PR #439 är armerad. Jag väntar på att #439 landar och rapporterar sedan."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T1" 0 "${EC}" || ok=1
check_block "T1" || ok=1
check_reason "T1" "0 körande" || ok=1
check_reason "T1" "background_tasks" || ok=1
check_reason "T1" "T112" || ok=1
check_logg "T1" "blockera" "obevakad_vantan" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: GRÖN SIDA — korrekt avslut utan väntepåstående släpps ═══"
setup
RA="$(payload "Stop" "false" '"KLAR — PR #518 skapad, alla grindar gröna, kortets AC bockade."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T2" 0 "${EC}" || ok=1
check_tillat "T2" || ok=1
check_logg "T2" "tillat" "inget_vantepastaende" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: körande bakgrundsjobb BÄR väntepåståendet → släpps ═══"
# background_tasks-formen är mätning 4:s faktiska: id/type/status/description.
setup
RA="$(payload "Stop" "false" '"Jag bevakar CI via vakten i bakgrunden."' '[{"id":"bj9bkiu6o","type":"shell","status":"running","description":"ci-wait","command":"bash scripts/ci-wait.sh --pr 518"}]')"
kor_ra "${RA}"
ok=0
check_exit "T3" 0 "${EC}" || ok=1
check_tillat "T3" || ok=1
check_logg "T3" "tillat" "buret_av_bakgrundsjobb" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: completed-jobb bär INTE (T112: fullbordan väckte ingen) ═══"
setup
RA="$(payload "Stop" "false" '"Jag bevakar CI via vakten i bakgrunden."' '[{"id":"x","type":"shell","status":"completed","description":"ci-wait","command":"c"}]')"
kor_ra "${RA}"
ok=0
check_exit "T4" 0 "${EC}" || ok=1
check_block "T4" || ok=1
check_reason "T4" "1 post(er), varav 0 körande" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T5: stop_hook_active=true → genomsläpp FÖRE all prövning (AC #3) ═══"
setup
RA="$(payload "Stop" "true" '"Jag väntar på att #439 landar."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T5" 0 "${EC}" || ok=1
check_tillat "T5" || ok=1
check_logg "T5" "tillat" "stop_hook_active" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T6: VÄNTLÄGE-deklaration gör väntan explicit → släpps ═══"
setup
RA="$(payload "Stop" "false" '"Arbetet står tills kön öppnar.\nVÄNTLÄGE: orkestrerarens SendMessage väcker mig; verifikat hämtas vid väckning."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T6" 0 "${EC}" || ok=1
check_tillat "T6" || ok=1
check_logg "T6" "tillat" "vantlage_deklarerat" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T7: motparts-väntan (väntar på ditt besked) är undantag → släpps ═══"
setup
RA="$(payload "Stop" "false" '"Två vägar är möjliga. Väntar på ditt besked innan jag fortsätter."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T7" 0 "${EC}" || ok=1
check_tillat "T7" || ok=1
check_logg "T7" "tillat" "inget_vantepastaende" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T8: undantag STRIPPAS — obevakad CI-väntan i samma meddelande fälls ═══"
setup
RA="$(payload "Stop" "false" '"Väntar på ditt besked om scope. Jag bevakar samtidigt CI-utfallet för #520."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T8" 0 "${EC}" || ok=1
check_block "T8" || ok=1
check_logg "T8" "blockera" "obevakad_vantan" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T9: engelskt väntepåstående fälls ═══"
setup
RA="$(payload "Stop" "false" '"Branch pushed. I will wait for the merge queue to pick it up."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T9" 0 "${EC}" || ok=1
check_block "T9" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T10: SubagentStop — samma logik, samma fällning ═══"
setup
RA="$(payload "SubagentStop" "false" '"Inväntar CI-verdiktet för min PR innan jag rapporterar."' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T10" 0 "${EC}" || ok=1
check_block "T10" || ok=1
check_reason "T10" "SubagentStop" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T11: tomt meddelande → inget påstående att pröva → släpps ═══"
setup
RA="$(payload "Stop" "false" '""' '[]')"
kor_ra "${RA}"
ok=0
check_exit "T11" 0 "${EC}" || ok=1
check_tillat "T11" || ok=1
check_logg "T11" "tillat" "tomt_meddelande" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T12: FAIL-CLOSED — trasig stdin blockerar, aldrig tyst släpp (AC #4) ═══"
setup
kor_ra "detta är inte JSON {{{"
ok=0
check_exit "T12" 0 "${EC}" || ok=1
check_block "T12" || ok=1
check_reason "T12" "fail-closed" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T13: trasig stdin MED stop_hook_active:true → degraderad frisläppning ═══"
# Frisläppnings-kontraktet håller även när parsern är trasig — annars hade en
# trasig vakt blockerat varje försök upp till harnessets tak på 8.
setup
kor_ra 'inte JSON men bär "stop_hook_active": true i texten {{{'
ok=0
check_exit "T13" 0 "${EC}" || ok=1
check_tillat "T13" || ok=1
check_logg "T13" "tillat" "stop_hook_active_degraderat" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T14: FAIL-CLOSED — saknad policyfil blockerar med larm ═══"
setup
RA="$(payload "Stop" "false" '"KLAR."' '[]')"
kor_ra "${RA}" "${TEST_DIR}/finns-inte.json"
ok=0
check_exit "T14" 0 "${EC}" || ok=1
check_block "T14" || ok=1
check_reason "T14" "policyfilen saknas" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T15: FAIL-CLOSED — ogiltig policy (fält ej arrayer) blockerar ═══"
setup
printf '{"vantepastaende_monster":"inte en array"}' > "${TEST_DIR}/trasig-policy.json"
RA="$(payload "Stop" "false" '"KLAR."' '[]')"
kor_ra "${RA}" "${TEST_DIR}/trasig-policy.json"
ok=0
check_exit "T15" 0 "${EC}" || ok=1
check_block "T15" || ok=1
check_reason "T15" "ogiltig" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T16: kontraktsrenhet — hela tillåt-kedjan skriver 0 byte stdout ═══"
# Körs mot den SKARPA policyfilen i repo-roten: beviset gäller den fil som
# faktiskt används, inte bara test-kopian.
setup
RA="$(payload "Stop" "false" '"Sammanfattning: tre filer ändrade, grindarna gröna, inget kvarstår."' '[]')"
kor_ra "${RA}" "${POLICY_SKARP}"
ok=0
check_exit "T16" 0 "${EC}" || ok=1
check_tillat "T16" || ok=1
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
