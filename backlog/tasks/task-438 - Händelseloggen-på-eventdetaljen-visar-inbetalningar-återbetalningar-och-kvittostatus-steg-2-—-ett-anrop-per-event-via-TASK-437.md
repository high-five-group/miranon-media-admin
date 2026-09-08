---
id: TASK-438
title: >-
  Händelseloggen på eventdetaljen visar inbetalningar, återbetalningar och
  kvittostatus (steg 2) — ett anrop per event via TASK-437
status: To Do
assignee: []
created_date: '2026-09-08 02:21'
updated_date: '2026-09-08 15:44'
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
- [x] #1 Ett anrop för hela eventet när Öppna detaljer öppnas, noll anrop vid sidladdning — bevisat i e2e via nätverksräkning
- [x] #2 Varje inbetalning och återbetalning syns som händelse med belopp, betalsätt, kvittostatus och notering, sorterad senast överst blandat med utskicken
- [x] #3 Laddnings- och felläge enligt InbetalningsLista-mönstret; mark-paid- och event-deltagare-invarianterna gröna; axe 0
- [ ] #4 Ögonmätt av Marcus mot staging före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT AV ORKESTRERAREN (S124 resume 1, 2026-09-08, Marcus mandat "Bygg steg 2 när den landat"). Gren task-438-handelselogg-inbetalningar på main 01c33c14 (efter #2457).
FORM: `betalningar/inbetalnings-handelser.ts` (ny, ren härledning: "Inbetalning 2 500 kr · Swish" / "Återbetalning 500 kr · Bankgiro", underrader kvittostatus via `kvittolage` · "Makulerad: <skäl>" · "Notering: …"; ikoner Banknote/Undo2/Ban; tid = betalningsdatum ?? skapadNar). `Tidslinje` fick valfri `undertext` per nod (readonly string[], caption-rader mellan text och tid). `Betalningar.tsx`: `useInbetalningarForEvent(event.id, sorterade id:n för BÅDA flikarna, aktiv)` → Map per anmälan → per person blandas `harledHandelser` + `inbetalningsHandelser`, sorteras senast överst; rent datum formateras utan klockslag (`loggtid`/`tidsvarde`, noon-förankrad), skelett per person medan batchen väntas (loggen sorterar aldrig om under ögonen), EN felruta för hela ytan med Försök igen (InbetalningsLista-orden). Kvittojobbets felskäl visas medvetet inte i loggen (hör till ytan där Lotta kan agera) — bokfört i modulens docblock.
AVVIKELSER MOT KORTET: inga i scope. Två mätta fällor under bygget, bokförda i testfilen: (1) `visaKronor` ger hårt blanksteg (sv-SE) — regex i tester matchar `\s`, pure-testet bygger förväntan ur formatteraren; (2) en 500 från EF:en retryas i BÅDA lagren (EF-klient + React Query, TASK-420) och når inte ytan inom expect-timeouten — feltestet använder 400 (husets policy retryar aldrig 4xx).
VERIFIERING (faktiska exitkoder): typecheck 0 · biome check . 0 · build 0 · check-langa-streck 0 · api-pure `tests/api/inbetalnings-handelser.test.ts` 8/8 · acceptance `anmalan-detalj` 7/7 · e2e `mark-paid.staging` + `event-deltagare.staging` 33/33 (nya: 0 anrop vid sidladdning / 1 batch-anrop med alla 8 aktiva id:n, aldrig den avbokade, inget nytt anrop vid flikbyte; händelser med belopp/betalsätt/kvittostatus/notering i ordningen återbetalning 20 juli · inbetalning 15 juli · bekräftelse 12 juli · anmälan 10 juli, rent datum utan klockslag; makulerad rad med skäl; felruta + Försök igen + omhämtning; axe 0 med underrader).
AC #4 (Marcus ögonmätning) lämnas öppen.
<!-- SECTION:NOTES:END -->
