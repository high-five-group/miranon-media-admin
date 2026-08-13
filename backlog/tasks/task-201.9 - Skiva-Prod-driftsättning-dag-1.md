---
id: TASK-201.9
title: 'Skiva: Prod-driftsättning dag 1'
status: To Do
assignee: []
created_date: '2026-08-11 20:27'
updated_date: '2026-08-13 15:46'
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
- [ ] #1 activity_log född i prod-Supabase (samma migration + RLS-bevis som staging, 201.2-formen)
- [ ] #2 log-activity + get-activity-log deployade i prod; smoke per EF-praxis (deny-triple-andan)
- [ ] #3 Front-deployen VERIFIERAD utrullad (task-199-fällan: prod-fronten kan stå stale — verifiera faktisk version, anta inte)
- [ ] #4 Rök-test i prod: en riktig åtgärd → posten syns i Lottas historik
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
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
<!-- SECTION:NOTES:END -->
