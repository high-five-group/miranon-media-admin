---
id: TASK-456
title: >-
  Fynd: betalningsinkorgens kort blir lägre när ingen pill visas — pill-raden
  saknar reserverad höjd
status: To Do
assignee: []
created_date: '2026-09-18 11:07'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - docs/research/betalningsytan-tre-prodobservationer-2026-09-18.md
priority: high
ordinal: 796000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus i prod 2026-09-18: ett kort i betalningsinkorgen är lägre än syskonen — "inte bra, alla kort ska alltid vara exakt lika höga". `RadInnehall` i `src/components/betalningar/BetalningsInkorg.tsx:2523–2576`: pill-raden (rad 2540, `flex flex-wrap items-center gap-2`) är alltid monterad men bär ingen `min-h`; de tre pillarna är villkorliga (`rad.forfallen` 2555, `rad.obekraftad` 2566, `rad.spegelSlapar` 2571). Är alla tre falska blir raden 0 px och kortet krymper.

Prod-belagt av S127-orkestreraren (read-only, record `rec8XOxyalHD6DCEu`): anmälan har Status "Bekräftad (mail skickat)", 2 500 kr obetalt, inte förfallen, spegeln i fas — alltså ingen pill alls, helt legitimt datatillstånd. Kravet "lika höga" är redan etablerat för syskonytorna (sessionsdok S121 rad 546–548, S114 rad 316). Husmönster: `RegistreratNuBlock.tsx:544–566` (min-h) och Intresserade-listans `min-h-[1lh]`. Inkorgens kort är inte facit-stämplat (underlaget § O1). Eventdetaljens "Öppna detaljer" delar `RadInnehall` (TASK-436) — kontrollera att den ytan inte ändras oavsiktligt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först: test som mäter korthöjden för en rad utan pill mot en rad med pill (samma viewport) — olika i dag, lika efter fix; mobil 390 och desktop 1280
- [ ] #2 Pill-raden reserverar höjd enligt husmönstret; en rad med TVÅ pillar som radbryter på smal skärm hanteras uttalat (antingen samma höjd för alla eller namngivet undantag med skäl)
- [ ] #3 Eventdetaljens Öppna detaljer (delar RadInnehall) verifierad oförändrad eller medvetet lika
- [ ] #4 Marcus ögonmäter inkorgen i dev-server/staging innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
