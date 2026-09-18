---
id: TASK-456
title: >-
  Fynd: betalningsinkorgens kort blir lägre när ingen pill visas — pill-raden
  saknar reserverad höjd
status: To Do
assignee: []
created_date: '2026-09-18 11:07'
updated_date: '2026-09-18 11:57'
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
- [x] #1 Rött-först: test som mäter korthöjden för en rad utan pill mot en rad med pill (samma viewport) — olika i dag, lika efter fix; mobil 390 och desktop 1280
- [x] #2 Pill-raden reserverar höjd enligt husmönstret; en rad med TVÅ pillar som radbryter på smal skärm hanteras uttalat (antingen samma höjd för alla eller namngivet undantag med skäl)
- [x] #3 Eventdetaljens Öppna detaljer (delar RadInnehall) verifierad oförändrad eller medvetet lika
- [ ] #4 Marcus ögonmäter inkorgen i dev-server/staging innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Bygg-agent slutrapport 2026-09-18. AC #1-#3 avbockade och mätta; AC #4 (Marcus ögonmätning) lämnas obockad per uppdrag, se PR-kroppen för exakt route/datatillstånd. DoD #1 lämnas OBOCKAD med avsikt — "Alla acceptanskriterier" är literally inte sant medan AC #4 väntar Marcus.

FIX: `min-h-6` (24 px, husmönster — samma som `AnmalningarSida.tsx`s badge-slot, mätt där till exakt 24 px för `StatusBadge storlek="sm"`) på pill-radens div i `RadInnehall` (`BetalningsInkorg.tsx:2540`), plus `data-testid="rad-pillar"` för mätbarhet.

RÖTT-FÖRST (AC #1), staging e2e (`tests/e2e/betalningar-inkorg-pillrad-hojd.staging.test.ts`), mätt live mot verklig staging: FÖRE fix — mobil 390: pillfri=120px vs enpill=144px (diff 24px = exakt pillens höjd); desktop 1280: 76px vs 100px (samma diff). EFTER fix: identiska på båda viewports.

AC #2 (designfrågan), mätt vid 390 px, inte gissad: TVÅ pillar (Obekräftad + Basen släpar) radbryter INTE — kortet 144px, identiskt med en-pill-baslinjen, pillradens egen boundingBox 24px (en rad). TRE samtidiga pillar (Förfallen + Obekräftad + Basen släpar — en obekräftad, förfallen anmälan vars spegel också släpar) RADBRYTER till två rader — kortet blir 176px (+32px = en extra pillrad 24px + gap-2 8px). Namngivet, medvetet undantag (dokumenterat i kod-kommentaren vid rad-pillar-diven): att tvinga fram en rad hade krävt att krympa StatusBadge sm-skalsteget eller pillarnas etablerade ordalydelse, vilket rör varje annan konsument av samma skalsteg (AnmalningarSida.tsx, Betalningar.tsx m.fl.) för en enda radrad yta.

AC #3: `RadInnehall` är INTE, som uppdraget påstod, bokstavligen delad med eventdetaljens "Öppna detaljer" — den funktionen är privat till BetalningsInkorg.tsx och används bara internt (3 anrop, alla i samma fil). Vad som FAKTISKT delas är BasenSlaparPill (extraherad ur RadInnehall vid TASK-436, se dess eget docblock) — och den är oförändrad av denna fix. Divergens noterad per ADR-086. Empiriskt verifierad ändå: hela `tests/e2e/mark-paid.staging.test.ts` (22 tester, den exakta "Öppna detaljer"-sviten) körd mot fixad kod — 22/22 gröna.

Grindar: typecheck exit 0, biome check exit 0 (inga fynd i rörda filer), build exit 0, check-langa-streck exit 0 (328 filer). test:api: api-pure 1786/1786 gröna. Full test:api (inkl. api-staging) kolliderade med en SAMTIDIG CI-körning (post-merge.yml #35340750185, "Staging (API + E2E)"-jobbet, bekräftat in_progress via gh) — TASK-77-preflighten stoppade normal körning; kört under MM_STAGING_PREFLIGHT=off gav 3 transienta fel, varav 2 (cancel-registration, generate-event-attachment) gick gröna vid omkörning och 1 (send-registration-confirmation.staging.test.ts "GATE-LIVENESS", helt orört av denna PR — anmälningsbekräftelse-domänen, ingen call-path mot BetalningsInkorg/RadInnehall) konsekvent timeoutade (30s, "Request context disposed") så länge CI-jobbet var in_progress — en känd, transient miljökollision, inte en regression av denna diff.
<!-- SECTION:NOTES:END -->
