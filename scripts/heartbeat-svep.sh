#!/usr/bin/env bash
# scripts/heartbeat-svep.sh — mekaniserad heartbeat + trevägs-svep för
# landnings-läget (TASK-119, ur S91 tjugoandra resumen).
#
# VARFÖR SKRIPTET FINNS: heartbeaten (CLAUDE.md § Landning, "Svep vid varje
#   väckning") var en bakgrunds-bash orkestreraren skrev för hand varje
#   session — envägs-historik, ingen mekanik, inget grindat. Tre mätta
#   felmoder samma kväll (S91 tjugoandra resumen, 2026-08-01→02):
#     (1) envägs-nyckling — main-topp-vakten var blind för RÖTT (PR #572).
#         Samma klass som L328 redan bevisat tre gånger: en regel/vakt utan
#         mekanism efterlevs inte pålitligt.
#     (2) blind för DIRTY — en armerad-men-konfliktad PR (#575) landar
#         aldrig och går aldrig röd; ett tredje TYST tillstånd ingen vakt såg.
#     (3) armering-är-inte-minne (#565, #575) — `autoMergeRequest: null`
#         betyder INTE "aldrig armerad": en `failed_checks`-utsparkning ur
#         kön konsumerar armeringen tyst och ser identisk ut med en PR som
#         aldrig armerats (CLAUDE.md § Landning, tabellen "Vad
#         `autoMergeRequest: null` betyder").
#
#   L443 (mintad S95, 2026-08-02) namnger den underliggande principfelet:
#   "en vakt som pollar tillståndsBYTE är blind för rött — vakta
#   utfallsKLASSER." Det är skälet till att RÖTT och DIRTY nedan rapporteras
#   var sitt sopande VARJE svep (level-triggered) — inte bara vid övergången
#   in i tillståndet (edge-triggered). En PR som VARIT röd i tio svep i rad
#   ska synas i det elfte precis lika tydligt som i det första.
#
# ═══ A3b — VERKTYGSVALS-PRÖVNING (bygg-eget vs gh extension/watch-verktyg) ═══
#   Krav sedan 2026-07-27 (CONTRIBUTING.md § "Verktygsval före nybygge"):
#   redovisa domen skriftligt även när den blir "bygg eget".
#
#   Prövat mot samma primärkälla som redan låg på disk
#   (docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md,
#   källkods-mätning mot cli/cli@trunk 2026-08-02) OCH skarpt mot detta repo
#   2026-08-02 (se TASK-119-bygget):
#
#     - `gh pr checks --watch` (pkg/cmd/pr/checks/checks.go): pollar VARJE
#       10:e sekund, men mot EN namngiven PR:s StatusCheckRollup — ingen yta
#       för "alla öppna PR:ar mot main", ingen yta för mergeStateStatus
#       (DIRTY), ingen yta för autoMergeRequest. Känner inte till kön alls
#       (sökt `MergeQueue`/`mergeQueue` i filen: 0 träffar, samma fynd som
#       redan låg i research-doket).
#     - `gh run watch` (pkg/cmd/run/watch/watch.go): samma begränsning på
#       ETT run-ID, workflow-run-status — inget PR- eller kö-objekt alls.
#     - `gh pr merge`: engångskoll av `isInMergeQueue`/`mergeStateStatus`,
#       ingen loop, ingen historik mellan anrop — kan inte upptäcka att ETT
#       tillstånd höll i flera svep (exakt L443:s krav).
#     - `gh dash` / community-extensions (`gh-dash` m.fl.): TUI:er för
#       MÄNSKLIG granskning, ingen maskinläsbar exit-kod eller config-driven
#       larmklassning; fel produktkategori för en bakgrundsvakt en agent
#       ska kunna montera i `Monitor`.
#
#   DOM: BYGG EGET. Skälet är strukturellt, inte bekvämlighet: inget
#   `gh`-kommando uttrycker "alla öppna PR:ar mot main, klassade i RÖD/DIRTY/
#   ARMERINGS-KANDIDAT, samma svar oavsett hur länge tillståndet hållit i".
#   `gh` förblir DATAKÄLLAN (all hämtning nedan går via `gh api graphql`/
#   `gh pr list` — inget eget HTTP-lager byggs), bara sväng-logiken är egen.
#   Samma mönster och samma dom som `ci-wait.sh` (§3 i
#   docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md) och
#   `staging-semaphore.sh preflight` — tredje instansen av samma klass.
#
# ANVÄNDNING
#   scripts/heartbeat-svep.sh [--once] [--repo ägare/namn] [--branch namn]
#                             [--interval sek] [--timeout sek] [--quiet]
#
#   --once       kör EN svep-cykel och avsluta med dess verdikt (default:
#                loopar tills --timeout, eller för evigt om timeout=0).
#   --repo       "ägare/namn" — annars HEARTBEAT_REPO i policy-filen.
#   --branch     bas-gren att bevaka — annars HEARTBEAT_BRANCH (default "main").
#   --interval   sömn mellan svep i loop-läge — annars HEARTBEAT_INTERVAL.
#   --timeout    total löptid för loop-läget i sekunder, 0 = obegränsat —
#                annars HEARTBEAT_TIMEOUT. Ignoreras av --once.
#   --quiet      dämpar rutin-raderna ("main oförändrad", "N PR granskade").
#                LARM-raderna (RÖTT/DIRTY/ARMERINGS-KANDIDAT/main-avancerade)
#                skrivs ALLTID — de är hela poängen med svepet.
#
#   Startform som bakgrunds-monitor (den form § Landning pekar på):
#     kör skriptet UTAN --once i en Code-sessions bakgrunds-bash och montera
#     med Monitor-verktyget — varje rad blir en notifikation, exakt den
#     "väckarklocka, aldrig fakta"-form § Landning redan kräver
#     förgrundsverifiering efter.
#
# TREVÄGS-SNAPSHOT PER SVEP
#   1. main-SHA — `gh api repos/<repo>/commits/<branch>`. Avancerar den
#      sedan förra svepet har en landning skett (informationsrad, inget
#      LARM — det är GODA nyheter, men orkestreraren ska agera: starta
#      nästa post).
#   2. RÖDA check-rollups — `commits(last:1).commit.statusCheckRollup.state`
#      (GitHubs EGEN aggregat-klassning per PR — täcker required/icke-
#      required-semantik utan att skriptet gissar) för VARJE öppen PR mot
#      basgrenen. FAILURE/ERROR ⇒ RÖTT. Rapporteras varje svep tillståndet
#      håller, inte bara vid övergången (L443).
#   3. DIRTY-mängd — `mergeStateStatus == "DIRTY"` för VARJE öppen PR.
#      Samma level-triggered rapportering.
#
#   Utöver de tre namngivna vägarna: en FJÄRDE, ur samma tabell (§ Landning,
#   "armering-är-inte-minme"). En öppen, icke-draft PR i mergeStateStatus
#   CLEAN/UNSTABLE utan aktiv `autoMergeRequest` KAN vara aldrig-armerad
#   ELLER en `failed_checks`-utsparkning som konsumerat sin armering — de
#   två fallen är, per CLAUDE.md:s egen tabell, INTE urskiljbara ur statiskt
#   API-svar. Skriptet FLAGGAR kandidaten (fälls) i stället för att gissa;
#   disambigueringen (ett andra `gh pr merge --auto --merge`) är
#   orkestrerarens steg, inte skriptets — att låta ett bakgrundsskript
#   autonomt köa om en PR utan mänsklig granskning vore en ny, oprövad
#   risk-yta ingen del av kortet efterfrågar.
#
#   TASK-128 (2026-08-03): den ursprungliga formuleringen ovan missade en
#   TREDJE möjlighet bakom `autoMergeRequest: null` — PR:en är redan
#   FRAMGÅNGSRIKT KÖAD. Tabellrad 2 (§ Landning): en PR som var `CLEAN` vid
#   armeringen köas direkt och `autoMergeRequest` sätts ALDRIG — det är
#   normalfallet, inte ett undantag. Den koden fanns inte urskiljbar när
#   kommentaren skrevs, men fältet `isInMergeQueue` på `PullRequest`-typen
#   GÖR den urskiljbar: hämtat i samma GraphQL-query nedan och exkluderat ur
#   kandidat-villkoret. Mätt sju gånger under mekanismens första skarpa natt
#   (2026-08-02): PR #614, #617 (×3), #621, #623, #624 — samtliga
#   `isInMergeQueue: true`, `autoMergeRequest: null`, `mergeStateStatus:
#   CLEAN`, samtliga falsklarm. `isInMergeQueue` löser INTE den ursprungliga
#   ambiguiteten (aldrig-armerad vs. utsparkad-med-konsumerad-armering) —
#   båda de fallen har `isInMergeQueue: false` och ska, korrekt, FORTFARANDE
#   flaggas som kandidat. Vad fältet gör är att ta bort en TREDJE, felaktigt
#   inkluderad grupp (redan köad) ur kandidat-mängden helt.
#
# EXIT-KODER (fail-closed, bitmask i --once/slutläge)
#   0   inga LARM — main ev. oförändrad, inga PR:ar RÖDA/DIRTY/kandidater
#   1   RÖTT      — minst en öppen PR har FAILURE/ERROR i sin check-rollup
#   2   DIRTY     — minst en öppen PR har mergeStateStatus DIRTY
#   4   KANDIDAT  — minst en öppen, icke-draft PR är CLEAN/UNSTABLE utan
#                   aktiv auto-merge-begäran OCH inte redan köad
#                   (isInMergeQueue=false) — möjlig konsumerad armering
#                   eller aldrig-armerad (TASK-128)
#       (bitmask-summerade, 1..7 vid flera samtidiga larm)
#  64   användningsfel — config/flagga saknas eller ogiltig (sysexits
#       EX_USAGE, samma konvention som staging-semaphore.sh)
#  77   sonden kunde inte svara — ett `gh`-anrop misslyckades (fail-closed,
#       samma kod och skäl som staging-semaphore.sh: ett obesvarat
#       instrument är farligare tystnat än fällt)
#
#   main-SHA-avancemang bär INGEN egen exit-bit: det är alltid goda
#   nyheter, aldrig ett larm i sig.
#
# gh-binären kan överstyras med GH_BIN (testsvitens stub-väg, samma form
# som ci-wait.sh/staging-semaphore.sh). Policy-filen med
# HEARTBEAT_SVEP_POLICY, tillstånds-katalogen (senast sedda main-SHA) med
# HEARTBEAT_STATE_DIR — samma testbarhets-mönster som
# MM_STAGING_LOCK_DIR i staging-semaphore.sh.
#
# Testsvit: scripts/test-heartbeat-svep.sh
#
# Källa: CLAUDE.md § Landning ("Svep vid varje väckning" + tabellen om
#        `autoMergeRequest: null`) · tasks/lessons.md L443 · L328 ·
#        docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md
# Etablerad: TASK-119, 2026-08-02
set -euo pipefail

GH="${GH_BIN:-gh}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEARTBEAT_SVEP_POLICY="${HEARTBEAT_SVEP_POLICY:-${SCRIPT_DIR}/../.heartbeat-svep-policy.conf}"
STATE_DIR="${HEARTBEAT_STATE_DIR:-/tmp/mm-heartbeat-svep}"

REPO=""
BRANCH=""
INTERVAL=""
TIMEOUT=""
ONCE=0
QUIET=0

if [[ -f "${HEARTBEAT_SVEP_POLICY}" ]]; then
    # shellcheck source=/dev/null
    source "${HEARTBEAT_SVEP_POLICY}"
    REPO="${HEARTBEAT_REPO:-}"
    BRANCH="${HEARTBEAT_BRANCH:-}"
    INTERVAL="${HEARTBEAT_INTERVAL:-}"
    TIMEOUT="${HEARTBEAT_TIMEOUT:-}"
fi
PR_LIMIT="${HEARTBEAT_PR_LIMIT:-100}"

die() { printf 'heartbeat-svep: %s\n' "$1" >&2; exit "${2:-64}"; }
say() { [[ "${QUIET}" -eq 1 ]] || printf '%s\n' "$1"; }
# Larm-rader (alarm() nedan) skrivs ALLTID, oavsett --quiet — de är hela
# poängen med svepet (L443: ett tillstånd som håller i ska synas varje gång).
alarm() { printf '%s\n' "$1"; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --repo)     REPO="${2:-}";     shift 2 ;;
        --branch)   BRANCH="${2:-}";   shift 2 ;;
        --interval) INTERVAL="${2:-}"; shift 2 ;;
        --timeout)  TIMEOUT="${2:-}";  shift 2 ;;
        --once)     ONCE=1; shift ;;
        --quiet)    QUIET=1; shift ;;
        # Radintervallet är § ANVÄNDNING. Ändras huvudet ovan måste det
        # följa med — annars ljuger --help tyst (samma disciplin som ci-wait.sh).
        -h|--help)  sed -n '61,81p' "$0"; exit 0 ;;
        *) die "okänt argument: $1" ;;
    esac
done

[[ -n "${BRANCH}" ]] || BRANCH="main"

[[ -n "${REPO}" ]] || die "REPO saknas — sätt HEARTBEAT_REPO=\"ägare/namn\" i
   ${HEARTBEAT_SVEP_POLICY}
   eller ange:  --repo <ägare/namn>"

[[ -n "${INTERVAL}" ]] || die "INTERVAL saknas — sätt HEARTBEAT_INTERVAL i
   ${HEARTBEAT_SVEP_POLICY}
   eller ange:  --interval <sek>"
[[ "${INTERVAL}" =~ ^[1-9][0-9]*$ ]] || die "--interval måste vara ett positivt heltal, fick '${INTERVAL}'"

[[ -n "${TIMEOUT}" ]] || TIMEOUT=0
[[ "${TIMEOUT}" =~ ^[0-9]+$ ]] || die "--timeout måste vara ett heltal ≥ 0 (sekunder, 0 = obegränsat), fick '${TIMEOUT}'"

mkdir -p "${STATE_DIR}"
STATE_FILE="${STATE_DIR}/last-main-sha"

# --- EN svep-cykel ----------------------------------------------------------
# Returnerar bitmask-verdikten via $? (0/1/2/4/kombinationer, 77 vid sond-fel).
# Sätter aldrig `exit` själv (anropas i `||`-position av loopen), så
# funktionen returnerar via `return`.
sweep_once() {
    local main_sha rc verdict=0

    set +e
    main_sha="$("${GH}" api "repos/${REPO}/commits/${BRANCH}" --jq '.sha' 2>/dev/null)"
    rc=$?
    set -e
    if [[ "${rc}" -ne 0 || -z "${main_sha}" ]]; then
        alarm "heartbeat-svep: SONDEN KUNDE INTE SVARA — main-SHA (repo ${REPO}, gren ${BRANCH})."
        return 77
    fi

    local prev=""
    [[ -f "${STATE_FILE}" ]] && prev="$(cat "${STATE_FILE}" 2>/dev/null || true)"
    if [[ -n "${prev}" && "${prev}" != "${main_sha}" ]]; then
        alarm "heartbeat-svep: main AVANCERADE ${prev:0:8} → ${main_sha:0:8} — en landning skedde, starta nästa post."
    else
        say "heartbeat-svep: main oförändrad (${main_sha:0:8})."
    fi
    printf '%s' "${main_sha}" > "${STATE_FILE}"

    local rows
    set +e
    # shellcheck disable=SC2016
    # Enkla citattecken är AVSIKTLIGA: $owner/$name/$branch/$limit är
    # GraphQL-variabler som `-f`/`-F` binder på anropet nedan, inte
    # bash-variabler — de ska INTE expanderas av skalet. Samma form som
    # GraphQL-anropen i docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md.
    rows="$("${GH}" api graphql -f query='
        query($owner:String!, $name:String!, $branch:String!, $limit:Int!) {
          repository(owner:$owner, name:$name) {
            pullRequests(states: OPEN, first: $limit, baseRefName: $branch) {
              nodes {
                number
                isDraft
                mergeStateStatus
                autoMergeRequest { enabledAt }
                isInMergeQueue
                commits(last: 1) {
                  nodes { commit { statusCheckRollup { state } } }
                }
              }
            }
          }
        }' \
        -f "owner=${REPO%%/*}" -f "name=${REPO#*/}" -f "branch=${BRANCH}" -F "limit=${PR_LIMIT}" \
        --jq '.data.repository.pullRequests.nodes[] | [
                .number, .isDraft, .mergeStateStatus,
                (.autoMergeRequest != null),
                (.commits.nodes[0].commit.statusCheckRollup.state // "NONE"),
                .isInMergeQueue
              ] | @tsv' 2>/dev/null)"
    rc=$?
    set -e
    if [[ "${rc}" -ne 0 ]]; then
        alarm "heartbeat-svep: SONDEN KUNDE INTE SVARA — pr-lista (repo ${REPO}, gren ${BRANCH})."
        return 77
    fi

    local granskade=0 antal_rott=0 antal_dirty=0 antal_kandidat=0
    while IFS=$'\t' read -r nr draft mss automerge rollup inqueue; do
        [[ -n "${nr}" ]] || continue
        granskade=$(( granskade + 1 ))

        # RÖTT — GitHubs egen aggregat-klassning per PR (kräver/icke-kräver
        # redan uppslaget av GitHub, skriptet gissar inte). Fail-closed:
        # allt annat än SUCCESS/PENDING/EXPECTED/NONE räknas som RÖTT —
        # samma "allt som inte är uttryckligen grönt fäller"-princip som
        # ci-wait.sh (StatusState-enumet har bara fem värden totalt: SUCCESS,
        # FAILURE, ERROR, PENDING, EXPECTED — NONE är skriptets egen
        # sentinel för "inga checks alls ännu").
        case "${rollup}" in
            SUCCESS|PENDING|EXPECTED|NONE) ;;
            *)
                alarm "heartbeat-svep: RÖTT — PR #${nr} har check-rollup '${rollup}'."
                antal_rott=$(( antal_rott + 1 ))
                ;;
        esac

        # DIRTY — konfliktad, landar aldrig utan åtgärd, blir aldrig röd
        # av sig själv (S91-fyndet, felmod 2).
        if [[ "${mss}" == "DIRTY" ]]; then
            alarm "heartbeat-svep: DIRTY — PR #${nr} är konfliktad (mergeStateStatus=DIRTY)."
            antal_dirty=$(( antal_dirty + 1 ))
        fi

        # ARMERINGS-KANDIDAT — CLEAN/UNSTABLE, icke-draft, utan aktiv
        # auto-merge-begäran, OCH INTE redan köad. Kan vara ALDRIG ARMERAD
        # eller en `failed_checks`-utsparkning som konsumerat sin armering —
        # de två är, per CLAUDE.md § Landning, INTE urskiljbara ur statiskt
        # svar. Flaggas som kandidat, disambiguering är orkestrerarens steg.
        # `isInMergeQueue=true` (TASK-128) skiljer däremot ut en TREDJE,
        # felaktigt inkluderad grupp: en korrekt armerad PR som redan köats
        # (autoMergeRequest nollas vid köning, se CLAUDE.md § Landning
        # tabellrad 2) — den ska INTE larma alls.
        if [[ "${automerge}" == "false" && "${draft}" == "false" \
              && ( "${mss}" == "CLEAN" || "${mss}" == "UNSTABLE" ) \
              && "${inqueue}" == "false" ]]; then
            alarm "heartbeat-svep: ARMERINGS-KANDIDAT — PR #${nr} är ${mss} utan aktiv auto-merge-begäran. Kan vara ALDRIG ARMERAD eller UTSPARKAD med konsumerad armering (CLAUDE.md § Landning). Disambiguera: gh pr merge ${nr} --auto --merge"
            antal_kandidat=$(( antal_kandidat + 1 ))
        fi
    done <<<"${rows}"

    say "heartbeat-svep: ${granskade} öppna PR:ar granskade mot ${BRANCH} — ${antal_rott} röda, ${antal_dirty} dirty, ${antal_kandidat} armerings-kandidater."

    [[ "${antal_rott}"     -gt 0 ]] && verdict=$(( verdict | 1 ))
    [[ "${antal_dirty}"    -gt 0 ]] && verdict=$(( verdict | 2 ))
    [[ "${antal_kandidat}" -gt 0 ]] && verdict=$(( verdict | 4 ))

    if [[ "${verdict}" -eq 0 ]]; then
        say "heartbeat-svep: ALLT LUGNT."
    else
        alarm "heartbeat-svep: LARM (bitmask ${verdict}) — se rader ovan."
    fi
    return "${verdict}"
}

# --- Körläge -----------------------------------------------------------------
# sweep_once() TOGGLAR set -e/+e INTERNT kring varje gh-anrop (för att kunna
# läsa dess $? manuellt utan att skalet avbryter). Anropas den under ett
# imperativt `set +e; sweep_once; rc=$?; set -e` läcker den interna
# återinkopplingen av set -e UT ur funktionen: skalet är redan i set -e-läge
# igen när `return <ickenoll>` exekveras, och avslutar hela skriptet DÄR,
# innan `rc=$?` någonsin nås (bevisat i en minimal repro under TASK-119-
# bygget — loop-läget slutade efter EN sopning trots --timeout, exakt detta
# fel). `sweep_once || rc=$?` är immunt: `||`-positionen är en SYNTAKTISK
# undantags-plats för set -e (samma familj som if/while-villkor), så den
# gäller oavsett vad funktionen gör invärtes med set -e/+e.
if [[ "${ONCE}" -eq 1 ]]; then
    RC=0
    # shellcheck disable=SC2310
    # AVSIKTLIGT: verdikten (0/1/2/4/77) är en KLASSNING, inte ett fel —
    # `||` fångar den utan att skriptet avbryts, och $? läses av omedelbart
    # på nästa rad. Se stycket ovan för varför imperativ set+e/-e-togglning
    # INTE fungerar här.
    sweep_once || RC=$?
    exit "${RC}"
fi

NOW="$(date +%s)"
DEADLINE=0
[[ "${TIMEOUT}" -gt 0 ]] && DEADLINE=$(( NOW + TIMEOUT ))

LAST_VERDICT=0
while :; do
    LAST_VERDICT=0
    # shellcheck disable=SC2310  # se motiveringen ovan (--once-grenen)
    sweep_once || LAST_VERDICT=$?

    NOW="$(date +%s)"
    if [[ "${DEADLINE}" -gt 0 && "${NOW}" -ge "${DEADLINE}" ]]; then
        say "heartbeat-svep: --timeout uppnått — avslutar loop-läget."
        break
    fi
    sleep "${INTERVAL}"
done

exit "${LAST_VERDICT}"
