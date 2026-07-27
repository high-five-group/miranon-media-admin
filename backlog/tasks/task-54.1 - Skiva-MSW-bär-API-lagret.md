---
id: TASK-54.1
title: 'Skiva: MSW bär API-lagret'
status: To Do
assignee: []
created_date: '2026-07-27 15:06'
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
- [ ] #1 Alla sex EF-svar levereras av MSW-handlers uttryckta mot EF-kontraktet
- [ ] #2 Den gamla uppslagstabellen, dess 501-fallback och den handskrivna preflight-hanteringen är borta
- [ ] #3 Klocka, session och typsnitts-routes är oförändrade — diffen visar det
- [ ] #4 Tillgångs-optionen står på sitt defaultvärde, med motiveringen skriven i koden
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Baseline-dispatchen loggar 'Inga baseline-ändringar' — ekvivalensen bevisad, inte antagen
- [ ] #6 Ingen befintlig e2e-fil rörd — diffen visar det
<!-- DOD:END -->
