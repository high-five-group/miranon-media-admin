---
id: TASK-201.9
title: 'Skiva: Prod-driftsättning dag 1'
status: Done
assignee: []
created_date: '2026-08-11 20:27'
updated_date: '2026-08-14 19:23'
labels:
  - ready-for-human
dependencies:
  - TASK-201.4
  - TASK-201.6
  - TASK-201.7
parent_task_id: TASK-201
ordinal: 374000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dag 1-leveransen: hela aktivitetsloggen tas till prod. MEDVETET utan beroende på filterraden (201.8) — A-formen räcker för driftsättning (mellanstationen, S105 Del 2 beslut 1); landar 201.8 före driftsättningen följer den med. HITL: prod-access + verifiering är Marcus-moment (S103-precedentet: EF-prod-deploy som öppen skuld tills Marcus-GO).

Täcker: dag 1-leveransen av berättelserna 1–6, 9–12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 activity_log född i prod-Supabase (samma migration + RLS-bevis som staging, 201.2-formen)
- [x] #2 log-activity + get-activity-log deployade i prod; smoke per EF-praxis (deny-triple-andan)
- [x] #3 Front-deployen VERIFIERAD utrullad (task-199-fällan: prod-fronten kan stå stale — verifiera faktisk version, anta inte)
- [x] #4 Rök-test i prod: en riktig åtgärd → posten syns i Lottas historik
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-12 (val A, klartext "A"): prod-ref-låset i TASK-203 lämnas BRETT, och denna skiva förblir ett Marcus-moment.

Bakgrund: TASK-203 (PR #1212) landar ett mekaniskt lås som nekar agent-kommandon som innehåller prod-refen lvjsfnphlauldxqlncpl, oavsett underkommando. Låset är avsiktligt bredare än sin ursprungliga spec — bygg-agenten flaggade utvidgningen öppet i sin slutrapport.

KONSEKVENS FÖR DENNA SKIVA: en agent som plockar 201.9 kommer att FÄLLAS av låset på AC #1 och #2. Det är korrekt beteende, inte ett fel att felsöka och inte något att kringgå. Kortet bar redan ready-for-human och HITL-noten om prod-access; låset gör den avsikten mekanisk i stället för underförstådd.

Vald väg (A) framför alternativet att låta en agent köra via låsets dokumenterade förbi-väg. Skälet: prod-driftsättning mot verklig persondata är ett Marcus-beslut, och en spärr som rutinmässigt kringgås just där den betyder mest är ingen spärr. Förbi-vägen är dessutom konvention plus en smal teknisk spärr — inte outbrytbar, eftersom agenter kan läsa skriptets källkod (bygg-agentens egen ärliga avgränsning; samma klass som ADR-104:s "!"-kanal).

BREDARE FÖLJD, bokförd här eftersom den rör samma väg: scripts/deploy-prod-functions.sh kan inte längre köras av en agent utan förbi-vägen. Det var tidigare en agent-körd väg med Marcus muntliga GO (S84/S102-historiken i tasks/todo.md). Detta är en avsiktlig policyskärpning, inte en regression.

RUNBOOK SKRIVEN (S105, 2026-08-13, bygg-agent i worktree agent-aa3d3be9043e3daeb): docs/reference/prod-driftsattning-runbook.md. Ingen prod-operation utförd — agenten skrev DOKUMENTET, körde ingenting mot prod (prod-ref-låset TASK-203 respekterat, ingen bypass konstruerad). Runbooken tar Marcus från förkrav till alla fyra AC plus rullbakåt, med varje kommando källmärkt mot TASK-201.2 (migration+RLS), TASK-201.11 (link-hängningen = lösenordsprompt), TASK-196 (EF-deployens verkliga utdataform), T39-preflighten (deny-triplen anon 401 / fel metod 405 / anon-Bearer 401) och supabase/migrations/README.md (appliceringsvägen).

BLOCKERARE FUNNEN, MÄTT — AC #2 kan inte uppfyllas som läget står: log-activity och get-activity-log står INTE i .prod-functions-allowlist.conf. Uppmätt 2026-08-13 med 'bash scripts/deploy-prod-functions.sh --list' (exit 0): deploy-set 33, exkluderade 6 — de två aktivitetslogg-funktionerna ligger bland de exkluderade tillsammans med de fyra test-*. Allowlisten är fail-closed med avsikt, så detta är korrekt beteende, inte ett fel. Två rader måste landa i conf-filen FÖRE driftsättningen; efter det ska --list visa deploy-set 35 / exkluderade 4. Agenten lade dem INTE till på eget bevåg — filens eget huvud kräver ett MEDVETET tillägg per rad, och den senaste utvidgningen (2026-08-11) skedde under uttrycklig Marcus GO. Runbookens steg 0.1 bär den exakta formen.

AC #3 ÄR SVAGAST OCH FLAGGAD SOM SÅDAN: runbookens steg 6 är märkt PRELIMINÄRT och pekar på TASK-199:s pågående utredning som den auktoritativa källan till verifikations-kommandot. Interimsformen återanvänder TASK-199:s EGEN dokumenterade metod (Vercel-deploylistan mot main-SHA + curl/bundle-grep + Clear site data mot PWA-precachen) och konkurrerar därför inte med utredningen; en obelagd risk (kodsplittring kan lägga markörsträngen i en lat-laddad chunk) är öppet bokförd i steget.

ÖVRIGT UPPMÄTT SOM RUNBOOKEN BÄR: huvudkatalogen stod länkad mot STAGING vid skrivtillfället (supabase/.temp/project-ref) — därav ett eget avslutande steg som länkar tillbaka, eftersom link-tillståndet är sticky och per arbetskatalog. scripts/deploy-prod-functions.sh anropar BAR 'supabase' (globalt installerad v2.75.0) medan repots dokumenterade migrationsväg använder 'npx supabase' (v2.114.0, ej pinnad i package.json) — två CLI-versioner på samma maskin, bokförd som fälla 6. ADR-050:s 'ingen deploy-automatik' verifierad fortfarande gällande (rad 31; inget workflow refererar functions deploy).

Grindar: npm run check:docs exit 0, 14/14 gröna (lychee 0 errors, Vale 0 errors/0 warnings, markdownlint rent efter en MD029-rättelse). Inga AC bockade av agenten — de bockas när driftsättningen faktiskt körts.

BLOCKERAREN UPPLÖST (S105, 2026-08-13, Marcus GO verbatim "1A. GO! Kör bara!"): get-activity-log + log-activity tillagda i .prod-functions-allowlist.conf enligt runbookens steg 0.1-form (kommentarsblock med datum och GO-citat, filens egen konvention sedan app-paritetsutvidgningen 2026-08-11).

MÄTT FÖRE: bash scripts/deploy-prod-functions.sh --list, exit 0 — deploy-set 33, exkluderade 6 (get-activity-log, log-activity + de fyra test-*).
MÄTT EFTER: samma kommando, exit 0 — deploy-set 35, exkluderade 4 (enbart test-attachments-storage, test-auth, test-invite-completion, test-pdf-generation). Båda aktivitetslogg-funktionerna står nu som [prod].

SIDOEFFEKT MÄTT, INTE ANTAGEN: tests/api/ef-metod-vakt.test.ts (TASK-38) är config-driven mot samma conf-fil, så de två nya raderna utvidgar automatiskt grindens täckning — 34 → 36 tester, alla gröna (exit 0). Både get-activity-log och log-activity bär metod-vakten (405 före requireUser, efter handleCors). Tvåriktat bevis: med test-auth temporärt tillagd fällde grinden exit 1 med 'test-auth: saknar explicit metod-vakt' — raden togs bort igen, diffen är fyra rader i en fil.
scripts/test-deploy-prod-functions.sh: 4/4 PASS, 0 FAIL, exit 0.

INGEN PROD RÖRD: endast conf-filen ändrad. Ingen deploy, ingen link, inget kommando med prod-refen — prod-ref-låset (TASK-203) respekterat, ingen bypass konstruerad. AC #2 kräver fortfarande faktisk deploy + smoke och förblir Marcus-moment; inga AC bockade här.

AC #1–#3 BOCKADE MOT BELÄGG (orkestrerar-agent, ADR-086, 2026-08-14) — källa: tasks/sessions/archive/2026-08/2026-08-11-session-105.md Del 8 § 'Prod-driftsättningen — steg för steg, faktiskt utfall' (Marcus körde runbooken guidat, kommando för kommando, 2026-08-13 em/kväll):

AC #1 (activity_log född i prod): Steg 2 Migrationer — 'Båda applicerade; migration list visar local == remote för 20260811211759 + 20260812143131'. Steg 3 RLS-bevis — 'anon läsning 401, anon skrivning 401' (samma form som staging, TASK-201.2).

AC #2 (log-activity + get-activity-log deployade; smoke): Steg 4 EF-deploy — 'log-activity + get-activity-log, "Deployed Functions.", båda ACTIVE v1'. Steg 5 Deny-triple — utfallet blev 401·401·401 i stället för förväntat 401·405·401; Del 8 förklarar och klassar detta ofarligt: supabase/config.toml har [functions.log-activity] verify_jwt = true, så plattformens gateway avvisar FÖRE koden körs (metod-vakten finns och svarar 405, men nås aldrig utan JWT — configens egen kommentar: 'gateway-första-försvar'). Alla sex anrop nekades (varken 200 öppen eller 404 ej deployad). Runbookens § Steg 5 bär ett dokumentationsfel (405-förväntan) som Del 8 flaggar för rättelse — smoke-avsikten (nekad åtkomst utan giltig auth) är uppfylld trots avvikelsen.

AC #3 (front-deployen verifierad utrullad): Steg 6 Front — 'prod-bundeln bär aktivitetshistorik; alla verb funna i activityTypes-*.js' (task-199-fällan undveks: faktisk bundle grep, inte antagande). Del 8 bokför även en SW-precache-fälla som fångades LIVE under samma pass (gammal bundle-hash cachad i Marcus browser, löst med Clear site data) — orelaterad till AC #3:s verifiering men samma sessions fynd, bokförd som bekräftelse på att TASK-199s uppdateringsbanner behövdes.

AC #4 LÄMNAS ÖPPEN per uppdrag — Marcus kör rök-testet i prod ikväll. Del 8 Steg 7 dokumenterar ETT tidigare rök-test i passet ('Anteckning på event → syns i historikvyn; hem-spalten dröjde (cache)') men det föregick TASK-210s fix (landad senare samma kväll, #1264, MERGED 2026-08-13T20:03:29Z) och är därför inte det AC #4 efterfrågar mot dagens läge.

AC #4 BOCKAD MOT SAMMANSATT BEVISKEDJA (S105 Del 10, 2026-08-14 kväll), öppet komponerad eftersom Marcus avstod ett andra prod-rök-test (verbatim: "vi har ju redan för fan gjort tester i prod-appen på detta igår. Jag litar på att det här skiten funkar nu"):
(1) RÖK-TESTET I PROD 2026-08-13 utförde en riktig åtgärd och posten syntes i historiken (AC-textens bokstav uppfylld då; hem-spaltens fördröjning var den kända cache-luckan).
(2) LUCKAN STÄNGD OCH LANDAD: TASK-210 / PR #1264 MERGED, tvåsidigt testbevis enhet+acceptance.
(3) BETEENDET LIVE-BEVISAT 2026-08-14 i staging-tvillingen (samma kod, mekanisk Playwright-vandring): anteckning skriven → hem-spalten visade posten "nyss" via ren klientnavigering utan omladdning.
(4) PROD-FRONTEN VERIFIERAD FÄRSK via Vercel-förstapartskedjan: deployment 21:08 byggd från main@133cb91c (git-verifierat ⊇ #1264), Ready, aliasad till admin.miranon.dev; deploys rullar per main-push (bundle-churn observerad live).
VARNING BOKFÖRD: ett tidigare stale-larm samma kväll byggde på sträng-grep i minifierade chunkar och DROGS TILLBAKA — chunk-attribution är opålitligt instrument; vercel inspect-kedjan är rätt. Full mätserie: TASK-199-kortets notes + sessionsdok S105 Del 10.
DoD #2–#4: skivans landningar (#1219-runbooken, allowlist-raderna, prod-operationen 2026-08-13) bar gröna grindar per jobb vid respektive landning; denna stängnings-commit är docs-only.
<!-- SECTION:NOTES:END -->
