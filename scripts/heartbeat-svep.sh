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
#   --quiet      dämpar RUTIN-raderna ("main oförändrad", "N PR granskade").
#                Två klasser skrivs ALLTID, oavsett --quiet:
#                  LARM       RÖTT/DIRTY/ARMERINGS-KANDIDAT — bär en
#                             exit-bit (§ EXIT-KODER), kräver åtgärd.
#                  ALLTID-PÅ  main-avancerade/main-baslinje-satt — INGEN
#                             exit-bit (alltid goda nyheter, eller ett
#                             neutralt faktum), men samma --quiet-immunitet
#                             som LARM. TASK-135 (2026-08-04) skilde ut
#                             klassen ordagrant — en tidigare formulering
#                             kallade båda "LARM-raderna" rakt av, vilket
#                             motsade § TREVÄGS-SNAPSHOT nedan
#                             ("ALLTID-PÅ, inte en LARM-klass").
#
#                KALLSTART (TASK-135): en avancemang-rad KRÄVER ett KÄNT
#                tidigare SHA att jämföra mot. Saknas det (skriptets allra
#                första sopning, eller en tömd/ny tillstånds-katalog) finns
#                inget att jämföra mot — INTE en --quiet-bugg, utan den
#                fundamentala gränsen för en tvåprovs-jämförelse. Skriptet
#                skriver då en egen "main-SHA-baslinje satt"-rad (ALLTID-PÅ)
#                i stället för tystnad: annars är en genuin kallstart och en
#                tystad, uteblivet-larm-sopning omöjliga att skilja åt i en
#                --quiet rå-logg — exakt den förväxling som startade
#                TASK-135 (svepet observerades aldrig visa en
#                avancemang-rad efter en landning; förklaringen var
#                kallstart/förlorad tillståndskontinuitet, inte trasig
#                --quiet-hantering — den var, mätt, redan korrekt).
#
#   Startform som bakgrunds-monitor (den form § Landning pekar på):
#     kör skriptet UTAN --once i en Code-sessions bakgrunds-bash och montera
#     med Monitor-verktyget — varje rad blir en notifikation, exakt den
#     "väckarklocka, aldrig fakta"-form § Landning redan kräver
#     förgrundsverifiering efter.
#
#   UNDERHÅLL — GLES GREN-STÄDNING (TASK-323, config-driven, DESTRUKTIV):
#     står HEARTBEAT_STADA_GRENAR_INTERVALL > 0 i policy-filen anropar svepet
#     scripts/stada-grenar.sh --utfor högst så ofta (sekunder mellan
#     körningar, tillstånd i STATE_DIR). Skriptet raderar LOKALA grenar som
#     är mergade i bas-grenen, ALDRIG med -D, bakom sina fyra egna skydd
#     (bas-gren · aktuell gren · uppcheckad i någon worktree · skyddslista).
#     0 eller osatt ⇒ AV — en spoke-kopia utan värdet städar ingenting.
#     Städningen bär INGEN exit-bit: den är UNDERHÅLL, inte övervakning, och
#     kan aldrig göra ett svep till ett larm ens när den själv fallerar.
#
# TREVÄGS-SNAPSHOT PER SVEP
#   1. main-SHA — `gh api repos/<repo>/commits/<branch>`. Avancerar den
#      sedan förra svepet har en landning skett (ALLTID-PÅ, inte en
#      LARM-klass — det är GODA nyheter, men orkestreraren ska agera:
#      starta nästa post). Saknas ett känt tidigare SHA att jämföra mot
#      (kallstart, § ANVÄNDNING) skrivs i stället en "main-SHA-baslinje
#      satt"-rad, likaledes ALLTID-PÅ (TASK-135, 2026-08-04).
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
#   disambigueringen (ett andra `gh pr merge --auto`) är
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
#   Fynd 2026-08-04 (samma S97-natt som TASK-135): en FJÄRDE grupp behöver
#   samma behandling av motsatt skäl — PR:ar som ÄR genuina
#   armerings-kandidater men vars författare medvetet lämnats oarmerad
#   (dependabot-kvartetten #632–#635, väntar på Marcus inbjudan, S97
#   sessionsdok § "Ej i scope"). De larmade VARJE svep, level-triggered per
#   L443, tills mekanismen fanns. `HEARTBEAT_EXEMPT_AUTHORS`
#   (.heartbeat-svep-policy.conf, matchat mot GraphQL-fältet
#   `author.login`) undantar dem från bit 4 UTAN att göra dem osynliga — en
#   RUTIN-rad (say(), dämpad av --quiet) ersätter larm-raden. RÖTT/DIRTY
#   för samma PR:ar är OFÖRÄNDRADE: undantaget rör bara "ingen aktiv
#   auto-merge-begäran"-tolkningen, aldrig ett verkligt trädfel. Fullt
#   formval-resonemang (författare vs. etikett, falsifierat mot
#   .github/dependabot.yml) i policy-filens egen kommentar.
#
# EXIT-KODER (fail-closed, bitmask i --once/slutläge)
#   0   inga LARM — main ev. oförändrad, inga PR:ar RÖDA/DIRTY/kandidater
#   1   RÖTT      — minst en öppen PR har FAILURE/ERROR i sin check-rollup
#   2   DIRTY     — minst en öppen PR har mergeStateStatus DIRTY
#   4   KANDIDAT  — minst en öppen, icke-draft PR är CLEAN/UNSTABLE utan
#                   aktiv auto-merge-begäran OCH inte redan köad
#                   (isInMergeQueue=false) — möjlig konsumerad armering
#                   eller aldrig-armerad (TASK-128). PR:ar vars författare
#                   står i HEARTBEAT_EXEMPT_AUTHORS räknas INTE in i denna
#                   bit (fynd 2026-08-04) — de syns i stället som en
#                   dämpningsbar rutin-rad, se § ARMERINGS-KANDIDAT ovan.
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
#   Gren-städningen (§ UNDERHÅLL, TASK-323) bär INGEN egen exit-bit heller,
#   av ett ANNAT skäl: den är en UNDERHÅLLS-åtgärd, inte en observation av
#   landnings-läget. Ett fel i den (skriptet saknas, en radering vägras)
#   säger ingenting om PR-läget svepet finns för att bevaka, och får därför
#   aldrig maskeras in i verdikten — en röd städning som gjorde svepet
#   "rött" hade fått orkestreraren att leta efter en trasig PR som inte
#   finns.
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
#
# TASK-135 (2026-08-04): PR #684 landade (10:19:45Z) medan svepet redan
# kördes (--quiet, loop-läge) — minst tre sopningar EFTER landningen
# loggade RÖTT/ARMERINGS-KANDIDAT men aldrig en avancemang-rad, vilket såg
# ut som en trasig --quiet-hantering. Grundlig empirisk prövning (kontinu-
# erligt loop-läge OCH separata --once-anrop, båda med delat tillstånd och
# --quiet) visade att avancemang-raden REDAN var korrekt ALLTID-PÅ i varje
# konstruerad situation — koden höll inte den bugg uppdraget antog. Den
# faktiska luckan: en KALLSTART (inget känt tidigare SHA — skriptets första
# sopning, eller en ny/tömd tillstånds-katalog) gick tidigare via den
# TYSTADE say()-grenen, vilket gör en genuin kallstart omöjlig att skilja
# från en tystad "inget hände"-sopning i en --quiet rå-logg. Fixen: en
# explicit "main-SHA-baslinje satt"-rad (ALLTID-PÅ) för just det fallet.
# Se scripts/test-heartbeat-svep.sh T23 för tvåsidigt bevis.
set -euo pipefail

GH="${GH_BIN:-gh}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEARTBEAT_SVEP_POLICY="${HEARTBEAT_SVEP_POLICY:-${SCRIPT_DIR}/../.heartbeat-svep-policy.conf}"
STATE_DIR="${HEARTBEAT_STATE_DIR:-/tmp/mm-heartbeat-svep}"

# Gren-städarens binär (TASK-323). Overrideable av samma skäl som GH_BIN:
# testsviten kopierar BARA heartbeat-svep.sh till sin TEST_DIR, så en
# hårdkodad SCRIPT_DIR-sökväg hade gjort städvägen otestbar utan att köra
# den skarpt mot ett riktigt repo.
STADA_BIN="${HEARTBEAT_STADA_BIN:-${SCRIPT_DIR}/stada-grenar.sh}"

# Fail-closed default INNAN source: en policy-fil UTAN variabeln (äldre
# spoke-kopia, eller filen saknas helt) städar INGENTING. Motsatt riktning
# mot HEARTBEAT_EXEMPT_AUTHORS ovan, och avsiktligt: den mekanismen tystar
# ett larm om den är av, DENNA raderar grenar om den är på. Ett osatt värde
# ska aldrig kunna bli en destruktiv operation någon inte bett om.
HEARTBEAT_STADA_GRENAR_INTERVALL=0

REPO=""
BRANCH=""
INTERVAL=""
TIMEOUT=""
ONCE=0
QUIET=0
# Fail-open default: tom array. Deklareras FÖRE source så en policy-fil
# utan HEARTBEAT_EXEMPT_AUTHORS (äldre spoke-kopia, eller filen saknas helt)
# lämnar mekanismen av — ingen PR tystas — i stället för att skriptet
# kraschar på en odefinierad variabel (§ ARMERINGS-KANDIDAT nedan).
HEARTBEAT_EXEMPT_AUTHORS=()

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

# is_exempt_author <login> — sant om <login> finns i HEARTBEAT_EXEMPT_AUTHORS
# (.heartbeat-svep-policy.conf § "PR-författare vars öppna PR:ar ALDRIG
# larmar som ARMERINGS-KANDIDAT"). "${arr[@]:-}" (inte bara "${arr[@]}")
# är AVSIKTLIGT: bash 3.2 (macOS-default) kastar "unbound variable" på en
# TOM array under `set -u` utan `:-`-fallbacken, även när arrayen redan är
# deklarerad — samma idiom som GRIND_UNDANTAG-loopen i
# deny-grind-genom-pipe.sh.
is_exempt_author() {
    local candidate="$1" a
    for a in "${HEARTBEAT_EXEMPT_AUTHORS[@]:-}"; do
        [[ -n "${a}" ]] || continue
        [[ "${candidate}" == "${a}" ]] && return 0
    done
    return 1
}

# ── FEMTE VÄGEN: gles gren-städning (TASK-323) ───────────────────────────────
#
# VARFÖR HÄR OCH INTE I EN HOOK ELLER I CI — de fyra kandidaterna kortet
# räknar upp, prövade mot mätning i stället för smak:
#
#   post-merge-hook   AVFÄRDAD. `post-merge` fyrar bara när ett LOKALT `git
#                     merge`/`git pull` faktiskt kör (git-scm.com/docs/
#                     githooks). Våra merges sker på GitHubs servrar via
#                     merge queue — ingen lokal merge inträffar, så hooken
#                     fyrar aldrig av landningen. Den skulle på sin höjd
#                     fyra långt senare, om någon råkar `pull`:a i
#                     huvudkatalogen. Dessutom: repot har EN hook
#                     (.githooks/pre-commit), och `core.hooksPath` skrivs om
#                     av Claude Code vid VARJE worktree-skapelse (T121) —
#                     hook-vägen är strukturellt opålitlig just här.
#   nightly.yml (CI)  AVFÄRDAD, fysiskt omöjlig. Lokala grenar finns bara i
#                     Marcus klon; en GitHub-runner har en egen färsk klon
#                     utan dem. Den kan inte se det den ska städa.
#   worktree-remove   AVFÄRDAD för DENNA landning. stada-worktrees.sh bor i
#                     marcus-hub-pluginet (annat repo, utanför denna diff),
#                     fyrar bara vid paus-svep (sällan), och städar bara de
#                     grenar en worktree den tar bort råkar hålla — aldrig
#                     grenar som aldrig hade en worktree.
#   heartbeat (VALD)  Den enda mekanism som redan är PERSISTENT igång exakt
#                     när grenarna växer. Återväxten (~49 grenar/dygn,
#                     docs/research/backlog-kortskapandets-flaskhals-
#                     2026-08-26.md § Återväxten) produceras av fleeten, och
#                     en fleet förutsätter en orkestrerare — som kör detta
#                     svep. Korrelationen är själva argumentet: städningen är
#                     aktiv precis under de timmar skulden byggs, och sover
#                     när ingen bygger den.
#
# VARFÖR TIDSBASERAD OCH INTE KNUTEN TILL main-AVANCEMANG: avancemanget vore
# semantiskt precisare ("nu blev grenar mergade"), men vinsten är marginell
# — grenar mergas löpande och ett glest tidsfönster fångar dem ändå — medan
# kostnaden är en extra tillståndskoppling mellan två oberoende vägar.
# Över-engineering-vakten (~/.claude/CLAUDE.md): ren tid vinner.
#
# VARFÖR GLES OCH INTE VARJE SVEP: MÄTT 2026-08-28 i denna worktree — en
# torrkörning över 193 grenar tog 23,4 s (157 kandidater, 36 skonade). Var
# 90:e sekund hade ätit ~26 % av svep-cykeln och fördröjt varje larm.
# Kostnaden är dessutom självbegränsande: den faller med grenantalet, så
# efter första sopningen är den en bråkdel.
#
# VARFÖR INGET LÅS MOT PÅGÅENDE backlog-SKANNING (kortets designfråga (c)):
# Backlog.md tar ett fingeravtryck av aktiva gren-refs före varje laddning
# och jämför efter; ändras det RETRYAR den, och först på tredje försöket
# kastas "Active branch refs or configuration kept changing while tasks were
# loading" (verbatim ur node_modules/backlog.md-darwin-x64/backlog).
# Risken är alltså VERKLIG men kräver att alla tre försöken störs. Två
# egenskaper håller den nere utan lås: raderings-fönstret är glest (default
# var 30:e minut) och kort, och — viktigast — en ID-KOLLISION är strukturellt
# omöjlig oavsett timing: skriptet rör bara grenar som är MERGADE i
# bas-grenen, och ett mergat korts fil ligger redan i backlog/tasks/ på main.
# Skanningen finns för att hitta kort på ICKE-landade grenar; de rörs aldrig.
# Ett lås mot ett CLI som inte känner till vårt lås vore dessutom inte
# byggbart utan att wrappa varje backlog-anrop i repot.
#
# KONTRAKT: returnerar ALLTID 0. Skriver som mest en RUTIN-rad (say(),
# dämpas av --quiet). Larmar aldrig, bär ingen exit-bit, och tiger helt när
# ingenting raderades.
stada_grenar_om_dags() {
    local intervall nu senast utfil rc raderade

    intervall="${HEARTBEAT_STADA_GRENAR_INTERVALL:-0}"
    # Ogiltigt värde behandlas som AV, inte som fel: en trasig policy-rad ska
    # inte kunna stoppa landnings-bevakningen (som är svepets faktiska jobb).
    [[ "${intervall}" =~ ^[0-9]+$ ]] || return 0
    [[ "${intervall}" -gt 0 ]] || return 0
    [[ -x "${STADA_BIN}" ]] || return 0

    nu="$(date +%s)"
    senast=0
    if [[ -f "${STADA_STATE_FILE}" ]]; then
        senast="$(cat "${STADA_STATE_FILE}" 2>/dev/null || echo 0)"
        [[ "${senast}" =~ ^[0-9]+$ ]] || senast=0
    fi
    [[ $(( nu - senast )) -ge "${intervall}" ]] || return 0

    # Stämpla FÖRE körningen, inte efter. En städning som hänger eller dör
    # halvvägs ska inte kunna starta om vid VARJE svep därefter — då vore en
    # trasig städning en 90-sekunders-loop av destruktiva anrop i stället för
    # ett glest försök. Samma "stämpla försöket, inte framgången"-disciplin
    # som backoff-mönster i allmänhet.
    printf '%s' "${nu}" > "${STADA_STATE_FILE}" 2>/dev/null || true

    utfil="${STATE_DIR}/stada-grenar-senaste-utdata.txt"
    rc=0
    # INGEN --ingen-fetch, med avsikt. Svepets egen main-SHA-väg går via
    # `gh api` och rör ALDRIG git-refs, så den lokala origin/main är inte
    # färsk bara för att svepet kört. stada-grenar.sh:s eget huvud är
    # explicit: en stale bas kan bara UNDER-rapportera (missa nyligen
    # landade grenar), aldrig radera fel — men den skriver också att
    # `--ingen-fetch` "finns bara för offline/test-bruk". En fetch var
    # HEARTBEAT_STADA_GRENAR_INTERVALL:e sekund är försumbar; att städa mot
    # en stale bas vore att bygga in den under-rapportering vi städar för
    # att slippa.
    "${STADA_BIN}" --utfor > "${utfil}" 2>&1 || rc=$?

    if [[ "${rc}" -ne 0 ]]; then
        say "heartbeat-svep: UNDERHÅLL — gren-städningen gav exit ${rc}. Svepets verdikt är OPÅVERKAT (städning larmar aldrig). Utdata: ${utfil}"
        return 0
    fi

    # `|| true`: set -o pipefail är aktivt i detta skript, och en tom/oväntad
    # utdata får inte kunna avbryta svepet via set -e. Städningen larmar
    # aldrig — då får den inte heller krascha på sin egen rapport-parsning.
    raderade="$(sed -n 's/^Raderade grenar: *\([0-9][0-9]*\).*/\1/p' "${utfil}" | tail -1 || true)"
    [[ "${raderade}" =~ ^[0-9]+$ ]] || raderade=0

    # TYST VID NOLL (kortets designkrav (b)): en idempotent körning som inte
    # hittade något att göra är ingen nyhet och skriver ingenting alls.
    [[ "${raderade}" -gt 0 ]] || return 0

    say "heartbeat-svep: UNDERHÅLL — ${raderade} mergade lokala grenar städade (stada-grenar.sh, aldrig -D). Nästa tidigast om ${intervall}s."
    return 0
}

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
        # Utökat 61,81 → 61,104 i TASK-135 (ALLTID-PÅ-klass + kallstart-
        # stycket), 61,104 → 61,114 i TASK-323 (§ UNDERHÅLL — gles
        # gren-städning; en DESTRUKTIV bieffekt får aldrig stå utanför det
        # block --help faktiskt visar);
        # scripts/test-heartbeat-svep.sh T24 fäller om raden
        # avviker från blockets faktiska start/slut.
        -h|--help)  sed -n '61,114p' "$0"; exit 0 ;;
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
# Gren-städningens egen tidsstämpel (TASK-323). Egen fil, inte en rad i
# STATE_FILE: de två vägarna är oberoende och ska kunna nollställas var för
# sig — testsviten river STATE_DIR mellan fall och båda ska då kallstarta
# rent, utan att den ena vägens format kan korrumpera den andras.
STADA_STATE_FILE="${STATE_DIR}/last-stada-grenar"

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
    elif [[ -z "${prev}" ]]; then
        # KALLSTART (TASK-135): inget tidigare känt SHA att jämföra mot —
        # varken den här sopningen eller en TYST "main oförändrad" kan vara
        # rätt beskrivning (vi vet inte om main just avancerat eller inte).
        # ALLTID-PÅ av samma skäl som avancemang-raden ovan (§ ANVÄNDNING):
        # utan denna rad är kallstart och en genuint tystad, uteblivet-larm-
        # sopning omöjliga att skilja åt i en --quiet rå-logg.
        alarm "heartbeat-svep: main-SHA-baslinje satt (${main_sha:0:8}) — inget tidigare känt SHA att jämföra mot. Nästa sopning kan rapportera avancemang."
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
                author { login }
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
                .isInMergeQueue,
                (.author.login // "")
              ] | @tsv' 2>/dev/null)"
    rc=$?
    set -e
    if [[ "${rc}" -ne 0 ]]; then
        alarm "heartbeat-svep: SONDEN KUNDE INTE SVARA — pr-lista (repo ${REPO}, gren ${BRANCH})."
        return 77
    fi

    local granskade=0 antal_rott=0 antal_dirty=0 antal_kandidat=0 antal_undantagna=0
    while IFS=$'\t' read -r nr draft mss automerge rollup inqueue author; do
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
        #
        # En FJÄRDE grupp (fynd 2026-08-04, dependabot-kvartetten #632–#635):
        # PR:ar vars FÖRFATTARE är medvetet undantagen
        # (HEARTBEAT_EXEMPT_AUTHORS, .heartbeat-svep-policy.conf) larmar
        # INTE som kandidat — men rapporteras ändå som en RUTIN-rad (say(),
        # dämpad av --quiet precis som "N granskade"-sammanfattningen), inte
        # tystade helt. Se policy-filens kommentar för formvalet
        # (författare, inte etikett) och varför tystnad vore fel (T108-
        # klassen: ett tillstånd utan bevakare).
        if [[ "${automerge}" == "false" && "${draft}" == "false" \
              && ( "${mss}" == "CLEAN" || "${mss}" == "UNSTABLE" ) \
              && "${inqueue}" == "false" ]]; then
            # shellcheck disable=SC2310
            # AVSIKTLIGT: is_exempt_author() innehåller inga kommandon som
            # kan misslyckas oväntat (ren bash — for-loop + strängjämförelse
            # + return), så set -e-avstängningen SC2310 varnar för är
            # ofarlig här. Samma disciplin som de två SC2310-disablen redan
            # i detta skript (§ Körläge nedan).
            if is_exempt_author "${author}"; then
                say "heartbeat-svep: PARKERAD (undantagen) — PR #${nr} är ${mss} utan aktiv auto-merge-begäran, författare '${author}' i HEARTBEAT_EXEMPT_AUTHORS. Larmar inte som armerings-kandidat."
                antal_undantagna=$(( antal_undantagna + 1 ))
            else
                alarm "heartbeat-svep: ARMERINGS-KANDIDAT — PR #${nr} är ${mss} utan aktiv auto-merge-begäran. Kan vara ALDRIG ARMERAD eller UTSPARKAD med konsumerad armering (CLAUDE.md § Landning). Disambiguera: gh pr merge ${nr} --auto"
                antal_kandidat=$(( antal_kandidat + 1 ))
            fi
        fi
    done <<<"${rows}"

    say "heartbeat-svep: ${granskade} öppna PR:ar granskade mot ${BRANCH} — ${antal_rott} röda, ${antal_dirty} dirty, ${antal_kandidat} armerings-kandidater, ${antal_undantagna} undantagna (parkerade)."

    [[ "${antal_rott}"     -gt 0 ]] && verdict=$(( verdict | 1 ))
    [[ "${antal_dirty}"    -gt 0 ]] && verdict=$(( verdict | 2 ))
    [[ "${antal_kandidat}" -gt 0 ]] && verdict=$(( verdict | 4 ))

    # FEMTE VÄGEN — underhåll, körs EFTER att verdikten är färdigberäknad så
    # den bevisligen inte kan påverka den (§ EXIT-KODER: städning larmar
    # aldrig). `|| true` är bälte-och-hängslen: funktionen returnerar alltid
    # 0 av sig själv, men set -e är aktivt här och kontraktet ska hålla även
    # om någon senare ändrar funktionens returväg.
    # shellcheck disable=SC2310
    # AVSIKTLIGT: `|| true` är hela poängen — utfallet ska ignoreras.
    stada_grenar_om_dags || true

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
