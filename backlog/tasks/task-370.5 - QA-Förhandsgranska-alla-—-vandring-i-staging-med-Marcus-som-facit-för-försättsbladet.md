---
id: TASK-370.5
title: >-
  QA: Förhandsgranska alla — vandring i staging med Marcus som facit för
  försättsbladet
status: Done
assignee: []
created_date: '2026-09-03 08:32'
updated_date: '2026-09-04 13:34'
labels:
  - ready-for-human
  - intentionally-unchecked
dependencies:
  - TASK-370.1
  - TASK-370.2
  - TASK-370.3
  - TASK-370.4
references:
  - tasks/sessions/2026-09-03-session-116.md
parent_task_id: TASK-370
ordinal: 671000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan i staging (granskningsdata via npm run seed:review — bygg aldrig för hand): 1) Registrera två inbetalningar med kvitto → 'Förhandsgranska alla 2 kvitton' står bredvid Skicka; klick öppnar ett fönster direkt med laddningssida som fylls med en PDF med tre sidor: försättsblad + två kvitton i listans ordning. 2) Försättsbladet: logga och rubrikblock som kvittot, antal + tidpunkt, tabellen med namn/e-post/event/belopp/betalsätt, summan stämmer, notraden ordagrant — MARCUS DÖMER UTSEENDET (mallen saknar förlaga); avvikelser blir nya kort, aldrig retusch av planen. 3) Sex kvitton: sju sidor, ordningen stämmer, varje kvittosida visar FÖRHANDSVISNING. 4) Blandade event i samma kö: dokumentet skapas, rätt event per rad på försättsbladet. 5) Trettio kvitton: dokumentet kommer inom rimlig tid; trettioett: begripligt meddelande, inget dokument. 6) Trasigt underlag (t.ex. en anmälan utan e-post): inget dokument, fönstret stängs, felet på sidan namnger personen. 7) Per-rad-knapparna: tryck på två rader i följd utan väntan → två fönster, bara den tryckta laddar; 'alla' och per-rad oberoende. 8) Ett väntande kvitto: dagens knapp, inget försättsblad. 9) iPad Safari: fönstret öppnas (ingen popup-blockering), PDF:en går att bläddra; bedöm om trettio sidor är hanterbart på surfplattan (öppen fråga ur research-passet). 10) Ingenting skickat, ingen kvittoserie rörd: kontrollera Inbetalningar-tabellen och kvittoserien efter vandringen. Täcker samtliga användarberättelser 1–20 som helhet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Punkt 1–10 i testplanen genomgångna i staging och bokförda i kortet med utfall per punkt
- [x] #2 Marcus har dömt försättsbladets utseende: godkänt, eller avvikelser registrerade som nya kort
- [ ] #3 Inga skickade kvitton och ingen rörd kvittoserie efter vandringen (verifierat mot data)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Minimaltestet (två kvitton, en sidbrytning) verifierat med pdfinfo/pdftotext/pdffonts FÖRE EF-bygget, och renderingstiden vid N ≈ 30 mätt mot klienttaket (ärvd PRD-grind; markera N/A med motivering om skivan inte rör den)
- [ ] #5 ADR-124 § Updates amenderad med det kombinerade utkastets nyckelform; mallkatalogens README § Förlagorna bokför försättsbladet som mall utan förlaga (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
- [ ] #6 Mallparitets-grinden och mall-synken körda om försättsbladets mall läggs i mallkatalogen (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus QA-vandring i staging 2026-09-04: fann Summa-rutan smalare än sammanställningen; rättat i TASK-388/PR #2295 (width: calc(100% - 5mm)), staging preview-receipt v26. Marcus kvittens verbatim: "Försättsbladet ser rätt ut nu, 370.5 godkänt."

OBOCKAT MED AVSIKT: AC #1 (punkt 1-10 bokförda med utfall per punkt) och AC #3 (kvittoserie-verifiering) lämnas obockade — denna stängningsbatch bär endast Marcus slutgiltiga kvittens och det enda faktiskt registrerade fyndet (TASK-388), inte en per-punkt-dokumenterad testlogg. AC #2 (Marcus dom av utseendet) är verifierbart sant och bockad. DoD #1 följer AC-läget; DoD #4-6 (ärvda PRD-grindar för mall-render/ADR-124/mallparitet) hör till EF-bygget i 370.1-370.3, inte till denna rena QA-vandring, och lämnas obockade av samma skäl.
<!-- SECTION:NOTES:END -->
