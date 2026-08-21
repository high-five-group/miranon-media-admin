---
id: TASK-286.3
title: 'Skiva: Svensk sortering, räknarrad ur arrayen, rivning av sök-walken'
status: To Do
assignee: []
created_date: '2026-08-21 11:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-286.2
parent_task_id: TASK-286
ordinal: 518000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: Lotta bläddrar i listan och den är i svensk bokstavsordning — A till Z, sedan Å, Ä, Ö — med de namnlösa ('Ej tillgängligt', fälla 43) sist. Åsa står inte längre bland A:na (fälla 51:s inkonsekvens är stängd, för första gången). Räknarraden ('Visar N av M personer') räknas ur arrayen och behöver ingen egen hämtning. Under huven finns inte längre två vägar: dagens sök-/cursor-fråga i listan och EF:ens separata total-walk är rivna, eftersom ingen konsument läser dem; EF:ens sök-läge finns kvar bara om någon annan yta använder det (grep-svep avgör — rivs det inte, skriv varför).

HUR (ADR-123 beslut 3–4): Intl.Collator('sv') på den laddade arrayen; sentinelen sorteras sist i sin hink (den är redan undantagen i bokstavsindexets hink-logik, TASK-283). Räknarraden = filtrerad.length / register.length; TASK-277:s skew-säkra fallback för total rivs med walken. startvarmningen.ts:s kommentar om att persons.search 'saknar naturlig kärnfråga' uppdateras till att registerfrågan HAR en men hålls utanför den blockerande mängden av kostnadsskäl (ADR-123 beslut 7). queryKeys.persons.search/all städas om de blir oanvända.

Detta är skivan TASK-283.2–283.4 (bokstavsraden) bygger ovanpå: sorteringen och arrayen är deras underlag.

Täcker användarberättelser: 4, 7, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Listan är sorterad med svensk kollation (A–Z, Å, Ä, Ö) och sentinelen för namnlösa sist — verifierat i acceptance-testet med fixtur som bär Å-, Ä-, Ö- och sentinel-poster
- [ ] #2 Räknarraden räknas ur arrayen; EF:ens total-walk och dess fallback-logik i listan är rivna
- [ ] #3 Listans sök-/cursor-fråga är riven; EF:ens sök-läge rivs om grep-svepet visar noll andra konsumenter, annars bokförs konsumenten i PR:en
- [ ] #4 startvarmningens kommentar om persons-frågan är uppdaterad till ADR-123 beslut 7:s motivering
- [ ] #5 Personlistans rad- och listform är identisk med facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — referenserna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [ ] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [ ] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->
