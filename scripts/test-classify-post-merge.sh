#!/usr/bin/env bash
# scripts/test-classify-post-merge.sh
#
# Empirisk test-suite för scripts/classify-post-merge.sh (TASK-73).
#
# Ett scenario per gren i klassningen, båda riktningarna. Det exakta antalet
# gröna kontroller står i skriptets EGEN slutrad ("── Resultat: N passerade
# ──") — skriv aldrig av ett tal hit för hand (TASK-106-klassen: en kopia
# glider ur synk utan att någon märker det).
#
# VÄG B — PR-ytan (ursprunglig form, TASK-73):
#   T1  docs-landning: `Test suite` skipped i PR-körningen        → true
#   T2  kod-landning: inner-jobb i stället för `Test suite`       → false
#   T3  event != push (dispatch)                                  → false
#   T4  ingen andra förälder (ej merge-commit)                    → false
#   T5  träd-avvikelse merge vs PR-head                           → false
#   T6  commits-API-fel på merge-commiten                         → false
#   T7  commits-API-fel på PR-headen                              → false
#   T8  ingen GRÖN pull_request-körning (bara cancelled)          → false
#   T9  körnings-API-fel (`run list`)                             → false
#   T10 jobblist-fel (`run view`)                                 → false
#   T11 `Test suite` med oväntad conclusion (failure)             → false
#   T12 användningsfel (saknat SHA / saknad REPO)                 → exit 2
#   T13 KOPPLINGSGRINDEN — se nedan
#
# VÄG A — kö-ytan (TASK-78). T1–T13 kör med tom kö-lista och bevisar därmed
# samtidigt att den gamla vägen är ORÖRD:
#   T14 kö-docs TROTS träd-avvikelse                              → true
#   T15 kögrupp med kod slår PR:ens docs-klassning (AC#3)         → false
#   T16 kö-basen != merge-commitens första förälder               → false
#   T17 körnings-API-fel på kö-ytan                               → false
#   T18 jobblist-fel på kö-körningen                              → false
#   T19 kö-körning med `Test suite` failure                       → false
#   T20 cancelled kö-körning → faller till VÄG B                  → true
#   T21 kö-frågans form: --event merge_group mot MERGE-sha:t
#
# T14 ÄR TVÅSIDIGHETSBEVISET: den fäller mot skriptet FÖRE TASK-78-fixen
# (träd-avvikelse ⇒ fail-closed ⇒ false) och passerar efter. Mätt, inte antaget
# — se PR-beskrivningen för körningen mot den ofixade kopian.
#
# N3 (TASK-450.2, T166 vägval 2) — BEFORE-SPANNET, INTE BARA TOPPEN:
#   T22 två merge-commitar, texttopp, BEFORE satt      → false (TVÅSIDIGHETSBEVIS)
#   T23 en merge-commit, BEFORE satt (exakt ett steg)  → oförändrat true
#   T24 BEFORE = noll-SHA                              → false
#   T25 BEFORE onåbar inom taket (historiken tar slut) → false
#   T26 BEFORE satt men TOMT (ej samma som osatt)      → false
#   T27 BEFORE OSATT på samma scenario som T22         → true (ROLLBACK-BEVIS)
#   T28 API-fel MITT I vandringen (steg ≥ 2)           → false
#   T29 BEFORE == topp-commiten (degenererad push)     → false, eget skäl i loggen
#   T13c post-merge.yml skickar BEFORE i klassningsjobbets env (kopplingsgrind,
#       runda 2-tillägg — se § nedan)
#
# OKAND-SIGNALEN (TASK-464.4 runda 2, review-fynd 1 — scripts/lib/svit-
# signal.sh kräver nu POSITIVT belägg, inte frånvaro, se den filens huvud):
#   T30 jobbnamn omdöpt i kö-körningen (OKAND:tomt)          → false
#   T31 inre jobb finns, inget success (OKAND:inga-lyckade)  → false
#   T32 inre jobb med failure bland lyckade (OKAND:ovantad)  → false
#
# T22 ÄR N3:s TVÅSIDIGHETSBEVIS: den fäller mot skriptet FÖRE denna fix (ingen
# BEFORE-räkning finns, så bara HEAD^2 läses — toppens docs-klassning ärvs
# blint) och passerar efter. T27 är SPEGELBILDEN och samtidigt
# rollback-beviset: exakt samma scenario som T22, men med BEFORE OSATT — det
# ska ge EXAKT det gamla (buggiga) svaret `true`, eftersom borttagen `BEFORE`-
# rad i post-merge.yml är den dokumenterade rollback-vägen.
#
# T13c ÄR EN EGEN TVÅSIDIGHETSGRUND, körd manuellt (inte i denna svit): en
# scratch-kopia av post-merge.yml UTAN BEFORE-raden fäller T13c, den riktiga
# filen passerar. Se PR-beskrivningen för körningen mot båda kopiorna.
#
# ═══ VARFÖR T13 FINNS: PARITETEN ÄR EN STRÄNG, OCH DEN GRINDAS ═══
# Klassningen ärver ci.yml:s beslut i stället för att räkna om det, just för att
# slippa en andra kopia av glob-listorna (restlistans A3). Priset är EN koppling:
# skriptets `CI_SUITE_JOB_NAME` måste vara ci.yml:s faktiska `suite`-jobbnamn.
# Till skillnad från en 30-radig globlista kan en enda sträng grindas mekaniskt,
# och T13 gör det — plus att post-merge.yml faktiskt anropar skriptet.
# Utan grinden hade kopplingen drivit tyst: fel namn ⇒ jobbet hittas aldrig ⇒
# full svit på varje landning, alltså exakt den defekt kortet stänger,
# återinförd av sin egen fix. Utfallet är fail-closed, men tyst — och en tyst
# fail-closed är en grind som slutat mäta (L322-klassen).
#
# ═══ STUBBENS GRÄNS (ärvd lärdom, test-ci-wait.sh S91) ═══
# En grön stubbsvit bevisar LOGIKEN, inte att den möter verkligheten. Stubben
# kör därför skriptets EGNA `--jq`-uttryck genom riktiga jq mot scenario-JSON i
# API:ts form — inte förberedda svarssträngar. Utöver det kördes klassningen
# SKARPT mot verkliga landningar 2026-07-28, båda riktningarna:
#   ed51b95 (docs, PR #374, 8 rader .md) → docs_only=true  (körning 30393253176)
#   4543d18 (kod-PR)                     → docs_only=false (körning 30389547241)
# Ändras denna svit ska den följas av skarpa körningar mot verkliga merge-SHA:n
# innan den anses bevisad.
#
# Test-isolering: /tmp/task73-test-classify/ med en gh-stub på PATH.
# Återställer via trap. INGEN nätverkstrafik, inget riktigt gh-anrop.
#
# Användning: bash scripts/test-classify-post-merge.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: backlog TASK-73 · ADR-039 § lesson→grind (L43)
# Etablerad: Session 91 (2026-07-28)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/task73-test-classify"
GATE_SRC="${REPO_ROOT}/scripts/classify-post-merge.sh"

MERGE_SHA="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
HEAD_SHA="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/bin" "${TEST_DIR}/lib"
    cp "${GATE_SRC}" "${TEST_DIR}/classify.sh"
    chmod +x "${TEST_DIR}/classify.sh"
    # TASK-464.4/SE1: classify-post-merge.sh sourcear två delade libs
    # (CI_SUITE_JOB_NAME + las_svit_signal) relativt sin egen SCRIPT_DIR —
    # sandboxen måste bära dem på samma relativa plats som riktiga scripts/.
    cp "${REPO_ROOT}/scripts/lib/ci-suite-job-name.sh" "${TEST_DIR}/lib/"
    cp "${REPO_ROOT}/scripts/lib/svit-signal.sh" "${TEST_DIR}/lib/"

    # gh-stub. Scenariot styrs av miljövariabler:
    #   GH_COMMIT_MERGE_JSON  API-svar för merge-SHA:t (aaaa…)
    #   GH_COMMIT_HEAD_JSON   API-svar för PR-headen (bbbb…)
    #   GH_COMMIT_EXTRA_JSON  karta {sha: commit-json} för N3:s BEFORE-vandring
    #                         (varje hopp bakåt förbi aaaa, t.ex. "cccc")
    #   GH_RUNLIST_JSON       API-svar för `gh run list`
    #   GH_RUNVIEW_JSON       API-svar för `gh run view --json jobs`
    #   GH_FAIL_ON            vilket anrop som ska ge exit 1:
    #                         commit_merge | commit_head | commit_walk |
    #                         runlist | runview
    #   GH_CALL_LOG           fil dit varje anrops argument loggas
    #
    # Stubben kör skriptets EGNA --jq-uttryck genom riktiga jq mot JSON i API:ts
    # form. Ett fel i uttrycket fångas därför här, inte först i CI.
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail

printf '%s\n' "$*" >> "${GH_CALL_LOG:-/dev/null}"

fail_on="${GH_FAIL_ON:-}"

# Plocka ut --jq-uttrycket och --event-värdet ur argumenten.
jq_expr=""
event_arg=""
prev=""
for a in "$@"; do
    if [[ "${prev}" == "--jq" ]]; then
        jq_expr="${a}"
    fi
    if [[ "${prev}" == "--event" ]]; then
        event_arg="${a}"
    fi
    prev="${a}"
done

sub="${1:-}"
case "${sub}" in
    api)
        target="${2:-}"
        if [[ "${target}" == *"/commits/aaaa"* ]]; then
            [[ "${fail_on}" == "commit_merge" ]] && exit 1
            printf '%s' "${GH_COMMIT_MERGE_JSON:-{\}}" | jq -r "${jq_expr}"
            exit $?
        fi
        if [[ "${target}" == *"/commits/bbbb"* ]]; then
            [[ "${fail_on}" == "commit_head" ]] && exit 1
            printf '%s' "${GH_COMMIT_HEAD_JSON:-{\}}" | jq -r "${jq_expr}"
            exit $?
        fi
        # N3:s BEFORE-vandring: varje hopp bakom aaaa (t.ex. "cccc") slås upp i
        # GH_COMMIT_EXTRA_JSON, en karta {sha: commit-json i API:ts RÅA form}.
        # Ett SHA som saknas i kartan speglar gh:s 404 precis som fallet nedan.
        extra_sha="${target##*/commits/}"
        extra_body=$(printf '%s' "${GH_COMMIT_EXTRA_JSON:-{\}}" | jq -r --arg sha "${extra_sha}" '.[$sha] // empty')
        if [[ -n "${extra_body}" ]]; then
            [[ "${fail_on}" == "commit_walk" ]] && exit 1
            printf '%s' "${extra_body}" | jq -r "${jq_expr}"
            exit $?
        fi
        # Okänt SHA — spegla gh:s beteende vid 404.
        exit 1
        ;;
    run)
        case "${2:-}" in
            list)
                # VÄG A (kö-ytan) och VÄG B (PR-ytan) frågar samma subkommando;
                # de skiljs på --event, precis som skriptet gör.
                if [[ "${event_arg}" == "merge_group" ]]; then
                    [[ "${fail_on}" == "runlist_mg" ]] && exit 1
                    printf '%s' "${GH_RUNLIST_MG_JSON:-[]}" | jq -r "${jq_expr}"
                    exit $?
                fi
                [[ "${fail_on}" == "runlist" ]] && exit 1
                printf '%s' "${GH_RUNLIST_JSON:-[]}" | jq -r "${jq_expr}"
                exit $?
                ;;
            view)
                # Kö-körningen har id 7777, PR-körningen 4242 (se scenariona).
                if [[ "${3:-}" == "7777" ]]; then
                    [[ "${fail_on}" == "runview_mg" ]] && exit 1
                    printf '%s' "${GH_RUNVIEW_MG_JSON:-{\}}" | jq -r "${jq_expr}"
                    exit $?
                fi
                [[ "${fail_on}" == "runview" ]] && exit 1
                printf '%s' "${GH_RUNVIEW_JSON:-{\}}" | jq -r "${jq_expr}"
                exit $?
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

# Standardscenario: en docs-landning. Enskilda test skriver över delar.
#
# JSON:en är API:ts RÅA form, inte färdiga svarssträngar — stubben kör skriptets
# egna --jq-uttryck genom riktiga jq mot den. Det är avsiktligt strängare: första
# versionen av denna svit bar förenklad JSON, och sviten fällde då T1 med
# `Cannot index string with string "sha"` — alltså mot en form skriptet aldrig
# möter. Ett jq-uttrycksfel fångas därför här i stället för först i CI.
scenario_defaults() {
    export GH_COMMIT_MERGE_JSON="{\"sha\":\"${MERGE_SHA}\",\"commit\":{\"tree\":{\"sha\":\"t1\"}},\"parents\":[{\"sha\":\"cccc\"},{\"sha\":\"${HEAD_SHA}\"}]}"
    export GH_COMMIT_HEAD_JSON='{"commit":{"tree":{"sha":"t1"}}}'
    export GH_RUNLIST_JSON='[{"databaseId":4242,"status":"completed","conclusion":"success"}]'
    export GH_RUNVIEW_JSON='{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Test suite","conclusion":"skipped"}]}'
    # VÄG A tom som DEFAULT — landningen gick inte via kön. Det gör att T1–T13
    # kör exakt den väg de alltid kört, och deras oförändrade utfall är
    # bakåtkompatibilitets-beviset för TASK-78. Kö-scenariona sätter den själva.
    export GH_RUNLIST_MG_JSON='[]'
    export GH_RUNVIEW_MG_JSON='{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Test suite","conclusion":"skipped"}]}'
    export GH_FAIL_ON=""
    export GH_CALL_LOG="${TEST_DIR}/calls.log"
    : > "${GH_CALL_LOG}"
    # BEFORE OSATT som DEFAULT — grindar N3-blocket av helt (rollback-egenskapen,
    # § N3 i classify-post-merge.sh). T1–T21 kör därmed exakt den väg de alltid
    # kört; N3-scenariona (T22–T27) sätter BEFORE själva.
    unset BEFORE GH_COMMIT_EXTRA_JSON 2>/dev/null || true
}

# run_case <namn> <förväntad docs_only> [sha] — kör klassningen under stubben.
run_case() {
    local namn="$1" forvantat="$2" sha="${3:-${MERGE_SHA}}"
    local ut faktiskt
    ut=$(PATH="${TEST_DIR}/bin:${PATH}" REPO="ett/repo" \
        EVENT_NAME="${EVENT_NAME:-push}" bash "${TEST_DIR}/classify.sh" "${sha}" 2>&1)
    faktiskt=$(printf '%s' "${ut}" | sed -n 's/^docs_only=\([a-z]*\).*/\1/p' | head -1)
    if [[ "${faktiskt}" == "${forvantat}" ]]; then
        echo "  ✅ ${namn}: docs_only=${faktiskt}"
        PASSED=$(( PASSED + 1 ))
    else
        echo "  ❌ ${namn}: förväntat docs_only=${forvantat}, fick '${faktiskt}'"
        echo "     utdata: ${ut}"
        FAILED=$(( FAILED + 1 ))
    fi
}

pass() {
    echo "  ✅ $1"
    PASSED=$(( PASSED + 1 ))
}

fel() {
    echo "  ❌ $1"
    FAILED=$(( FAILED + 1 ))
}

echo "── scripts/classify-post-merge.sh — testsvit ──"
setup

# --- T1: docs-landning → true -------------------------------------------------
scenario_defaults
run_case "T1 docs-landning (Test suite skipped)" "true"

# --- T2: kod-landning → false -------------------------------------------------
# Reusable-anropet expanderas till inner-jobb; inget jobb heter exakt `Test suite`.
scenario_defaults
export GH_RUNVIEW_JSON='{"jobs":[{"name":"Test suite / Pure + Build","conclusion":"success"},{"name":"Test suite / Staging (API + E2E)","conclusion":"success"}]}'
run_case "T2 kod-landning (inner-jobb, ingen exakt Test suite)" "false"

# --- T3: dispatch → false -----------------------------------------------------
scenario_defaults
EVENT_NAME="workflow_dispatch" run_case "T3 event=workflow_dispatch" "false"
unset EVENT_NAME

# --- T4: ingen andra förälder → false ----------------------------------------
scenario_defaults
export GH_COMMIT_MERGE_JSON='{"sha":"aaaa","commit":{"tree":{"sha":"t1"}},"parents":[{"sha":"cccc"}]}'
run_case "T4 ingen andra förälder" "false"

# --- T5: träd-avvikelse → false ----------------------------------------------
scenario_defaults
export GH_COMMIT_HEAD_JSON='{"commit":{"tree":{"sha":"ANNAT"}}}'
run_case "T5 träd-avvikelse" "false"

# --- T6/T7: commits-API-fel → false ------------------------------------------
scenario_defaults
export GH_FAIL_ON="commit_merge"
run_case "T6 commits-API-fel (merge-commit)" "false"

scenario_defaults
export GH_FAIL_ON="commit_head"
run_case "T7 commits-API-fel (PR-head)" "false"

# --- T8: ingen grön PR-körning → false ---------------------------------------
scenario_defaults
export GH_RUNLIST_JSON='[{"databaseId":4242,"status":"completed","conclusion":"cancelled"}]'
run_case "T8 endast cancelled PR-körning" "false"

# --- T9: run list-fel → false -------------------------------------------------
scenario_defaults
export GH_FAIL_ON="runlist"
run_case "T9 körnings-API-fel (run list)" "false"

# --- T10: run view-fel → false ------------------------------------------------
scenario_defaults
export GH_FAIL_ON="runview"
run_case "T10 jobblist-fel (run view)" "false"

# --- T11: oväntad conclusion → false -----------------------------------------
scenario_defaults
export GH_RUNVIEW_JSON='{"jobs":[{"name":"Test suite","conclusion":"failure"}]}'
run_case "T11 Test suite med conclusion failure" "false"

# --- T12: användningsfel → exit 2 --------------------------------------------
scenario_defaults
PATH="${TEST_DIR}/bin:${PATH}" REPO="ett/repo" bash "${TEST_DIR}/classify.sh" >/dev/null 2>&1
if [[ "$?" -eq 2 ]]; then
    pass "T12a saknat SHA → exit 2"
else
    fel "T12a saknat SHA gav inte exit 2"
fi
PATH="${TEST_DIR}/bin:${PATH}" REPO="" bash "${TEST_DIR}/classify.sh" "${MERGE_SHA}" >/dev/null 2>&1
if [[ "$?" -eq 2 ]]; then
    pass "T12b saknad REPO → exit 2"
else
    fel "T12b saknad REPO gav inte exit 2"
fi

# --- T12c: pull_request-filtret måste finnas ---------------------------------
# Utan `--event pull_request` kan en PUSH-körning läsas, där `Test suite` kan
# vara skippad av MERGE-DEDUPEN i stället för av D0 — två helt olika påståenden.
scenario_defaults
run_case "T12c (uppvärmning för filterkontroll)" "true"
if grep -q -- "--event pull_request" "${GH_CALL_LOG}"; then
    pass "T12c run list frågar med --event pull_request"
else
    fel "T12c run list saknar --event pull_request — dedup-skippade körningar kan läsas som D0"
fi

# ═══ VÄG A — KÖ-YTAN (TASK-78) ═══════════════════════════════════════════════
# Kö-körningen (`event=merge_group`) kördes på EXAKT den commit som landar, så
# den ärvs före PR-körningen. Scenariona nedan sätter GH_RUNLIST_MG_JSON;
# grennamnet måste sluta på merge-commitens FÖRSTA förälder, som i
# scenario_defaults är `cccc`.
echo "── VÄG A: kö-ytan (TASK-78) ──"

MG_OK='[{"databaseId":7777,"status":"completed","conclusion":"success","headBranch":"gh-readonly-queue/main/pr-99-cccc"}]'

# --- T14: KORTETS DEFEKT — kö-docs trots träd-avvikelse → true ---------------
# DETTA ÄR TESTET SOM FÄLLER FÖRE FIXEN. Träden avviker (main har rört sig sedan
# PR-headen skrevs — `#423`-fallet), vilket är precis vad VÄG B fail-closar på.
# Kö-körningen klassade samma träd som docs, och den gäller det som landar.
scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_COMMIT_HEAD_JSON='{"commit":{"tree":{"sha":"MAIN-HAR-RORT-SIG"}}}'
run_case "T14 kö-docs trots träd-avvikelse (TASK-78-fallet)" "true"

# --- T15: kö-körningens KOD-utfall har företräde → false ---------------------
# PRIORITETS-ASSERTION, inte ett fysiskt scenario — sagt rakt ut hellre än
# överdrivet: med `min_entries_to_merge: 1` får varje post en egen kö-körning på
# sin egen commit, så "kö säger kod medan PR säger docs" är svårt att framkalla
# skarpt. Testet låser ORDNINGEN: kö-körningen vinner, alltid. Kastas den om så
# PR-vägen får företräde, fäller detta test — och först då kan en kod-bärande
# landning ärva en docs-klassning.
#
# AC#3:s SUBSTANS vilar inte här utan på härledningen ur källan: ci.yml:s D0-steg
# är en ALLOWLIST där only_changed blir true ENDAST när VARENDA ändrad fil
# matchar (tj-actions/changed-files @ pinnad SHA, src/changedFilesOutput.ts:
# `onlyChanged = otherChangedFiles.length === 0 && …`). En kögrupp som blandar
# docs och kod har minst en icke-matchande fil ⇒ only_changed=false ⇒ KOD.
# Skarp empiri i samma riktning: kö-körning 30439086378 (`#424`, bas = `#423`:s
# merge-commit) klassade KOD och instansierade inner-jobben.
scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_RUNVIEW_MG_JSON='{"jobs":[{"name":"Test suite / Pure + Build","conclusion":"success"},{"name":"Test suite / Staging (API + E2E)","conclusion":"success"}]}'
run_case "T15 kögrupp med kod slår PR:ens docs-klassning" "false"

# --- T16: kö-basen är inte första föräldern → false --------------------------
# Utan bas-kontrollen hade detta gett `true` på en klassning av FEL diff.
scenario_defaults
export GH_RUNLIST_MG_JSON='[{"databaseId":7777,"status":"completed","conclusion":"success","headBranch":"gh-readonly-queue/main/pr-99-ETTHELTANNATSHA"}]'
run_case "T16 kö-bas != merge-commitens första förälder" "false"

# --- T17: run list-fel på kö-ytan → false ------------------------------------
# PR-vägen hade gett `true` här; ett API-fel får inte tyst degradera till den.
scenario_defaults
export GH_FAIL_ON="runlist_mg"
run_case "T17 körnings-API-fel på kö-ytan" "false"

# --- T18: jobblist-fel på kö-körningen → false -------------------------------
scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_FAIL_ON="runview_mg"
run_case "T18 jobblist-fel på kö-körningen" "false"

# --- T19: `Test suite` med oväntad conclusion i kö-körningen → false ---------
scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_RUNVIEW_MG_JSON='{"jobs":[{"name":"Test suite","conclusion":"failure"}]}'
run_case "T19 kö-körning med Test suite failure" "false"

# --- T20: icke-grön kö-körning ignoreras → VÄG B gäller ----------------------
# En cancelled kö-körning är ingen klassning; skriptet ska falla till PR-vägen,
# inte fail-closa. Här är PR-vägen docs och träden lika ⇒ true.
scenario_defaults
export GH_RUNLIST_MG_JSON='[{"databaseId":7777,"status":"completed","conclusion":"cancelled","headBranch":"gh-readonly-queue/main/pr-99-cccc"}]'
run_case "T20 cancelled kö-körning → faller till VÄG B" "true"

# --- T21: kö-frågan ställs mot MERGE-sha:t, inte PR-headen -------------------
# Frågas fel SHA hittas aldrig någon kö-körning och hela VÄG A blir död kod —
# en tyst fail-closed, alltså samma L322-klass T13 vaktar.
scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
run_case "T21 (uppvärmning för kö-frågans form)" "true"
if grep -q -- "--event merge_group" "${GH_CALL_LOG}"; then
    pass "T21a run list frågar kö-ytan med --event merge_group"
else
    fel "T21a run list saknar --event merge_group — VÄG A är frånkopplad"
fi
if grep -E -- "--event merge_group" "${GH_CALL_LOG}" | grep -q -- "--commit ${MERGE_SHA}"; then
    pass "T21b kö-frågan ställs mot merge-commitens egen SHA"
else
    fel "T21b kö-frågan ställs inte mot merge-SHA:t — klassningen läser fel commit"
fi

# ═══ N3 — BEFORE-SPANNET, INTE BARA TOPPEN (TASK-450.2, T166 vägval 2) ═══════
# Topologin: aaaa (MERGE_SHA, topp) → första förälder cccc → första förälder
# BEFORE_SHA. cccc är alltså SJÄLV en merge-commit — precis kö-batchens form
# när fler än en post landar i samma push.
echo "── N3: BEFORE-spannet, inte bara toppen (TASK-450.2) ──"

BEFORE_SHA="dddddddddddddddddddddddddddddddddddddddd"
ZERO_SHA="0000000000000000000000000000000000000000"
TVA_MERGE_EXTRA="{\"cccc\": {\"parents\":[{\"sha\":\"${BEFORE_SHA}\"},{\"sha\":\"eeee\"}]}}"

# --- T22: två merge-commitar, texttopp, BEFORE satt → false (TVÅSIDIGHETSBEVIS) ---
# aaaa ärver i dag docs-klassningen av bbbb (texttoppen), men dess FÖRSTA
# förälder cccc är SJÄLV en merge-commit vars första förälder är BEFORE — två
# landningar i samma push, och den nedre bar kod. FÄLLER mot skriptet FÖRE
# TASK-450.2 (ingen BEFORE-räkning finns, HEAD^2=bbbb ärvs blint → true) och
# PASSERAR efter (→ false). Mätt mot origin/main-kopian, se PR-beskrivningen.
scenario_defaults
export GH_COMMIT_EXTRA_JSON="${TVA_MERGE_EXTRA}"
export BEFORE="${BEFORE_SHA}"
run_case "T22 två merge-commitar, texttopp (TVÅSIDIGHETSBEVIS)" "false"

# --- T23: en merge-commit, BEFORE satt (exakt ETT steg) → oförändrat true ---
# BEFORE = cccc, alltså aaaa:s FÖRSTA förälder direkt: exakt en landning i
# pushen. Dagens logik (VÄG B, docs-scenariot i scenario_defaults) ska köras
# helt orörd.
scenario_defaults
export BEFORE="cccc"
run_case "T23 en merge-commit, BEFORE satt (exakt ett steg)" "true"

# --- T24: BEFORE = noll-SHA → false ------------------------------------------
# Ny gren eller den första pushen mot main — ingen bas att räkna steg mot.
scenario_defaults
export BEFORE="${ZERO_SHA}"
run_case "T24 BEFORE = noll-SHA" "false"

# --- T25: BEFORE onåbar inom taket → false -----------------------------------
# cccc:s historik tar slut (parents: []) innan BEFORE hittas — omskriven
# historik eller en djupare batch än taket (BEFORE_STEG_TAK=10) tillåter.
scenario_defaults
export GH_COMMIT_EXTRA_JSON='{"cccc": {"parents":[]}}'
export BEFORE="${BEFORE_SHA}"
run_case "T25 BEFORE onåbar (historiken tar slut)" "false"

# --- T26: BEFORE satt men TOMT → false (skiljer sig från OSATT, se T27) ------
# "" är INTE detsamma som att variabeln saknas: grinden är `${BEFORE+x}`
# (existens), aldrig `-z` (värde). Satt-men-tomt är en egen fail-closed-kant.
scenario_defaults
export BEFORE=""
run_case "T26 BEFORE satt men tomt" "false"

# --- T27: BEFORE OSATT, SAMMA scenario som T22 → true (ROLLBACK-BEVIS) -------
# scenario_defaults unsetar redan BEFORE. GH_COMMIT_EXTRA_JSON sätts ändå, för
# att ordagrant vara T22:s topologi — den är inert här eftersom N3-blocket
# aldrig körs utan BEFORE. Utan BEFORE i miljön hoppas hela blocket, och
# skriptet faller till EXAKT det gamla svaret (HEAD^2=bbbb, texttopp ⇒ true) —
# det svaret ÄR bugen T166/N3 stänger, och det är precis vad en borttagen
# BEFORE-rad i post-merge.yml ska ge (planens § Rollback; § N3 i skriptets
# eget huvud).
scenario_defaults
export GH_COMMIT_EXTRA_JSON="${TVA_MERGE_EXTRA}"
run_case "T27 BEFORE osatt, T22:s scenario (ROLLBACK-BEVIS)" "true"

# --- T28: API-fel MITT I vandringen (steg ≥ 2) → false -----------------------
# Steg 1 återanvänder commit_json (redan hämtad, inget nytt anrop). Steg 2
# kräver ETT NYTT commits-API-anrop (för cccc) — GH_FAIL_ON=commit_walk river
# just DET anropet, inte steg 1:s. Samma topologi som T22, men anropet till
# cccc faller i stället för att lyckas.
scenario_defaults
export GH_COMMIT_EXTRA_JSON="${TVA_MERGE_EXTRA}"
export BEFORE="${BEFORE_SHA}"
export GH_FAIL_ON="commit_walk"
run_case "T28 API-fel mitt i BEFORE-vandringen (steg 2)" "false"

# --- T29: BEFORE == topp-commiten (degenererad push) → false -----------------
# before==after — ingen vandring behövs eller hjälper (en commit kan aldrig
# vara sin egen förälder). Detta är INTE samma fel som "onåbar inom taket":
# den generiska tak-texten vore sakligt missvisande här, så fallet har sitt
# EGET skäl i skriptet (se § N3-blocket, degenererad-push-kontrollen).
scenario_defaults
export BEFORE="${MERGE_SHA}"
run_case "T29 BEFORE == topp-commiten (degenererad push)" "false"
t29_ut=$(PATH="${TEST_DIR}/bin:${PATH}" REPO="ett/repo" BEFORE="${MERGE_SHA}" bash "${TEST_DIR}/classify.sh" "${MERGE_SHA}" 2>&1)
if printf '%s' "${t29_ut}" | grep -q "degenererad push"; then
    pass "T29a skälet är eget (degenererad push), inte den generiska tak-texten"
else
    fel "T29a skälet i loggen är INTE det egna degenererad-push-skälet — kan vara den missvisande tak-texten"
fi

# ═══ T30–T32: OKAND-signalen (TASK-464.4 runda 2, review-fynd 1) ═══
# scripts/lib/svit-signal.sh kräver sedan runda 2 POSITIVT belägg för RUN.
# Dessa tre fall bevisar att classify-post-merge.sh:s docs_only FÖRBLIR
# false (samma utfall som RUN/API-fel gav förut) för alla tre OKAND-formerna
# — efterkontrollens fail-closed-riktning ("okänt = sviten kördes INTE").
# Körda via VÄG A (kö-ytan) eftersom det är den ytan SE1 delar med
# scripts/dedup-huvudgren.sh; den delade funktionens EGNA sju/åtta fall
# (RUN/SKIPPED/OKAND × alla varianter) är redan bevisade i
# scripts/test-svit-signal.sh — dessa tre är KOPPLINGS-beviset: att
# classify-post-merge.sh tolkar OKAND rätt, inte att signalen själv är rätt.
scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_RUNVIEW_MG_JSON='{"jobs":[{"name":"Detect changed files","conclusion":"success"},{"name":"Full svit (omdöpt, EJ Test suite)","conclusion":"skipped"}]}'
run_case "T30 jobbnamn omdöpt i kö-körningen (OKAND:tomt) → docs_only=false" "false"

scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_RUNVIEW_MG_JSON='{"jobs":[{"name":"Test suite / Staging (API + E2E)","conclusion":"skipped"}]}'
run_case "T31 inre jobb finns, inget success (OKAND:inga-lyckade) → docs_only=false" "false"

scenario_defaults
export GH_RUNLIST_MG_JSON="${MG_OK}"
export GH_RUNVIEW_MG_JSON='{"jobs":[{"name":"Test suite / Pure + Build","conclusion":"success"},{"name":"Test suite / Acceptance (hermetisk) (1)","conclusion":"failure"}]}'
run_case "T32 inre jobb med failure bland lyckade (OKAND:ovantad-konklusion) → docs_only=false" "false"

# --- T13: KOPPLINGSGRINDEN ---------------------------------------------------
echo "── T13: kopplingen till ci.yml ──"
CI_YML="${REPO_ROOT}/.github/workflows/ci.yml"
POST_MERGE_YML="${REPO_ROOT}/.github/workflows/post-merge.yml"
# TASK-464.4/SE1: konstanten flyttade till en delad lib (scripts/lib/ci-suite-
# job-name.sh, sourcad av GATE_SRC OCH scripts/dedup-huvudgren.sh) — läs den
# DÄR, inte längre ur GATE_SRC självt.
CI_SUITE_JOB_NAME_LIB="${REPO_ROOT}/scripts/lib/ci-suite-job-name.sh"

skript_namn=$(sed -n 's/^CI_SUITE_JOB_NAME="\(.*\)"$/\1/p' "${CI_SUITE_JOB_NAME_LIB}" | head -1)
ci_namn=$(awk '/^  suite:/{f=1;next} f&&/^    name: /{sub(/^    name: /,"");print;exit}' "${CI_YML}")

if [[ -z "${skript_namn}" ]]; then
    fel "T13a kunde inte läsa CI_SUITE_JOB_NAME ur ${CI_SUITE_JOB_NAME_LIB}"
elif [[ -z "${ci_namn}" ]]; then
    fel "T13a kunde inte läsa suite-jobbets name: ur ci.yml"
elif [[ "${skript_namn}" == "${ci_namn}" ]]; then
    pass "T13a CI_SUITE_JOB_NAME ('${skript_namn}') == ci.yml:s suite-jobbnamn"
else
    fel "T13a KOPPLINGSDRIFT: skriptet säger '${skript_namn}', ci.yml:s suite-jobb heter '${ci_namn}'."
    echo "     Fix: uppdatera CI_SUITE_JOB_NAME i ${GATE_SRC} till ci.yml:s namn."
fi

# Mönstret ankras på ett faktiskt `run:`-steg, inte på filnamnet som substräng.
# Den lösare formen `grep -q "classify-post-merge.sh"` PRÖVADES och var tyst
# fail-open: filhuvudet nämner scripts/test-classify-post-merge.sh, vilket
# innehåller samma substräng, så grinden var grön även med anropet BORTTAGET
# (mätt mot sandlådekopia 2026-07-28). En grind som inte kan fälla är ingen
# grind — samma L322-klass den själv vaktar.
if grep -qE '^[[:space:]]+run: bash scripts/classify-post-merge\.sh' "${POST_MERGE_YML}"; then
    pass "T13b post-merge.yml kör faktiskt classify-post-merge.sh"
else
    fel "T13b post-merge.yml har inget 'run: bash scripts/classify-post-merge.sh'-steg — klassningen är frånkopplad."
fi

# --- T13c: BEFORE-RADEN — kopplingsgrind för N3 (TASK-450.2) -----------------
# Rollback-egenskapen (§ N3 i classify-post-merge.sh:s huvud) gör FRÅNVARO av
# BEFORE odetekterbar från AVSIKT: skriptet faller tyst till dagens (buggiga)
# beteende om raden försvinner ur workflowen. Utan denna grind skulle en
# framtida borttagen rad se identisk ut med en medveten rollback — precis den
# L322-klass T13b:s egen kommentar varnar för, applicerad på en NY koppling.
# Scopad till KLASSNINGSJOBBETS env-block (mellan steg-namnet och dess
# run:-rad), inte en fri substräng någonstans i filen — samma disciplin som
# T13b:s ankrade grep.
KLASSNING_BLOCK=$(awk '
    /name: Ärv ci\.yml:s klassning för det landade trädet/ { f=1 }
    f { print }
    f && /run: bash scripts\/classify-post-merge\.sh/ { exit }
' "${POST_MERGE_YML}")

if [[ -z "${KLASSNING_BLOCK}" ]]; then
    fel "T13c kunde inte hitta klassningsjobbets steg i ${POST_MERGE_YML} (ankaret 'name: Ärv ci.yml:s klassning …' saknas eller är omdöpt)"
elif echo "${KLASSNING_BLOCK}" | grep -qE '^[[:space:]]+BEFORE: \$\{\{ github\.event\.before \}\}[[:space:]]*$'; then
    pass "T13c post-merge.yml skickar BEFORE (github.event.before) i klassningsjobbets env"
else
    fel "T13c post-merge.yml saknar BEFORE-raden i klassningsjobbets env — T166-hålet (60 hål/19 dagar) är TYST återinfört."
    echo "     Fix: lägg tillbaka 'BEFORE: \${{ github.event.before }}' i env-blocket för steget 'Ärv ci.yml:s klassning för det landade trädet'."
fi

# TVÅSIDIGHETSBEVIS för T13c (körs manuellt, inte i denna svit — se
# PR-beskrivningen): en scratch-kopia av post-merge.yml UTAN BEFORE-raden
# fäller ovanstående block; den riktiga filen passerar. Samma metod som T22.

echo ""
echo "── Resultat: ${PASSED} passerade, ${FAILED} failade ──"
if [[ "${FAILED}" -gt 0 ]]; then
    exit 1
fi
exit 0
