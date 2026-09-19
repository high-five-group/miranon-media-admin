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
#                             [--session ID] [--alla]
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
#   --session ID Filtrerar RÖTT/DIRTY/ARMERINGS-KANDIDAT till PR:ar som bär
#                sessionens markör i kroppen (satt av bygg-agenten vid
#                `gh pr create`, se .claude/agents/bygg-agent.md § Landning:
#                `<!-- heartbeat-svep:session:ID -->`). En PR utan denna
#                markör, eller märkt för en ANNAN session, larmar INTE här
#                (TASK-462, § SESSIONSMEDVETET SVEP nedan). Utan flaggan:
#                dagens beteende (ALLA öppna PR:ar) — ett TIPS skrivs då på
#                ALLTID-PÅ-kanalen (stdout, --quiet-immunt, taktat av
#                HEARTBEAT_OMARKERAD_INTERVALL — INTE en gång per körning
#                till stderr längre, review runda 1 fynd 1: en bakgrunds-
#                Monitor bär bara stdout vidare som notifikation) om att
#                sessionsläge finns, så en session som inte känner till
#                flaggan ändå upptäcker den.
#   --alla       Uttryckligt "dagens beteende" (alla öppna PR:ar, ingen
#                markörfiltrering) — VINNER om den kombineras med --session
#                (session-filtreringen stängs då helt av, ingen kombinerad
#                effekt). Skriver INGEN TIPS-rad (flaggan bevisar att
#                sessionen redan känner till mekanismen).
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
#     Fel (städningen fallerar, stämpeln går inte att skriva) skrivs på
#     ALLTID-PÅ-kanalen och syns även under --quiet; bara den LYCKADE
#     rutin-raden dämpas.
#
#     KÄND BEGRÄNSNING — glesnings-klockan är GLOBAL PER MASKIN, inte per
#     session. Stämpeln bor i STATE_DIR (default /tmp/mm-heartbeat-svep),
#     som två samtidiga orkestrerar-sessioner utan egen HEARTBEAT_STATE_DIR
#     DELAR. Följden: båda kan läsa samma `senast` innan endera hinner
#     skriva den nya, och båda trigga städningen nära samtidigt — så
#     intervallet är ett golv per MASKIN, inte en garanti per session.
#     Ofarligt: stada-grenar.sh:s fyra skydd gäller oförändrat i varje
#     körning, och en `git branch -d` som förlorar kapplöpningen redovisas
#     graciöst som SKONAS ("vägrade"), aldrig som ett fel. Vad som drabbas
#     är kostnadsantagandet (~1 % av cykeln), inte datan.
#     Detta är samma delade-state-klass som F10 i
#     docs/research/prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md
#     (öppet, ej fixat — gäller redan last-main-sha). F10:s föreslagna fix
#     har TVÅ halvor: atomär skrivning + per-session-nyckling. Den atomära
#     halvan är byggd här (se stämplingen i stada_grenar_om_dags());
#     nyckling per session rör hela svepets state-modell och ligger utanför
#     TASK-323.
#
#   SESSIONSMEDVETET SVEP (TASK-462): två sessioner (S126 + S127) som båda
#   körde svepet mot samma repo väcktes tidigare av VARANDRAS PR:ar — ett
#   handhållet `grep -v '#NNNN'`-filter i monitor-kommandot var enda
#   skyddet, och ett felskrivet nummer där döljer den EGNA PR:ens röda
#   (mätt 2026-09-18, backlog/tasks/task-462). `--session ID` gör svepet
#   medvetet om ÄGARSKAP: RÖTT/DIRTY/ARMERINGS-KANDIDAT rapporteras bara för
#   PR:ar som bär `<!-- heartbeat-svep:session:ID -->` i kroppen. En PR
#   märkt för en ANNAN session är HELT TYST i sessionsläge (den har en känd
#   ägare, bara inte oss) — AC #2:s krav.
#
#   MARKÖREN sätts av bygg-agenten vid `gh pr create`
#   (.claude/agents/bygg-agent.md § Landning), aldrig av detta skript.
#   Formatet är HÅRDKODAT, inte config-drivet (samma val som
#   MARKER_START/MARKER_END i scripts/lib/review-risk-sektion.mjs): det är
#   en del av PROTOKOLLET mellan bygg-agent och svep, inte ett
#   projekt-specifikt värde en policy-fil ska kunna byta ut.
#
#   EN OMÄRKT PR (ingen sessionsmarkör alls) FÅR ALDRIG BLI TYST (AC #3) —
#   men larmar heller INTE var 90:e sekund (det vore att återinföra exakt
#   den brus-klass kortet finns för att åtgärda). Den syns i stället i ett
#   EGET, GLEST besked på ALLTID-PÅ-kanalen (--quiet-immunt, men UTAN
#   exit-bit — en observation, aldrig en order att agera på), taktat av
#   HEARTBEAT_OMARKERAD_INTERVALL (sekunder, default 1800 om policy-filen
#   saknar värdet — en NY säkerhetsrelevant signal ska vara SYNLIG som
#   default, inte tyst som default; motsatt riktning mot
#   HEARTBEAT_STADA_GRENAR_INTERVALL, som är fail-CLOSED eftersom DEN är
#   destruktiv). Samma stämplade-intervall-mönster som § FEMTE VÄGEN ovan
#   (egen state-fil, tyst vid noll fynd).
#
#   DEPENDABOT-PR:AR HAR INGEN SESSION (AC #4, medvetet beslut): författare
#   i HEARTBEAT_EXEMPT_AUTHORS räknas ALDRIG in i den omärkta bucketen — den
#   bucketen handlar om ÄGARSKAP ("vem ska agera på denna PR"), och en sådan
#   författare äger strukturellt aldrig en session. RÄTTAT (review runda 1
#   fynd 2, Marcus-beslut 2026-09-19): en tidigare formulering här påstod att
#   dessa PR:ar "redan har sin egen hantering" och exkluderade dem HELT — det
#   höll bara för ARMERINGS-KANDIDAT-vägen (§ ARMERINGS-KANDIDAT nedan,
#   PARKERAD-raden i --alla-läge). RÖTT/DIRTY är en ANNAN väg med en EGEN
#   GRÄNS i .heartbeat-svep-policy.conf ("undantaget gäller ENDAST
#   armerings-kandidat-vägen... larmar OFÖRÄNDRAT"), och den gränsen höll
#   INTE i sessionsläge innan denna fixrunda: "ingen markör"-grenen
#   `continue`:ade förbi RÖTT/DIRTY-klassningen även för dessa författare. En
#   undantagen författares RÖTT/DIRTY rapporteras nu i ETT EGET, GLEST besked
#   (dependabot_status_notis_om_dags(), samma stämplade-intervall-mönster som
#   ovan, HEARTBEAT_OMARKERAD_INTERVALL, egen state-fil) — INFORMATION,
#   ALDRIG en bitmask-bit i DENNA sessions verdikt (en sådan PR ägs inte av
#   den som råkar köra svepet). Detta är den ANDRA användningen av samma
#   lista (ursprungligen bara armerings-kandidat-undantaget ovan) — dess
#   FÖRSTA betydelse är OFÖRÄNDRAD, se .heartbeat-svep-policy.conf §
#   "PR-författare vars öppna PR:ar ALDRIG larmar som ARMERINGS-KANDIDAT".
#
#   TIPS OM MEKANISMEN (kortets AC #8, bakåtkompatibilitet): ingen --session
#   och ingen --alla ⇒ RÖTT/DIRTY/ARMERINGS-KANDIDAT är IDENTISKA med
#   beteendet innan TASK-462 (alla PR:ar, ingen markörhantering). ETT tips om
#   att sessionsläge finns visas — RÄTTAT (review runda 1 fynd 1): en
#   tidigare version skrev tipset till STDERR, men repots dokumenterade
#   körform är en bakgrunds-Monitor, och Monitor-verktygets egen
#   specifikation säger att BARA stdout blir notifikationer, så målgruppen
#   såg det aldrig. tips_notis_om_dags() skriver det nu på ALLTID-PÅ-kanalen
#   (stdout, --quiet-immunt) och taktar det med samma
#   HEARTBEAT_OMARKERAD_INTERVALL som ovan, så en lång bakgrunds-loop inte
#   upprepar det var 90:e sekund. En körning som inte känner till --session
#   (t.ex. hubbens session-start-kommando innan det uppdaterats) byter alltså
#   ALDRIG beteende tyst, och tipset går aldrig ut i sessionsläge (där det
#   inte behövs).
#
#   VALIDERAT SESSION-ID SEDAN REVIEW RUNDA 4 (Marcus-beslut 2026-09-19): de
#   tre notiserna ovan (omarkerad_notis_om_dags/dependabot_status_notis_om_dags/
#   tips_notis_om_dags) taktades ursprungligen mot EN gemensam, MASKIN-GLOBAL
#   STATE_DIR (default /tmp/mm-heartbeat-svep) — empiriskt visat: S126
#   sveper först och stämplar filen ⇒ S127:s eget svep ser ALDRIG sin egen
#   förstagångs-notis. Review runda 3 fixade det med en SANERINGSFUNKTION
#   (session_id_sanitize(), mappade otillåtna tecken till `_`) — men review
#   runda 4 fann att SANERINGEN SJÄLV kunde kollidera: "S 126" och "S/126"
#   sanerades BÅDA till "S_126", vilket tyst återinförde exakt den
#   tvärsessions-tystnad fixen skulle ta bort (och PR:ens "FULLSTÄNDIGT
#   löst"-formulering var därmed en överdrift, ADR-083). RÄTTAT, enklare och
#   FAIL-CLOSED i stället för mer sanering: `--session <ID>` VALIDERAS mot
#   HEARTBEAT_SESSION_ID_REGEX (^[A-Za-z0-9._-]{1,64}$) OCH mot
#   HEARTBEAT_SESSION_ID_ENDAST_PUNKTER_REGEX (avvisar ID som består ENBART
#   av punkter, t.ex. "." eller "..") DIREKT efter arg-parsingen, INNAN
#   något svep sker. Ett ogiltigt ID skriver ett felmeddelande på BÅDE
#   stdout OCH stderr (Monitor-formen, § ANVÄNDNING, ser bara stdout) och
#   avslutar med exit 2 — ingen sopning, inget state skrivs. Filnamnets
#   per-session-DEL är sedan ID:T SJÄLVT, HELT OSANERAT: en kollision är
#   omöjlig PER KONSTRUKTION (två OLIKA giltiga ID-strängar kan aldrig bli
#   SAMMA sträng), inte bara osannolik. session_id_sanitize() är BORTTAGEN.
#
#   KÄND BEGRÄNSNING — GLOBAL PER MASKIN (samma disclosure-form som § FEMTE
#   VÄGEN ovan, gren-städningens klocka): valideringen löser interferensen
#   för omarkerad_notis_om_dags()/dependabot_status_notis_om_dags() — båda
#   kräver sessionslage=1 (SESSION satt) för att ens köra, så deras
#   state-fil är ALLTID sessions-scopad OCH kollisionsfri när de faktiskt
#   avfyrar. Den TREDJE, tips_notis_om_dags(), är en ANNAN sak: den körs
#   UTESLUTANDE när SESSION är TOM (motsatt villkor) — det finns då inget
#   sessions-ID att skopa mot, och dess stämpel förblir OFÖRÄNDRAT GLOBAL PER
#   MASKIN. Två sessioner som BÅDA kör utan --session (t.ex. innan hubbens
#   AC #5-del landat) delar alltså fortfarande TIPS-stämpeln — en av dem kan
#   missa sitt eget förstagångstips om den andra redan konsumerat fönstret.
#   Ofarligt: en missad TIPS-rad är ingen förlorad signal om PR-läget
#   (RÖTT/DIRTY/ARMERINGS-KANDIDAT är opåverkade), bara en förlorad
#   påminnelse om en flagga som redan står permanent dokumenterad i --help
#   och CLAUDE.md.
#
#   PER-SESSION-STATSFILERNAS ÅLDER (review runda 4 fynd 2, info): STATE_DIR
#   växer med EN fil per unikt session-ID sedan review runda 3 — ingen
#   städning fanns. Löst genom att PIGGYBACKA på gren-städningens BEFINTLIGA
#   glesa klocka i stada_grenar_om_dags() (SAMMA stämpel/intervall, INGEN ny
#   klocka byggd): varje gång den klockan är due raderas per-session-
#   statsfiler äldre än HEARTBEAT_SESSION_STATE_MAX_DAGAR dagar (default
#   30). Ärver samma på/av-villkor som gren-städningen
#   (HEARTBEAT_STADA_GRENAR_INTERVALL > 0, stada-grenar.sh exekverbar) — en
#   spoke utan gren-städning får därför heller ingen statsfil-städning, ett
#   medvetet val för att hålla ändringen till en handfull rader.
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

# Fail-safe-mot-SYNLIGHET default INNAN source (TASK-462, § SESSIONSMEDVETET
# SVEP): en policy-fil UTAN variabeln (äldre spoke-kopia) ska ändå visa den
# omärkta-PR-notisen — MOTSATT riktning mot HEARTBEAT_STADA_GRENAR_INTERVALL
# ovan (som defaultar AV eftersom den är DESTRUKTIV). Ett osatt värde här ska
# aldrig kunna göra en glömd PR permanent osynlig.
HEARTBEAT_OMARKERAD_INTERVALL=1800

REPO=""
BRANCH=""
INTERVAL=""
TIMEOUT=""
ONCE=0
QUIET=0
# TASK-462 § SESSIONSMEDVETET SVEP. SESSION är körningsspecifik (ett
# argument, aldrig ett policy-värde — samma "argument där det är
# körningsspecifikt"-princip som resten av skriptets CLI-flaggor). ALLA är
# en explicit opt-out ur sessionsfiltreringen.
SESSION=""
# SESSION_GIVEN (review runda 4, Marcus-beslut 2026-09-19): skiljer "flaggan
# gavs INTE alls" (giltigt — global/TIPS-läget, oförändrat sedan TASK-462)
# från "flaggan gavs MED ett tomt värde" (`--session ""`, OGILTIGT — måste
# avvisas). `[[ -n "${SESSION}" ]]` kan INTE skilja de två fallen åt: båda
# ger en tom sträng. Utan denna flagga hade `--session ""` tyst fallit
# tillbaka till global/TIPS-läget i stället för att avvisas med exit 2, som
# uppdraget uttryckligen kräver ("tomt" är ett av de fem namngivna
# ogiltiga-fallen).
SESSION_GIVEN=0
ALLA=0
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

# ALLTID-PÅ-kanalen (TASK-323): samma --quiet-immunitet som alarm(), men
# semantiskt en ANNAN klass — se § ANVÄNDNING, som skiljer LARM (bär en
# exit-bit, kräver åtgärd) från ALLTID-PÅ (ingen exit-bit, men får aldrig
# tystas). Behövs för rader som MÅSTE synas utan att påstå att något är fel:
# en fallerande gren-städning är ett observabilitets-krav, inte ett larm om
# landnings-läget.
#
# Varför en egen funktion och inte bara alarm(): utan den kan en läsare inte
# se på anropsstället vilken klass raden tillhör, och nästa person som söker
# "vad larmar det här skriptet om?" hade räknat in städningen. Distinktionen
# fanns redan i prosan (§ ANVÄNDNING, TASK-135) men saknade en egen kanal.
#
# ÖPPET, MEDVETET EJ ÄNDRAT HÄR: de befintliga ALLTID-PÅ-raderna
# (main-avancemang, main-SHA-baslinje) skriver fortfarande via alarm().
# De är korrekta i beteende — bara namnet ljuger — och att migrera dem
# ligger utanför TASK-323:s scope.
alltid_pa() { printf '%s\n' "$1"; }

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
# KONTRAKT: returnerar ALLTID 0. Skriver noll, en ELLER TVÅ RUTIN-rader
# (say(), dämpas av --quiet — utökat till "en eller två" i review runda 4:
# funktionen piggybackar sedan dess även den glesa per-session-statsfil-
# städningen, se dess egen kommentar nedan). Larmar aldrig, bär ingen
# exit-bit, och tiger helt när ingenting raderades.
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
    #
    # ATOMÄRT (skriv till temp + mv), av två skäl. (1) En läsare ska aldrig
    # kunna se en HALVSKRIVEN stämpel — `mv` inom samma filsystem är en
    # rename(2), som POSIX garanterar är atomär. (2) Det är den ena halvan av
    # F10:s föreslagna fix för heartbeat-statens delade /tmp-katalog
    # (docs/research/prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md
    # § F10 — den andra halvan, per-session-nyckling, ligger utanför
    # TASK-323, se § UNDERHÅLL i huvudet).
    #
    # Ett MISSLYCKAT stämpel-skriv tigs INTE ihjäl: uteblir stämpeln kör
    # nästa svep städningen igen om 90 s i stället för om ${intervall} s, och
    # det är precis den sortens tyst frekvensdrift ingen upptäcker utan en
    # rad. Den skrivs på ALLTID-PÅ-kanalen (syns även under --quiet) men bär
    # ingen exit-bit — städningen larmar aldrig.
    if printf '%s' "${nu}" > "${STADA_STATE_FILE}.tmp" 2>/dev/null \
       && mv -f "${STADA_STATE_FILE}.tmp" "${STADA_STATE_FILE}" 2>/dev/null; then
        :
    else
        rm -f "${STADA_STATE_FILE}.tmp" 2>/dev/null || true
        alltid_pa "heartbeat-svep: UNDERHÅLL — kunde inte stämpla ${STADA_STATE_FILE}. Städningen körs, men glesningen kan gå tätare än ${intervall}s tills stämpeln går att skriva. Verdikt OPÅVERKAT."
    fi

    # PER-SESSION-STATSFILERNAS ÅLDER (review runda 4 fynd 2, Marcus-beslut
    # 2026-09-19, info). STATE_DIR växer med EN fil per unikt session-ID
    # sedan review runda 3 (SESSION_STATE_SUFFIX) — ingen städning fanns.
    # PIGGYBACKAR på DENNA klocka (samma due-villkor/stämpel som ovan, INGEN
    # egen klocka) i stället för att bygga en fjärde: raderar
    # omarkerad/dependabot-notisernas per-session-statsfiler äldre än
    # HEARTBEAT_SESSION_STATE_MAX_DAGAR dagar. Egen ÅLDERS-tröskel (dagar,
    # inte sekunder) eftersom kriteriet skiljer sig från gren-städningens
    # (merge-status, inte ålder). TIPS_STATE_FILE/global-läget rörs INTE —
    # den bär inget session-ID i namnet att matcha mot. Larmar aldrig
    # (UNDERHÅLL, samma klass som gren-städningen ovan).
    local session_max_dagar session_statsfiler_raderade=0 f
    session_max_dagar="${HEARTBEAT_SESSION_STATE_MAX_DAGAR:-30}"
    [[ "${session_max_dagar}" =~ ^[0-9]+$ ]] || session_max_dagar=30
    if [[ "${session_max_dagar}" -gt 0 && -d "${STATE_DIR}" ]]; then
        # shellcheck disable=SC2312
        # AVSIKTLIGT: `find`s exitkod maskeras av process-substitutionen —
        # ofarligt här eftersom loopen redan hanterar tomt/inget-fynd
        # graciöst (session_statsfiler_raderade förblir 0, funktionen
        # larmar aldrig oavsett), samma disciplin som filens övriga
        # SC2310/SC2312-disabler.
        while IFS= read -r -d '' f; do
            rm -f "${f}" 2>/dev/null && session_statsfiler_raderade=$(( session_statsfiler_raderade + 1 ))
        done < <(find "${STATE_DIR}" -maxdepth 1 -type f \
                  \( -name 'last-omarkerad-notis-*' -o -name 'last-dependabot-notis-*' \) \
                  -mtime "+${session_max_dagar}" -print0 2>/dev/null)
        [[ "${session_statsfiler_raderade}" -gt 0 ]] && say "heartbeat-svep: UNDERHÅLL — ${session_statsfiler_raderade} gamla per-session-statsfiler (äldre än ${session_max_dagar} dagar) städade."
    fi

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

    # FEL SKRIVS PÅ ALLTID-PÅ-KANALEN, inte via say(). En persistent monitor
    # körs rimligen med --quiet (det är hela poängen med rutin/larm-
    # distinktionen), så en say()-rad här hade gjort en KONTINUERLIGT
    # fallerande städning helt osynlig — ingen stdout, bara en loggfil ingen
    # läser om man inte redan vet att den finns. Samma observabilitets-
    # felklass som TASK-135 en gång fixade för kallstart-raden.
    # Fortfarande INGEN exit-bit: raden säger "underhållet fungerar inte",
    # aldrig "landnings-läget är trasigt".
    if [[ "${rc}" -ne 0 ]]; then
        alltid_pa "heartbeat-svep: UNDERHÅLL — gren-städningen gav exit ${rc}. Svepets verdikt är OPÅVERKAT (städning larmar aldrig). Utdata: ${utfil}"
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

# ── SJÄTTE VÄGEN: sessionsmedvetet svep (TASK-462) ──────────────────────────
# Se § SESSIONSMEDVETET SVEP ovan för det fulla resonemanget. Sammanfattning
# här: markören är HÅRDKODAD (protokoll mellan bygg-agent och svep, inte ett
# projekt-specifikt värde — samma val som review-risk-sektion.mjs:s
# MARKER_START/MARKER_END).
HEARTBEAT_SESSION_MARKER_REGEX='<!-- heartbeat-svep:session:[^[:space:]]+ -->'

# session_marker <ID> — den exakta markörsträngen bygg-agenten skriver in i
# PR-kroppen för sessionen <ID>. Enda platsen formatet definieras — både
# detta skript och bygg-agent-kontraktet refererar samma sträng, aldrig en
# duplicerad kopia.
session_marker() { printf '<!-- heartbeat-svep:session:%s -->' "$1"; }

# HEARTBEAT_SESSION_ID_REGEX/-ENDAST_PUNKTER_REGEX — review runda 4
# (Marcus-beslut 2026-09-19). Ersätter session_id_sanitize() (review runda
# 3, BORTTAGEN här): granskningen fann att saneringen kunde mappa OLIKA
# ID:n till SAMMA filnamn ("S 126" och "S/126" ⇒ båda "S_126"), vilket tyst
# återinförde tvärsessions-tystnaden hela mekanismen finns för att ta bort.
# FAIL-CLOSED i stället för mer sanering: ett --session-ID som inte matchar
# REGEX, eller som matchar ENDAST_PUNKTER_REGEX (består uteslutande av
# punkter — "." och ".." är path-traversal-riskabla filnamnskomponenter
# oavsett vilka andra tecken som är tillåtna), avvisas HELT (se
# valideringsblocket efter argument-parsningen nedan) — körningen fortsätter
# aldrig till att bygga ett filnamn av ett ID som inte är exakt detta.
# 1–64 tecken: samma obehagligt-långt-argument-skydd som HEARTBEAT_PR_LIMIT,
# ingen mätt motivering för just 64 utöver "generöst men begränsat".
HEARTBEAT_SESSION_ID_REGEX='^[A-Za-z0-9._-]{1,64}$'
HEARTBEAT_SESSION_ID_ENDAST_PUNKTER_REGEX='^\.+$'

# pr_har_session_marker <body> <session> — sant om <body> bär EXAKT den
# markören (inte bara "någon" markör — se pr_har_nagon_marker för det).
# Substring-match, inte regex: session_marker() innehåller inga
# glob-specialtecken (*, ?, [), så `==`-mönstermatchningen nedan är säker.
# Markören läggs i en lokal variabel FÖRE testet (inte inline i `[[ ]]`) —
# annars varnar shellchecks SC2312 ("consider invoking this command
# separately") eftersom en command substitution direkt i ett testuttryck
# maskerar sitt eget avslutningsvärde. session_marker() är en ren printf som
# aldrig fallerar, men separationen kostar inget och håller grinden på 0.
pr_har_session_marker() {
    local body="$1" session="$2" marker
    marker="$(session_marker "${session}")"
    [[ "${body}" == *"${marker}"* ]]
}

# pr_har_nagon_marker <body> — sant om <body> bär EN markör för VILKEN
# session som helst (används för att skilja "märkt för en ANNAN session"
# — helt tyst, AC #2 — från "helt omärkt" — det egna glesa beskedet, AC #3).
pr_har_nagon_marker() {
    [[ "$1" =~ ${HEARTBEAT_SESSION_MARKER_REGEX} ]]
}

# omarkerad_notis_om_dags <antal> <kommalista> <antal_undantagna> — den
# omärkta-PR-notisen (AC #3), taktad av HEARTBEAT_OMARKERAD_INTERVALL. Samma
# stämplade-intervall-mönster som stada_grenar_om_dags() ovan (egen
# state-fil, atomär skrivning, tyst vid noll fynd) men ALLTID på
# alltid_pa()-kanalen (aldrig say() — AC #3 kräver att den ALDRIG blir helt
# tyst) och ALDRIG en LARM-rad (ingen exit-bit — en observation, inte en
# order). KONTRAKT: returnerar ALLTID 0.
omarkerad_notis_om_dags() {
    local antal="$1" lista="$2" undantagna="$3"
    local intervall nu senast

    [[ "${antal}" -gt 0 ]] || return 0

    intervall="${HEARTBEAT_OMARKERAD_INTERVALL:-1800}"
    [[ "${intervall}" =~ ^[0-9]+$ ]] || intervall=1800

    nu="$(date +%s)"
    senast=0
    if [[ -f "${OMARKERAD_STATE_FILE}" ]]; then
        senast="$(cat "${OMARKERAD_STATE_FILE}" 2>/dev/null || echo 0)"
        [[ "${senast}" =~ ^[0-9]+$ ]] || senast=0
    fi
    [[ $(( nu - senast )) -ge "${intervall}" ]] || return 0

    # Atomär stämpling (temp + mv), samma skäl som stada_grenar_om_dags():
    # en läsare ska aldrig se en halvskriven stämpel, och `mv` inom samma
    # filsystem är en rename(2) — POSIX-atomär. Ett misslyckat skriv tigs
    # INTE ihjäl (samma observabilitets-disciplin): nästa svep försöker om
    # om 90s i stället för om ${intervall}s, och det syns på ALLTID-PÅ.
    if printf '%s' "${nu}" > "${OMARKERAD_STATE_FILE}.tmp" 2>/dev/null \
       && mv -f "${OMARKERAD_STATE_FILE}.tmp" "${OMARKERAD_STATE_FILE}" 2>/dev/null; then
        :
    else
        rm -f "${OMARKERAD_STATE_FILE}.tmp" 2>/dev/null || true
        alltid_pa "heartbeat-svep: UNDERHÅLL — kunde inte stämpla ${OMARKERAD_STATE_FILE}. Notisen kan komma tätare än ${intervall}s tills stämpeln går att skriva."
    fi

    local undantagna_text=""
    [[ "${undantagna}" -gt 0 ]] && undantagna_text=" (${undantagna} dependabot m.fl. undantagna via HEARTBEAT_EXEMPT_AUTHORS, räknas inte hit)"
    alltid_pa "heartbeat-svep: SESSION — ${antal} öppna PR:ar UTAN sessionsmarkör${undantagna_text}: ${lista}. Ingen order — kontrollera själv vem som äger dem (se --alla för fullständig lista). Nästa påminnelse tidigast om ${intervall}s."
    return 0
}

# dependabot_status_notis_om_dags <antal> <kommalista> — review runda 1 fynd
# 2 (Marcus-beslut 2026-09-19, TASK-462). HEARTBEAT_EXEMPT_AUTHORS-undantaget
# gäller ENDAST armerings-kandidat-vägen (.heartbeat-svep-policy.conf §
# "GRÄNS": "en Dependabot-PR som genuint går RÖD ... eller DIRTY ... larmar
# OFÖRÄNDRAT"). Fram till denna fixrunda gjorde sessionsfiltreringens "ingen
# markör alls"-gren i sweep_once() `continue` FÖRE RÖTT/DIRTY-klassningen
# även för dessa författare — så en genuint trasig Dependabot-CI blev TYST i
# sessionsläge, i strid med den GRÄNSEN. Samma stämplade-intervall-
# mönster som omarkerad_notis_om_dags() (egen state-fil, SAMMA
# HEARTBEAT_OMARKERAD_INTERVALL — "samma strypning som omarkerade") men EGEN
# alltid_pa()-rad: detta är INFORMATION om att en PR ingen session äger står
# RÖD/DIRTY, ALDRIG en order till DENNA session (Dependabot-PR:ar ägs inte
# av den som råkar köra svepet) — bär därför INGEN exit-bit, precis som den
# omärkta-PR-notisen. KONTRAKT: returnerar ALLTID 0.
dependabot_status_notis_om_dags() {
    local antal="$1" lista="$2"
    local intervall nu senast

    [[ "${antal}" -gt 0 ]] || return 0

    intervall="${HEARTBEAT_OMARKERAD_INTERVALL:-1800}"
    [[ "${intervall}" =~ ^[0-9]+$ ]] || intervall=1800

    nu="$(date +%s)"
    senast=0
    if [[ -f "${DEPENDABOT_STATE_FILE}" ]]; then
        senast="$(cat "${DEPENDABOT_STATE_FILE}" 2>/dev/null || echo 0)"
        [[ "${senast}" =~ ^[0-9]+$ ]] || senast=0
    fi
    [[ $(( nu - senast )) -ge "${intervall}" ]] || return 0

    if printf '%s' "${nu}" > "${DEPENDABOT_STATE_FILE}.tmp" 2>/dev/null \
       && mv -f "${DEPENDABOT_STATE_FILE}.tmp" "${DEPENDABOT_STATE_FILE}" 2>/dev/null; then
        :
    else
        rm -f "${DEPENDABOT_STATE_FILE}.tmp" 2>/dev/null || true
        alltid_pa "heartbeat-svep: UNDERHÅLL — kunde inte stämpla ${DEPENDABOT_STATE_FILE}. Notisen kan komma tätare än ${intervall}s tills stämpeln går att skriva."
    fi

    alltid_pa "heartbeat-svep: UNDANTAGEN FÖRFATTARE — ${antal} öppna PR:ar från HEARTBEAT_EXEMPT_AUTHORS är RÖTT eller DIRTY (ingen session äger dem, se .heartbeat-svep-policy.conf § GRÄNS): ${lista}. Information, ingen order till DENNA session. Nästa påminnelse tidigast om ${intervall}s."
    return 0
}

# tips_notis_om_dags — review runda 1 fynd 1 (Marcus-beslut 2026-09-19,
# TASK-462, kortets AC #8/bakåtkompatibilitet). Ersätter den tidigare
# top-nivå-printf:en till stderr (EN gång per invokation, se § ANVÄNDNING
# ovan för historiken) — repots dokumenterade körform är en bakgrunds-
# Monitor, och Monitor-verktygets egen specifikation säger att BARA stdout
# blir notifikationer; stderr hamnar bara i en loggfil ingen läser förrän
# efteråt (mätt fynd, inte en gissning). Flyttad till alltid_pa() (stdout,
# quiet-immun) och taktad av SAMMA intervall som den omärkta-PR-notisen
# (HEARTBEAT_OMARKERAD_INTERVALL) — annars hade en lång bakgrunds-loop
# upprepat tipset var HEARTBEAT_INTERVAL:e sekund (default 90s), vilket är
# exakt den brus-klass hela filen finns för att undvika. EGEN state-fil
# (TIPS_STATE_FILE): oberoende stämpel av samma skäl som
# STATE_FILE/STADA_STATE_FILE/OMARKERAD_STATE_FILE/DEPENDABOT_STATE_FILE
# redan är separata. Anropas EN gång per sweep_once() (i stället för en
# gång per skript-invokation) — --alla räknas fortfarande som att sessionen
# redan känner till mekanismen (uttryckligt bortval), så bara den HELT
# omedvetna kombinationen (varken flagga satt) får tipset. KONTRAKT:
# returnerar ALLTID 0, larmar aldrig (ingen exit-bit).
tips_notis_om_dags() {
    [[ -z "${SESSION}" && "${ALLA}" -eq 0 ]] || return 0

    local intervall nu senast
    intervall="${HEARTBEAT_OMARKERAD_INTERVALL:-1800}"
    [[ "${intervall}" =~ ^[0-9]+$ ]] || intervall=1800

    nu="$(date +%s)"
    senast=0
    if [[ -f "${TIPS_STATE_FILE}" ]]; then
        senast="$(cat "${TIPS_STATE_FILE}" 2>/dev/null || echo 0)"
        [[ "${senast}" =~ ^[0-9]+$ ]] || senast=0
    fi
    [[ $(( nu - senast )) -ge "${intervall}" ]] || return 0

    if printf '%s' "${nu}" > "${TIPS_STATE_FILE}.tmp" 2>/dev/null \
       && mv -f "${TIPS_STATE_FILE}.tmp" "${TIPS_STATE_FILE}" 2>/dev/null; then
        :
    else
        rm -f "${TIPS_STATE_FILE}.tmp" 2>/dev/null || true
        alltid_pa "heartbeat-svep: UNDERHÅLL — kunde inte stämpla ${TIPS_STATE_FILE}. Tipset kan komma tätare än ${intervall}s tills stämpeln går att skriva."
    fi

    alltid_pa "heartbeat-svep: TIPS — sessionsläge finns (--session <ID>) sedan TASK-462; ingen session angiven, kör i icke-filtrerat läge (dagens beteende, motsvarar --alla). Se CLAUDE.md § Landning. Nästa påminnelse tidigast om ${intervall}s."
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
        --session)  SESSION="${2:-}"; SESSION_GIVEN=1; shift 2 ;;
        --alla)     ALLA=1; shift ;;
        # Radintervallet är § ANVÄNDNING. Ändras huvudet ovan måste det
        # följa med — annars ljuger --help tyst (samma disciplin som ci-wait.sh).
        # Utökat 61,81 → 61,104 i TASK-135 (ALLTID-PÅ-klass + kallstart-
        # stycket), 61,104 → 61,135 i TASK-323 (§ UNDERHÅLL — gles
        # gren-städning; en DESTRUKTIV bieffekt får aldrig stå utanför det
        # block --help faktiskt visar), 61,135 → 61,198 i TASK-462
        # (--session/--alla-flaggorna + § SESSIONSMEDVETET SVEP), 61,198 →
        # 61,217 i TASK-462 fix-runda 1 (review runda 1: rättad
        # DEPENDABOT-PR:AR-text + TIPS flyttad till alltid_pa()/stdout),
        # 61,217 → 61,246 i TASK-462 fix-runda 2 (review runda 3: PER-SESSION
        # statsfil-suffix + KÄND BEGRÄNSNING-stycket för TIPS globala fall),
        # 61,246 → 61,269 i TASK-462 fix-runda 3 (review runda 4: validerat
        # session-ID ersätter sanering, session_id_sanitize() BORTTAGEN, + §
        # PER-SESSION-STATSFILERNAS ÅLDER-stycket);
        # scripts/test-heartbeat-svep.sh T24 fäller om raden
        # avviker från blockets faktiska start/slut.
        -h|--help)  sed -n '61,269p' "$0"; exit 0 ;;
        *) die "okänt argument: $1" ;;
    esac
done

# --session-validering (review runda 4, Marcus-beslut 2026-09-19). Se
# HEARTBEAT_SESSION_ID_REGEX/-ENDAST_PUNKTER_REGEX ovan för det fulla
# resonemanget (ersätter session_id_sanitize(), BORTTAGEN). Körs FÖRE
# BRANCH/REPO/INTERVAL/TIMEOUT-valideringen nedan — ett ogiltigt session-ID
# ska aldrig hinna orsaka en obegriplig sekundär fel senare i skriptet.
# Skrivs på BÅDE stdout OCH stderr (till skillnad från die(), som bara
# skriver stderr): Monitor-formen (§ ANVÄNDNING) ser BARA stdout, så en
# ren stderr-rad hade varit exakt den TIPS-rads-bugg review runda 1 fynd 1
# redan fixade en gång — samma observabilitets-skäl, nytt anropsställe.
#
# VILLKORET ÄR SESSION_GIVEN, INTE "-n \"\${SESSION}\"": de två skiljer sig
# EXAKT när `--session ""` ges — ett tomt värde för en flagga som FAKTISKT
# angavs. `-n`-formen hade tyst tolkat det som "flaggan gavs inte" och fallit
# tillbaka till global/TIPS-läget; SESSION_GIVEN fångar att flaggan verkligen
# lästes av arg-parsern, oavsett vad den bar.
if [[ "${SESSION_GIVEN}" -eq 1 ]]; then
    if [[ ! "${SESSION}" =~ ${HEARTBEAT_SESSION_ID_REGEX} ]] \
       || [[ "${SESSION}" =~ ${HEARTBEAT_SESSION_ID_ENDAST_PUNKTER_REGEX} ]]; then
        SESSION_VALIDERINGSFEL="heartbeat-svep: OGILTIGT --session-ID '${SESSION}' — måste matcha ${HEARTBEAT_SESSION_ID_REGEX} (1-64 tecken, endast [A-Za-z0-9._-]) och INTE bestå enbart av punkter. Körningen avbröts, inget svep skedde."
        printf '%s\n' "${SESSION_VALIDERINGSFEL}"
        printf '%s\n' "${SESSION_VALIDERINGSFEL}" >&2
        exit 2
    fi
fi

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

# TASK-462 § SESSIONSMEDVETET SVEP, kortets AC #8 (bakåtkompatibilitet).
# TIPS-raden skrevs HÄR fram till review runda 1 fynd 1 (Marcus-beslut
# 2026-09-19): EN gång per SKRIPT-invokation, direkt till stderr. Repots
# dokumenterade körform är en bakgrunds-Monitor, och Monitor-verktygets egen
# specifikation säger att BARA stdout blir notifikationer — målgruppen såg
# raden aldrig. Flyttad till tips_notis_om_dags() (alltid_pa(), stdout,
# taktad av HEARTBEAT_OMARKERAD_INTERVALL) och anropas nu från sweep_once(),
# se § SJÄTTE VÄGEN nedan — INTE härifrån, av samma skäl den ANDRA
# stämplade-intervall-notisen (omarkerad_notis_om_dags) redan bor i
# sweep_once() och inte i toppnivå-koden.

mkdir -p "${STATE_DIR}"
STATE_FILE="${STATE_DIR}/last-main-sha"
# Gren-städningens egen tidsstämpel (TASK-323). Egen fil, inte en rad i
# STATE_FILE: de två vägarna är oberoende och ska kunna nollställas var för
# sig — testsviten river STATE_DIR mellan fall och båda ska då kallstarta
# rent, utan att den ena vägens format kan korrumpera den andras.
# MEDVETET GLOBAL (rörs INTE av review runda 3, se KÄND BEGRÄNSNING i §
# SESSIONSMEDVETET SVEP ovan för fullt resonemang och varför just DEN
# klockan får förbli delad).
STADA_STATE_FILE="${STATE_DIR}/last-stada-grenar"

# PER-SESSION statsfil-suffix (review runda 3, HÄRLETT DIREKT UR DET
# VALIDERADE ID:T sedan review runda 4 — se HEARTBEAT_SESSION_ID_REGEX
# ovan, ingen sanering längre). SAMMA villkor som sweep_once()s
# sessionslage — dupliceras hit eftersom suffixet behövs INNAN
# sweep_once() någonsin anropas. Satt ⇒ de tre strypta notisernas
# state-filer nedan bär sessionens ID VERBATIM (redan bevisat matcha
# HEARTBEAT_SESSION_ID_REGEX vid detta lägre, se valideringsblocket ovan —
# INGEN transformation här, kollision är omöjlig per konstruktion), så två
# samtidiga sessioner med SAMMA STATE_DIR (delad default
# /tmp/mm-heartbeat-svep om ingen egen HEARTBEAT_STATE_DIR sätts) inte
# längre stämplar varandras fönster — den empiriskt visade buggen
# (S126 sveper först ⇒ S127 ser aldrig sin egen förstagångs-notis).
# OSATT (ingen --session, eller --alla) ⇒ tomt suffix, alltså SAMMA fil som
# innan denna runda — global strypning, se KÄND BEGRÄNSNING ovan.
SESSION_STATE_SUFFIX=""
if [[ -n "${SESSION}" && "${ALLA}" -eq 0 ]]; then
    SESSION_STATE_SUFFIX="-${SESSION}"
fi

# Den omärkta-PR-notisens egen tidsstämpel (TASK-462), oberoende av
# STADA_STATE_FILE av samma skäl som ovan. PER SESSION sedan review runda 3
# (SESSION_STATE_SUFFIX), KOLLISIONSFRI sedan review runda 4 (validerat ID,
# ingen sanering) — denna notis körs ALDRIG utan att SESSION är satt
# (sessionslage=1 krävs, se sweep_once()), så den är ALLTID sessions-scopad
# när den faktiskt kan avfyra: interferensen är fullständigt löst för den.
OMARKERAD_STATE_FILE="${STATE_DIR}/last-omarkerad-notis${SESSION_STATE_SUFFIX}"
# TIPS-radens egen tidsstämpel (TASK-462, review runda 1 fynd 1), samma
# oberoende-skäl — en TOM STATE_DIR (testsvit, kallstart) gör ALLA fyra
# stämplade vägar kallstarta oberoende av varandra. SESSION_STATE_SUFFIX
# TILLÄMPAS HÄR MEN ÄR ALLTID TOMT I PRAKTIKEN: tips_notis_om_dags() körs
# UTESLUTANDE när SESSION är TOM (motsatt villkor mot OMARKERAD/DEPENDABOT
# ovan/nedan) — det finns då inget sessions-ID att skopa mot, och stämpeln
# förblir GLOBAL PER MASKIN. Se § SESSIONSMEDVETET SVEP, "KÄND BEGRÄNSNING".
TIPS_STATE_FILE="${STATE_DIR}/last-tips-notis${SESSION_STATE_SUFFIX}"
# Dependabot-RÖTT/DIRTY-notisens egen tidsstämpel (TASK-462, review runda 1
# fynd 2), samma oberoende-skäl. PER SESSION sedan review runda 3 — samma
# "alltid sessions-scopad när aktiv"-egenskap som OMARKERAD_STATE_FILE ovan
# (dependabot_status_notis_om_dags() kräver också sessionslage=1).
DEPENDABOT_STATE_FILE="${STATE_DIR}/last-dependabot-notis${SESSION_STATE_SUFFIX}"

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
    # `body` (TASK-462, § SESSIONSMEDVETET SVEP) hämtas ALLTID, oavsett
    # --session/--alla, för att hålla frågan i EN statisk sträng i stället
    # för en fjärde handhållen variant. jq:s @tsv ESCAPAR embedded tabbar/
    # radbrytningar inom varje fält (`\t`/`\n`/`\r`/`\\` — jq-manualen,
    # "@tsv"-filtret), så en flerradig PR-kropp bryter INTE en-rad-per-PR-
    # invarianten `while read` bygger på nedan — den kommer bara innehålla
    # LITERALA `\n`-sekvenser i stället för riktiga radbrytningar, vilket
    # inte påverkar en enkel substrängs-/regex-matchning mot markören.
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
                body
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
                (.author.login // ""),
                (.body // "")
              ] | @tsv' 2>/dev/null)"
    rc=$?
    set -e
    if [[ "${rc}" -ne 0 ]]; then
        alarm "heartbeat-svep: SONDEN KUNDE INTE SVARA — pr-lista (repo ${REPO}, gren ${BRANCH})."
        return 77
    fi

    local granskade=0 antal_rott=0 antal_dirty=0 antal_kandidat=0 antal_undantagna=0
    # TASK-462 § SESSIONSMEDVETET SVEP — endast fyllda när sessionsläge är
    # AKTIVT (SESSION satt OCH --alla INTE given, se villkoret i loopen).
    local antal_andra_sessioner=0 antal_omarkerad=0 antal_omarkerad_undantagna=0
    local omarkerad_lista=""
    # antal_dependabot_status/dependabot_status_lista — review runda 1 fynd 2
    # (TASK-462): RÖTT/DIRTY för en HEARTBEAT_EXEMPT_AUTHORS-författare utan
    # sessionsmarkör. Skild räkning från antal_omarkerad_undantagna ovan (den
    # räknar BARA "hur många exempt-PR:ar saknar markör", oavsett CI-läge) —
    # denna räknar bara de som DESSUTOM är RÖTT eller DIRTY just nu.
    local antal_dependabot_status=0
    local dependabot_status_lista=""
    local sessionslage=0
    [[ -n "${SESSION}" && "${ALLA}" -eq 0 ]] && sessionslage=1

    while IFS=$'\t' read -r nr draft mss automerge rollup inqueue author body; do
        [[ -n "${nr}" ]] || continue

        # SESSIONSFILTRERING (TASK-462). Görs FÖRST, innan RÖTT/DIRTY/
        # KANDIDAT-klassningen nedan ens körs — en PR som inte hör till oss
        # ska inte bidra till NÅGON av dem (AC #1/#2). `continue` hoppar
        # resten av loop-kroppen för den raden.
        if [[ "${sessionslage}" -eq 1 ]]; then
            # shellcheck disable=SC2310
            # AVSIKTLIGT: pr_har_session_marker()/pr_har_nagon_marker() är
            # ren bash (`[[ ]]`-test, ingen extern process), samma disciplin
            # som is_exempt_author() ovan — set -e-avstängningen SC2310
            # varnar för är ofarlig här.
            if pr_har_session_marker "${body}" "${SESSION}"; then
                : # EGEN session — fortsätt till RÖTT/DIRTY/KANDIDAT nedan.
            elif pr_har_nagon_marker "${body}"; then
                # FRÄMMANDE session — känd ägare, bara inte oss. HELT TYST
                # (AC #2): varken alarm() eller say(), inte ens i
                # sammanfattningsraden per-PR — bara i totalräkningen.
                antal_andra_sessioner=$(( antal_andra_sessioner + 1 ))
                continue
            else
                # INGEN markör alls. Dependabot m.fl. (HEARTBEAT_EXEMPT_
                # AUTHORS) har ALDRIG en session och räknas separat — se
                # § SESSIONSMEDVETET SVEP, "DEPENDABOT-PR:AR HAR INGEN
                # SESSION" för varför listan (ursprungligen bara
                # armerings-kandidat-undantaget) återanvänds här.
                # shellcheck disable=SC2310
                if is_exempt_author "${author}"; then
                    antal_omarkerad_undantagna=$(( antal_omarkerad_undantagna + 1 ))

                    # Review runda 1 fynd 2 (Marcus-beslut 2026-09-19):
                    # HEARTBEAT_EXEMPT_AUTHORS-undantaget gäller ENDAST
                    # armerings-kandidat-vägen (.heartbeat-svep-policy.conf §
                    # "GRÄNS") — RÖTT/DIRTY på en sådan PR FÅR INTE bli tyst
                    # bara för att den `continue`:ar ut ur RÖTT/DIRTY-
                    # klassningen nedan. Samma fail-closed-princip som RÖTT-
                    # klassningen längre ned (allt utom SUCCESS/PENDING/
                    # EXPECTED/NONE räknas rött) — duplicerad HÄR, inte
                    # refaktorerad till en delad funktion, eftersom denna gren
                    # `continue`:ar och aldrig når den klassningen.
                    local dep_skal=""
                    case "${rollup}" in
                        SUCCESS|PENDING|EXPECTED|NONE) ;;
                        *) dep_skal="RÖTT (${rollup})" ;;
                    esac
                    [[ "${mss}" == "DIRTY" ]] && dep_skal="${dep_skal:+${dep_skal}, }DIRTY"
                    if [[ -n "${dep_skal}" ]]; then
                        antal_dependabot_status=$(( antal_dependabot_status + 1 ))
                        dependabot_status_lista="${dependabot_status_lista:+${dependabot_status_lista}, }#${nr} (${author}: ${dep_skal})"
                    fi
                else
                    antal_omarkerad=$(( antal_omarkerad + 1 ))
                    omarkerad_lista="${omarkerad_lista:+${omarkerad_lista}, }#${nr}"
                fi
                continue
            fi
        fi

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

    local sammanfattning="heartbeat-svep: ${granskade} öppna PR:ar granskade mot ${BRANCH} — ${antal_rott} röda, ${antal_dirty} dirty, ${antal_kandidat} armerings-kandidater, ${antal_undantagna} undantagna (parkerade)."
    if [[ "${sessionslage}" -eq 1 ]]; then
        sammanfattning="${sammanfattning} [session ${SESSION}] ${antal_andra_sessioner} tillhör andra sessioner (tysta), ${antal_omarkerad} omärkta, ${antal_omarkerad_undantagna} omärkta men undantagna."
    fi
    say "${sammanfattning}"

    [[ "${antal_rott}"     -gt 0 ]] && verdict=$(( verdict | 1 ))
    [[ "${antal_dirty}"    -gt 0 ]] && verdict=$(( verdict | 2 ))
    [[ "${antal_kandidat}" -gt 0 ]] && verdict=$(( verdict | 4 ))

    # SJÄTTE VÄGEN — den omärkta-PR-notisen (TASK-462, AC #3). Körs EFTER
    # att verdikten är färdigberäknad, av samma skäl som FEMTE VÄGEN nedan:
    # en observation, aldrig ett larm, får aldrig kunna påverka bitmasken.
    # Bär INGEN exit-bit och larmar aldrig, oavsett vad den skriver.
    if [[ "${sessionslage}" -eq 1 ]]; then
        # shellcheck disable=SC2310
        # AVSIKTLIGT: funktionen returnerar alltid 0 (se dess eget kontrakt).
        omarkerad_notis_om_dags "${antal_omarkerad}" "${omarkerad_lista}" "${antal_omarkerad_undantagna}" || true

        # Review runda 1 fynd 2 — samma "observation, aldrig ett larm"-skäl
        # som raden ovan: en HEARTBEAT_EXEMPT_AUTHORS-författares RÖTT/DIRTY
        # tillhör ingen session och får aldrig bidra till DENNA sessions
        # bitmask, men får heller aldrig bli helt tyst.
        # shellcheck disable=SC2310
        dependabot_status_notis_om_dags "${antal_dependabot_status}" "${dependabot_status_lista}" || true
    fi

    # Review runda 1 fynd 1 — TIPS-raden om att sessionsläge finns, se
    # tips_notis_om_dags() ovan för det fulla resonemanget. Oberoende av
    # sessionslage (den handlar om FRÅNVARON av --session/--alla, inte om
    # PR-filtreringen) och körs sist av de tre stämplade ALLTID-PÅ-notiserna
    # för att inte tränga undan RÖTT/DIRTY/KANDIDAT-larmen som alltid ska stå
    # överst.
    # shellcheck disable=SC2310
    tips_notis_om_dags || true

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
