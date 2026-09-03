---
id: TASK-370.4
title: >-
  Skiva: Knappen Förhandsgranska alla N i betalningsinkorgen — fönster-först,
  laddläge per anrop, felet namnger personen
status: To Do
assignee: []
created_date: '2026-09-03 08:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-369
  - TASK-370.1
references:
  - tasks/sessions/2026-09-03-session-116.md
parent_task_id: TASK-370
ordinal: 670000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: i betalningsinkorgens granskningsblock, när kön bär två eller fler väntande kvitton, står knappen 'Förhandsgranska alla N' bredvid 'Skicka N kvitton' (S116 beslut 1); med exakt ett väntande kvitto är dagens ensamma knapp oförändrad, och per-rad-knapparna finns kvar. Knappens tillgängliga namn bär antalet ('Förhandsgranska alla 6 kvitton'). Klick: fönstret öppnas SYNKRONT i klicket med laddningssida (fönster-först-mönstret, stängt-fönster-vakten), EF:en anropas med köns ID:n i visningsordning, adressen sätts vid svar. Laddläge och spärr per anrop på TASK-369:s per-ID-mekanism: bara den tryckta knappen laddar, radknapparna är klickbara och oberoende (beslut 5). Fel: fönstret stängs och felet visas på sidan med personens namn (beslut 4); taköverskridande visas som ett begripligt meddelande ('Förhandsgranskningen klarar högst 30 kvitton åt gången …'). Kön är dagens session-lokala; blir den server-härledd (TASK-346.4/S115) följer knappen automatiskt. Testskarv 3: hermetiskt acceptance-test för betalningsinkorgen (EF-mockad som befintliga inkorgstester) med negativt bevis mot förlagans komponent. Täcker användarberättelser: 1, 7, 10, 11, 12, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Knappen finns bara vid N ≥ 2, bredvid Skicka N kvitton, med tillgängligt namn som bär antalet; N = 1 och per-rad-knapparna oförändrade (acceptance-test i båda lägena)
- [ ] #2 Klick öppnar fönstret synkront med laddningssida före anropet; adressen sätts vid svar; stängt fönster hanteras utan fel
- [ ] #3 Laddläge bara på den tryckta knappen; radknapparna klickbara under tiden (per-ID-mekanismen från TASK-369), bevisat med test
- [ ] #4 Mockat fel: fönstret stängs, role=alert på sidan bär personens namn; mockat taköverskridande visar det begripliga meddelandet
- [ ] #5 Negativt bevis: acceptance-testet fäller mot förlagans komponent
- [ ] #6 DoD-kvartetten + betalningsinkorgens acceptance-tester gröna; docblocken beskriver den nya formen
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
