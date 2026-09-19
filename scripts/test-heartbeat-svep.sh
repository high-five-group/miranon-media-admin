#!/usr/bin/env bash
# scripts/test-heartbeat-svep.sh
#
# Empirisk testsvit för scripts/heartbeat-svep.sh (TASK-119 + TASK-128 +
# TASK-135 + fynd 2026-08-04 om HEARTBEAT_EXEMPT_AUTHORS). Räkningen längst
# ned i filen ("X passerade") är den AUKTORITATIVA totalen — mätt, aldrig
# handräknad hit (TASK-106-disciplinen: en kopierad räkning kan bli fel utan
# att någon märker det). Tyngdpunkt på AC#1:s krav: tvåsidigt bevis per väg
# (planterat fall fälls, rent fall släpps), för VAR OCH EN av de tre
# namngivna vägarna plus den fjärde (armerings-kandidat) ur samma tabell:
#
#   T1  RÖTT planterat (check-rollup FAILURE)              → bit 1 satt
#   T2  RÖTT rent (samma PR, rollup SUCCESS)                → bit 1 EJ satt
#   T3  DIRTY planterat (mergeStateStatus DIRTY)            → bit 2 satt
#   T4  DIRTY rent (mergeStateStatus CLEAN, armerad)         → bit 2 EJ satt
#   T5  KANDIDAT planterat (CLEAN, ej armerad, ej draft)     → bit 4 satt
#   T6  KANDIDAT rent — redan ARMERAD                        → bit 4 EJ satt
#   T7  KANDIDAT rent — DRAFT                                 → bit 4 EJ satt
#   T8  KANDIDAT rent — BLOCKED (varken CLEAN eller UNSTABLE) → bit 4 EJ satt
#   T9  KANDIDAT planterat — UNSTABLE räknas också             → bit 4 satt
#   T9b KANDIDAT rent — KÖAD (isInMergeQueue=true), PR #617-mönstret,   (TASK-128)
#       annars identisk med T5 — en armerad OCH köad PR ska INTE larma  → bit 4 EJ satt
#   T9c KANDIDAT planterat — genuint UTSPARKAD (isInMergeQueue=false,   (TASK-128)
#       i övrigt identiskt med T9b) → ska FORTFARANDE larma             → bit 4 satt
#   T10 KOMBINERAT — en RÖD-PR + en DIRTY-PR samtidigt         → bitmask 3
#   T11 main-SHA AVANCERAR mellan två sopningar (delat state)  → larmrad
#   T12 main-SHA OFÖRÄNDRAD mellan två sopningar               → ingen larmrad
#   T13 fail-closed: gh-anropet för main-SHA misslyckas        → 77
#   T14 fail-closed: gh-anropet för pr-listan misslyckas       → 77
#   T15 användningsfel: REPO saknas (ingen config, ingen flagga) → 64
#   T16 användningsfel: ogiltigt --interval (0)                  → 64
#   T17 användningsfel: ogiltigt --timeout (icke-numeriskt)      → 64
#   T18 --once loopar ALDRIG (även med stort --interval)         → snabb
#   T19 loop-läge, --timeout-bundet, flera iterationer            → sista verdikt
#   T20 tom PR-lista → 0 granskade, ALLT LUGNT                    → 0
#   T21 --quiet dämpar rutin-rader men ALDRIG larm-rader (L443)    → RÖTT syns
#   T22 --quiet vid STABILT, KÄNT läge → helt tyst stdout           → tomt
#   T23 KALLSTART: "main-SHA-baslinje satt" syns ÄVEN under --quiet (TASK-135)
#       — fäller på det orörda skriptet (kallstart gick via say()), passerar
#       efter fixen (alarm())                                       → ALLTID-PÅ
#   T24 --help visar den utökade ALLTID-PÅ/KALLSTART-texten (TASK-135) → syns
#   T25 undantagen PR (author=dependabot) → PARKERAD-rutinrad, INGET
#       kandidat-larm, ALDRIG "ARMERINGS-KANDIDAT" i utdatan    → bit 4 EJ satt
#   T25b samma undantagna PR under --quiet → PARKERAD-raden dämpas (helt
#        tyst stdout, samma --quiet-immunitet-KLASS som T22, inte ALLTID-PÅ)
#   T26 icke-undantagen författare (t.ex. en människas PR) → larmar
#       FORTFARANDE som kandidat — undantaget överexkluderar inte  → bit 4 satt
#   T27 HEARTBEAT_EXEMPT_AUTHORS SAKNAS helt i policyn (odefinierad
#       variabel) → fail-open, dependabot-PR:en larmar ändå        → bit 4 satt
#   T27b HEARTBEAT_EXEMPT_AUTHORS definierad men TOM (()) → samma
#        fail-open, samma larm                                     → bit 4 satt
#
# T40–T55 (TASK-462, SESSIONSMEDVETET SVEP): kortets AC #1/#2 kräver
# tvåsidigt bevis per LARM-väg (RÖTT/DIRTY/KANDIDAT) — en främmande PR tyst,
# en egen PR larmar — plus AC #3 (omärkt-notisen), AC #4 (dependabot) och
# AC #8 (bakåtkompatibilitet, TIPS-raden).
#   T40 RÖTT, EGEN session-markör                                → larmar
#   T41 RÖTT, FRÄMMANDE session-markör (annan ID)  i sessionsläge → TYST
#   T42 SAMMA främmande RÖD PR, men --alla                        → larmar
#   T43 DIRTY, EGEN session-markör                                → larmar
#   T44 DIRTY, FRÄMMANDE session-markör  i sessionsläge           → TYST
#   T45 KANDIDAT, EGEN session-markör                             → larmar
#   T46 KANDIDAT, FRÄMMANDE session-markör i sessionsläge         → TYST
#   T47 OMÄRKT PR, sessionsläge, kallstart-intervall → ALLTID-PÅ-notis,
#       syns ÄVEN under --quiet, INGEN exit-bit                    → 0
#   T48 SAMMA omärkta PR, direkt igen (glesning) → tyst denna gång  → 0
#   T49 OMÄRKT PR med author=dependabot (exempt) → EXKLUDERAS ur
#       bucketen, ingen notis (0 fynd)                              → 0
#   T50 BAKÅTKOMPATIBILITET: ingen --session/--alla, PR med en FRÄMMANDE
#       markör i kroppen → larmar ÄNDÅ (dagens beteende är okänsligt
#       för markörer helt och hållet)                              → larmar
#
# T51–T55 UPPDATERADE, T56–T61 NYA (review runda 1, Marcus-beslut
# 2026-09-19). Fynd 1: TIPS-raden syntes aldrig via Monitor (bara stdout blir
# notifikationer) — flyttad från stderr till alltid_pa()/stdout, taktad av
# HEARTBEAT_OMARKERAD_INTERVALL. Fynd 2: en HEARTBEAT_EXEMPT_AUTHORS-
# författares RÖTT/DIRTY blev osynlig i sessionsläge (sessionsfiltreringens
# "ingen markör"-gren `continue`:ade förbi RÖTT/DIRTY-klassningen) — nu ett
# eget, glest besked, aldrig en bitmask-bit för sessionen.
#   T51 TIPS-raden på STDOUT (kallstart, ingen --session/--alla)     → syns
#   T51b TIPS-raden syns INTE på stderr (positivt bevis på flytten)  → tyst
#   T51c TIPS-raden STRYPS — samma anrop direkt igen                → tyst
#   T52 TIPS-raden UTEBLIR HELT (stdout OCH stderr) när --session ges → tyst
#   T53 TIPS-raden UTEBLIR HELT när --alla ges                        → tyst
#   T54 BÅDA FLAGGOR samtidigt (--session X --alla) → --alla VINNER
#       (samma främmande-PR-scenario som T42, ska larma precis som --alla
#       ensamt)                                                     → larmar
#   T55 --help visar § SESSIONSMEDVETET SVEP och de nya flaggorna     → syns
#   T56 Dependabot RÖTT, OMÄRKT, sessionsläge → strypt besked, INGEN
#       bitmask-bit för sessionen (dagens beteende var HELT TYST)     → 0
#   T57 Dependabot DIRTY, OMÄRKT, sessionsläge → samma strypta kanal   → 0
#   T58 SAMMA dependabot-RÖTT-PR, direkt igen (glesning) → tyst        → 0
#   T59 SAMMA dependabot-RÖTT-PR, men --alla → dagens beteende
#       OFÖRÄNDRAT (vanlig RÖTT-alarm, ingen "UNDANTAGEN FÖRFATTARE"-
#       rad)                                                        → larmar
#   T60 Dependabot GRÖN (SUCCESS/CLEAN), OMÄRKT, sessionsläge → INGEN
#       dependabot-status-notis (0 fynd, T49:s scenario, utökad kontroll) → 0
#   T61 Kod-kommentaren (§ SESSIONSMEDVETET SVEP) nämner INTE längre att
#       dependabot "redan har sin egen hantering" för RÖTT/DIRTY          → syns
#
# T62–T65 (review runda 3, Marcus-beslut 2026-09-19): de strypta notisernas
# state-filer taktades mot en MASKIN-GLOBAL STATE_DIR — S126 sveper först,
# stämplar filen, S127:s eget svep ser ALDRIG sin egen förstagångs-notis.
# Fixat: --session <ID> ⇒ statsfilen bär sessionens ID i namnet.
#   T62 Två sessioner (S126/S127), SAMMA STATE_DIR: dependabot-notisen →
#       BÅDA ser den EN gång, stryps sedan VAR FÖR SIG                    → 0
#   T63 Samma tvåsidiga bevis för den omärkta-PR-notisen                  → 0
#   T64 OMSKRIVEN i review runda 4 — se T66–T72 nedan (session_id_sanitize()
#       ersatt av validering; farliga ID avvisas nu i stället för saneras)
#   T65 UTAN --session (TIPS): dagens GLOBALA beteende oförändrat — en
#       andra körning som delar STATE_DIR stryps ÄNDÅ (ingen session-ID
#       att skopa mot, se KÄND BEGRÄNSNING)                        → tyst
#
# T66–T74 (review runda 4, EXIT-KOD RÄTTAD I REVIEW RUNDA 5, Marcus-beslut
# 2026-09-19): review runda 3 fann att session_id_sanitize() kunde mappa
# OLIKA ID:n till SAMMA filnamn ("S 126"/"S/126" ⇒ båda "S_126") — tyst
# återinförd tvärsessions-tystnad, och PR:ens "FULLSTÄNDIGT löst"
# överclaimade. Fixat: --session <ID> VALIDERAS (^[A-Za-z0-9._-]{1,64}$,
# aldrig enbart punkter) i stället för saneras; ogiltigt ⇒ **exit 64**
# (INTE 2 — review runda 5 fynd 1: exit 2 kolliderade med bitmask-koden
# DIRTY), via die() (ENDAST stderr, INTE stdout — samma konvention som
# REPO/INTERVAL/TIMEOUT), fail-closed, ingen körning, ingen fil skriven.
#   T66 Giltigt ID "S126" (baseline, oförändrat)                      → 0
#   T67 Giltigt ID MED punkt "s126.resume.2" (punkt tillåten, inte ENDAST
#       punkter)                                                       → 0
#   T68 Tomt --session-ID ("") → exit 64, fel ENDAST på stderr
#   T69 Session-ID med mellanslag ("S 126") → exit 64
#   T70 Session-ID med snedstreck ("S/126") → exit 64
#   T71 Session-ID SOM ENBART punkter ("..") → exit 64 (path-traversal-form,
#       avvisas trots att tecknen i sig är tillåtna)
#   T72 Session-ID på 65 tecken (över gränsen) → exit 64
#   T73 INGEN fil skrivs alls i STATE_DIR när ID:t avvisas (fail-closed
#       betyder "ingen sopning skedde", inte "sopning med ett tomt namn")
#   T74 Ett giltigt farligt-LIKNANDE-men-TILLÅTET ID ("../")-substräng är
#       INTE giltigt (redan täckt av T70:s snedstreck), men ett ID som bara
#       RÅKAR innehålla punkter mitt i sig ("v1.2.3") är giltigt och ger sin
#       EGEN statsfil, skild från ett annat giltigt ID — kollision omöjlig
#       per konstruktion (kompletterar T62/T63:s S126≠S127-bevis med ett
#       tredje, olikt-format par)
#
# T75–T82 (review runda 5, Marcus-beslut 2026-09-19). Fynd 1: exit 2 för
# ogiltigt --session-ID kolliderade med bitmask-DIRTY — rättat till 64 (se
# T64/T66–T72 ovan). Fynd 2: `--session` (eller vilken annan värde-flagga
# som helst) som SISTA token fick `shift 2` att fallera, `set -e` avslutade
# med `shift`s EGEN exit 1 (= bitmask RÖTT) och NOLL utskrift. Fynd 3:
# "kollision omöjlig per konstruktion" höll på strängnivå men inte på ett
# skiftlägesokänsligt filsystem (macOS APFS) — "S126"/"s126" är nu MED
# AVSIKT samma session för statsfilnamnet.
#   T75 --session sista token (inget värde) → exit 64, INTE 1          → 64
#   T76 --repo sista token → exit 64                                    → 64
#   T77 --branch sista token → exit 64                                  → 64
#   T78 --interval sista token → exit 64                                → 64
#   T79 --timeout sista token (inget värde) → exit 64                    → 64
#       (UPPTÄCKT, EJ FIXAT — utanför denna rundas anspråk: "--session
#       --alla" tolkar "--alla" som ett GILTIGT sessions-ID i stället för
#       att avvisa det som en flagga utan värde, eftersom "--alla" råkar
#       matcha HEARTBEAT_SESSION_ID_REGEX. Ingen bitmask-kollision — bara
#       en tyst felparsning. Rapporterat, inte byggt.)
#   T80/T80b "S126" och "s126" (SAMMA STATE_DIR) delar MED AVSIKT
#       statsfil — S126 ser notisen, s126 stryps av S126:s stämpel       → 0
#   T81/T81b statsfilen är normaliserad till gemener, ingen separat
#       versal-variant skapas
#   T82 Markör-matchningen (RÖTT/DIRTY/KANDIDAT) — VÄND i fix-runda 6, se
#       nedan (var SKIFTLÄGESKÄNSLIG i denna runda, RÄTTAD SAMMA DAG efter
#       ett granskningsfynd — se T82–T82d)                              → 1
#
# T82–T82d (fix-runda 6, review runda 5 fynd 1, Marcus-beslut 2026-09-19).
# Skiftlägespolicyn var ASYMMETRISK: statsfilnamnet (T80–T81b) normaliserades
# redan till gemener, men pr_har_session_marker() jämförde SESSION VERBATIM
# mot PR-kroppens markör — en session märkt "S126" blev HELT OSYNLIG för
# sitt eget RÖTT/DIRTY/ARMERINGS-KANDIDAT om svepet kördes med
# `--session s126`, exakt "sessionen ser aldrig sitt eget röda"-felklassen
# kortet finns för att ta bort. RÄTTAT: EN policy överallt — --session-
# värdet och PR-kroppens markör normaliseras BÅDA till gemener innan
# jämförelsen (se pr_har_session_marker() i scripts/heartbeat-svep.sh).
#   T82  Markör "S126" (versaler) MATCHAS NU av --session "s126" (gemener)
#        — VÄND mot denna runda (var NOT_EXPECT_OUT, är nu EXPECT_OUT)    → 1
#   T82b Omvänt skiftläge: markör "s126" (gemener) MATCHAS av
#        --session "S126" (versaler)                                      → 1
#   T82c Blandat skiftläge: markör "S126-Resume-2" MATCHAS av
#        --session "s126-resume-2"                                        → 1
#   T82d Skiftlägesnormaliseringen döljer INTE en genuint FRÄMMANDE
#        session: markör "S127" förblir TYST under --session "s126" —
#        bara SKIFTLÄGET normaliseras, inte VILKEN session ID:t pekar ut  → 0
#
# T83–T89 (review runda 5 UPPFÖLJNING, samma dag, Marcus-beslut
# 2026-09-19). Bygg-agenten upptäckte själv under runda 5:s revision att
# den DÅ gällande regexen (^[A-Za-z0-9._-]{1,64}$) gjorde `--session --alla`
# GILTIGT — "--alla" matchade (bindestreck/bokstäver tillåtna) och
# konsumerades TYST som sessions-ID. Byggt SAMMA dag på order, innan nästa
# granskningsrunda: HEARTBEAT_SESSION_ID_REGEX skärpt till
# ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ — FÖRSTA tecknet måste vara
# alfanumeriskt.
#   T83 --session --alla → exit 64 (huvudfyndet — var GILTIGT innan)   → 64
#   T84 --session -x → exit 64 (börjar med "-")                        → 64
#   T85 --session . (EN punkt) → exit 64 (första tecknet ej alfanum.)  → 64
#   T86 --session a (EN bokstav) → giltigt, körs normalt               → 0
#   T87/T87b Session-ID på EXAKT 64 tecken (övre gränsen) → giltigt     → 0
#   T88/T88b Session-ID på 65 tecken (EN över gränsen) → exit 64        → 64
#   T89 --session _S126 (understreck FÖRST) → exit 64 (skärpningen
#       gäller alla tre "ej alfanumeriskt"-tecken, inte bara "-")       → 64
#
# Test-isolering: /tmp/task119-test-heartbeat-svep/ med en gh-stub som svarar
# ur ett scenario-katalog (main-sha / rows / fail-mainsha / fail-prlist).
# INGEN nätverkstrafik, inget riktigt gh-anrop, ingen ändring i real-repot,
# eget HEARTBEAT_STATE_DIR (rör aldrig det riktiga tillståndet).
#
# LAYOUTEN SPEGLAR PRODUKTIONEN: skriptet kopieras till
# ${TEST_DIR}/scripts/heartbeat-svep.sh och den RIKTIGA policy-filen till
# ${TEST_DIR}/.heartbeat-svep-policy.conf — samma relation som i repot, så
# den FAKTISKA default-upplösningen av policy-sökvägen provas (T15 är
# undantaget: den pekar HEARTBEAT_SVEP_POLICY på en sökväg som inte finns).
#
# STUBBENS GRÄNS, öppet skriven (samma disciplin som test-staging-semaphore.sh
# § "STUBBENS GRÄNS"): gh:s `--jq`/`-f query=` körs INNE i den riktiga `gh`-
# binären, så stubben här levererar redan färdig, förberäknad TSV-utdata —
# den kör aldrig det verkliga GraphQL-uttrycket. Sviten bevisar därmed
# SKRIPTETS EGEN klassningslogik (RÖTT/DIRTY/KANDIDAT-besluten i bash), inte
# att GraphQL-frågan matchar det verkliga API:t. Den kopplingen är i stället
# verifierad SKARPT mot live-API:t under TASK-119-bygget 2026-08-02:
#   - `gh api graphql` med exakt samma fråga kördes mot
#     high-five-group/miranon-media-admin (PR #611, ett stängt ärende) och
#     gav `{"number":611,"red":false,"verdicts":["OK","OK",...]}` — alla åtta
#     jobb SUCCESS, korrekt klassat som icke-rött.
#   - `commits(last:1).commit.statusCheckRollup.state` verifierades via
#     introspektion vara ett NON_NULL StatusState-enum med exakt fem värden
#     (SUCCESS, FAILURE, ERROR, PENDING, EXPECTED) — den uttömmande listan
#     bash-klassningen nedan (T1/T2 m.fl.) bygger på.
#   - `gh api repos/<repo>/commits/<branch> --jq .sha` kördes skarpt mot
#     samma repo och gav samma SHA som `git fetch` redan visat lokalt.
# Ändras GraphQL-frågan eller fält-antagandena ska en ny skarp körning göras.
#
# Användning: bash scripts/test-heartbeat-svep.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: CLAUDE.md § Landning · tasks/lessons.md L443 · TASK-119 · TASK-135 ·
#        .heartbeat-svep-policy.conf § "PR-författare vars öppna PR:ar
#        ALDRIG larmar som ARMERINGS-KANDIDAT"
# Etablerad: TASK-119, 2026-08-02 · utökad TASK-128 (2026-08-03) · TASK-135
# (2026-08-04, T23/T24 — kallstart-rad + --help-täckning) · fynd 2026-08-04
# (T25–T27b — HEARTBEAT_EXEMPT_AUTHORS, dependabot-kvartetten #632–#635) ·
# TASK-462 (2026-09-18, T40–T55 — sessionsmedvetet svep: --session/--alla,
# PR-kropps-markören, den omärkta-PR-notisen, TIPS-raden) · TASK-462
# fix-runda 1 (2026-09-19, review runda 1: T51–T55 omskrivna + T56–T61 nya —
# TIPS-raden på stdout/strypt, dependabot-RÖTT/DIRTY-notisen) · TASK-462
# fix-runda 2 (2026-09-19, review runda 3: T62–T65 nya — PER-SESSION
# statsfil-suffix, session_id_sanitize()) · TASK-462 fix-runda 3 (2026-09-19,
# review runda 4: T64 omskriven + T66–T74 nya — validerat session-ID ersätter
# sanering, session_id_sanitize() BORTTAGEN, per-session-statsfil-städning) ·
# TASK-462 fix-runda 4 (2026-09-19, review runda 5: T64/T66–T72 exit-kod
# 2→64 + T75–T82 nya — bitmask-kollision rättad, saknat flaggvärde fångat,
# skiftlägesokänsligt statsfilnamn) · TASK-462 fix-runda 5 (2026-09-19,
# review runda 5 uppföljning, samma dag: T83–T89 nya — FÖRSTA tecknet i
# session-ID måste vara alfanumeriskt, "--session --alla" avvisas) ·
# TASK-462 fix-runda 6 (2026-09-19, runda 5:s eget fynd 1: T82 VÄND +
# T82b–T82d nya — skiftlägespolicyn var ASYMMETRISK (statsfilnamn
# normaliserat, markör-matchning inte), rättad till EN policy överallt) ·
# TASK-479.2 (2026-09-19, SE16 — T90–T100b nya, SJUNDE VÄGEN: öppna
# ci-post-merge-/nattärenden)
#   T90/T91 ci-post-merge: tvåsidigt bevis (öppet ärende ⇒ rad, inget ⇒ tyst)
#   T92/T93 natt (ci-natt/bokforingsdrift/beroendevarning/lankrota): samma,
#       egen bucket/egen state-fil
#   T94a–c ÖVERGÅNG röd→grön rapporteras EN gång, sedan tyst igen (kallstart
#       räknas som övergång in i rött — rapporteras omedelbart, inte väntar)
#   T95a/b PÅMINNELSEINTERVALLET HÅLLS — röd kvarstår, andra sopningen direkt
#       efter (default 1800s) ger INGEN andra rad
#   T96a/b PÅMINNELSEINTERVALLET ÄR CONFIG-DRIVET —
#       HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL=0 via egen policy-fil (samma
#       teknik som T30) ger tvärtemot T95b en PÅMINNELSE-rad på andra
#       sopningen
#   T97 SESSIONS-LÄGET FILTRERAR INTE BORT MAIN-LÄGET — --session S1 med ett
#       öppet ci-post-merge-ärende visar ÄRENDE-raden ändå (kortets krav)
#   T98/T99 FAIL-CLOSED (77) på VARDERA av de två oberoende gh-anropen,
#       isolerat — ci-post-merge-sonden fallerar utan att smitta natt-sonden
#       och vice versa
#   T100/T100b --help visar § SJUNDE VÄGEN, config-rattarna och pekaren till
#       CONTRIBUTING.md § Tidsregel och ägare — radintervallet 61,310→61,322

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task119-test-heartbeat-svep"
SKRIPT_SRC="${REPO_ROOT}/scripts/heartbeat-svep.sh"
POLICY_SRC="${REPO_ROOT}/.heartbeat-svep-policy.conf"

SKRIPT="${TEST_DIR}/scripts/heartbeat-svep.sh"
SCEN="${TEST_DIR}/scenario"
STATE_DIR="${TEST_DIR}/state"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # anropas via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/bin" "${TEST_DIR}/scripts" "${SCEN}" "${STATE_DIR}"
    cp "${SKRIPT_SRC}" "${SKRIPT}"
    chmod +x "${SKRIPT}"
    cp "${POLICY_SRC}" "${TEST_DIR}/.heartbeat-svep-policy.conf"

    # gh-stub. Svarar ur ${SCEN}:
    #   main-sha          en rad, SHA:t "commits/<branch>"-anropet ska
    #                     returnera
    #   rows              förberäknade TSV-rader, som gh:s --jq redan hade
    #                     gjort
    #   fail-mainsha      NÄRVARO ⇒ main-SHA-anropet misslyckas (exit 1)
    #   fail-prlist       NÄRVARO ⇒ pr-lista-anropet (graphql) misslyckas
    #                     (exit 1)
    #   postmerge-arenden ett ärendenummer per rad — `gh issue list --label
    #                     ci-post-merge`-svaret (TASK-479.2, SE16)
    #   natt-arenden      ett ärendenummer per rad — `gh issue list --search
    #                     'label:ci-natt,...'`-svaret (TASK-479.2, SE16)
    #   fail-arenden-pm   NÄRVARO ⇒ ci-post-merge-ärendesonden misslyckas
    #   fail-arenden-natt NÄRVARO ⇒ nattärendesonden misslyckas
    # STUBBENS GRÄNS gäller likaså här (§ ovan i filhuvudet): den matchar
    # `issue`/`list` OCH SÖKER efter "ci-post-merge" resp. "ci-natt" BLAND
    # ARGUMENTEN — den kör aldrig det verkliga `gh issue list`-anropet mot
    # GitHubs API. Vilken av de TVÅ buckets ett anrop hör till avgörs av
    # skriptets EGNA, distinkta argument (`--label ci-post-merge` vs.
    # `--search '...ci-natt...'`) — samma teknik som `graphql`-grenen ovan
    # särskiljer sig från main-SHA-grenen på `$2`.
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
SCEN="${T119_SCEN}"
if [ "${1:-}" = "api" ]; then
    if [ "${2:-}" = "graphql" ]; then
        if [ -f "${SCEN}/fail-prlist" ]; then exit 1; fi
        [ -f "${SCEN}/rows" ] && cat "${SCEN}/rows"
        exit 0
    fi
    # övriga `gh api`-anrop i detta skript är alla main-SHA-uppslaget:
    # "repos/<repo>/commits/<branch>" --jq .sha
    if [ -f "${SCEN}/fail-mainsha" ]; then exit 1; fi
    [ -f "${SCEN}/main-sha" ] && cat "${SCEN}/main-sha"
    exit 0
fi
if [ "${1:-}" = "issue" ] && [ "${2:-}" = "list" ]; then
    # ARGV-fångst (TASK-479.2 review runda 2 fynd 1, samma teknik som
    # T323_ARGV för stada-stubben): skriver argumentlistan om
    # T119_ARENDE_ARGV är satt — bevisar att en CONFIG-ÖVERSTYRD etikett/
    # söksträng faktiskt når `gh`-anropet, oavsett om denna stubbs egen
    # ci-post-merge/ci-natt-routing nedan känner igen det anpassade värdet.
    #
    # ETT ELEMENT PER RAD, INRAMAT (review runda 3 fynd 2, Marcus-beslut
    # 2026-09-19): `printf '%s\n' "$*"` (runda 2) SLÅR IHOP hela argv med
    # blanksteg till EN rad — ett korrekt citerat `--search "a b"` (ETT
    # argv-element) och ett ordsplittrat `--search a b` (TVÅ element) ger
    # DÄRMED IDENTISK loggrad; stubben kunde alltså aldrig bevisa att
    # produktionskoden faktiskt citerar `${ARENDE_SEARCH_NATT}` korrekt.
    # `printf '<%s>\n' "$@"` bevarar element-GRÄNSEN synligt (varje `$@`-
    # element blir sin EGEN rad, inramad i `<...>`) — T102b nedan kräver
    # nu `<label:egen-sok is:open>` som ETT sammanhängande element.
    if [ -n "${T119_ARENDE_ARGV:-}" ]; then
        printf '<%s>\n' "$@" >> "${T119_ARENDE_ARGV}"
    fi
    is_postmerge=0
    is_natt=0
    for a in "$@"; do
        case "${a}" in
            ci-post-merge) is_postmerge=1 ;;
            *ci-natt*) is_natt=1 ;;
        esac
    done
    if [ "${is_postmerge}" = 1 ]; then
        if [ -f "${SCEN}/fail-arenden-pm" ]; then exit 1; fi
        [ -f "${SCEN}/postmerge-arenden" ] && cat "${SCEN}/postmerge-arenden"
        exit 0
    fi
    if [ "${is_natt}" = 1 ]; then
        if [ -f "${SCEN}/fail-arenden-natt" ]; then exit 1; fi
        [ -f "${SCEN}/natt-arenden" ] && cat "${SCEN}/natt-arenden"
        exit 0
    fi
    exit 0
fi
exit 0
STUB
    chmod +x "${TEST_DIR}/bin/gh"

    # Baseline-scenario: inga fel, inga PR:ar, ett stabilt SHA, inga öppna
    # ärenden i endera bucketen.
    printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "${SCEN}/main-sha"
    : > "${SCEN}/rows"
    rm -f "${SCEN}/fail-mainsha" "${SCEN}/fail-prlist"
    : > "${SCEN}/postmerge-arenden"
    : > "${SCEN}/natt-arenden"
    rm -f "${SCEN}/fail-arenden-pm" "${SCEN}/fail-arenden-natt"
}

# reset_scen: återställ scenariot till en ren baseline MELLAN testfall, utan
# att riva hela TEST_DIR (state-katalogen ska normalt nollställas per fall
# så main-SHA-baseline inte läcker mellan oberoende testfall — T11/T12
# hanterar sitt eget delade state explicit och anropar INTE denna).
reset_scen() {
    printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "${SCEN}/main-sha"
    : > "${SCEN}/rows"
    rm -f "${SCEN}/fail-mainsha" "${SCEN}/fail-prlist"
    : > "${SCEN}/postmerge-arenden"
    : > "${SCEN}/natt-arenden"
    rm -f "${SCEN}/fail-arenden-pm" "${SCEN}/fail-arenden-natt"
    rm -rf "${STATE_DIR}"
    mkdir -p "${STATE_DIR}"
}

set_rows() { printf '%b' "$1" > "${SCEN}/rows"; }
set_postmerge_arenden() { printf '%b' "$1" > "${SCEN}/postmerge-arenden"; }
set_natt_arenden() { printf '%b' "$1" > "${SCEN}/natt-arenden"; }

# EXPECT_OUT sätts FÖRE ett run_case-anrop för att dessutom kräva en sträng i
# utdatan. NOT_EXPECT_OUT sätts för att kräva att en sträng SAKNAS (används
# för T2/T4/T6/T7/T8/T12/T21/T22 — "rent fall släpps" bevisas genom att
# larmraden INTE finns, inte bara av exit-koden). Båda nollställs av
# run_case så de aldrig läcker till nästa fall.
EXPECT_OUT=""
NOT_EXPECT_OUT=""
# EXPECT_ERR/NOT_EXPECT_ERR: samma kontrakt som ovan men mot STDERR
# specifikt. Infört av TASK-462 för den ursprungliga TIPS-raden (som då
# skrevs till stderr) — den flyttades till stdout i review runda 1 fynd 1
# (se tips_notis_om_dags()), men mekanismen behålls: T51b använder NU
# NOT_EXPECT_ERR för att POSITIVT bevisa att TIPS inte längre syns på
# stderr (i stället för att bara råka vara sann, vilket en borttagen
# EXPECT_ERR-kontroll hade varit). Se § STRÖM-SEPARATION nedan för varför de
# två strömmarna ändå fångas i separata filer.
EXPECT_ERR=""
NOT_EXPECT_ERR=""

# run_case <namn> <förväntad exit> <max sekunder eller "-"> <env-tilldelningar...> -- <args...>
#
# ═══ STRÖM-SEPARATION (TASK-462) ═══
# stdout och stderr fångas i VARSIN fil (out.txt / err.txt) i stället för en
# kombinerad `2>&1`. HISTORIK, rättad i TASK-462 fix-runda (review runda 1
# fynd 1): denna kommentar påstod tidigare att separationen fanns EFTERSOM
# TIPS-raden skrevs till stderr — det höll bara fram till fixrundan; TIPS
# ligger nu på stdout (alltid_pa(), taktad, se tips_notis_om_dags()).
# Separationen behålls ÄNDÅ: den lämnar EXPECT_ERR/NOT_EXPECT_ERR som en
# skarp, oberoende kanal för `die()` (användningsfel, T15–T17) och för T51b:s
# positiva "syns INTE på stderr"-bevis, utan att en kombinerad ström riskerar
# att blanda ihop de två strömmarnas bevisbörda. Alla ÄLDRE
# `alarm()`/`say()`/`alltid_pa()`-rader gick redan via stdout (ren `printf`,
# fd1) — bara `die()` gick till stderr. Separationen ändrar därför INGEN
# äldre testfalls faktiska bevisbörda.
run_case() {
    local name="$1" want="$2" maxsec="$3"; shift 3
    local start elapsed got
    local expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    local eexpect="${EXPECT_ERR}" enexpect="${NOT_EXPECT_ERR}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    EXPECT_ERR=""
    NOT_EXPECT_ERR=""
    start="$(date +%s)"
    ( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
        HEARTBEAT_STATE_DIR="${STATE_DIR}" \
        "$@" ) >"${TEST_DIR}/out.txt" 2>"${TEST_DIR}/err.txt"
    got=$?
    elapsed=$(( $(date +%s) - start ))

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        cat "${TEST_DIR}/out.txt" "${TEST_DIR}/err.txt" 2>/dev/null | sed 's/^/      /' | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ "${maxsec}" != "-" && "${elapsed}" -gt "${maxsec}" ]]; then
        printf '  ✗ %s — tog %ss, max %ss\n' "${name}" "${elapsed}" "${maxsec}"
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — stdout saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — stdout innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${eexpect}" ]] && ! grep -qF -- "${eexpect}" "${TEST_DIR}/err.txt"; then
        printf '  ✗ %s — stderr saknade "%s"\n' "${name}" "${eexpect}"
        sed 's/^/      /' "${TEST_DIR}/err.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${enexpect}" ]] && grep -qF -- "${enexpect}" "${TEST_DIR}/err.txt"; then
        printf '  ✗ %s — stderr innehöll oväntat "%s"\n' "${name}" "${enexpect}"
        sed 's/^/      /' "${TEST_DIR}/err.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$(( PASSED + 1 ))
}

setup
# INGET hårdkodat antal här (TASK-106-disciplinen: en kopierad räkning kan
# bli fel mot skriptets egen slutrad utan att någon märker det — det hände
# just den raden en gång: "nio" mot "tio"). Den enda AUKTORITATIVA totalen
# är "X passerade" på slutraden, räknad av PASSED/FAILED-motorn nedan i
# samma körning som producerar den — inte handräknad hit.
printf 'test-heartbeat-svep: kör mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# T1/T2 — RÖTT: tvåsidigt bevis (planterat fälls, rent släpps).
# mergeStateStatus=BLOCKED här medvetet: isolerar RÖTT-vägen från
# KANDIDAT-vägen (som kräver CLEAN/UNSTABLE), så testet bara mäter EN sak.
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n'
EXPECT_OUT="RÖTT — PR #572"
run_case "T1  RÖTT planterat (check-rollup FAILURE) → bit 1" 1 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="RÖTT"
run_case "T2  RÖTT rent (samma PR, rollup SUCCESS) → bit 1 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T3/T4 — DIRTY: tvåsidigt bevis. automerge=true här medvetet: isolerar
# DIRTY-vägen från KANDIDAT-vägen (som kräver automerge=false).
reset_scen
set_rows '575\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\n'
EXPECT_OUT="DIRTY — PR #575"
run_case "T3  DIRTY planterat (mergeStateStatus DIRTY) → bit 2" 2 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '575\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="DIRTY"
run_case "T4  DIRTY rent (CLEAN, armerad) → bit 2 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T5–T9c — ARMERINGS-KANDIDAT: fjärde vägen (§ Landning-tabellen,
# "armering-är-inte-minne"). Sju fall: ett planterat, tre rena varianter
# (armerad / draft / fel mergeStateStatus), ett andra planterat fall
# (UNSTABLE räknas också, inte bara CLEAN), och TASK-128:s par — köad
# (isInMergeQueue=true) som INTE ska larma vs. genuint utsparkad
# (isInMergeQueue=false) som FORTFARANDE ska larma. Alla T1–T9 sätter
# isInMergeQueue=false explicit (6:e TSV-kolumnen) — den dimensionen
# ska inte påverka RÖTT/DIRTY/de äldre KANDIDAT-varianterna.
reset_scen
set_rows '565\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #565"
run_case "T5  KANDIDAT planterat (CLEAN, ej armerad, ej draft) → bit 4" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T6  KANDIDAT rent — redan armerad → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\ttrue\tCLEAN\tfalse\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T7  KANDIDAT rent — draft → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\tfalse\tBLOCKED\tfalse\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T8  KANDIDAT rent — BLOCKED (ej CLEAN/UNSTABLE) → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\tfalse\tUNSTABLE\tfalse\tSUCCESS\tfalse\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #565"
run_case "T9  KANDIDAT planterat — UNSTABLE räknas också → bit 4" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

# T9b/T9c (TASK-128) — isInMergeQueue är den enda skillnaden mellan raderna:
# samma nummer (#617, det verkligt mätta PR:et), samma CLEAN/ej-draft/
# ej-automerge-villkor. Det ISOLERAR exakt den nya diskriminatorn.
reset_scen
set_rows '617\tfalse\tCLEAN\tfalse\tSUCCESS\ttrue\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T9b KANDIDAT rent — KÖAD (isInMergeQueue=true, PR #617-mönstret) → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '617\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #617"
run_case "T9c KANDIDAT planterat — genuint UTSPARKAD (isInMergeQueue=false) → bit 4 fortfarande satt" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T10 — KOMBINERAT. En RÖD PR och en DIRTY PR samtidigt, olika PR-nummer.
# Bitmask-summering: 1 (RÖTT) | 2 (DIRTY) = 3. Båda larmraderna ska synas.
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n575\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\n'
run_case "T10 KOMBINERAT — RÖD + DIRTY samtidigt → bitmask 3" 3 - \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF "RÖTT — PR #572" "${TEST_DIR}/out.txt" && grep -qF "DIRTY — PR #575" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T10b  båda larmraderna syns i samma svep\n'; PASSED=$(( PASSED + 1 ))
else
    printf '  ✗ T10b  saknar en av larmraderna\n'; FAILED=$(( FAILED + 1 ))
fi

# ============================================================
# T11/T12 — main-SHA: AVANCEMANG är edge-triggered (en landning är en
# diskret händelse, inte ett ihållande larm-tillstånd) — till skillnad från
# RÖTT/DIRTY ovan som är level-triggered (L443). Två sopningar i SAMMA
# testfall, delat state, för att mäta övergången.
echo ""
reset_scen
printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "${SCEN}/main-sha"
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once ) >/dev/null 2>&1
printf 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' > "${SCEN}/main-sha"
EXPECT_OUT="main AVANCERADE aaaaaaaa → bbbbbbbb"
run_case "T11 main-SHA AVANCERAR mellan två sopningar → larmrad" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
printf 'cccccccccccccccccccccccccccccccccccccccc' > "${SCEN}/main-sha"
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once ) >/dev/null 2>&1
NOT_EXPECT_OUT="AVANCERADE"
run_case "T12 main-SHA OFÖRÄNDRAD mellan två sopningar → ingen larmrad" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T13/T14 — FAIL-CLOSED. Ett obesvarat instrument är farligare tystnat än
# fällt (samma princip och samma exit-kod, 77, som staging-semaphore.sh).
echo ""
reset_scen
touch "${SCEN}/fail-mainsha"
EXPECT_OUT="SONDEN KUNDE INTE SVARA — main-SHA"
run_case "T13 fail-closed: main-SHA-anropet misslyckas → 77" 77 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
touch "${SCEN}/fail-prlist"
EXPECT_OUT="SONDEN KUNDE INTE SVARA — pr-lista"
run_case "T14 fail-closed: pr-lista-anropet misslyckas → 77" 77 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T15–T17 — ANVÄNDNINGSFEL (config/flagga saknas eller ogiltig) → 64,
# sysexits EX_USAGE, samma konvention som staging-semaphore.sh.
echo ""
reset_scen
run_case "T15 användningsfel: REPO saknas (ingen config, ingen flagga) → 64" 64 - \
    env HEARTBEAT_SVEP_POLICY=/finns/inte.conf \
    bash ./scripts/heartbeat-svep.sh --once

run_case "T16 användningsfel: ogiltigt --interval (0) → 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --interval 0

run_case "T17 användningsfel: ogiltigt --timeout (icke-numeriskt) → 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --timeout abc

# ============================================================
# T18 — --once LOOPAR ALDRIG. Ett stort --interval (50s) skulle avslöja en
# regression direkt: om --once av misstag går in i loop-grenen hänger
# testet i minst 50s. Bunden till 5s ger bred marginal utan att vara skör.
echo ""
reset_scen
run_case "T18 --once loopar aldrig (stort --interval, ändå snabb)" 0 5 \
    bash ./scripts/heartbeat-svep.sh --once --interval 50

# ============================================================
# T19 — LOOP-LÄGE, --timeout-bundet. interval=1, timeout=3 ⇒ flera
# iterationer inom en kort, deterministisk budget. Sista sopningens verdikt
# (RÖTT planterat i scenariot) ska vara skriptets slutliga exit-kod.
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n'
run_case "T19 loop-läge, --timeout-bundet, sista verdikt vinner → 1" 1 8 \
    bash ./scripts/heartbeat-svep.sh --interval 1 --timeout 3
if [[ "$(grep -c 'RÖTT — PR #572' "${TEST_DIR}/out.txt" 2>/dev/null || true)" -ge 2 ]]; then
    printf '  ✓ T19b  minst två sopningar hann köras inom loop-fönstret\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T19b  färre än två sopningar sågs — loopen körde inte\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T20 — TOM PR-lista. Grundfallet: inga öppna PR:ar alls ska vara ALLT
# LUGNT, inte ett fel.
echo ""
reset_scen
EXPECT_OUT="0 öppna PR:ar granskade"
run_case "T20 tom PR-lista → 0 granskade, ALLT LUGNT" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T21/T22 — --quiet dämpar RUTIN-rader men ALDRIG larm-rader (L443: ett
# tillstånd som håller i ska synas lika tydligt varje gång — att låta
# --quiet tysta det vore att återintroducera exakt den envägs-blindheten
# kortet finns för att åtgärda).
echo ""
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n'
EXPECT_OUT="RÖTT — PR #572"
NOT_EXPECT_OUT="öppna PR:ar granskade"
run_case "T21 --quiet dämpar rutin men ALDRIG larm (RÖTT syns ändå)" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet

# T22 mäter den STABILA tystnaden — känt tidigare SHA, oförändrat, inga
# PR-larm — INTE kallstart (TASK-135, se T23 nedan). En färsk tillstånds-
# katalog har inget att jämföra mot och skriver därför sin EGEN ALLTID-PÅ-
# rad ("main-SHA-baslinje satt"); en preliminär sopning (utdata kastad,
# samma tvåsopnings-mönster som T11/T12) etablerar baslinjen FÖRE
# mättillfället, så detta fall isolerar den riktiga steady-state-tystnaden.
reset_scen
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once --quiet ) >/dev/null 2>&1
run_case "T22 --quiet vid stabilt, känt läge → helt tyst stdout" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if [[ -s "${TEST_DIR}/out.txt" ]]; then
    printf '  ✗ T22b  förväntade tom utdata, fick:\n'
    sed 's/^/      /' "${TEST_DIR}/out.txt" | head -5
    FAILED=$(( FAILED + 1 ))
else
    printf '  ✓ T22b  stdout helt tomt vid stabilt, känt, tyst läge\n'
    PASSED=$(( PASSED + 1 ))
fi

# ============================================================
# T23 — KALLSTART (TASK-135, 2026-08-04): explicit "main-SHA-baslinje
# satt"-rad krävs ÄVEN under --quiet. En avancemang-rad KRÄVER ett känt
# tidigare SHA; saknas det (färsk/tömd tillstånds-katalog) finns inget att
# jämföra mot. Utan denna rad är en genuin kallstart och en tystad,
# uteblivet-larm-sopning OMÖJLIGA att skilja åt i en --quiet rå-logg —
# EXAKT den förväxling som startade TASK-135: svepet observerades aldrig
# visa en avancemang-rad efter PR #684 landade (10:19:45Z); förklaringen
# var kallstart/förlorad tillståndskontinuitet, inte trasig
# --quiet-hantering (den var, mätt via T11/T12/T21/T22 ovan, redan korrekt
# — de vägde bara aldrig kallstarts-fallet specifikt, samma lucka i
# TÄCKNING som orsakade att förväxlingen kunde uppstå obemärkt).
# TVÅSIDIGT BEVIS (kortets AC #2): detta fall FÄLLER på det orörda
# skriptet (kallstarten gick tidigare via say(), tystad av --quiet — noll
# rader, identiskt med den gamla T22-formen ovan) och PASSERAR efter
# fixen (kallstarten går nu via alarm()).
echo ""
reset_scen
EXPECT_OUT="main-SHA-baslinje satt"
run_case "T23 KALLSTART — baslinje-rad syns ÄVEN under --quiet (TASK-135)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet

# ============================================================
# T24 — --help ljuger inte tyst (samma disciplin som ci-wait.sh, se
# skriptets egen kommentar vid `-h|--help`-grenen). Radintervallet
# `sed -n '61,104p'` MÅSTE följa § ANVÄNDNING-blockets faktiska gränser;
# TASK-135 utökade blocket (61,81 → 61,104) för ALLTID-PÅ-klassen +
# kallstart-stycket. Detta fall bevisar att --help FAKTISKT visar det nya
# innehållet OCH blockets svans, inte bara att sed-anropet kör utan fel.
echo ""
EXPECT_OUT="ALLTID-PÅ"
run_case "T24 --help visar den nya ALLTID-PÅ/KALLSTART-texten (TASK-135)" 0 - \
    bash ./scripts/heartbeat-svep.sh --help
if grep -qF "KALLSTART" "${TEST_DIR}/out.txt" && grep -qF "Startform som bakgrunds-monitor" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T24b  --help täcker hela det uppdaterade ANVÄNDNING-blocket\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T24b  --help saknar KALLSTART-stycket eller blockets svans\n'; FAILED=$((FAILED+1))
fi
# T24c (TASK-323) — den DESTRUKTIVA bieffekten måste synas i --help. Ett
# skript som kan radera grenar får inte dölja det i ett block --help hoppar
# över; detta fall fäller om radintervallet inte följer med blockets nya slut.
if grep -qF "UNDERHÅLL — GLES GREN-STÄDNING" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T24c  --help visar § UNDERHÅLL (gren-städningen är synlig, inte dold)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T24c  --help saknar § UNDERHÅLL — radintervallet följde inte med blocket\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T25/T25b/T26/T27/T27b — HEARTBEAT_EXEMPT_AUTHORS (fynd 2026-08-04,
# dependabot-kvartetten #632–#635). setup() kopierar den RIKTIGA
# .heartbeat-svep-policy.conf (samma relation som produktionen, § LAYOUTEN
# ovan) — den bär redan HEARTBEAT_EXEMPT_AUTHORS=("dependabot"), så T25/T26
# prövar mekanismen mot den FAKTISKA konfigurationen, inte en testdouble.
echo ""
reset_scen
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
EXPECT_OUT="PARKERAD (undantagen) — PR #632"
NOT_EXPECT_OUT="ARMERINGS-KANDIDAT"
run_case "T25 undantagen PR (author=dependabot) → PARKERAD-rutinrad, INGET kandidat-larm" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# T25b isolerar --quiet-dämpningen från kallstartens ALLTID-PÅ-rad (samma
# tvåsopnings-teknik som T22: en preliminär, kastad sopning sätter
# SHA-baslinjen FÖRE mättillfället).
reset_scen
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once --quiet ) >/dev/null 2>&1
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
run_case "T25b samma undantagna PR under --quiet, stabilt SHA → helt tyst stdout" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if [[ -s "${TEST_DIR}/out.txt" ]]; then
    printf '  ✗ T25c  förväntade tom utdata (PARKERAD dämpad av --quiet), fick:\n'
    sed 's/^/      /' "${TEST_DIR}/out.txt" | head -5
    FAILED=$(( FAILED + 1 ))
else
    printf '  ✓ T25c  stdout helt tomt — PARKERAD-raden är en rutin-rad, inte ett larm\n'
    PASSED=$(( PASSED + 1 ))
fi

reset_scen
set_rows '640\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\toctocat\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #640"
NOT_EXPECT_OUT="PARKERAD"
run_case "T26 icke-undantagen författare (octocat, en människas PR) → larmar FORTFARANDE" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

# T27/T27b: två ODEFINIERAD-varianter av "tom/saknad" (kortets krav-text
# nämner uttryckligen båda) mot en HANDSKRIVEN policy-fil utan (T27) eller
# med tom (T27b) HEARTBEAT_EXEMPT_AUTHORS — bevisar att skriptets EGEN
# fail-open-default (HEARTBEAT_EXEMPT_AUTHORS=() FÖRE source, se
# scripts/heartbeat-svep.sh) håller oavsett vilken av de två formerna
# policy-filen råkar sakna.
echo ""
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    > "${TEST_DIR}/.no-exempt-policy.conf"
reset_scen
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #632"
NOT_EXPECT_OUT="PARKERAD"
run_case "T27 HEARTBEAT_EXEMPT_AUTHORS SAKNAS helt i policyn → fail-open, larmar ändå" 4 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.no-exempt-policy.conf" \
    bash ./scripts/heartbeat-svep.sh --once

printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_EXEMPT_AUTHORS=()' \
    > "${TEST_DIR}/.empty-exempt-policy.conf"
reset_scen
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #632"
NOT_EXPECT_OUT="PARKERAD"
run_case "T27b HEARTBEAT_EXEMPT_AUTHORS definierad TOM (()) → fail-open, larmar ändå" 4 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.empty-exempt-policy.conf" \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T28–T36 — FEMTE VÄGEN: gles gren-städning (TASK-323).
#
# Vad som bevisas TVÅSIDIGT, och varför just dessa par:
#   fyrar/tiger      T28 (intervall passerat ⇒ körs) mot T29 (samma stub
#                    direkt efter ⇒ glesningen håller den tyst).
#   på/av            T28 mot T30 (INTERVALL=0 ⇒ stubben anropas ALDRIG,
#                    bevisat med en argv-markörfil, inte med tyst utdata —
#                    tyst utdata bevisar bara att inget SKREVS, inte att
#                    inget KÖRDES).
#   tyst vid noll    T31 — designkravet "tyst vid noll kandidater": en
#                    idempotent körning utan fynd skriver ingenting alls.
#   larmar aldrig    T32 (städning exit 1 ⇒ svepets verdikt fortfarande 0)
#                    och T33 (städning exit 1 + en RÖD PR ⇒ verdikt exakt 1,
#                    inte förorenat). T33 är det egentliga beviset: den
#                    skiljer "städningen tystade sig" från "städningen råkade
#                    inte påverka en redan tom bitmask".
#   fail-safe        T34 — STADA_BIN saknas på disk ⇒ tyst, exit 0. Det är
#                    exakt läget för varje spoke som kopierar heartbeat men
#                    inte stada-grenar.sh.
#   rutin, ej larm   T35 — --quiet dämpar UNDERHÅLL-raden. Om den vore ett
#                    larm hade den överlevt --quiet (jfr T21/T22).
#   kontraktet       T36 — stubben tar emot `--utfor` och INTE
#                    `--ingen-fetch`. Argumentvalet är ett medvetet beslut
#                    (stada-grenar.sh: en stale bas under-rapporterar) och
#                    ska fällas om någon "optimerar" bort fetchen.
echo ""

# Stub för stada-grenar.sh: loggar sin argv, ekar en summering i skriptets
# riktiga format, och kan fås att fallera. T323_RADERADE styr talet som
# heartbeat parsar ut.
cat > "${TEST_DIR}/stada-stub.sh" <<'STADASTUB'
#!/usr/bin/env bash
[ -n "${T323_ARGV:-}" ] && printf '%s\n' "$*" > "${T323_ARGV}"
printf '=== GRENSTADNING ===\n'
printf -- '-- Summering --\n'
printf 'Raderade grenar:  %s\n' "${T323_RADERADE:-0}"
printf 'Skonade grenar:    2\n'
exit "${T323_EXIT:-0}"
STADASTUB
chmod +x "${TEST_DIR}/stada-stub.sh"
STADA_STUB="${TEST_DIR}/stada-stub.sh"
ARGV_FIL="${TEST_DIR}/stada-argv.txt"

reset_scen
rm -f "${ARGV_FIL}"
EXPECT_OUT="UNDERHÅLL — 3 mergade lokala grenar städade"
run_case "T28 intervall passerat (kallstart) + 3 raderade → UNDERHÅLL-rutinrad, exit 0" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=3 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once

# T29 — INGEN reset_scen: stämpeln från T28 ligger kvar i STATE_DIR, så
# glesningen ska hålla nästa svep tyst trots att stubben skulle rapportera
# fynd. Bevisar att intervallet faktiskt läses, inte bara skrivs.
rm -f "${ARGV_FIL}"
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T29 andra svepet direkt efter → glesningen håller städningen tyst" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=3 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -f "${ARGV_FIL}" ]]; then
    printf '  ✗ T29b  stubben KÖRDES trots att intervallet inte passerat\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T29b  stubben anropades aldrig — glesningen är en spärr, inte bara tystnad\n'; PASSED=$((PASSED+1))
fi

# T30 — AV-läget. Egen policy-fil med INTERVALL=0.
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_STADA_GRENAR_INTERVALL=0' \
    > "${TEST_DIR}/.stada-av-policy.conf"
reset_scen
rm -f "${ARGV_FIL}"
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T30 HEARTBEAT_STADA_GRENAR_INTERVALL=0 → städningen är AV" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.stada-av-policy.conf" \
    HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=9 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -f "${ARGV_FIL}" ]]; then
    printf '  ✗ T30b  stubben KÖRDES trots INTERVALL=0\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T30b  stubben anropades aldrig vid INTERVALL=0\n'; PASSED=$((PASSED+1))
fi

# T31 — tyst vid noll (designkrav b).
reset_scen
rm -f "${ARGV_FIL}"
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T31 städning körd men 0 raderade → helt tyst om städningen" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=0 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -f "${ARGV_FIL}" ]]; then
    printf '  ✓ T31b  stubben KÖRDES — tystnaden är "inget att rapportera", inte "hoppade över"\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T31b  stubben kördes aldrig — fel orsak till tystnaden\n'; FAILED=$((FAILED+1))
fi

# T32/T33 — LARMAR ALDRIG. T33 är det skarpa fallet: en RÖD PR ger verdikt 1,
# och en samtidigt fallerande städning får inte ändra den siffran.
reset_scen
EXPECT_OUT="gren-städningen gav exit 1"
run_case "T32 städningen fallerar, inga PR-fynd → verdikt ÄNDÅ 0" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_EXIT=1 \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '701\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\n'
EXPECT_OUT="gren-städningen gav exit 1"
run_case "T33 städningen fallerar + RÖD PR → verdikt exakt 1, bitmasken oförorenad" 1 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_EXIT=1 \
    bash ./scripts/heartbeat-svep.sh --once

# T34 — fail-safe: skriptet finns inte på disk (varje spoke utan
# stada-grenar.sh).
reset_scen
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T34 STADA_BIN saknas på disk → tyst, exit 0 (ingen spoke kraschar)" 0 - \
    env HEARTBEAT_STADA_BIN="${TEST_DIR}/finns-inte.sh" \
    bash ./scripts/heartbeat-svep.sh --once

# T35 — UNDERHÅLL-raden är en RUTIN-rad: --quiet ska dämpa den. Tvåsopnings-
# tekniken från T22/T25b sätter SHA-baslinjen först så kallstart-raden inte
# förorenar mätningen; STATE_DIR behålls, så andra sopningen måste få ett
# eget städ-fönster — därav den egna policyfilen med INTERVALL=1.
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_STADA_GRENAR_INTERVALL=1' \
    > "${TEST_DIR}/.stada-tat-policy.conf"
reset_scen
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" \
    HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.stada-tat-policy.conf" \
    HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=4 \
    bash ./scripts/heartbeat-svep.sh --once --quiet ) >/dev/null 2>&1
sleep 2
run_case "T35 UNDERHÅLL-raden dämpas av --quiet (rutin-rad, inget larm)" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.stada-tat-policy.conf" \
    HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=4 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if [[ -s "${TEST_DIR}/out.txt" ]]; then
    printf '  ✗ T35b  förväntade tom utdata under --quiet, fick:\n'
    sed 's/^/      /' "${TEST_DIR}/out.txt" | head -5
    FAILED=$(( FAILED + 1 ))
else
    printf '  ✓ T35b  stdout helt tomt — UNDERHÅLL är rutin, inte larm\n'; PASSED=$((PASSED+1))
fi

# T36 — argv-kontraktet mot stada-grenar.sh.
reset_scen
rm -f "${ARGV_FIL}"
run_case "T36 anropet bär --utfor" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=1 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF -- "--utfor" "${ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T36b  --utfor skickas (annars vore städningen en evig torrkörning)\n'; PASSED=$((PASSED+1))
else
    ARGV_SETT="$(cat "${ARGV_FIL}" 2>/dev/null || true)"
    printf '  ✗ T36b  --utfor saknades i argv: %s\n' "${ARGV_SETT}"; FAILED=$((FAILED+1))
fi
if grep -qF -- "--ingen-fetch" "${ARGV_FIL}" 2>/dev/null; then
    printf '  ✗ T36c  --ingen-fetch skickades — basen blir stale och städningen under-rapporterar\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T36c  --ingen-fetch skickas INTE (färsk bas, medvetet val)\n'; PASSED=$((PASSED+1))
fi

# ============================================================
# T37/T38 — OBSERVABILITET: fel tystas ALDRIG av --quiet (TASK-323 runda 2,
# granskningsfynd 2 och 4).
#
# Varför detta är en egen klass, skild från T35: en persistent monitor körs
# rimligen MED --quiet (det är hela poängen med rutin/larm-distinktionen).
# Skickas ett FEL på say()-kanalen blir en kontinuerligt trasig städning helt
# osynlig — ingen stdout, bara en loggfil ingen läser om man inte redan vet
# att den finns. Samma observabilitets-felklass som TASK-135 en gång fixade
# för kallstart-raden. Därför går fel via alltid_pa(), som är --quiet-immun
# men INTE bär någon exit-bit.
#
# TVÅSIDIGHETEN sitter i paret T35 ↔ T37: SUCCESS-raden dämpas (T35b bevisar
# helt tom stdout), FAILURE-raden syns (T37). Vore båda på samma kanal kunde
# bara en av dem hålla.
echo ""

reset_scen
EXPECT_OUT="gren-städningen gav exit 1"
run_case "T37 städningen fallerar UNDER --quiet → felraden syns ändå (ALLTID-PÅ)" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_EXIT=1 \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if grep -qF "LARM (bitmask" "${TEST_DIR}/out.txt"; then
    printf '  ✗ T37b  felraden drog med sig ett LARM — städningen ska aldrig bära en exit-bit\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T37b  ingen LARM-rad — synlig utan att vara ett larm\n'; PASSED=$((PASSED+1))
fi

# T38 — stämpel-skrivningen fallerar. Mockas genom att göra .tmp-sökvägen till
# en KATALOG: `printf > <katalog>` fallerar ("Is a directory") utan att röra
# något annat state, så main-SHA-vägen är opåverkad och felet isoleras till
# exakt den skrivning fyndet gäller.
reset_scen
mkdir -p "${STATE_DIR}/last-stada-grenar.tmp"
EXPECT_OUT="kunde inte stämpla"
run_case "T38 stämpel-skrivfel UNDER --quiet → synlig rad, inte tyst || true" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=2 \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if grep -qF "LARM (bitmask" "${TEST_DIR}/out.txt"; then
    printf '  ✗ T38b  stämpel-felet drog med sig ett LARM — får inte påverka verdiktet\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T38b  ingen LARM-rad — stämpel-felet är synligt men bär ingen exit-bit\n'; PASSED=$((PASSED+1))
fi
rm -rf "${STATE_DIR}/last-stada-grenar.tmp"

# T39 — den lyckade stämplingen lämnar INGEN .tmp-fil kvar (atomiciteten får
# inte läcka skräp in i STATE_DIR vid varje svep).
reset_scen
run_case "T39 lyckad stämpling → atomär mv, ingen kvarlämnad .tmp" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=1 \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -e "${STATE_DIR}/last-stada-grenar.tmp" ]]; then
    printf '  ✗ T39b  .tmp-filen ligger kvar efter en lyckad körning\n'; FAILED=$((FAILED+1))
elif [[ -f "${STATE_DIR}/last-stada-grenar" ]]; then
    printf '  ✓ T39b  stämpeln på plats, ingen .tmp kvar\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T39b  stämpeln saknas helt\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T40–T55 — TASK-462, SESSIONSMEDVETET SVEP. TSV-radformatet har en 8:e
# kolumn sedan TASK-462 (`body`, för markören) — se § LAYOUTEN i filhuvudet:
# äldre rader (7 kolumner) läses fortfarande korrekt (body blir tom sträng),
# vilket ÄR T1–T39:s implicita bakåtkompatibilitetsbevis. Dessa fall sätter
# den 8:e kolumnen explicit.
echo ""

# T40/T41/T42 — RÖTT: tvåsidigt bevis för sessionsfiltreringen (AC #1/#2).
# automerge=true isolerar RÖTT-vägen från KANDIDAT-vägen, samma teknik som
# T1/T2.
reset_scen
set_rows '801\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S126 -->\n'
EXPECT_OUT="RÖTT — PR #801"
run_case "T40 RÖTT, EGEN sessionsmarkör → larmar" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

reset_scen
set_rows '802\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S127 -->\n'
NOT_EXPECT_OUT="RÖTT"
run_case "T41 RÖTT, FRÄMMANDE sessionsmarkör (S127) i sessionsläge S126 → TYST" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

reset_scen
set_rows '802\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S127 -->\n'
EXPECT_OUT="RÖTT — PR #802"
run_case "T42 SAMMA främmande röda PR, men --alla → larmar (dagens beteende)" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --alla

# T43/T44 — DIRTY: tvåsidigt bevis. automerge=true isolerar från KANDIDAT.
reset_scen
set_rows '803\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\toctocat\t<!-- heartbeat-svep:session:S126 -->\n'
EXPECT_OUT="DIRTY — PR #803"
run_case "T43 DIRTY, EGEN sessionsmarkör → larmar" 2 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

reset_scen
set_rows '804\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\toctocat\t<!-- heartbeat-svep:session:S127 -->\n'
NOT_EXPECT_OUT="DIRTY"
run_case "T44 DIRTY, FRÄMMANDE sessionsmarkör i sessionsläge → TYST" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# T45/T46 — ARMERINGS-KANDIDAT: tvåsidigt bevis.
reset_scen
set_rows '805\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\toctocat\t<!-- heartbeat-svep:session:S126 -->\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #805"
run_case "T45 KANDIDAT, EGEN sessionsmarkör → larmar" 4 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

reset_scen
set_rows '806\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\toctocat\t<!-- heartbeat-svep:session:S127 -->\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T46 KANDIDAT, FRÄMMANDE sessionsmarkör i sessionsläge → TYST" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# ============================================================
# T47/T48 — DEN OMÄRKTA-PR-NOTISEN (AC #3): tvåsidigt bevis på GLESNINGEN
# (fyrar vid kallstart, tiger direkt efter) — samma par-teknik som T28/T29
# för gren-städningen. rollup/mss hålls SUCCESS/CLEAN så verdikten
# otvetydigt är 0 oavsett notisen (en omärkt PR bearbetas ALDRIG för
# RÖTT/DIRTY/KANDIDAT).
echo ""
reset_scen
set_rows '810\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\toctocat\t\n'
EXPECT_OUT="SESSION — 1 öppna PR:ar UTAN sessionsmarkör"
run_case "T47 OMÄRKT PR, kallstart-intervall → ALLTID-PÅ-notis (syns, ingen exit-bit)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126
if grep -qF "#810" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T47b  notisen namnger PR-numret\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T47b  notisen saknar PR-numret #810\n'; FAILED=$((FAILED+1))
fi

# T47c — samma scenario UNDER --quiet: notisen ska synas ÄNDÅ (alltid_pa(),
# --quiet-immun) — men kräver en EGEN kallstart (färskt state) för att
# glesningen inte redan ska ha stämplats av T47 ovan.
reset_scen
set_rows '810\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\toctocat\t\n'
EXPECT_OUT="SESSION — 1 öppna PR:ar UTAN sessionsmarkör"
run_case "T47c samma sak UNDER --quiet → notisen syns ÄNDÅ" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126 --quiet

# T48 — INGEN reset_scen: stämpeln från T47c ligger kvar, så glesningen ska
# hålla notisen tyst trots att samma omärkta PR fortfarande står öppen.
NOT_EXPECT_OUT="UTAN sessionsmarkör"
run_case "T48 samma omärkta PR direkt igen → glesningen håller notisen tyst" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# ============================================================
# T49 — DEPENDABOT UNDANTAS UR DEN OMÄRKTA BUCKETEN (AC #4, medvetet
# beslut). Färsk kallstart (annars döljer T48:s glesning resultatet oavsett
# vad denna PR är).
reset_scen
set_rows '811\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\tdependabot\t\n'
NOT_EXPECT_OUT="UTAN sessionsmarkör"
run_case "T49 omärkt PR, author=dependabot → EXKLUDERAS ur bucketen, ingen notis" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# ============================================================
# T50 — BAKÅTKOMPATIBILITET (AC #8): ingen --session/--alla ⇒ dagens
# beteende är HELT okänsligt för markörer — en PR märkt för en annan
# session larmar ÄNDÅ, exakt som innan TASK-462 fanns.
echo ""
reset_scen
set_rows '820\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S999 -->\n'
EXPECT_OUT="RÖTT — PR #820"
run_case "T50 BAKÅTKOMPATIBILITET — ingen flagga, märkt PR larmar ändå" 1 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T51–T53 — TIPS-RADEN (review runda 1 fynd 1, Marcus-beslut 2026-09-19):
# flyttad från stderr till STDOUT (alltid_pa(), quiet-immun), taktad av
# HEARTBEAT_OMARKERAD_INTERVALL — se tips_notis_om_dags() för hela
# resonemanget (repots dokumenterade körform är en bakgrunds-Monitor, och
# Monitor-verktygets specifikation säger att bara stdout blir
# notifikationer). Uteblir HELT (varken stdout eller stderr) när --session
# eller --alla ges (sessionen känner redan till mekanismen).
echo ""
reset_scen
EXPECT_OUT="TIPS — sessionsläge finns"
run_case "T51 TIPS-raden på STDOUT (kallstart) när ingen flagga ges" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF "TIPS — sessionsläge finns" "${TEST_DIR}/err.txt" 2>/dev/null; then
    printf '  ✗ T51b  TIPS-raden syns FORTFARANDE på stderr — flytten är ofullständig\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T51b  TIPS-raden syns INTE på stderr (flytten är fullständig)\n'; PASSED=$((PASSED+1))
fi

# T51c — INGEN reset_scen: TIPS-stämpeln från T51 ligger kvar (samma
# glesnings-teknik som T47/T48 för den omärkta-PR-notisen), så tipset ska
# vara strypt trots att varken --session eller --alla ges den här gången.
NOT_EXPECT_OUT="TIPS —"
run_case "T51c TIPS-raden STRYPS — samma anrop direkt igen" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
NOT_EXPECT_OUT="TIPS"
NOT_EXPECT_ERR="TIPS"
run_case "T52 TIPS-raden UTEBLIR HELT (stdout+stderr) när --session ges" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S1

reset_scen
NOT_EXPECT_OUT="TIPS"
NOT_EXPECT_ERR="TIPS"
run_case "T53 TIPS-raden UTEBLIR HELT när --alla ges" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --alla

# ============================================================
# T54 — BÅDA FLAGGOR SAMTIDIGT: --alla VINNER (dokumenterad precedens,
# § SESSIONSMEDVETET SVEP). Återanvänder T41/T42:s främmande-PR-scenario:
# under --session ENSAM är den tyst (T41), under --alla ska den larma
# OAVSETT att --session också gavs.
echo ""
reset_scen
set_rows '802\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S127 -->\n'
EXPECT_OUT="RÖTT — PR #802"
run_case "T54 --session OCH --alla samtidigt → --alla vinner, larmar" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126 --alla

# ============================================================
# T55 — --help visar den nya SESSIONSMEDVETET SVEP-sektionen och flaggorna
# (samma "ljug inte tyst"-disciplin som T24).
echo ""
EXPECT_OUT="SESSIONSMEDVETET SVEP"
run_case "T55 --help visar § SESSIONSMEDVETET SVEP" 0 - \
    bash ./scripts/heartbeat-svep.sh --help
if grep -qF -- "--session ID" "${TEST_DIR}/out.txt" && grep -qF -- "--alla" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T55b  --help dokumenterar --session och --alla\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T55b  --help saknar --session/--alla-dokumentationen\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T56–T61 — DEPENDABOT RÖTT/DIRTY I SESSIONSLÄGE (review runda 1 fynd 2,
# Marcus-beslut 2026-09-19). Innan denna fixrunda gjorde sessionsfiltreringens
# "ingen markör alls"-gren `continue` FÖRE RÖTT/DIRTY-klassningen ÄVEN för
# HEARTBEAT_EXEMPT_AUTHORS-författare (dependabot m.fl.) — så en genuint
# trasig Dependabot-CI blev HELT OSYNLIG i sessionsläge, i strid med
# policy-filens egen § "GRÄNS" ("larmar OFÖRÄNDRAT"). automerge=true och
# mss=BLOCKED/DIRTY väljs medvetet för att isolera RÖTT/DIRTY-vägen från
# KANDIDAT-vägen, samma teknik som T1/T3.
echo ""
reset_scen
set_rows '900\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\tdependabot\t\n'
EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
NOT_EXPECT_OUT="RÖTT — PR #900"
run_case "T56 Dependabot RÖTT, omärkt, sessionsläge → strypt besked, INGEN bitmask-bit" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126
if grep -qF "#900 (dependabot: RÖTT (FAILURE))" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T56b  notisen namnger PR-nummer, författare OCH skäl\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T56b  notisen saknar PR #900/dependabot/RÖTT (FAILURE) i förväntat format\n'; FAILED=$((FAILED+1))
fi

# T57 — DIRTY-varianten, egen kallstart (annars döljer T56:s glesning
# resultatet oavsett vad denna PR är).
reset_scen
set_rows '901\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\tdependabot\t\n'
EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T57 Dependabot DIRTY, omärkt, sessionsläge → samma strypta kanal" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126
if grep -qF "#901 (dependabot: DIRTY)" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T57b  notisen namnger PR #901 med skälet DIRTY\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T57b  notisen saknar #901/DIRTY i förväntat format\n'; FAILED=$((FAILED+1))
fi

# T58 — GLESNING: INGEN reset_scen, samma dependabot-RÖTT-PR som T56 körs
# igen direkt (stämpeln från T56 ligger kvar sedan T57:s EGEN state-fil
# aldrig delar stämpel med T56:s) — måste alltså återanvända T56:s scenario,
# inte T57:s, för att mäta RÄTT stämpel.
reset_scen
set_rows '900\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\tdependabot\t\n'
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once --session S126 ) >/dev/null 2>&1
NOT_EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T58 SAMMA dependabot-RÖTT-PR direkt igen → glesningen håller notisen tyst" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# T59 — MED --alla: dagens beteende OFÖRÄNDRAT. Ingen sessionsfiltrering
# alls körs (sessionslage=0), så PR:en går genom den VANLIGA RÖTT-
# klassningen och larmar precis som varje annan röd PR — ingen
# "UNDANTAGEN FÖRFATTARE"-rad (den kanalen existerar bara i sessionsläge).
reset_scen
set_rows '900\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\tdependabot\t\n'
EXPECT_OUT="RÖTT — PR #900"
NOT_EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T59 SAMMA PR, men --alla → dagens beteende oförändrat (vanlig RÖTT-alarm)" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --alla

# T60 — GRÖN dependabot-PR (SUCCESS/CLEAN), omärkt, sessionsläge → INGEN
# dependabot-status-notis (0 fynd). Utökar T49 (som bara bevisar att den
# INTE hamnar i den omärkta bucketen) med en EXPLICIT kontroll av den NYA
# kanalen också.
reset_scen
set_rows '902\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\tdependabot\t\n'
NOT_EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T60 Dependabot GRÖN, omärkt, sessionsläge → ingen dependabot-status-notis" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# T61 — kod-/hjälptexten är RÄTTAD (ADR-083): --help ska nämna den nya
# funktionen (positivt bevis på den korrigerade mekanismen), inte bara
# frånvaron av den gamla, ofullständiga formuleringen (som ändå citeras
# ordagrant som HISTORIK i den rättade kommentaren — en ren frånvaro-kontroll
# hade gett falsk röd/grön signal beroende på citatet).
reset_scen
EXPECT_OUT="dependabot_status_notis_om_dags"
run_case "T61 --help/koden dokumenterar den rättade dependabot-RÖTT/DIRTY-mekanismen" 0 - \
    bash ./scripts/heartbeat-svep.sh --help

# ============================================================
# T62–T65 — PER-SESSION STATSFIL-SUFFIX (review runda 3, Marcus-beslut
# 2026-09-19). Granskningens fynd: de strypta notisernas state-filer låg i
# en MASKIN-GLOBAL STATE_DIR — en session som sopade FÖRE en annan stämplade
# filen åt BÅDA, så den andra sessionen kunde stå helt tyst under sin EGEN
# första sopning. INGEN reset_scen mellan T62/T62b (eller T63/T63b): det ÄR
# poängen — SAMMA STATE_DIR, TVÅ OLIKA --session-värden.
echo ""
reset_scen
set_rows '910\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\tdependabot\t\n'
EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T62 Session S126 (delad STATE_DIR): dependabot-notisen syns (kallstart)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# T62b — FIXEN: en ANNAN session (S127), SAMMA STATE_DIR, SAMMA scenario,
# direkt efter. Före denna runda: helt tyst (S126:s stämpel gällde för
# BÅDA). Efter: S127 har sin EGEN state-fil och ser notisen precis som om
# den vore ensam.
EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T62b Session S127 (SAMMA STATE_DIR) ser SAMMA notis oberoende — fixen" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S127

# T62c/T62d — båda sessionerna är nu strypta, men VAR FÖR SIG: S126:s andra
# sopning stryps av SIN EGEN stämpel (inte påverkad av att S127 sopat
# emellan), och S127:s andra sopning stryps av SIN.
NOT_EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T62c Session S126 igen → strypt av sin EGEN stämpel" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

NOT_EXPECT_OUT="UNDANTAGEN FÖRFATTARE"
run_case "T62d Session S127 igen → strypt av SIN EGEN stämpel (oberoende av S126)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S127

# T63/T63b/T63c/T63d — samma tvåsidiga bevis för den omärkta-PR-notisen.
reset_scen
set_rows '911\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\toctocat\t\n'
EXPECT_OUT="SESSION — 1 öppna PR:ar UTAN sessionsmarkör"
run_case "T63 Session S126 (delad STATE_DIR): omärkt-notisen syns (kallstart)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

EXPECT_OUT="SESSION — 1 öppna PR:ar UTAN sessionsmarkör"
run_case "T63b Session S127 (SAMMA STATE_DIR) ser SAMMA notis oberoende — fixen" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S127

NOT_EXPECT_OUT="UTAN sessionsmarkör"
run_case "T63c Session S126 igen → strypt av sin EGEN stämpel" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

NOT_EXPECT_OUT="UTAN sessionsmarkör"
run_case "T63d Session S127 igen → strypt av SIN EGEN stämpel (oberoende av S126)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S127

# T64 — OMSKRIVEN i review runda 4, EXIT-KOD RÄTTAD i review runda 5
# (Marcus-beslut 2026-09-19): session_id_sanitize() är BORTTAGEN. Ett
# tidigare "farligt men saneras"-ID ("../../etc/passwd") avvisas nu HELT i
# stället — fail-closed via die(), exit **64** (INTE 2: review runda 5
# fynd 1 — ett hemmagjort exit 2 kolliderade med bitmask-koden DIRTY).
# die() skriver ENDAST till stderr (den etablerade konventionen för VARJE
# annat CLI-/argumentfel i detta skript, se REPO/INTERVAL/TIMEOUT) — INTE
# till stdout som review runda 4:s hemmagjorda variant gjorde. INGEN fil
# skrivs alls (varken saniterad eller osaniterad). Se T68–T73 för den
# fullständiga tvåsidiga bevisningen av valideringen; detta fall behålls
# under T64:s namn som en direkt regressionsspärr mot att sanerings-
# beteendet av misstag återinförs.
reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T64 Farligt session-ID (path-traversal-försök) → AVVISAS (exit 64, endast stderr), skriver ingen fil" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session "../../etc/passwd"
if [[ -d "${STATE_DIR}" ]] && find "${STATE_DIR}" -mindepth 1 2>/dev/null | grep -q .; then
    printf '  ✗ T64b  STATE_DIR innehåller OVÄNTADE filer efter ett avvisat session-ID\n'
    find "${STATE_DIR}" -mindepth 1 2>/dev/null | sed 's/^/      /'
    FAILED=$((FAILED+1))
else
    printf '  ✓ T64b  STATE_DIR är tom/oskapad — inget skrevs för det avvisade ID:t\n'; PASSED=$((PASSED+1))
fi

# T65 — UTAN --session (TIPS-raden): dagens GLOBALA beteende är OFÖRÄNDRAT
# (KÄND BEGRÄNSNING, § SESSIONSMEDVETET SVEP). tips_notis_om_dags() körs
# ENDAST när SESSION saknas — det finns då inget ID att skopa mot, så två
# körningar som DELAR STATE_DIR delar fortfarande stämpeln. Samma par-teknik
# som T51/T51c, upprepad här explicit under review runda 3:s eget test-namn
# för spårbarhet (inte en ny mekanism — en bekräftelse att fixen INTE av
# misstag ändrade TIPS-raden).
reset_scen
EXPECT_OUT="TIPS — sessionsläge finns"
run_case "T65 Ingen --session (kallstart): TIPS syns" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
NOT_EXPECT_OUT="TIPS —"
run_case "T65b Ingen --session igen, SAMMA STATE_DIR → strypt globalt (oförändrat)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T66–T74 — SESSION-ID-VALIDERING (review runda 4, EXIT-KOD RÄTTAD i
# review runda 5, Marcus-beslut 2026-09-19). Fail-closed ersätter sanering:
# giltiga ID körs OFÖRÄNDRAT, ogiltiga AVVISAS med exit **64** (CLI-fel,
# samma sysexits-klass OCH samma die()-anrop som REPO/INTERVAL/TIMEOUT-
# valideringen — INTE ett eget hemmagjort exit 2, som kolliderade med
# bitmask-koden DIRTY) och ett felmeddelande på STDERR ENDAST (die()s
# etablerade konvention — EXPECT_ERR/NOT_EXPECT_OUT bevisar tillsammans
# att det INTE läcker till stdout).
echo ""
reset_scen
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T66 Giltigt ID \"S126\" (baseline) → körs normalt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

reset_scen
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T67 Giltigt ID MED punkt \"s126.resume.2\" → körs normalt (punkt tillåten)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session s126.resume.2

reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T68 Tomt --session-ID (\"\") → exit 64, fel ENDAST på stderr" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session ""

reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T69 Session-ID med mellanslag (\"S 126\") → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session "S 126"

reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
run_case "T70 Session-ID med snedstreck (\"S/126\") → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session "S/126"

reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
run_case "T71 Session-ID SOM ENBART punkter (\"..\") → exit 64 (path-traversal-form)" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session ".."

reset_scen
printf -v LANGT_ID 'a%.0s' {1..65}
EXPECT_ERR="OGILTIGT --session-ID"
run_case "T72 Session-ID på 65 tecken (över gränsen) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session "${LANGT_ID}"
if [[ "${#LANGT_ID}" -eq 65 ]]; then
    printf '  ✓ T72b  testets eget ID är verifierat 65 tecken (inte av misstag 64)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T72b  testets eget ID är %s tecken, inte 65 — testet mäter fel gräns\n' "${#LANGT_ID}"; FAILED=$((FAILED+1))
fi

# T73 — fail-closed betyder "ingen sopning skedde", inte "sopning med ett
# tomt/konstigt namn". Kör ETT ogiltigt anrop mot en HELT FÄRSK STATE_DIR
# (reset_scen) och bevisa att katalogen förblir tom — inte bara att EN
# specifik fil saknas (T64b), utan att INGET ALLS skrevs.
reset_scen
bash ./scripts/heartbeat-svep.sh --once --session "S/126" >/dev/null 2>&1
if [[ -d "${STATE_DIR}" ]] && find "${STATE_DIR}" -mindepth 1 2>/dev/null | grep -q .; then
    printf '  ✗ T73  STATE_DIR fick innehåll trots ett avvisat session-ID\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T73  STATE_DIR förblev tom — fail-closed skriver ingenting\n'; PASSED=$((PASSED+1))
fi

# T74 — kollision omöjlig per konstruktion: ETT TREDJE par giltiga ID i ett
# ANNAT format (innehåller punkter) än T62/T63:s "S126"/"S127" ska ändå ge
# VARSIN statsfil. Kompletterar (inte duplicerar) T62/T63 — bevisar att
# valideringen accepterar, och särskiljer, ID:n som RÅKAR dela ett prefix.
reset_scen
set_rows '913\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\toctocat\t\n'
run_case "T74 Giltigt ID \"v1.2.3\" (kallstart)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session v1.2.3
run_case "T74b Giltigt ID \"v1.2.30\" (delar prefix med T74, SAMMA STATE_DIR) → oberoende, ser notisen ÄNDÅ" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session v1.2.30
if [[ -f "${STATE_DIR}/last-omarkerad-notis-v1.2.3" && -f "${STATE_DIR}/last-omarkerad-notis-v1.2.30" ]]; then
    printf '  ✓ T74c  två VARSINA statsfiler (v1.2.3 och v1.2.30) — ingen kollision trots delat prefix\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T74c  förväntade två separata statsfiler för v1.2.3/v1.2.30, hittade inte båda\n'
    find "${STATE_DIR}" -maxdepth 1 -name 'last-omarkerad-notis-*' 2>/dev/null | sed 's/^/      /'
    FAILED=$((FAILED+1))
fi

# ============================================================
# T75–T79 — SAKNAT FLAGGVÄRDE (review runda 5 fynd 2, Marcus-beslut
# 2026-09-19). En värde-tagande flagga som är SISTA token (inget värde
# följer) fick tidigare `shift 2` att fallera — `set -e` avslutade DÅ hela
# skriptet med `shift`s EGEN exitkod (1, = bitmask RÖTT) och NOLL utskrift.
# Fångas nu INNAN `shift 2` körs: `die` med exit 64 och ett tydligt
# meddelande. Alla FEM värde-tagande flaggor testas — uppdraget efterfrågade
# uttryckligen samma fix "för varje annan flagga som tar ett värde, om
# samma mönster finns", och det gjorde det: identisk `"${2:-}"; shift 2`-
# form i alla fem grenar innan denna runda.
echo ""
reset_scen
EXPECT_ERR="kräver ett värde"
run_case "T75 --session som SISTA token (inget värde) → exit 64, INTE 1" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session

reset_scen
EXPECT_ERR="kräver ett värde"
run_case "T76 --repo som SISTA token (inget värde) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --repo

reset_scen
EXPECT_ERR="kräver ett värde"
run_case "T77 --branch som SISTA token (inget värde) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --branch

reset_scen
EXPECT_ERR="kräver ett värde"
run_case "T78 --interval som SISTA token (inget värde) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --interval

reset_scen
EXPECT_ERR="kräver ett värde"
run_case "T79 --timeout som SISTA token (inget värde) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --timeout

# ============================================================
# T80–T81b — SKIFTLÄGESOKÄNSLIGT STATSFILNAMN (review runda 5 fynd 3,
# Marcus-beslut 2026-09-19). "S126" och "s126" är MED AVSIKT samma session
# för de strypta notiskanalerna (macOS APFS delar annars fil ändå, på
# filsystemnivå, oavsett vad valideringen bevisar på strängnivå — se §
# SESSIONSMEDVETET SVEP "SKIFTLÄGESOKÄNSLIGT ÖVERALLT"). T82–T82d (markör-
# matchningen) flyttade till en egen sektion nedan i fix-runda 6, efter det
# att runda 5:s eget fynd 1 visade att policyn var asymmetrisk.
echo ""
reset_scen
set_rows '914\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\toctocat\t\n'
EXPECT_OUT="SESSION — 1 öppna PR:ar UTAN sessionsmarkör"
run_case "T80 Session \"S126\" (kallstart): omärkt-notisen syns" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

# T80b — INGEN reset_scen: SAMMA STATE_DIR, men nu \"s126\" (annat
# SKIFTLÄGE). Om skiftläge räknades som en ANNAN session hade detta varit
# en NY kallstart (notisen hade synts igen). Det ska den INTE göra —
# stämpeln delas MED AVSIKT.
NOT_EXPECT_OUT="UTAN sessionsmarkör"
run_case "T80b Session \"s126\" (annat skiftläge, SAMMA STATE_DIR) → strypt av S126:s stämpel (avsiktligt)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session s126

# T81 — den delade stämpelfilen ligger på GEMENER, inte på det skiftläge
# som råkade komma in FÖRST ("S126" i T80, versaler). VIKTIGT: `[[ -f ... ]]`
# DUGER INTE för detta — macOS APFS är skiftlägesOKÄNSLIGT för filLOOKUP som
# default, så `-f ".../last-omarkerad-notis-S126"` skulle hitta den redan
# skapade "...s126"-filen och ge ett FALSKT positivt "ja, versal-filen
# finns". `find -name` gör en STRÄNG-jämförelse mot det verkliga, lagrade
# katalognamnet (skiftlägeskänslig oavsett filsystemets lookup-beteende) —
# `ls`/`find`s returnerade sträng, inte ett andra filsystem-lookup, är den
# enda pålitliga metoden här.
STATSFIL_LISTA="$(find "${STATE_DIR}" -maxdepth 1 -name 'last-omarkerad-notis-*' 2>/dev/null)"
if grep -qF "last-omarkerad-notis-s126" <<<"${STATSFIL_LISTA}"; then
    printf '  ✓ T81  statsfilen är normaliserad till gemener (last-omarkerad-notis-s126)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T81  förväntade en gemener-normaliserad statsfil, hittade inte\n'
    printf '%s\n' "${STATSFIL_LISTA}" | sed 's/^/      /'
    FAILED=$((FAILED+1))
fi
if grep -qF "last-omarkerad-notis-S126" <<<"${STATSFIL_LISTA}"; then
    printf '  ✗ T81b  en OVÄNTAD versal-variant av statsfilen skapades också (last-omarkerad-notis-S126)\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T81b  ingen versal-variant av statsfilen skapades — bara EN fil för båda skiftlägena\n'; PASSED=$((PASSED+1))
fi

# ============================================================
# T82–T82d — SKIFTLÄGESOKÄNSLIGT ÖVERALLT, MARKÖR-MATCHNINGEN (fix-runda 6,
# review runda 5:s EGET fynd 1, Marcus-beslut 2026-09-19). T82 påstod i
# FÖREGÅENDE runda att pr_har_session_marker() var "en ANNAN, ORÖRD
# mekanism" och förblev skiftlägeskänslig — det gjorde policyn ASYMMETRISK:
# statsfilnamnet (T80/T80b ovan) normaliserades redan, men en PR märkt
# "S126" av bygg-agenten blev HELT OSYNLIG för sitt EGET RÖTT/DIRTY/
# ARMERINGS-KANDIDAT om svepet kördes med `--session s126` — precis
# "sessionen ser aldrig sitt eget röda"-felklassen kortet finns för att ta
# bort, återinförd via en enda bokstav. RÄTTAT: --session-värdet och
# PR-kroppens markör normaliseras BÅDA till gemener i
# pr_har_session_marker() innan jämförelsen — EN policy överallt.
echo ""
reset_scen
set_rows '915\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S126 -->\n'
EXPECT_OUT="RÖTT — PR #915"
run_case "T82 Markör \"S126\" (versaler) MATCHAS NU av --session \"s126\" (gemener) — VÄND fynd, EN policy överallt" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --session s126

reset_scen
set_rows '916\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:s126 -->\n'
EXPECT_OUT="RÖTT — PR #916"
run_case "T82b Omvänt skiftläge — markör \"s126\" (gemener) MATCHAS av --session \"S126\" (versaler)" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --session S126

reset_scen
set_rows '917\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S126-Resume-2 -->\n'
EXPECT_OUT="RÖTT — PR #917"
run_case "T82c Blandat skiftläge — markör \"S126-Resume-2\" MATCHAS av --session \"s126-resume-2\"" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --session s126-resume-2

reset_scen
set_rows '918\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\t<!-- heartbeat-svep:session:S127 -->\n'
NOT_EXPECT_OUT="RÖTT — PR #918"
run_case "T82d Genuint FRÄMMANDE session — markör \"S127\" FORTSATT TYST under --session \"s126\" (bara SKIFTLÄGET normaliseras, inte identiteten)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session s126

# ============================================================
# T83–T89 — FÖRSTA TECKNET MÅSTE VARA ALFANUMERISKT (review runda 5
# UPPFÖLJNING, samma dag, Marcus-beslut 2026-09-19). Upptäckt av
# bygg-agenten själv under FÖREGÅENDE rundas revision, byggt NU (innan
# nästa granskningsrunda) på orkestrerarens order: den GAMLA regexen
# (^[A-Za-z0-9._-]{1,64}$, valfritt tecken var som helst) gjorde
# `--session --alla` GILTIGT — "--alla" matchade regexen (bindestreck och
# bokstäver är tillåtna tecken) och konsumerades TYST som sessions-ID i
# stället för att avvisas som "flaggan --alla, inget värde gavs".
# HEARTBEAT_SESSION_ID_REGEX är nu ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ —
# FÖRSTA tecknet [A-Za-z0-9], INGET av "-"/"."/"_" — och
# ENDAST_PUNKTER_REGEX-kontrollen (T71) är sedan denna skärpning
# STRUKTURELLT REDUNDANT (ett rent punkt-ID kan aldrig ha ett alfanumeriskt
# FÖRSTA tecken), men behålls och testas ändå.
echo ""
reset_scen
EXPECT_ERR="SER UT SOM EN FLAGGA"
run_case "T83 --session --alla → exit 64 (var tidigare GILTIGT — huvudfyndet denna runda)" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session --alla

reset_scen
EXPECT_ERR="SER UT SOM EN FLAGGA"
run_case "T84 --session -x → exit 64 (börjar med \"-\")" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session -x

reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
run_case "T85 --session . (EN punkt) → exit 64 (första tecknet \".\", inte alfanumeriskt)" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session .

reset_scen
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T86 --session a (EN bokstav, kortast giltiga formen) → körs normalt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session a

reset_scen
printf -v ID_64 'a%.0s' {1..64}
NOT_EXPECT_OUT="OGILTIGT --session-ID"
run_case "T87 Session-ID på EXAKT 64 tecken (övre gränsen) → giltigt, körs normalt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session "${ID_64}"
if [[ "${#ID_64}" -eq 64 ]]; then
    printf '  ✓ T87b  testets eget ID är verifierat 64 tecken\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T87b  testets eget ID är %s tecken, inte 64 — testet mäter fel gräns\n' "${#ID_64}"; FAILED=$((FAILED+1))
fi

reset_scen
printf -v ID_65 'a%.0s' {1..65}
EXPECT_ERR="OGILTIGT --session-ID"
run_case "T88 Session-ID på 65 tecken (EN över gränsen) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session "${ID_65}"
if [[ "${#ID_65}" -eq 65 ]]; then
    printf '  ✓ T88b  testets eget ID är verifierat 65 tecken\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T88b  testets eget ID är %s tecken, inte 65 — testet mäter fel gräns\n' "${#ID_65}"; FAILED=$((FAILED+1))
fi

# T89 — differentierar T84 (börjar med "-") från T71 (består ENBART av
# punkter): ett ID som börjar med "_" (understreck, tillåtet tecken på
# POSITION 2+ men INTE som första tecken) ska ocksä avvisas — bevisar att
# skärpningen gäller GENERELLT för alla tre "inte alfanumeriskt"-tecknen
# som FÖRSTA position, inte bara "-".
reset_scen
EXPECT_ERR="OGILTIGT --session-ID"
run_case "T89 --session _S126 (understreck FÖRST) → exit 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --session _S126

# ============================================================
# T90–T101 (TASK-479.2, SE16): SJUNDE VÄGEN — öppna ci-post-merge-/
# nattärenden. Tvåsidigt bevis (öppet ärende ⇒ rad, inget ärende ⇒ tyst),
# övergångarna i BÅDA riktningarna, påminnelseintervallet (config-drivet),
# att sessionsläge INTE filtrerar bort main-läget, och fail-closed på
# sondfel för VARDERA av de två oberoende gh-anropen.

# T90/T91 — ci-post-merge: tvåsidigt bevis.
reset_scen
set_postmerge_arenden "2573\n"
EXPECT_OUT="ÄRENDE — 1 öppna ci-post-merge-ärenden: #2573"
run_case "T90 ÖPPET ci-post-merge-ärende (kallstart) → ÄRENDE-rad" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
NOT_EXPECT_OUT="ÄRENDE"
run_case "T91 INGA öppna ci-post-merge-ärenden → helt tyst" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# T92/T93 — natt (ci-natt/bokforingsdrift/beroendevarning/lankrota):
# samma tvåsidiga bevis, egen bucket.
reset_scen
set_natt_arenden "2566\n"
EXPECT_OUT="ÄRENDE — 1 öppna natt (ci-natt/bokforingsdrift/beroendevarning/lankrota)-ärenden: #2566"
run_case "T92 ÖPPET nattärende (kallstart) → ÄRENDE-rad, egen bucket" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
NOT_EXPECT_OUT="ÄRENDE"
run_case "T93 INGA öppna nattärenden → helt tyst" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# T94 — ÖVERGÅNG röd→grön rapporteras EN gång. INGEN reset_scen mellan de
# två anropen: STATE_DIR (och därmed "senast kända läge") måste bevaras för
# att övergången ska gå att mäta.
reset_scen
set_postmerge_arenden "2573\n"
run_case "T94a röd (kallstart) → transition rapporteras" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
set_postmerge_arenden ""
EXPECT_OUT="ÄRENDE ÅTERSTÄLLT — inga öppna ci-post-merge-ärenden längre"
run_case "T94b samma bucket blir grön → ÄRENDE ÅTERSTÄLLT rapporteras EN gång" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
NOT_EXPECT_OUT="ÄRENDE"
run_case "T94c fortsatt grön (tredje sopningen) → tyst igen, ingen upprepning" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# T95 — PÅMINNELSEINTERVALLET HÅLLS: röd kvarstår, andra sopningen direkt
# efter (default-intervallet 1800s har inte passerat) → INGEN andra
# ÄRENDE-rad. Samma glesnings-teknik som T29 (branch-städningen).
reset_scen
set_postmerge_arenden "2573\n"
run_case "T95a röd (kallstart) → rapporteras" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
NOT_EXPECT_OUT="ÄRENDE"
run_case "T95b SAMMA röda läge direkt igen → glesningen håller tyst (default-intervallet)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# T96 — PÅMINNELSEINTERVALLET ÄR CONFIG-DRIVET: egen policy-fil med
# HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL=0 (samma teknik som T30:s
# HEARTBEAT_STADA_GRENAR_INTERVALL=0) gör varje sopning "förfallen"
# omedelbart — röd kvarstår ska då ge en PÅMINNELSE-rad redan på andra
# sopningen, till skillnad från T95b.
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL=0' \
    > "${TEST_DIR}/.arende-tat-policy.conf"
reset_scen
set_postmerge_arenden "2573\n"
run_case "T96a röd (kallstart), HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL=0 → rapporteras" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.arende-tat-policy.conf" \
    bash ./scripts/heartbeat-svep.sh --once
EXPECT_OUT="ÄRENDE (påminnelse) — fortfarande 1 öppna ci-post-merge-ärenden: #2573"
run_case "T96b SAMMA röda läge, intervall=0 → PÅMINNELSE-rad denna gång (config-drivet, TVÄRTEMOT T95b)" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.arende-tat-policy.conf" \
    bash ./scripts/heartbeat-svep.sh --once

# T97 — SESSIONS-LÄGET FILTRERAR INTE BORT MAIN-LÄGET (kortets uttryckliga
# krav): samma röda ci-post-merge-läge som T90, men körningen sker MED
# --session — ÄRENDE-raden ska synas OFÖRÄNDRAT (huvudgrenens ärenderegister
# har ingen sessionsmarkör att filtrera mot).
reset_scen
set_postmerge_arenden "2573\n"
EXPECT_OUT="ÄRENDE — 1 öppna ci-post-merge-ärenden: #2573"
run_case "T97 --session S1 med öppet ci-post-merge-ärende → ÄRENDE-raden syns ÄNDÅ" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --session S1

# T98/T99 — FAIL-CLOSED PÅ SONDFEL (samma 77 som main-SHA-/PR-list-
# sonderna), VARDERA av de två oberoende gh-anropen isolerat.
reset_scen
touch "${SCEN}/fail-arenden-pm"
EXPECT_OUT="SONDEN KUNDE INTE SVARA — öppna ci-post-merge-ärenden"
run_case "T98 gh issue list (ci-post-merge) misslyckas → 77" 77 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
touch "${SCEN}/fail-arenden-natt"
EXPECT_OUT="SONDEN KUNDE INTE SVARA — öppna nattärenden"
run_case "T99 gh issue list (natt) misslyckas, ci-post-merge-sonden OK → 77" 77 - \
    bash ./scripts/heartbeat-svep.sh --once

# T100 — --help ljuger inte tyst (samma disciplin som T24/T55). Radintervallet
# `sed -n '61,328p'` utökades 61,310 → 61,322 (TASK-479.2 runda 1) →
# 61,328 (TASK-479.2 review runda 2: fynd 1-config-rattarna).
reset_scen
EXPECT_OUT="SJUNDE VÄGEN"
run_case "T100 --help visar § SJUNDE VÄGEN (TASK-479.2, SE16)" 0 - \
    bash ./scripts/heartbeat-svep.sh --help
if grep -qF "HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL" "${TEST_DIR}/out.txt" \
   && grep -qF "Tidsregel och ägare" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T100b  --help nämner config-ratten OCH pekaren till CONTRIBUTING.md\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T100b  --help saknar config-ratten eller CONTRIBUTING.md-pekaren\n'; FAILED=$((FAILED+1))
fi
# T100c (review runda 2 fynd 1) — samma "ljug inte tyst"-disciplin för de
# TVÅ NYA config-rattarna (etikett/söksträng är inte längre hårdkodade).
if grep -qF "HEARTBEAT_ARENDE_LABEL_POSTMERGE" "${TEST_DIR}/out.txt" \
   && grep -qF "HEARTBEAT_ARENDE_SEARCH_NATT" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T100c  --help nämner de NYA config-rattarna (etikett/söksträng)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T100c  --help saknar de nya config-rattarna — radintervallet följde inte med\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T101–T103 (TASK-479.2 review runda 2, Marcus-beslut 2026-09-19): tre fynd
# ur PR #2588 runda 1.
#
# T101/T102 (fynd 1, config-driven etikett/söksträng): bevisar att BÅDE
# default OCH ett ÖVERSTYRT policy-värde faktiskt når `gh`-anropets
# argumentlista — ARGV-fångst via T119_ARENDE_ARGV (samma teknik som
# T323_ARGV för stada-stubben), INTE bara att svepets EGEN klassnings-logik
# (som bara känner igen de HÅRDKODADE defaultvärdena) råkar fungera.
ARENDE_ARGV_FIL="${TEST_DIR}/arende-argv.txt"

# ARGV-ASSERTIONERNA MATCHAR NU `<element>`-PER-RAD-FORMATET (review runda 3
# fynd 2): `<label:a b>` som ETT sammanhängande grepp-mönster bevisar att
# hela strängen var ETT argv-element (citerat rätt) — två SEPARATA rader
# `<label:a>`/`<b>` (ordsplittring) hade INTE matchat samma mönster. Detta
# är den skarpa skillnaden mot runda 2:s "--label ci-post-merge"-sökning,
# som var identisk oavsett citering (se stubbens egen kommentar ovan).
reset_scen
set_postmerge_arenden "2573\n"
rm -f "${ARENDE_ARGV_FIL}"
run_case "T101a DEFAULT-policy → ci-post-merge-etiketten når gh-anropet" 0 - \
    env T119_ARENDE_ARGV="${ARENDE_ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF -- "<ci-post-merge>" "${ARENDE_ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T101a-argv  argv bar default-etiketten "ci-post-merge" som ETT element\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T101a-argv  argv saknade default-etiketten\n'; FAILED=$((FAILED+1))
fi

printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_ARENDE_LABEL_POSTMERGE="egen-etikett"' \
    > "${TEST_DIR}/.arende-label-policy.conf"
reset_scen
set_postmerge_arenden "2573\n"
rm -f "${ARENDE_ARGV_FIL}"
run_case "T101b ÖVERSTYRD policy (HEARTBEAT_ARENDE_LABEL_POSTMERGE) → når gh-anropet" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.arende-label-policy.conf" \
    T119_ARENDE_ARGV="${ARENDE_ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF -- "<egen-etikett>" "${ARENDE_ARGV_FIL}" 2>/dev/null \
   && ! grep -qF -- "<ci-post-merge>" "${ARENDE_ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T101b-argv  argv bar den ÖVERSTYRDA etiketten som ETT element, INTE defaulten\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T101b-argv  argv saknade den överstyrda etiketten (eller läckte defaulten)\n'; FAILED=$((FAILED+1))
fi

reset_scen
rm -f "${ARENDE_ARGV_FIL}"
run_case "T102a DEFAULT-policy → nattens söksträng når gh-anropet SOM ETT ELEMENT" 0 - \
    env T119_ARENDE_ARGV="${ARENDE_ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF -- "<label:ci-natt,bokforingsdrift,beroendevarning,lankrota is:open>" "${ARENDE_ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T102a-argv  argv bar default-söksträngen som ETT SAMMANHÄNGANDE element (citerad rätt)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T102a-argv  argv saknade default-söksträngen som ETT element\n'; FAILED=$((FAILED+1))
fi

printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_ARENDE_SEARCH_NATT="label:egen-sok is:open"' \
    > "${TEST_DIR}/.arende-search-policy.conf"
reset_scen
rm -f "${ARENDE_ARGV_FIL}"
run_case "T102b ÖVERSTYRD policy (HEARTBEAT_ARENDE_SEARCH_NATT) → når gh-anropet SOM ETT ELEMENT" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.arende-search-policy.conf" \
    T119_ARENDE_ARGV="${ARENDE_ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF -- "<label:egen-sok is:open>" "${ARENDE_ARGV_FIL}" 2>/dev/null \
   && ! grep -qF -- "ci-natt" "${ARENDE_ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T102b-argv  argv bar den ÖVERSTYRDA söksträngen som ETT SAMMANHÄNGANDE element, INTE defaulten\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T102b-argv  argv saknade den överstyrda söksträngen som ETT element (eller läckte defaulten)\n'; FAILED=$((FAILED+1))
fi

# T102c (review runda 3 fynd 2, RÖTT-FÖRST-BEVIS FÖR SJÄLVA TESTMETODEN):
# ett korrekt citerat `--search "$ARENDE_SEARCH_NATT"` ska ge söksträngen
# som ETT argv-element (T102a/b ovan bevisar detta för PRODUKTIONSKODEN).
# Detta fall bevisar det OMVÄNDA: en TILLFÄLLIG, OCITERAD kopia av samma
# anrop ger TVÅ element i stället för ETT, så samma "ETT element"-assertion
# FALLER mot den trasiga kopian — annars vore assertionen själv tandlös
# (den hade kunnat "råka" passera även om citeringen aldrig prövades).
# Produktionsskriptet RÖRS INTE — kopian lever bara i TEST_DIR.
OCITERAD_KOPIA="${TEST_DIR}/scripts/heartbeat-svep-ociterad-kopia.sh"
cp "${SKRIPT}" "${OCITERAD_KOPIA}"
# Samma sed-baserade punktändring som ingenstans annars i denna svit: tar
# bort ENBART citattecknen kring den specifika `--search`-expansionen (inte
# någon annan `${...}`-användning i filen), så resten av skriptets beteende
# är oförändrat.
# shellcheck disable=SC2016
# AVSIKTLIGT: enkla citattecken är HELA POÄNGEN — `${ARENDE_SEARCH_NATT}`
# ska matchas LITTERALT i sed-mönstret/grep-mönstren nedan (mot FILENS
# text), aldrig expanderas av detta skal.
sed -i.bak 's/--search "\${ARENDE_SEARCH_NATT}"/--search ${ARENDE_SEARCH_NATT}/' "${OCITERAD_KOPIA}"
rm -f "${OCITERAD_KOPIA}.bak"
# shellcheck disable=SC2016
if grep -qF -- '--search ${ARENDE_SEARCH_NATT}' "${OCITERAD_KOPIA}" \
   && ! grep -qF -- '--search "${ARENDE_SEARCH_NATT}"' "${OCITERAD_KOPIA}"; then
    printf '  ✓ T102c-forutsattning  den ociterade kopian saknar verkligen citattecknen (testet mäter rätt sak)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T102c-forutsattning  sed-ändringen träffade inte förväntad rad — kopian är INTE ociterad, testet nedan mäter ingenting\n'; FAILED=$((FAILED+1))
fi
chmod +x "${OCITERAD_KOPIA}"
reset_scen
rm -f "${ARENDE_ARGV_FIL}"
run_case "T102c OCITERAD kopia (kontrast, INTE produktionskoden) → söksträngen splittras i FLERA element" 0 - \
    env T119_ARENDE_ARGV="${ARENDE_ARGV_FIL}" \
    bash "${OCITERAD_KOPIA}" --once
if grep -qF -- "<label:ci-natt,bokforingsdrift,beroendevarning,lankrota" "${ARENDE_ARGV_FIL}" 2>/dev/null \
   && ! grep -qF -- "<label:ci-natt,bokforingsdrift,beroendevarning,lankrota is:open>" "${ARENDE_ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T102c-argv  den OCITERADE kopian splittrar söksträngen i FLERA element (bevisar att "ETT element"-assertionen ovan är skarp, inte tandlös)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T102c-argv  den ociterade kopian splittrade INTE söksträngen — testmetoden bevisar ingenting\n'; FAILED=$((FAILED+1))
fi
rm -f "${ARENDE_ARGV_FIL}"

# ============================================================
# T103 (fynd 3, mängdmedvetet): {A,B} → {A,C} ger EN rad som nämner BÅDE
# tillkommet och stängt; {A,B} → {A,B} (oförändrad SAMMANSÄTTNING, inte bara
# oförändrat ANTAL) är tyst; och det GAMLA "rod"/"gron"-formatet krashar
# inte och ger inget falskt övergångslarm på migreringssopningen.

# (a) {2573,2575} → {2573,2578}: 2575 stängs, 2578 tillkommer, antalet är
# OFÖRÄNDRAT (2→2) — runda 1:s antal-baserade jämförelse hade missat detta
# helt (samma antal ⇒ "oförändrad", tyst tills nästa påminnelse).
reset_scen
set_postmerge_arenden "2573\n2575\n"
run_case "T103a-kallstart {2573,2575} (kallstart) → etablerar mängden" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
set_postmerge_arenden "2573\n2578\n"
EXPECT_OUT="ÄRENDE — förändring i öppna ci-post-merge-ärenden: 2 öppna nu (#2573, #2578). Tillkommit: #2578. Stängt: #2575."
run_case "T103a SAMMA ANTAL, NY SAMMANSÄTTNING ({2573,2575}→{2573,2578}) → EN rad, båda delmängderna nämnda" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (b) {2573,2575} → {2573,2575}: identisk mängd, tyst (även om antalet
# "råkar" vara detsamma som (a) — det är SAMMANSÄTTNINGEN som avgör).
reset_scen
set_postmerge_arenden "2573\n2575\n"
run_case "T103b-kallstart {2573,2575} (kallstart) → etablerar mängden" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
NOT_EXPECT_OUT="ÄRENDE"
run_case "T103b OFÖRÄNDRAD SAMMANSÄTTNING ({2573,2575}→{2573,2575}) → tyst" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (c) GAMMALT FORMAT ("rod"), pre-existing state_fil skriven av runda 1-
# koden: får INTE krascha och får INTE ge ett falskt övergångslarm (varje
# nu-öppet ärende skulle annars felaktigt se ut som "just tillkommet").
# Beteendet: TYST denna ENDA migreringssopning, staten skrivs om till nya
# formatet, och normal mängd-diffning återupptas AUTOMATISKT nästa sopning.
reset_scen
mkdir -p "${STATE_DIR}"
printf 'rod' > "${STATE_DIR}/last-arende-ci-post-merge-lage"
set_postmerge_arenden "2573\n2578\n"
NOT_EXPECT_OUT="ÄRENDE"
run_case "T103c GAMMALT FORMAT ('rod') → tyst migreringssopning, ingen krasch" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
T103C_MIGRERAT="$(cat "${STATE_DIR}/last-arende-ci-post-merge-lage" 2>/dev/null)"
if [[ "${T103C_MIGRERAT}" == "2573,2578" ]]; then
    printf '  ✓ T103c-migrerat  state_fil skriven om till nya (sorterade) formatet\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T103c-migrerat  state_fil INTE i förväntat nytt format: %s\n' "${T103C_MIGRERAT}"; FAILED=$((FAILED+1))
fi
# Nästa sopning: OFÖRÄNDRAD mängd (fortfarande {2573,2578}) → tyst, precis
# som (b) — bevisar att normal diffning återupptagits, inte att vägen bara
# råkar vara tyst av andra skäl.
NOT_EXPECT_OUT="ÄRENDE"
run_case "T103c-uppfoljning1 OFÖRÄNDRAD mängd efter migrering → tyst (normal diffning)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
# Tredje sopningen: mängden ÄNDRAS (2582 tillkommer) → normal
# diff-rapportering ska nu fungera, INTE fortsatt tyst från migreringen.
set_postmerge_arenden "2573\n2578\n2582\n"
EXPECT_OUT="Tillkommit: #2582. Stängt: inga."
run_case "T103c-uppfoljning2 mängden ÄNDRAS efter migrering → normal diff-rapportering fungerar" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (c2) samma bevis för "gron" (det ANDRA gamla värdet) — punkt (c) i
# uppdraget namnger båda literalerna explicit.
reset_scen
mkdir -p "${STATE_DIR}"
printf 'gron' > "${STATE_DIR}/last-arende-ci-post-merge-lage"
set_postmerge_arenden "2573\n"
NOT_EXPECT_OUT="ÄRENDE"
run_case "T103c2 GAMMALT FORMAT ('gron') → tyst migreringssopning, ingen krasch" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T104a–e (TASK-479.2 review runda 3 fynd 1, Marcus-beslut 2026-09-19):
# `comm` kräver indata sorterad i SIN EGEN (lexikala/byte-)ordning, inte
# numerisk — T103 ovan råkade aldrig korsa en sifferlängdsgräns (alla
# testnummer var fyrsiffriga) och missade därför bevisa detta. RÖTT-FÖRST:
# dessa fall skrevs INNAN koden fixades (se PR-kroppens körutdrag för
# den faktiska röda körningen mot a8bde2ef).

# (a) {2,3,10} → {2,10}: 10 finns i BÅDA mängderna men numerisk sortering
# ("2,3,10") är INTE byte-sorterad ("10" < "2" < "3" lexikalt) — en `comm`
# som får numerisk indata ser "10" som en RAD SOM SKILJER mängderna åt,
# fast den inte gör det. Rätt svar: bara 3 stängdes, inget tillkom.
reset_scen
set_postmerge_arenden "2\n3\n10\n"
run_case "T104a-kallstart {2,3,10} (kallstart) → etablerar mängden" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
set_postmerge_arenden "2\n10\n"
EXPECT_OUT="ÄRENDE — förändring i öppna ci-post-merge-ärenden: 2 öppna nu (#2, #10). Tillkommit: inga. Stängt: #3."
run_case "T104a {2,3,10}→{2,10}: EXAKT 'Stängt: #3', INGET tillkommet (comm-sorteringsbuggen)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (b) {9999,10000} → {10000,10001}: samma bugklass vid 9999/10000-gränsen
# uppdraget själv namnger. Rätt svar: 10001 tillkom, 9999 stängdes.
reset_scen
set_postmerge_arenden "9999\n10000\n"
run_case "T104b-kallstart {9999,10000} (kallstart) → etablerar mängden" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
set_postmerge_arenden "10000\n10001\n"
EXPECT_OUT="ÄRENDE — förändring i öppna ci-post-merge-ärenden: 2 öppna nu (#10000, #10001). Tillkommit: #10001. Stängt: #9999."
run_case "T104b {9999,10000}→{10000,10001}: EXAKT 'Tillkommit: #10001. Stängt: #9999.'" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (c) {999,1000} → {999,1000}: OFÖRÄNDRAD mängd över SAMMA sifferlängds-
# gräns ska vara TYST — regressionsvakt mot att fixen (byte-ordning för
# jämförelse) av misstag gör en genuint oförändrad mängd till en falsk
# övergång.
reset_scen
set_postmerge_arenden "999\n1000\n"
run_case "T104c-kallstart {999,1000} (kallstart) → etablerar mängden" 0 - \
    bash ./scripts/heartbeat-svep.sh --once
NOT_EXPECT_OUT="ÄRENDE"
run_case "T104c OFÖRÄNDRAD {999,1000}→{999,1000} över sifferlängdsgräns → tyst" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (d) En tillståndsfil skriven i NUMERISK ordning ("999,1000" — den ordning
# RUNDA 2:s kod skrev innan denna fix) läst av den NYA koden för SAMMA,
# OFÖRÄNDRADE mängd ({999,1000}) får INTE ge ett falskt ÖVERGÅNGSlarm. Utan
# normalisering-vid-läsning skulle "999,1000" (filen) != "1000,999" (fräscht
# beräknad byte-ordning) se ut som en mängdFÖRÄNDRING (en "Tillkommit:/
# Stängt:"-rad), fast inget ändrats.
#
# NOTIS_FIL SEEDAS OCKSÅ, med en FÄRSK stämpel (realistisk in-place-
# uppgradering): notis-formatet ändrades ALDRIG mellan runda 2 och 3 (bara
# state_fil:s CSV-ordning gjorde det), så en verklig uppgraderad
# installation HAR en äkta, nyligen stämplad notis_fil kvar. Utan den
# stämpeln (t.ex. ett rent nollställt STATE_DIR) hade funktionen sett
# "ingen tidigare notis" och skickat en LEGITIM påminnelse (§ ANVÄNDNING,
# väg 3 "oförändrad mängd, röd kvarstår, påminnelseintervallet passerat")
# — sant och rätt i sig, men en ANNAN signal än den FALSKA ÖVERGÅNGEN detta
# fall specifikt prövar frånvaron av. Med en färsk notis-stämpel är
# FÖRVÄNTAN entydig: HELT TYST (varken övergång eller påminnelse).
reset_scen
mkdir -p "${STATE_DIR}"
printf '999,1000' > "${STATE_DIR}/last-arende-ci-post-merge-lage"
T104D_NU="$(date +%s)"
printf '%s' "${T104D_NU}" > "${STATE_DIR}/last-arende-ci-post-merge-notis"
set_postmerge_arenden "999\n1000\n"
NOT_EXPECT_OUT="ÄRENDE"
run_case "T104d state_fil i GAMMAL NUMERISK ordning ('999,1000'), oförändrad mängd, färsk notis-stämpel → HELT TYST" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# (e) PRESENTATIONEN är numeriskt ordnad även när gh:s råa svarsordning INTE
# är det (här: 10001 FÖRE 9999 i rå gh-utdata) — en byte-sorterad
# presentation hade visat "#10001, #9999" (fel för en människa att läsa).
reset_scen
set_postmerge_arenden "10001\n9999\n"
EXPECT_OUT="ÄRENDE — 2 öppna ci-post-merge-ärenden: #9999, #10001."
run_case "T104e presentationen är NUMERISKT ordnad ('#9999, #10001'), oavsett gh:s råa svarsordning" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

printf '\ntest-heartbeat-svep: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
