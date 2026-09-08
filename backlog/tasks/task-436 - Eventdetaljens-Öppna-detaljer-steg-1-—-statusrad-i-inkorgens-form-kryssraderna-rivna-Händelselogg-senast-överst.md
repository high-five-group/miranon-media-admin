---
id: TASK-436
title: >-
  Eventdetaljens 'Öppna detaljer' steg 1 — statusrad i inkorgens form,
  kryssraderna rivna, Händelselogg senast överst
status: To Do
assignee: []
created_date: '2026-09-08 02:20'
updated_date: '2026-09-08 02:53'
labels:
  - ready-for-agent
dependencies: []
ordinal: 763000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-09-08 (S124), efter att orkestreraren sett ytorna i staging: "var perfektionist med designen nu, det måste vara sjukt snyggt och rent". Byggs av orkestreraren själv.

DAGENS FORM (sett 2026-09-08 mot dev-server/staging, event recolQdNGcKz1eX0n): flikar Saknar betalning/Klara + deadline-märke, per person namn + pills, två avstängda kryssrader `BetalningsLasRad` (Anmälningsavgift/Slutbetalning + "Mottagen"-pill + basens notering som läsvärde), ett medvetet tomrum (`pt-8`, rubriken "Utskick" riven av Marcus 2026-08-06), utskickslogg (`Tidslinje` ur basens tidsstämplar) eller platshållartext. Inga belopp. Inga inbetalningar.

KVITTERADE BESLUT 2026-09-08:
1. Kryssraderna rivs: en avstängd kryssruta är en kontroll som inte är en kontroll (samma dom som för knappar, Marcus 2026-09-01); sedan ADR-128 säger de bara klart/inte klart medan alla andra ytor talar i kronor ("samma sak heter samma sak var Lotta än står", AnmalansBetalningar.tsx docblock); basens noteringsfält är tomma i prod (mätt 2026-09-08, 0 poster).
2. Statusrad per person i INKORGENS EXAKTA FORM: "1 500 kr kvar att betala" + Förfallen/Obekräftad/Basen släpar-pills, "Allt betalt"/"Inget att betala" för Klara — ur `useOppnaBetalningar` (samma anrop som inkorgen, `InkorgsRad` bär `eventId`) filtrerat på eventet: noll extra anrop. `RadInnehall` (`src/components/betalningar/BetalningsInkorg.tsx` rad 2522–2583) bryts ut till delad komponent under `src/components/betalningar/` (ADR-126); inkorgen importerar tillbaka byte-identiskt.
3. Utskicksloggen blir Händelselogg: senast överst (persondetaljens `harledHandelser`-precedent, `AnmalanDetail.tsx` rad 143), bär dagens utskick plus "Anmäld" ur `inskickad`; ingen synlig rubrik (Marcus 2026-08-06 står). Inbetalningarna i loggen är STEG 2 (TASK-438) och kräver serverläsningen TASK-437.
4. Eventsidan skriver ingenting (TASK-145 DoD #7): invarianterna i `tests/e2e/mark-paid.staging.test.ts` rad 415/421 (noll textbox) och `tests/e2e/event-deltagare.staging.test.ts` rad 823–887 (noll skriv-affordanser efter "Öppna detaljer") ska vara gröna oförändrade.

KÄLLOR: `src/components/events/detail/Betalningar.tsx` (docblock rad 16–39, `BetalningsPersonRad` rad 381–623, montering via `Deltagare.tsx` `ArbetsKo` rad ~1387/1793–1801), `src/components/betalningar/inkorg-harledningar.ts` (`harledRad` rad 98, `InkorgsRad` rad 39), `src/data/betalningar/useBetalningar.ts` rad 58, `src/components/registrations/Tidslinje.tsx`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Per person i Öppna detaljer: namn + pills som i dag, därunder statusraden 'Kvar att betala' i persondetaljens etikett-värde-form (husets form för detaljkort, BetalningsInkorg.tsx RadInnehall docblock: etikett-formen bär panelen och anmälans detaljvy, löpande text bär inkorgen) renderad av samma utbrutna komponent som anmälans detaljvy; inkorgens befintliga tester gröna utan ändring
- [x] #2 BetalningsLasRad och de två kryssraderna borta; inga disabled-kryss i sektionen; Saknar/Klara-flikarna och deadline-märket oförändrade; eventets pris saknas sägs EN gång på eventnivå, aldrig per person
- [x] #3 Tidslinjen heter Händelselogg i kod, aria och tomtext, sorteras senast överst, bär dagens utskick plus Anmäld ur inskickad med detaljvyns ordval ur en delad härledning (registrations/handelser.ts) som även detaljvyns Händelser använder; ingen synlig rubrik
- [x] #4 Noll skriv-affordanser: mark-paid.staging och event-deltagare.staging omskrivna mot den nya formen med invarianterna bevarade (noll textbox, noll mailto) och skärpta (noll kryss); axe 0 på öppen sektion; beloppen hämtas först när detaljerna öppnas (noll anrop vid sidladdning, bevisat i e2e); prefers-contrast more, prefers-reduced-motion och print prövade i browsern
- [ ] #5 Ögonmätt av Marcus mot dev-server/staging före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
