#!/usr/bin/env bash
# scripts/test-post-merge-attribution.sh
#
# Empirisk test-svit för scripts/post-merge-attribution.sh (TASK-334).
#
# 25 testfall — båda riktningarna för varje gren i attributionen.
#
# ATTRIBUTIONEN (A1-A10, A14-A15, A17-A18):
#   A1  ankaret grönt, noll omätta landningar däremellan → "primära misstänkta"
#   A2  ankaret grönt, TRE hoppade däremellan            → NEKAR primär misstanke
#   A3  ankaret rött, noll däremellan                    → "ÄLDRE"
#   A4  ankaret rött, TVÅ hoppade däremellan             → "ÄLDRE" + räkning
#   A5  ingen tidigare körning alls                      → "Ingen tidigare"
#   A6  `gh run list` fallerar                           → OKÄND
#   A7  `gh run view` fallerar på en kandidat            → OKÄND (fail-closed)
#   A8  varje tidigare körning hoppade sviten            → OKÄND, ej gissning
#   A9  en NYARE körning ligger ovanför oss i listan     → den IGNORERAS
#   A10 saknad/ogiltig env (REPO / RUN_ID / SHA)         → OKÄND, exit 0
#   A14 körning utan svit-jobb alls (ingen dom)          → räknas som omätt
#   A15 spann-texten bär `<ankare>..<denna>`
#   A17 MAX_JOBBFRAGOR-taket respekteras
#   A18 frågans form: --workflow/--branch main/--event push
#   A19 de två taken (MAX_KORNINGAR / MAX_JOBBFRAGOR) är LIKA
#
# KOPPLINGS- OCH WIRINGSGRINDARNA (A11-A13):
#   A11 POST_MERGE_SUITE_JOB_NAME == post-merge.yml:s `suite`-jobbnamn
#   A12 post-merge.yml anropar faktiskt skriptet
#   A13 den FALSKA meningen är borta ur post-merge.yml (ADR-083-vakten)
#
# ═══ A2 ÄR TVÅSIDIGHETSBEVISET ═══
# Det är exakt det skarpa fall som mättes 2026-08-28: ankaret var grönt, men
# fyra docs-landningar däremellan hade hoppat sviten, och larmet skrev ändå
# "den här landningen är den primära misstänkta" (ärenden #2043 och #2047,
# körningar 33139629247 och 33140227702). Mot den GAMLA inline-logiken i
# post-merge.yml — som läste föregående körnings WORKFLOW-conclusion — hade A2
# gett den falska meningen. Mot skriptet ger den ett nekande.
#
# ═══ A13 ÄR ADR-083-VAKTEN ═══
# Fixen är värdelös om någon återinför den gamla meningen i workflow-filen.
# A13 hävdar att strängen "är den primära misstänkta. Revert nedan" INTE står
# någonstans i post-merge.yml — den ska produceras av skriptet, som bara
# skriver den när den är sann, aldrig hårdkodas i YAML.
#
# ═══ STUBBENS GRÄNS (ärvd lärdom, test-classify-post-merge.sh) ═══
# En grön stubbsvit bevisar LOGIKEN, inte att den möter verkligheten. Stubben
# svarar med JSON i körnings-API:ts FAKTISKA form (`gh run list --json
# databaseId,headSha,conclusion,status` respektive `gh run view --json jobs`),
# och skriptets egna jq-uttryck körs genom riktiga jq mot den. Formen är
# dessutom avläst ur elva skarpa post-merge-körningar 2026-08-28 (se skriptets
# § VARFÖR SKRIPTET FINNS för listan).
#
# Test-isolering: /tmp/task334-test-attribution/ med en gh-stub på PATH.
# Återställer via trap. INGEN nätverkstrafik, inget riktigt gh-anrop.
#
# Användning: bash scripts/test-post-merge-attribution.sh
# Exit 0 om alla testfall passerar. Exit 1 om något failar.
#
# Källa: backlog TASK-334 · ADR-039 § lesson→grind (L43) · ADR-083
# Etablerad: Session 112 (2026-08-28)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/task334-test-attribution"
GATE_SRC="${REPO_ROOT}/scripts/post-merge-attribution.sh"
POST_MERGE_YML="${REPO_ROOT}/.github/workflows/post-merge.yml"

DENNA_RUN_ID="9000"
DENNA_SHA="ffffffffffffffffffffffffffffffffffffffff"

# Den FALSKA meningen — hårdkodad här med avsikt, som A13:s mätsticka.
FALSK_MENING="är den primära misstänkta. Revert nedan"

PASSED=0
FAILED=0

UT=""
KOD=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/bin"
    cp "${GATE_SRC}" "${TEST_DIR}/attribution.sh"
    chmod +x "${TEST_DIR}/attribution.sh"

    # gh-stub. Scenariot styrs av miljövariabler:
    #   GH_RUNLIST_JSON   svar på `gh run list … --json databaseId,headSha,…`
    #   GH_RUNVIEWS_JSON  map <databaseId som sträng> → `{"jobs":[…]}`
    #   GH_FAIL_ON        "runlist" | "runview:<id>"
    #   GH_CALL_LOG       fil dit varje anrops argument loggas
    #
    # En körning som saknas i GH_RUNVIEWS_JSON ger exit 1, precis som gh gör
    # mot ett 404 — så ett scenario kan inte råka lyckas på en tom map.
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail

printf '%s\n' "$*" >> "${GH_CALL_LOG:-/dev/null}"

fail_on="${GH_FAIL_ON:-}"

case "${1:-}" in
    run)
        case "${2:-}" in
            list)
                [[ "${fail_on}" == "runlist" ]] && exit 1
                printf '%s' "${GH_RUNLIST_JSON:-[]}"
                exit 0
                ;;
            view)
                id="${3:-}"
                [[ "${fail_on}" == "runview:${id}" ]] && exit 1
                svar=$(printf '%s' "${GH_RUNVIEWS_JSON:-{\}}" | jq -c --arg id "${id}" '.[$id] // empty')
                if [[ -z "${svar}" ]]; then
                    exit 1
                fi
                printf '%s' "${svar}"
                exit 0
                ;;
            *)
                exit 1
                ;;
        esac
        ;;
    *)
        exit 1
        ;;
esac
STUB
    chmod +x "${TEST_DIR}/bin/gh"
}

# Jobbformerna, avlästa ur elva skarpa post-merge-körningar 2026-08-28.
# Utfallet var binärt utan undantag: ETT jobb med EXAKT svit-jobbets namn och
# conclusion `skipped`, ELLER inner-jobb prefixade "<namn> / ". Aldrig blandat.
#
# VARIABLER, INTE FUNKTIONER: `jq --argjson x "$(funktion)"` fäller SC2312 i
# strict-läget (kommandosubstitution som argument maskerar returvärdet). En
# enkel tilldelning gör inte det.
#
# OBS: en kommentarrad får inte INLEDAS med ordet "shellcheck" — då tolkas den
# som ett direktiv och faller på SC1073. Mätt vid bygget av denna fil.
SVIT="Verifierande svit på det mergade trädet"
KLASSNING='{"name":"Ärvd klassning — körde PR-grinden sviten?","conclusion":"success"}'

JOBB_HOPPAD=$(printf '{"jobs":[%s,{"name":"%s","conclusion":"skipped"}]}' "${KLASSNING}" "${SVIT}")
JOBB_KORD_GRONT=$(printf '{"jobs":[%s,{"name":"%s / Pure + Build","conclusion":"success"},{"name":"%s / Staging (API + E2E)","conclusion":"success"}]}' "${KLASSNING}" "${SVIT}" "${SVIT}")
JOBB_KORD_ROTT=$(printf '{"jobs":[%s,{"name":"%s / Pure + Build","conclusion":"success"},{"name":"%s / Staging (API + E2E)","conclusion":"failure"}]}' "${KLASSNING}" "${SVIT}" "${SVIT}")
JOBB_INGEN_DOM='{"jobs":[{"name":"Ärvd klassning — körde PR-grinden sviten?","conclusion":"cancelled"}]}'

scenario_defaults() {
    export GH_RUNLIST_JSON='[]'
    export GH_RUNVIEWS_JSON='{}'
    export GH_FAIL_ON=""
    export GH_CALL_LOG="${TEST_DIR}/calls.log"
    : > "${GH_CALL_LOG}"
    unset MAX_JOBBFRAGOR 2>/dev/null || true
}

# kor [REPO] [RUN_ID] [SHA] — kör attributionen under stubben.
kor() {
    local r="${1-ett/repo}" rid="${2-${DENNA_RUN_ID}}" sha="${3-${DENNA_SHA}}"
    UT=$(PATH="${TEST_DIR}/bin:${PATH}" REPO="${r}" RUN_ID="${rid}" SHA="${sha}" \
        MAX_JOBBFRAGOR="${MAX_JOBBFRAGOR:-20}" \
        bash "${TEST_DIR}/attribution.sh" 2>/dev/null)
    KOD=$?
}

pass() {
    echo "  ✅ $1"
    PASSED=$(( PASSED + 1 ))
}

fel() {
    echo "  ❌ $1"
    FAILED=$(( FAILED + 1 ))
}

# hav <namn> <substräng> — texten MÅSTE innehålla substrängen.
hav() {
    if [[ "${UT}" == *"$2"* ]]; then
        pass "$1"
    else
        fel "$1 — saknade '$2'"
        echo "     utdata: ${UT}"
    fi
}

# hav_ej <namn> <substräng> — texten får INTE innehålla substrängen.
hav_ej() {
    if [[ "${UT}" != *"$2"* ]]; then
        pass "$1"
    else
        fel "$1 — texten bar '$2' som den inte får bära"
        echo "     utdata: ${UT}"
    fi
}

exit_noll() {
    if [[ "${KOD}" -eq 0 ]]; then
        pass "$1 (exit 0 — larmet överlever)"
    else
        fel "$1 gav exit ${KOD}; skriptet MÅSTE alltid returnera 0, annars dödas larm-steget"
    fi
}

echo "── scripts/post-merge-attribution.sh — testsvit ──"
setup

# --- A1: ankaret grönt, noll däremellan --------------------------------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"success\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn --argjson a "${JOBB_KORD_GRONT}" '{"1001": $a}')
export GH_RUNVIEWS_JSON
kor
hav "A1 ankaret grönt utan mellanled ⇒ primär misstanke" "den här landningen är den primära misstänkta"
exit_noll "A1"

# --- A2: ankaret grönt, TRE hoppade däremellan (KORTETS FALL) ----------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1004,\"headSha\":\"4444444444444444444444444444444444444444\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1003,\"headSha\":\"3333333333333333333333333333333333333333\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1002,\"headSha\":\"2222222222222222222222222222222222222222\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"success\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn \
    --argjson h "${JOBB_HOPPAD}" --argjson g "${JOBB_KORD_GRONT}" \
    '{"1004": $h, "1003": $h, "1002": $h, "1001": $g}')
export GH_RUNVIEWS_JSON
kor
hav_ej "A2 NEKAR den falska meningen" "${FALSK_MENING}"
hav "A2 säger uttryckligen att landningen INTE är primärt misstänkt" "**INTE** den primära misstänkta"
hav "A2 räknar de omätta landningarna" "3 landning(ar) passerat utan att sviten mätte dem"
hav "A2 namnger orsaken (ärvd D0)" "ärvd \`D0\`"
hav "A2 listar de hoppade landningarna" "Landningar som hoppade sviten däremellan"
hav "A15 spann-texten bär ankare..denna" "git log --oneline 111111111111..ffffffffffff"
exit_noll "A2"

# --- A3: ankaret rött, noll däremellan ---------------------------------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"failure\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn --argjson r "${JOBB_KORD_ROTT}" '{"1001": $r}')
export GH_RUNVIEWS_JSON
kor
hav "A3 ankaret rött ⇒ felet är äldre" "sannolikt ÄLDRE än den här landningen"
hav_ej "A3 påstår aldrig primär misstanke" "${FALSK_MENING}"
exit_noll "A3"

# --- A4: ankaret rött, TVÅ hoppade däremellan --------------------------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1003,\"headSha\":\"3333333333333333333333333333333333333333\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1002,\"headSha\":\"2222222222222222222222222222222222222222\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"failure\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn \
    --argjson h "${JOBB_HOPPAD}" --argjson r "${JOBB_KORD_ROTT}" \
    '{"1003": $h, "1002": $h, "1001": $r}')
export GH_RUNVIEWS_JSON
kor
hav "A4 rött ankare bär också räkningen" "2 landning(ar) passerat utan att sviten mätte dem"
hav "A4 rött ankare ⇒ äldre fel" "Revertera inte reflexmässigt"
exit_noll "A4"

# --- A5: ingen tidigare körning ----------------------------------------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"}]"
kor
hav "A5 första körningen någonsin" "Ingen tidigare post-merge-körning"
exit_noll "A5"

# --- A6: run list-fel → OKÄND ------------------------------------------------
scenario_defaults
export GH_FAIL_ON="runlist"
kor
hav "A6 körnings-API-fel ⇒ OKÄND" "**OKÄND**"
hav "A6 säger uttryckligen att det INTE är ett påstående" "INTE ett påstående om historiken"
exit_noll "A6"

# --- A7: run view-fel på en kandidat → OKÄND (fail-closed) -------------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"success\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn --argjson g "${JOBB_KORD_GRONT}" '{"1001": $g}')
export GH_RUNVIEWS_JSON
export GH_FAIL_ON="runview:1001"
kor
hav "A7 jobblist-fel ⇒ OKÄND, aldrig en gissning" "**OKÄND**"
exit_noll "A7"

# --- A8: alla tidigare körningar hoppade sviten ------------------------------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1002,\"headSha\":\"2222222222222222222222222222222222222222\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"success\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn --argjson h "${JOBB_HOPPAD}" '{"1002": $h, "1001": $h}')
export GH_RUNVIEWS_JSON
kor
hav "A8 ingen mätning i fönstret ⇒ OKÄND" "ingen av de 2 närmast föregående"
hav_ej "A8 påstår aldrig primär misstanke" "${FALSK_MENING}"
exit_noll "A8"

# --- A9: en NYARE körning ovanför oss ignoreras ------------------------------
# Larmet kan köra medan en parallell landning redan lagt en nyare körning i
# listan. Den gamla inline-formen (`select(.databaseId != RUN_ID) | .[0]`)
# hade plockat DEN och kallat den "föregående". Här är den nyare GRÖN och den
# äldre RÖD: väljs fel post blir svaret "primär misstanke" i stället för
# "äldre fel".
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":2001,\"headSha\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"failure\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn \
    --argjson g "${JOBB_KORD_GRONT}" --argjson r "${JOBB_KORD_ROTT}" \
    '{"2001": $g, "1001": $r}')
export GH_RUNVIEWS_JSON
kor
hav "A9 nyare körning ignoreras — ankaret är den ÄLDRE" "körning 1001"
hav "A9 utfallet blir 'äldre fel', inte primär misstanke" "sannolikt ÄLDRE"
if grep -q "run view 2001" "${GH_CALL_LOG}"; then
    fel "A9 skriptet frågade den NYARE körningen 2001 — listan skärs inte vid eget index"
else
    pass "A9 den nyare körningen frågades aldrig"
fi
exit_noll "A9"

# --- A10: saknad/ogiltig env → OKÄND, aldrig icke-noll -----------------------
scenario_defaults
kor "" "${DENNA_RUN_ID}" "${DENNA_SHA}"
hav "A10a saknad REPO ⇒ OKÄND" "**OKÄND**"
exit_noll "A10a"

scenario_defaults
kor "ett/repo" "inte-ett-tal" "${DENNA_SHA}"
hav "A10b ogiltig RUN_ID ⇒ OKÄND" "**OKÄND**"
exit_noll "A10b"

scenario_defaults
kor "ett/repo" "${DENNA_RUN_ID}" ""
hav "A10c saknad SHA ⇒ OKÄND" "**OKÄND**"
exit_noll "A10c"

# --- A14: körning utan svit-jobb alls räknas som omätt, inte som ankare ------
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1002,\"headSha\":\"2222222222222222222222222222222222222222\",\"conclusion\":\"cancelled\",\"status\":\"completed\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"success\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn \
    --argjson d "${JOBB_INGEN_DOM}" --argjson g "${JOBB_KORD_GRONT}" \
    '{"1002": $d, "1001": $g}')
export GH_RUNVIEWS_JSON
kor
hav "A14 utebliven dom räknas som omätt landning" "1 landning(ar) passerat utan att sviten mätte dem"
hav "A14 och särskiljs från ett D0-hopp" "ingen dom: avbruten eller oväntad form"
hav_ej "A14 nekar primär misstanke" "${FALSK_MENING}"
exit_noll "A14"

# --- A17: MAX_JOBBFRAGOR-taket respekteras -----------------------------------
# Utan tak kan larm-steget spendera obegränsat med `gh run view`-anrop på en
# lång docs-svit. Med taket blir svaret OKÄND i stället — ärligt, inte gissat.
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"},{\"databaseId\":1003,\"headSha\":\"3333333333333333333333333333333333333333\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1002,\"headSha\":\"2222222222222222222222222222222222222222\",\"conclusion\":\"success\",\"status\":\"completed\"},{\"databaseId\":1001,\"headSha\":\"1111111111111111111111111111111111111111\",\"conclusion\":\"success\",\"status\":\"completed\"}]"
GH_RUNVIEWS_JSON=$(jq -cn \
    --argjson h "${JOBB_HOPPAD}" --argjson g "${JOBB_KORD_GRONT}" \
    '{"1003": $h, "1002": $h, "1001": $g}')
export GH_RUNVIEWS_JSON
MAX_JOBBFRAGOR=2 kor
hav "A17 taket stoppar vandringen och svarar OKÄND" "ingen av de 2 närmast föregående"
unset MAX_JOBBFRAGOR
exit_noll "A17"

# --- A18: frågans form -------------------------------------------------------
# Utan `--event push` blandas workflow_dispatch-körningar in; utan `--branch
# main` läses andra grenars körningar. Båda hade gett en attribution byggd på
# fel population.
scenario_defaults
export GH_RUNLIST_JSON="[{\"databaseId\":${DENNA_RUN_ID},\"headSha\":\"${DENNA_SHA}\",\"conclusion\":null,\"status\":\"in_progress\"}]"
kor
if grep -q -- "--event push" "${GH_CALL_LOG}"; then
    pass "A18a run list frågar med --event push"
else
    fel "A18a run list saknar --event push — dispatch-körningar blandas in"
fi
if grep -q -- "--branch main" "${GH_CALL_LOG}"; then
    pass "A18b run list frågar med --branch main"
else
    fel "A18b run list saknar --branch main"
fi
if grep -q -- "--workflow post-merge.yml" "${GH_CALL_LOG}"; then
    pass "A18c run list frågar post-merge.yml"
else
    fel "A18c run list frågar inte post-merge.yml"
fi

# --- A19: de två taken är lika -----------------------------------------------
# Listan bär alltid vår EGEN körning, så efter skärningen vid eget index finns
# som mest MAX_KORNINGAR-1 kandidater. Är taken lika kan jobbfråge-taket därför
# aldrig bli det bindande, och läget "OKÄND trots outforskade kandidater"
# existerar inte. Glider de isär återuppstår det tyst — därför grindas det.
# (Granskningsfynd, PR #2059 runda 2: värdena var 30 respektive 20.)
tak_korningar=$(sed -n 's/^MAX_KORNINGAR=.*:-\([0-9][0-9]*\)}"$/\1/p' "${GATE_SRC}" | head -1)
tak_fragor=$(sed -n 's/^MAX_JOBBFRAGOR=.*:-\([0-9][0-9]*\)}"$/\1/p' "${GATE_SRC}" | head -1)

if [[ -z "${tak_korningar}" || -z "${tak_fragor}" ]]; then
    fel "A19 kunde inte läsa de två takens defaultvärden ur ${GATE_SRC}"
elif [[ "${tak_korningar}" == "${tak_fragor}" ]]; then
    pass "A19 MAX_KORNINGAR == MAX_JOBBFRAGOR (${tak_korningar}) — jobbfråge-taket kan aldrig bli bindande"
else
    fel "A19 TAKEN HAR GLIDIT ISÄR: MAX_KORNINGAR=${tak_korningar}, MAX_JOBBFRAGOR=${tak_fragor}."
    echo "     Vid ${tak_fragor}-${tak_korningar} hoppade körningar i rad svarar skriptet OKÄND trots"
    echo "     outforskade kandidater. Höj BÅDA eller ingen."
fi

# --- A11-A13: KOPPLINGS- OCH WIRINGSGRINDARNA --------------------------------
echo "── A11-A13: kopplingen till post-merge.yml ──"

skript_namn=$(sed -n 's/^POST_MERGE_SUITE_JOB_NAME="\(.*\)"$/\1/p' "${GATE_SRC}" | head -1)
yml_namn=$(awk '/^  suite:/{f=1;next} f&&/^    name: /{sub(/^    name: /,"");print;exit}' "${POST_MERGE_YML}")

if [[ -z "${skript_namn}" ]]; then
    fel "A11 kunde inte läsa POST_MERGE_SUITE_JOB_NAME ur ${GATE_SRC}"
elif [[ -z "${yml_namn}" ]]; then
    fel "A11 kunde inte läsa suite-jobbets name: ur post-merge.yml"
elif [[ "${skript_namn}" == "${yml_namn}" ]]; then
    pass "A11 POST_MERGE_SUITE_JOB_NAME ('${skript_namn}') == post-merge.yml:s suite-jobbnamn"
else
    fel "A11 KOPPLINGSDRIFT: skriptet säger '${skript_namn}', post-merge.yml:s suite-jobb heter '${yml_namn}'."
    echo "     Fix: uppdatera POST_MERGE_SUITE_JOB_NAME i ${GATE_SRC}."
fi

# Ankrat på ett faktiskt anrop, inte på filnamnet som substräng — samma fälla
# som test-classify-post-merge.sh T13b mätte: filhuvudet nämner testsvitens
# namn, vilket bär samma substräng, så en lösare grep hade varit grön även med
# anropet borttaget.
if grep -qE 'bash scripts/post-merge-attribution\.sh' "${POST_MERGE_YML}"; then
    pass "A12 post-merge.yml anropar faktiskt post-merge-attribution.sh"
else
    fel "A12 post-merge.yml har inget anrop av scripts/post-merge-attribution.sh — attributionen är frånkopplad."
fi

if grep -qF "${FALSK_MENING}" "${POST_MERGE_YML}"; then
    fel "A13 ADR-083-VAKTEN FÄLLER: post-merge.yml bär åter den hårdkodade meningen '${FALSK_MENING}'."
    echo "     Meningen får bara produceras av skriptet, som skriver den ENDAST när den är sann."
else
    pass "A13 den falska meningen är borta ur post-merge.yml"
fi

echo ""
echo "── Resultat: ${PASSED} passerade, ${FAILED} failade ──"
if [[ "${FAILED}" -gt 0 ]]; then
    exit 1
fi
exit 0
