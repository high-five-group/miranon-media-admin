---
id: TASK-485
title: >-
  Fynd: fillPlaceholders byter mallplatshållare mot rått värde utan HTML-kodning
  — mät om utskickskedjan kodar senare, annars lagrad HTML-injektion via namn
  från anonyma formulär
status: To Do
assignee: []
created_date: '2026-09-19 12:41'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 839000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur research-passet docs/research/publik-anmalningsvag-utan-inloggning-2026-09-19.md § Oväntade fynd (S128), kodläst av orkestreraren 2026-09-19: fillPlaceholders i supabase/functions/_shared/action-mail-template.ts (rad 55–70) ersätter {platshållare} med värdet oförändrat, och filen innehåller ingen HTML-kodning alls. OMÄTT: om texten HTML-kodas senare i kedjan innan den blir ett mail (rendering i send-emails/React Email/annan mall). Därför är detta antingen en verklig lucka eller ofarligt — kortet finns för att mäta färdigt. Varför det angår oss REDAN I DAG, inte först när nya miranon.se byggs: namn från anonyma Elfsight-formulär når basen via Zapier och hamnar sedan i utskickens {förnamn} m.fl. Med den publika anmälningsvägen (S128 beslut 11) blir indatan dessutom direkt anonym. Persondata citeras aldrig i kortet eller i testfixturer — använd Deltagare NN och påhittade värden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hela kedjan från fillPlaceholders till färdigt mail är kartlagd med fil+rad per steg, och det är MÄTT (inte antaget) om ett värde som <b>x</b> resp. <script> når mailets HTML okodat — för varje mailtyp som använder mallen
- [ ] #2 Är luckan verklig: värden HTML-kodas vid insättning i HTML-kontext (textdelen av mailet lämnas okodad), med tvåsidigt bevis — ett test som är rött före fixen och grönt efter
- [ ] #3 Är luckan INTE verklig: kortet stängs med beviset (var kodningen sker, fil+rad) och ett regressionstest som fäller om den kodningen tas bort
- [ ] #4 Ämnesraden och avsändarnamn prövas separat mot header-injektion (radbrytning i värde)
- [ ] #5 Fyndet och utfallet noteras i den publika anmälningsvägens spec som GOLV-krav
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
