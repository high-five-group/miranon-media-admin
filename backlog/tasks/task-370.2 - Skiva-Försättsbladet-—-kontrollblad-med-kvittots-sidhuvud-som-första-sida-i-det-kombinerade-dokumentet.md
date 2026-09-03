---
id: TASK-370.2
title: >-
  Skiva: Försättsbladet — kontrollblad med kvittots sidhuvud som första sida i
  det kombinerade dokumentet
status: To Do
assignee: []
created_date: '2026-09-03 08:31'
labels:
  - ready-for-agent
dependencies:
  - TASK-370.1
references:
  - tasks/sessions/2026-09-03-session-116.md
parent_task_id: TASK-370
ordinal: 668000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: det kombinerade förhandsgranskningsdokumentet börjar med ett försättsblad i kvittots formspråk (Carlito, monokrom, de gråa rundade rutorna) som återanvänder kvittots sidhuvud (logga + rubrikblock) och den delade bilage-CSS:en. Innehåll (S116 beslut 2–3): rubrik Förhandsgranskning; antal kvitton och tidpunkt; en tabell med en rad per kvitto i visningsordning: namn · mottagarens e-post · event · belopp · betalsätt; en summarad; notraden 'Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.' Bladet finns bara i förhandsgranskningen, aldrig i ett skickat kvitto. Mallen är husets första utan förlaga hos Lotta — Marcus är facit mot renderad PDF (döms i QA-skivan); beslutet bokförs i mallkatalogens README § Förlagorna. Mallen läggs i mallkatalogen enligt samma mönster som kvittomallen (källa + genererad spegel), och mallparitets-grinden + mall-synken körs. Tabellen ska klara 30 rader på en sida i 9 pt; blir det fler bryts tabellen läsbart över två sidor (Prince-primitiv: table, inte grid/flex-gap — se kvitto.css:s TASK-304-anteckningar). Testskarv 1 (enhetsnivå): försättsbladets HTML bär rätt antal rader, rätt summa och notraden; kompositionen sätter det först. Täcker användarberättelser: 2, 3, 4, 6, 20.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Försättsbladet renderas som första sida i det kombinerade dokumentet; kvittosidorna följer oförändrade efter
- [ ] #2 Innehållet exakt: rubrik, antal + tidpunkt, tabell namn/e-post/event/belopp/betalsätt per kvitto i visningsordning, summarad, notraden ordagrant
- [ ] #3 Sidhuvudet (logga + rubrikblock) återanvänder kvittomallens byggstenar och delade CSS; kvittomallen och kvitto.css är orörda (diff-bevis)
- [ ] #4 Mallen ligger i mallkatalogen med genererad spegel; mallparitets-grinden och mall-synken gröna; README § Förlagorna bokför mallen som utan förlaga med Marcus som facit
- [ ] #5 npm run mall:pdf kan rendera försättsbladet ensamt ur en fixtur (för Marcus granskning); en rendering med 30 rader bifogas kortet som mätpunkt
- [ ] #6 Enhetstest: rätt radantal, rätt summa, notraden närvarande, försättsbladet först i kompositionen
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
