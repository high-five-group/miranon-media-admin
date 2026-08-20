#!/usr/bin/env bash
# scripts/test-ci-wait.sh
#
# Empirisk test-suite för scripts/ci-wait.sh (S87 städ-vågen; utökad S91, S91/TASK-72).
# 27 testfall:
#   T1  terminal-kontroll FÖRE första sömnen  ← regressionsvakten för cykel-3-buggen
#   T2  grön körning, alla jobb success → 0
#   T3  failande jobb → 1 (fail-closed)
#   T4  skippat jobb rapporteras men fäller inte → 0
#   T5  okänd jobb-conclusion fäller (fail-closed) → 1
#   T6  in_progress → completed: pollar och avslutar när villkoret håller
#   T7  aldrig terminal → 2 (timeout, inte hängning)
#   T8  run saknas först, dyker upp: pollar upp den → 0
#   T9  run dyker aldrig upp → 2
#   T10 --pr-upplösning via headRefOid → 0
#   T11 användningsfel (ingen/dubbel mode, ogiltigt intervall, FÖRKORTAD SHA
#       på --commit — d/e; gh ger tom lista utan felkod, så utan valideringen
#       blir felet en timeout som pekar på CI i stället för på anropet) → 3
#   T12 superseddad ≠ röd (S91), fyra fall:
#       a topp-conclusion cancelled + nyare körning finns  → 4
#       b cancelled UTAN nyare körning                     → 1  (fail-closed)
#       c cancelled + aggregator-failure + nyare           → 4  (verklighetsfallet)
#       d topp-conclusion failure + nyare finns            → 1  (bara avbrutna supersederas)
#   T13 VALET AV KÖRNING (TASK-72), sju fall — se blocket vid testerna
#   T14 tvåsidigt bevis: CI röd + annan workflow grön → 1, inte 0
#
# Test-isolering: /tmp/s87-test-ci-wait/ med en gh-stub på PATH som läser ett
# tillståndsfil-scenario. Återställer via trap. INGEN nätverkstrafik, inget
# riktigt gh-anrop, INGEN ändring av real-repo.
#
# LAYOUTEN SPEGLAR PRODUKTIONEN (TASK-72): skriptet kopieras till
# ${TEST_DIR}/scripts/ci-wait.sh och policy-filen till ${TEST_DIR}/.ci-wait-policy.conf
# — samma relation som scripts/ci-wait.sh ↔ .ci-wait-policy.conf i repot. Därmed
# provas den FAKTISKA default-upplösningen av policy-sökvägen, inte en
# env-överstyrd genväg. CI_WAIT_POLICY används bara där frånvaro/tomt värde är
# själva testfallet.
#
# STUBBENS GRÄNS (S91, dyrköpt): en grön stubbsvit bevisar LOGIKEN, inte att
# den möter verkligheten. Superseddad-fixens första version var grön mot alla
# stubbfall och föll ändå direkt mot skarpt API, därför att stubben inte
# speglade att aggregatorn "CI Passed or Skipped" failar by design vid avbrott.
# T12c bär det fallet nu — men lärdomen är att en ändring i denna svit ska
# följas av skarpa körningar mot verkliga run-ID:n innan den anses bevisad.
#
# Användning: bash scripts/test-ci-wait.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: tasks/sessions/archive/2026-07/2026-07-25-session-86.md Del 4 (tidsforensiken)
#        tasks/sessions/archive/2026-07/2026-07-26-session-91.md (superseddad-klassen)
# Etablerad: Session 87 städ-vågen; T12 tillagd Session 91

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s87-test-ci-wait"
GATE_SRC="${REPO_ROOT}/scripts/ci-wait.sh"

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
    mkdir -p "${TEST_DIR}/bin" "${TEST_DIR}/scripts"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/ci-wait.sh"
    chmod +x "${TEST_DIR}/scripts/ci-wait.sh"

    # Policy-fixturen på samma plats relativt skriptet som i repot, så
    # default-upplösningen (<skriptkatalog>/../.ci-wait-policy.conf) provas skarpt.
    printf 'CI_WAIT_WORKFLOW="CI"\n' > "${TEST_DIR}/.ci-wait-policy.conf"
    # Fixtur för "filen finns men värdet är tomt" — ska fälla, inte gissa.
    printf 'CI_WAIT_WORKFLOW=""\n' > "${TEST_DIR}/tom-policy.conf"

    # gh-stub: läser scenariot ur miljövariabler + en räknarfil.
    #   GH_RUNLIST_MISSES  antal `run list`-anrop som ska ge tomt svar först
    #   GH_PENDING_READS   antal `run view --json status`-anrop som ska ge in_progress
    #   GH_JOBS            per-jobb-rader för RÄTT körning, "namn<TAB>conclusion"
    #   GH_NEWER_RUN       (S91) svar på superseddad-frågan: ID för en NYARE
    #                      körning på samma branch, eller tomt = ingen nyare
    #   GH_RUN_META        (S91) "branch<TAB>createdAt<TAB>workflowName"
    #   GH_RIGHT_RUN       (TASK-72) ID som `run list` ger MED --workflow-filter
    #   GH_WRONG_RUN       (TASK-72) ID som `run list` ger UTAN filter
    #   GH_JOBS_WRONG      (TASK-72) per-jobb-rader för FEL körning
    #   GH_CONCLUSION_WRONG(TASK-72) topp-conclusion för FEL körning
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
COUNTER_DIR="${GH_COUNTER_DIR:-/tmp/s87-test-ci-wait}"
RIGHT="${GH_RIGHT_RUN:-4242}"
WRONG="${GH_WRONG_RUN:-5555}"
OTHER="${GH_OTHER_RUN:-7777}"
bump() { # bump <namn> -> skriver ut nytt värde
    local f="${COUNTER_DIR}/.count-$1" n=0
    [[ -f "${f}" ]] && n="$(cat "${f}")"
    n=$(( n + 1 )); printf '%s' "${n}" > "${f}"; printf '%s' "${n}"
}
case "$1" in
  pr)   printf 'deadbeefcafe\n'; exit 0 ;;
  run)
    case "$2" in
      list)
        # S91: superseddad-frågan känns igen på createdAt i --json-fälten;
        # run-upplösningens listanrop begär bara databaseId.
        if [[ "$*" == *"createdAt"* ]]; then
            printf '%s\n' "${GH_NEWER_RUN:-}"; exit 0
        fi
        n="$(bump runlist)"
        if [[ "${n}" -le "${GH_RUNLIST_MISSES:-0}" ]]; then printf '\n'; exit 0; fi
        # TASK-72: commiten bär FLERA workflows. Utan --workflow-filter ger gh
        # senaste körningen oavsett workflow (WRONG); med filter träffar den
        # namngivna workflowen. Det är hela defekten.
        #
        # Urvalet nycklas på VÄRDET, inte bara på flaggans närvaro — annars kan
        # inget test visa att --workflow slår policy-filens värde.
        wf=""; prev=""
        for a in "$@"; do
            [[ "${prev}" == "--workflow" ]] && wf="${a}"
            prev="${a}"
        done
        if [[ -z "${wf}" ]]; then
            printf '%s\n' "${WRONG}"
        elif [[ "${wf}" == "CI" ]]; then
            printf '%s\n' "${RIGHT}"
        else
            printf '%s\n' "${OTHER}"
        fi
        exit 0 ;;
      view)
        # TASK-72: svaren nycklas på RUN-ID:t ($3). Att följa fel körning måste
        # ge ett ANNAT utfall än att följa rätt — annars bevisar urvalstesterna
        # ingenting, eftersom båda körningarna svarat likadant.
        if [[ "$3" == "${WRONG}" ]]; then
            j="${GH_JOBS_WRONG:-CodeQL\tsuccess}"
            c="${GH_CONCLUSION_WRONG:-success}"
            w="CodeQL"
        elif [[ "$3" == "${OTHER}" ]]; then
            j="Annat jobb\tsuccess"
            c="success"
            w="Annan workflow"
        else
            j="${GH_JOBS:-Lint\tsuccess}"
            c="${GH_CONCLUSION:-success}"
            w="CI"
        fi
        # Skilj avläsningarna på vilka --json-fält som begärs.
        if [[ "$*" == *"jobs"* ]]; then
            printf '%b\n' "${j}"
        elif [[ "$*" == *"headBranch"* ]]; then
            printf '%b\n' "${GH_RUN_META:-feat/x\t2026-07-26T12:00:00Z\tCI}"
        elif [[ "$*" == *"headSha"* ]]; then
            # Egen gren sedan S91: föll tidigare igenom till status-grenen och
            # gav "completed success" som SHA — trasig stub, harmlöst utfall.
            # Bär workflow-namnet sedan TASK-72 (vakten skriver ut det).
            printf '%b\n' "deadbeefcafe0123\t${w}"
        else
            n="$(bump statusread)"
            if [[ "${n}" -le "${GH_PENDING_READS:-0}" ]]; then
                printf 'in_progress -\n'
            else
                printf 'completed %s\n' "${c}"
            fi
        fi
        exit 0 ;;
    esac ;;
esac
exit 0
STUB
    chmod +x "${TEST_DIR}/bin/gh"
    rm -f "${TEST_DIR}"/.count-*
}

# EXPECT_OUT (TASK-72): sätts FÖRE ett run_case-anrop för att dessutom kräva en
# sträng i utdatan. Exit-koden ensam kan inte visa VILKEN körning vakten följde,
# och just det är fyndets kärna — vakten rapporterade grönt om fel körning.
# Nollställs av run_case, så den läcker aldrig till nästa fall.
EXPECT_OUT=""

# run_case <namn> <förväntad exit> <max sekunder eller "-"> <env-assignments...> -- <args...>
run_case() {
    local name="$1" want="$2" maxsec="$3"; shift 3
    rm -f "${TEST_DIR}"/.count-*
    local start elapsed got expect="${EXPECT_OUT}"
    EXPECT_OUT=""
    start="$(date +%s)"
    ( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" GH_COUNTER_DIR="${TEST_DIR}" \
        "$@" ) >"${TEST_DIR}/out.txt" 2>&1
    got=$?
    elapsed=$(( $(date +%s) - start ))

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -8
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ "${maxsec}" != "-" && "${elapsed}" -gt "${maxsec}" ]]; then
        printf '  ✗ %s — tog %ss, max %ss\n' "${name}" "${elapsed}" "${maxsec}"
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${expect}" ]]; then
        if ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
            printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
            sed 's/^/      /' "${TEST_DIR}/out.txt" | head -8
            FAILED=$(( FAILED + 1 )); return
        fi
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$(( PASSED + 1 ))
}

setup
printf 'test-ci-wait: kör 27 testfall mot %s\n\n' "${GATE_SRC}"

# T1 — REGRESSIONSVAKTEN. En redan avslutad körning får ALDRIG kosta en sömn.
#      Cykel 3 i S86:s fix-våg sov bort nio minuter på exakt detta.
run_case "T1  terminal-kontroll före första sömnen (redan grön → 0 s)" 0 2 \
    env GH_PENDING_READS=0 GH_JOBS='Lint\tsuccess' \
    bash ./scripts/ci-wait.sh --run 4242 --interval 30 --quiet

run_case "T2  grön körning, alla jobb success → 0" 0 - \
    env GH_JOBS='Lint\tsuccess\nBuild\tsuccess' \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

run_case "T3  failande jobb → 1 (fail-closed)" 1 - \
    env GH_JOBS='Lint\tsuccess\nTest\tfailure' \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

run_case "T4  skippat jobb fäller inte → 0" 0 - \
    env GH_JOBS='Lint\tsuccess\nTest suite\tskipped' \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

run_case "T5  okänd conclusion fäller (fail-closed) → 1" 1 - \
    env GH_JOBS='Lint\tsuccess\nDeploy\ttimed_out' \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

run_case "T6  in_progress → completed, pollar klart → 0" 0 6 \
    env GH_PENDING_READS=2 GH_JOBS='Lint\tsuccess' \
    bash ./scripts/ci-wait.sh --run 4242 --interval 1 --quiet

run_case "T7  aldrig terminal → 2 (timeout, ej hängning)" 2 6 \
    env GH_PENDING_READS=9999 GH_JOBS='Lint\tsuccess' \
    bash ./scripts/ci-wait.sh --run 4242 --interval 1 --timeout 3 --quiet

# T8/T9 bar tidigare `--commit deadbeef` — en FÖRKORTAD SHA, som fungerade
# enbart för att ingen validering fanns. När T11d/e infördes fälldes båda, och
# det är valideringen som gör sitt jobb: den fångade två anropare som skickade
# ett argument `gh run list` aldrig hade kunnat matcha mot verkligheten. SHA:t
# nedan är fiktivt men FULLT — stubben bryr sig inte om värdet, bara vakten gör.
readonly FULL_SHA='deadbeefcafe0123456789abcdef0123456789ab'

run_case "T8  run saknas först, dyker upp → 0" 0 6 \
    env GH_RUNLIST_MISSES=2 GH_JOBS='Lint\tsuccess' \
    bash ./scripts/ci-wait.sh --commit "${FULL_SHA}" --interval 1 --quiet

run_case "T9  run dyker aldrig upp → 2" 2 6 \
    env GH_RUNLIST_MISSES=9999 \
    bash ./scripts/ci-wait.sh --commit "${FULL_SHA}" --interval 1 --timeout 3 --quiet

run_case "T10 --pr-upplösning via headRefOid → 0" 0 - \
    env GH_JOBS='Lint\tsuccess' \
    bash ./scripts/ci-wait.sh --pr 193 --quiet

run_case "T11a användningsfel: ingen mode → 3" 3 - env bash ./scripts/ci-wait.sh --quiet
run_case "T11b användningsfel: dubbel mode → 3" 3 - env bash ./scripts/ci-wait.sh --run 1 --pr 2
run_case "T11c användningsfel: ogiltigt intervall → 3" 3 - env bash ./scripts/ci-wait.sh --run 1 --interval 0

# T11d/e — FÖRKORTAD SHA PÅ --commit (S91, 2026-07-27). Fällan är att
# `gh run list --commit` ger TOM lista utan felkod för en förkortad SHA, så
# vakten pollade hela budgeten och rapporterade timeout — ett CI-problem som
# inte fanns. Fallet måste fälla som ANVÄNDNINGSFEL (3), inte som timeout (2):
# skillnaden är hela poängen, eftersom 2 skickar läsaren till CI och 3 till
# anropet. Full SHA ska passera valideringen och nå den vanliga vägen.
run_case "T11d användningsfel: förkortad SHA på --commit → 3" 3 - env \
    bash ./scripts/ci-wait.sh --commit d52d6c8 --quiet
run_case "T11e användningsfel: 39-teckens SHA på --commit → 3" 3 - env \
    bash ./scripts/ci-wait.sh --commit d52d6c8b30b76f229e407057e9aff16677faea --quiet

# T12 — SUPERSEDDAD ≠ RÖD (S91, mekaniserings-punkt 3).
# cancel-in-progress avbryter föregående körning vid varje ny push, och en
# orkestrerare som kör update-branch på en agents gren gör samma sak. Utfallet
# blev tidigare "RÖD" och skickade läsaren att felsöka en körning som aldrig
# hade något fel — den var bara inaktuell.
#
# NYCKELN ÄR TOPP-NIVÅNS conclusion, INTE jobb-mönstret. Första versionen av
# fixen prövade superseddad-frågan på jobb med conclusion "cancelled" och var
# grön mot stubben — men föll direkt mot verkligheten: aggregatorn
# "CI Passed or Skipped" failar BY DESIGN när jobb avbryts (S77:s fail-closed-
# form), så en avbruten körning bär nästan alltid ett failure-jobb och
# failure-grenen träffade före superseddad-prövningen. Empirisk kartläggning av
# fyra verkliga avbrutna körningar (30202493540, 30201694815, 30201501825,
# 30201387903, alla 2026-07-26) visade att jobb-mönstren varierar helt medan
# topp-conclusion är "cancelled" i samtliga. T12c nedan är det fall som hade
# fångat felet direkt.
#
# GitHubs API bär INGET fält för avbrottsorsaken (verifierat mot 30201494270:
# varken run_attempt, event eller tidsstämplar skiljer concurrency-avbrott från
# manuellt), så frågan blir den enda som spelar roll för beslutet: FINNS en
# nyare körning på samma branch och workflow? Då är utfallet inaktuellt oavsett
# varför det dog.
run_case "T12a topp-conclusion cancelled + nyare finns → 4 (superseddad)" 4 - \
    env GH_CONCLUSION=cancelled GH_JOBS='Lint\tsuccess\nTest suite\tcancelled' \
    GH_NEWER_RUN=9999 \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

run_case "T12b cancelled UTAN nyare körning → 1 (fail-closed, oförändrat)" 1 - \
    env GH_CONCLUSION=cancelled GH_JOBS='Lint\tsuccess\nTest suite\tcancelled' \
    GH_NEWER_RUN= \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

# T12c — VERKLIGHETSFALLET. Aggregatorn failar som konsekvens av avbrottet;
# dess failure är inte oberoende information. Detta är fallet som sänkte v1.
run_case "T12c cancelled + aggregator-failure + nyare → 4 (aggregatorn är följd, ej orsak)" 4 - \
    env GH_CONCLUSION=cancelled \
    GH_JOBS='Detect changed files\tsuccess\nLint\tcancelled\nCI Passed or Skipped\tfailure' \
    GH_NEWER_RUN=9999 \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

# T12d — bara AVBRUTNA körningar kan supersederas. En körning som genuint
# FAILADE behåller sitt röda utfall även om en nyare körning finns.
run_case "T12d topp-conclusion failure + nyare finns → 1 (bara avbrutna supersederas)" 1 - \
    env GH_CONCLUSION=failure GH_JOBS='Lint\tsuccess\nTest\tfailure' \
    GH_NEWER_RUN=9999 \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

# ============================================================
# T13 — VALET AV KÖRNING (TASK-72, 2026-07-28).
#
# DEFEKTEN: `gh run list <selektor> --limit 1` utan `--workflow` returnerar
# senaste körningen för selektorn OAVSETT workflow. Repot kör tre per push till
# main (CI, CodeQL, Post-merge) och bara CI bär required-checken. Mätt skarpt
# på commit 03d18888: den okvalificerade formen valde Post-merge (30398517485),
# inte CI (30398517346), och rapporterade "GRÖN per jobb" på Post-merges jobb.
# Fyndets ursprungliga empiri var commit 148f6766, där CodeQL (30391886253)
# följdes i stället för CI (30391891964).
#
# SCENARIOT NEDAN: stubben ger run 5555 utan filter och 4242 med. 5555:s jobb
# är GRÖNA och 4242:s är RÖDA. Vakten måste alltså landa på 4242 och fälla —
# följer den 5555 blir svaret grönt och testet failar. Exit-koden ensam räcker
# därför som diskriminator, och EXPECT_OUT visar dessutom vilket ID som följdes.
echo ""

EXPECT_OUT="körning 4242"
run_case "T13a --commit följer policyns workflow, inte senaste körningen" 0 - \
    env GH_JOBS='Lint\tsuccess' GH_JOBS_WRONG='CodeQL\tfailure' \
    bash ./scripts/ci-wait.sh --commit "${FULL_SHA}"

EXPECT_OUT="körning 4242"
run_case "T13b --pr följer policyns workflow (headRefOid → commit-uppslag)" 0 - \
    env GH_JOBS='Lint\tsuccess' GH_JOBS_WRONG='CodeQL\tfailure' \
    bash ./scripts/ci-wait.sh --pr 193

EXPECT_OUT="körning 4242"
run_case "T13c --branch följer policyns workflow" 0 - \
    env GH_JOBS='Lint\tsuccess' GH_JOBS_WRONG='CodeQL\tfailure' \
    bash ./scripts/ci-wait.sh --branch main

# Flaggan är den starkare källan: en explicit --workflow ska aldrig kunna
# överröstas av config-filen. Stubben ger 7777 för varje annat workflow-namn än
# policyns "CI", så ID:t i utdatan visar vilken källa som vann.
EXPECT_OUT="körning 7777"
run_case "T13d --workflow-flaggan slår policy-värdet" 0 - \
    env GH_JOBS='Lint\tsuccess' GH_JOBS_WRONG='CodeQL\tfailure' \
    bash ./scripts/ci-wait.sh --branch main --workflow "Annan workflow"

# --run är undantaget: ett run-ID är entydigt och behöver ingen workflow. Det
# är också formen exit 4 pekar ut för att följa en efterträdare — kräver den
# plötsligt config vore superseddad-vägen bruten.
run_case "T13e --run fungerar UTAN policy (entydigt ID)" 0 - \
    env CI_WAIT_POLICY=/finns/inte.conf GH_JOBS='Lint\tsuccess' \
    bash ./scripts/ci-wait.sh --run 4242 --quiet

# FAIL-CLOSED. Utan namn ska vakten VÄGRA, inte välja en godtycklig körning.
# Koden måste vara 3 (anropsfel), inte 2 (timeout): 3 skickar läsaren till
# anropet, 2 till CI — samma skillnad som T11d/e vilar på.
run_case "T13f --commit utan policy → 3 (vägrar hellre än gissar)" 3 - \
    env CI_WAIT_POLICY=/finns/inte.conf \
    bash ./scripts/ci-wait.sh --commit "${FULL_SHA}" --quiet

run_case "T13g policy finns men värdet tomt → 3" 3 - \
    env CI_WAIT_POLICY="${TEST_DIR}/tom-policy.conf" \
    bash ./scripts/ci-wait.sh --branch main --quiet

# ============================================================
# T14 — TVÅSIDIGT BEVIS (TASK-72 AC 4). Hela defekten i ett fall: CI är RÖD
# medan en annan workflow på samma commit är GRÖN. Vakten måste rapportera
# RÖTT. Före fixen valdes den gröna körningen och svaret blev exit 0 — ett
# grönt besked utan täckning på repots sista kontroll före armering.
echo ""
EXPECT_OUT="körning 4242"
run_case "T14  CI röd + annan workflow grön → 1 (RÖTT, inte falskt grönt)" 1 - \
    env GH_JOBS='Lint\tsuccess\nCI Passed or Skipped\tfailure' \
    GH_JOBS_WRONG='Analyze (javascript)\tsuccess' \
    GH_CONCLUSION=failure GH_CONCLUSION_WRONG=success \
    bash ./scripts/ci-wait.sh --commit "${FULL_SHA}"

printf '\ntest-ci-wait: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
