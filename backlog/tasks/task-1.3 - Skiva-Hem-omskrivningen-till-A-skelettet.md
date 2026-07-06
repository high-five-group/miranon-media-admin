---
id: TASK-1.3
title: 'Skiva: Hem-omskrivningen till A-skelettet'
status: Done
assignee: []
created_date: '2026-07-05 21:09'
updated_date: '2026-07-06 11:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-1.1
parent_task_id: TASK-1
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem arrangeras om till prototypvinnarens A-skelett (PRD implementationsbeslut 1; referens: sessionsdok Session 52 Del 4 + prototyp-commiten bf705f2 i git-historiken — leveransen skrivs NYSKRIVEN, prototypkod absorberas aldrig, beslut 10): hälsningskort med stort 'Hej {namn}' och uppdatera-kontroll, därunder Nästa event (primär-tint per variant C-mixen, klickbart i sin HELHET till eventets detaljsida) bredvid Obetalda avgifter (antalet stort, de första namnen under), sedan helbredds-listkortet Nya anmälningar (etikett-över-värde, tunna avdelare; varje rad klickbar till eventets anmälda-vy via anmälans event-koppling; rad utan event olänkad med 'Utan event'), sist befintlig CTA som kvarstår mot /event tills skiva 4 pekar om den. Vertikal stapling, max två kort i rad, tonala kortytor utan kantlinjer, generös hörnradie; ljus bas i Miranon-identiteten (FK:s struktur, inte dess färgvärld). Nya tokens endast i semantik-/komponentlagret (beslut 2). Polling/refresh-lagret återanvänds oförändrat (beslut 9). Hem-e2e:n uppdateras mot det nya skelettet; miljö-oberoende via route-mock där data-assertions annars blir sköra.
Täcker användarberättelser: 2, 3, 4, 5, 6, 7, 11 (Hems tomma lägen), 16, 17 (+ 13, 14, 15 för Hem)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem visar A-skelettet uppifrån och ned: hälsningskort med stort 'Hej {namn}' + uppdatera-kontroll, Nästa event och Obetalda i rad, helbredds-kortet Nya anmälningar, CTA sist
- [x] #2 Klick var som helst på Nästa event-kortet landar på eventets detaljsida; kortet bär primär-tinten och är en enda länk-yta utan nästlade länkar
- [x] #3 Klick på en anmälningsrad landar på det eventets anmälda-vy; rad utan event-koppling visas olänkad med texten 'Utan event'
- [x] #4 Tomma lägen visar vänlig begriplig text; manuell uppdatering och polling fungerar som före omskrivningen
- [x] #5 Hem är tangentbordsnavigerbar, har axe-baseline 0, klarar prefers-contrast: more och prefers-reduced-motion samt skrivs ut läsbart
- [x] #6 Hem-vyn matchar prototyp A-skelettet visuellt (referens bf705f2, granskas sida-vid-sida): ingen separat 'Hem'-rubrik — hälsningen 'Hej {namn}' ÄR sidans h1
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGKRAV ur Marcus-granskning 2026-07-06 (skiva 1-review): A-skelettet har INGEN separat 'Hem'-rubrik — hälsningen ('Hej {namn}') ÄR sidans rubrik (h1), exakt som prototyp-variant A (referens: bf705f2). Brödsmulor kommer senare (PRD Utanför omfattningen). A11y-not till byggaren: h1-rollen flyttar till hälsningskortet; rubrik-hierarkin h1→h2-cards bevaras, och RouteAnnouncer/staticData.title fortsätter bära vy-namnet 'Hem' för skärmläsare/flik-titel.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit a8afcf9 · CI-run 28785718115 grön per jobb · CI-grön-första-pass: ja · defekter under körning: 0 i kort-scope (2 pre-existing-fynd dokumenterade: auth-flow-h1-assertionen uppdaterad i skivan per Testbeslutet; loading-state-flaket stash-belagt pre-existing → TASK-3) · TDD: 1 cykel (e2e-skarven: 10 röda beteenden → 13/13 gröna + shell 8/8; mellansteg strict-mode exact:true). Design-review godkänd (AC #6: matchar prototyp A sida-vid-sida); Marcus designiteration → T65. DRIFT-METRIK-MATNING 3 (ADR-068 p.8-minimiformen).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren godkänd
<!-- DOD:END -->
