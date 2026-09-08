---
id: TASK-440
title: >-
  Persondetaljens Händelser visar inbetalningar via samma härledning som
  eventdetaljens Händelselogg (TASK-438) — undertext-rader, senast överst,
  befintlig per-person-läsning
status: To Do
assignee: []
created_date: '2026-09-08 15:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-438
ordinal: 767000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning ur TASK-438 (S124 resume 1, 2026-09-08). Persondetaljens "Händelser" (`src/components/registrations/AnmalanDetail.tsx` § harledHandelser → `Tidslinje`) bär bara utskicken; inbetalningarna finns som egen lista (`InbetalningsLista`) intill. Eventdetaljens Händelselogg (TASK-436/438) blandar sedan 2026-09-08 utskick och inbetalningar i EN tidslinje med underrader (kvittostatus · makulering · notering) ur den delade härledningen `src/components/betalningar/inbetalnings-handelser.ts` — "samma sak ska heta samma sak var Lotta än står" (Marcus 2026-09-01). Detta kort ger detaljvyn samma logg.
FORM: detaljvyns Händelser blandar `harledHandelser(registration)` med `inbetalningsHandelser(grupp)` exakt som `Betalningar.tsx` (samma sortering `tidsvarde`, samma `loggtid` för rent datum utan klockslag — bryt ut de två hjälparna till en delad modul i stället för att kopiera dem, ADR-126). Läsningen är detaljvyns BEFINTLIGA anrop (`useInbetalningarPerAnmalan`, ett anrop för EN person — batch-vägen är eventsidans behov, inte detaljvyns); svaret bär redan `inbetalningar`/`kvitton`/`jobbfel`, så inget nytt anrop tillkommer. Beslut som kortet INTE tar, utan grillas med Marcus innan bygge: ska `InbetalningsLista` (med sina handlingar: kvitto, makulera, radera) stå kvar intill loggen, eller blir loggen läsytan och listan handlingsytan? Läs `AnmalanDetail.tsx` docblock och `InbetalningsLista.tsx` § RADENS ANATOMI innan förslaget.
KÄLLOR: TASK-438 (#2468), `Betalningar.tsx` § TASK-438-stycket, `inbetalnings-handelser.ts` docblock, `Tidslinje.tsx` (`undertext`), `AnmalanDetail.tsx` rad ~640–646 (Händelser-blocket, TASK-438-kortets ursprungliga pekare).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Detaljvyns Händelser visar inbetalningar/återbetalningar/makulerade rader med samma text, underrader och ikoner som eventdetaljens Händelselogg, ur den delade härledningen; loggtid/tidsvarde delade, inte kopierade
- [ ] #2 Inget nytt nätverksanrop: samma per-person-läsning som i dag, bevisat i acceptance-test via nätverksräkning
- [ ] #3 Beslutet om InbetalningsLista intill loggen grillat och bokfört i kortet innan bygget
- [ ] #4 anmalan-detalj-acceptance och axe gröna; DoD-kommandona gröna med faktiska exitkoder
- [ ] #5 Ögonmätt av Marcus mot dev-server/staging före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
