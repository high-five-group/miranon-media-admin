---
id: TASK-370.4
title: >-
  Skiva: Knappen Förhandsgranska alla N i betalningsinkorgen — fönster-först,
  laddläge per anrop, felet namnger personen
status: Done
assignee: []
created_date: '2026-09-03 08:32'
updated_date: '2026-09-03 11:26'
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
- [x] #1 Knappen finns bara vid N ≥ 2, bredvid Skicka N kvitton, med tillgängligt namn som bär antalet; N = 1 och per-rad-knapparna oförändrade (acceptance-test i båda lägena)
- [x] #2 Klick öppnar fönstret synkront med laddningssida före anropet; adressen sätts vid svar; stängt fönster hanteras utan fel
- [x] #3 Laddläge bara på den tryckta knappen; radknapparna klickbara under tiden (per-ID-mekanismen från TASK-369), bevisat med test
- [x] #4 Mockat fel: fönstret stängs, role=alert på sidan bär personens namn; mockat taköverskridande visar det begripliga meddelandet
- [x] #5 Negativt bevis: acceptance-testet fäller mot förlagans komponent
- [x] #6 DoD-kvartetten + betalningsinkorgens acceptance-tester gröna; docblocken beskriver den nya formen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Minimaltestet (två kvitton, en sidbrytning) verifierat med pdfinfo/pdftotext/pdffonts FÖRE EF-bygget, och renderingstiden vid N ≈ 30 mätt mot klienttaket (ärvd PRD-grind; markera N/A med motivering om skivan inte rör den)
- [x] #5 ADR-124 § Updates amenderad med det kombinerade utkastets nyckelform; mallkatalogens README § Förlagorna bokför försättsbladet som mall utan förlaga (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
- [x] #6 Mallparitets-grinden och mall-synken körda om försättsbladets mall läggs i mallkatalogen (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DoD-noter: #4 N/A — denna skiva rör klienten (BetalningsInkorg.tsx, DataSourceAdapter/AirtableAdapter/SupabaseAdapter, kvitton.ts) och renderar ingen PDF; minimaltestet (två kvitton, en sidbrytning, pdfinfo/pdftotext/pdffonts) hör hemma i EF-kompositionen (TASK-370.1, redan byggd) resp. staging-skarpbeviset (TASK-370.3). #5 N/A — ADR-124 § Updates och mallkatalogens README § Förlagorna rör lagringsnyckelns form (370.1) och försättsbladets mall (370.2); denna skiva lägger ingen ny mall och rör ingen lagringsnyckel. #6 N/A — mallparitets-grinden och mall-synken gäller mallar i docs/mallar/bilagor/, som denna skiva inte rör.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · PR #2255 (MERGED 2026-09-03T11:25:02Z, granskad head dd863164). Review-loop: runda 1 ett warning (tak-regexen obunden mot EF:ens felsträng) → tolkaTakfel utbruten till inkorg-harledningar.ts + bindningstest som kör EF:ens riktiga validering med 31 id:n (5 fall inkl. diskrimineringskontroll) → runda 2 konvergerad, 0 fynd, risk låg; backstopp grön. Form: sentinel-nyckel '__alla__' i samma forhandsgranskaPagar-Set (beslut 5), egen mutation, adapter-port previewKvittonForInbetalningar genom DataSource, taket läses ur EF:ens fel (ingen klientkopia), TASK-353:s formvals-docblock omskrivet. E2e 8/8 (staging-e2e, chromium-authenticated — Acceptance-klassen kan inte rendera inkorgen), negativt bevis 5 röda/2 gröna mot origin/main. Ärvda DoD-poster 4–6 N/A (ren klientskiva). Orkestrerare S116.
<!-- SECTION:FINAL_SUMMARY:END -->
