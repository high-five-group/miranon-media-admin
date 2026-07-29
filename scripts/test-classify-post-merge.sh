#!/usr/bin/env bash
# scripts/test-classify-post-merge.sh
#
# Empirisk test-suite för scripts/classify-post-merge.sh (TASK-73).
#
# 21 testfall — ett per gren i klassningen, båda riktningarna.
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
    mkdir -p "${TEST_DIR}/bin"
    cp "${GATE_SRC}" "${TEST_DIR}/classify.sh"
    chmod +x "${TEST_DIR}/classify.sh"

    # gh-stub. Scenariot styrs av miljövariabler:
    #   GH_COMMIT_MERGE_JSON  API-svar för merge-SHA:t (aaaa…)
    #   GH_COMMIT_HEAD_JSON   API-svar för PR-headen (bbbb…)
    #   GH_RUNLIST_JSON       API-svar för `gh run list`
    #   GH_RUNVIEW_JSON       API-svar för `gh run view --json jobs`
    #   GH_FAIL_ON            vilket anrop som ska ge exit 1:
    #                         commit_merge | commit_head | runlist | runview
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
export GH_COMMIT_HEAD_JSON='{"commit":{"tree":{"sha":"MAIN-HAR-ROORT-SIG"}}}'
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

# --- T13: KOPPLINGSGRINDEN ---------------------------------------------------
echo "── T13: kopplingen till ci.yml ──"
CI_YML="${REPO_ROOT}/.github/workflows/ci.yml"
POST_MERGE_YML="${REPO_ROOT}/.github/workflows/post-merge.yml"

skript_namn=$(sed -n 's/^CI_SUITE_JOB_NAME="\(.*\)"$/\1/p' "${GATE_SRC}" | head -1)
ci_namn=$(awk '/^  suite:/{f=1;next} f&&/^    name: /{sub(/^    name: /,"");print;exit}' "${CI_YML}")

if [[ -z "${skript_namn}" ]]; then
    fel "T13a kunde inte läsa CI_SUITE_JOB_NAME ur ${GATE_SRC}"
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

echo ""
echo "── Resultat: ${PASSED} passerade, ${FAILED} failade ──"
if [[ "${FAILED}" -gt 0 ]]; then
    exit 1
fi
exit 0
