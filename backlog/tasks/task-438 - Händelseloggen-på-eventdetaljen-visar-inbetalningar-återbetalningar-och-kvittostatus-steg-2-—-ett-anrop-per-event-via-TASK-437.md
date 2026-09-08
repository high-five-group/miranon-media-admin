---
id: TASK-438
title: >-
  Händelseloggen på eventdetaljen visar inbetalningar, återbetalningar och
  kvittostatus (steg 2) — ett anrop per event via TASK-437
status: To Do
assignee: []
created_date: '2026-09-08 02:21'
updated_date: '2026-09-08 02:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-436
  - TASK-437
ordinal: 765000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Steg 2 av eventdetaljens "Öppna detaljer" (TASK-436). Beroende: TASK-437 byggd, staging-deployad och PROD-deployad av Marcus (fas4) innan denna PR landar. Byggs av orkestreraren själv.

Loggen tar in inbetalningsraderna som händelser blandade med utskicken, senast överst: datum (`betalningsdatum`, fallback `skapadNar`), belopp (`visaKronor`), betalsätt, kvittostatus (`kvittolage` ur `src/components/betalningar/panel-harledningar.ts`), noteringen som dämpad undertext; återbetalningar (`typ: 'aterbetalning'`) som egen händelsetyp med egen ikon. Hämtning EN gång per event när sektionen öppnas (TASK-437:s hook), noll anrop vid sidladdning; skeleton per person under laddning och `MessageBox` med "Försök igen" vid fel — samma mönster som `InbetalningsLista.tsx` rad 200–225. Persondetaljens "Händelser" (`AnmalanDetail.tsx` rad 640–646) har samma lucka och ersätts av samma komponent i ett eget uppföljningskort, inte här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett anrop för hela eventet när Öppna detaljer öppnas, noll anrop vid sidladdning — bevisat i e2e via nätverksräkning
- [ ] #2 Varje inbetalning och återbetalning syns som händelse med belopp, betalsätt, kvittostatus och notering, sorterad senast överst blandat med utskicken
- [ ] #3 Laddnings- och felläge enligt InbetalningsLista-mönstret; mark-paid- och event-deltagare-invarianterna gröna; axe 0
- [ ] #4 Ögonmätt av Marcus mot staging före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
