---
id: TASK-54.1
title: 'Skiva: MSW bär API-lagret'
status: In Progress
assignee: []
created_date: '2026-07-27 15:06'
updated_date: '2026-07-27 15:23'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-54
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
När den visuella sviten kör går varje Edge Function-anrop genom MSW:s matchningsmotor i stället för den handskrivna uppslagstabellen. Appen märker ingen skillnad: samma svarsformer, samma data, parsade av samma scheman som tidigare. Utåt är allt oförändrat — bilderna är desamma, hermetiken intakt, sviten lika snabb. Det som ändrats är att svaren deklareras som handlers mot EF-kontraktet i stället för som poster i en tabell med egen uppslagslogik, 501-fallback och handskriven preflight-hantering.

Efter skivan kan en ny mock skrivas genom att deklarera metod, path och svar. Handlers går att dela mellan filer och överskugga lokalt, matcha på body, variera per anropsordning och returnera felsvar — allt genom bibliotekets API i stället för genom egen kod.

Den frusna klockan, den seedade sessionen och typsnitts-pinningen rörs INTE. De löser inte mockningsproblem. Typsnitts-routerna ligger dessutom kvar på sid-nivå, vilket är avsiktligt: sid-routes vinner över context-routes, så ingen typsnitts-trafik når MSW och tillgångs-optionen kan stå kvar på sitt defaultvärde. Att stänga av den hade kostat omkring tre gångers fördröjning utan vinst.

Hermetik-vakten rörs inte heller i denna skiva — den gamla catch-all-routen står kvar och vaktar. Vaktens ombyggnad är nästa skiva och får eget rött-först-bevis, eftersom bindningens default är tyst genomsläpp och det är arbetsenhetens farligaste fälla.

Ingen befintlig e2e-fil rörs. Sid-routes vinner, så de omkring 141 route-anropen i 33 filer fortsätter fungera oförändrat.

VERIFIERING: kör baseline-genereringen via workflow-dispatch efter bytet. Loggar den "Inga baseline-ändringar — renderingen matchar incheckade bilder" är ekvivalensen bevisad bit-exakt mot de incheckade linux-bilderna. Öppnas i stället en baseline-PR är renderingen ändrad — det är ett äkta fynd som ska utredas, aldrig bockas bort. Lokalt ger sviten darwin-bilder som inte jämförs mot de incheckade; kör den före och efter bytet på samma maskin för snabb återkoppling under arbetet, men låt dispatchen vara det skarpa beviset.

Täcker användarberättelser: 1, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Klocka, session och typsnitts-routes är oförändrade — diffen visar det
- [x] #2 Tillgångs-optionen står på sitt defaultvärde, med motiveringen skriven i koden
- [x] #3 Alla sju EF-svar levereras av MSW-handlers uttryckta mot EF-kontraktet
- [x] #4 Den gamla uppslagstabellen och den handskrivna preflight-hanteringen är borta; 501-skyddet för omockad EF lever kvar i biblioteksburen form (catch-all-handler) och är grindat av ett test
<!-- AC:END -->









## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AVVIKELSER MOT KORTETS ORDALYDELSE, båda upptäckta vid implementation och bokförda öppet:

1. AC sa 'sex EF-svar'. Disk säger SJU (get-events, get-registrations, get-event, get-event-notes, get-event-formats, get-persons, get-person). AC rättat.

2. AC sa att 501-fallbacken skulle bort. Den togs bort ur den handskrivna tabellen men ÅTERINFÖRDES som MSW catch-all-handler (Ghost-mönstret, ADR-080 § 4) — annars hade bytet infört en tyst nätverksläcka: bindningens onUnhandledRequest har defaultvärdet bypass, och vakten måste släppa igenom /functions/v1/ för att MSW ska nå det. AC:ts avsikt var att den handskrivna UPPSLAGSLOGIKEN skulle bort, inte skyddet. AC rättat, skyddet grindat av tests/visual/omockad-ef.spec.ts.

3. Kortet sa att hermetik-vakten inte rörs. Den fick ett fallback-villkor för /functions/v1/ — utan det abort:ar den EF-anropen innan MSW ser dem, eftersom SAMTLIGA page-routes prövas före context-routes. Vaktens FORM är oförändrad (catch-all med abort); ombyggnaden till MSW:s callback är alltjämt 54.2. Route-precedensen verifierades med ett minimalt test före implementation, inte antagen.

EKVIVALENSBEVISET, lokalt: de darwin-baselines som fanns var tre dagar gamla och 4 av 12 föll. Kontrastkörning med GAMLA mekanismen gav IDENTISKT utfall (samma 4, samma feltyp) — alltså stale baselines, inte regression; S90:s f0f11f3 rörde personer-ytan efter att bilderna togs. Färska baselines genererades därefter med gamla mekanismen (12/12), varefter MSW-mekanismen kördes mot dem: 12/12 passed, pixel-identiskt.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Baseline-dispatchen loggar 'Inga baseline-ändringar' — ekvivalensen bevisad, inte antagen
- [x] #6 Ingen befintlig e2e-fil rörd — diffen visar det
<!-- DOD:END -->
