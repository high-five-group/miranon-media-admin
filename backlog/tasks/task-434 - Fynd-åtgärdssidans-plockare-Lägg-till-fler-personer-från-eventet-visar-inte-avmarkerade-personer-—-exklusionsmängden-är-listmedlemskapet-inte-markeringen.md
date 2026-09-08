---
id: TASK-434
title: >-
  Fynd: åtgärdssidans plockare 'Lägg till fler personer från eventet' visar inte
  avmarkerade personer — exklusionsmängden är listmedlemskapet, inte markeringen
status: Done
assignee: []
created_date: '2026-09-08 01:43'
updated_date: '2026-09-08 15:53'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 761000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-09-08 (S124, observerat i PROD): 'om jag expanderar listan med alla markerade deltagare och avmarkerar några, då bör de direkt finnas tillgängliga i listan Lägg till fler personer från eventet, men det gör dem inte.'

ROTORSAK (bekräftad ur koden av diagnos-agent, S124): `src/components/events/atgarder/AtgardsSida.tsx` håller två mängder — `synligaIds` (listans medlemskap) och `valda` (markeringen), rad 2982–2983, seedade lika vid mount rad 3030–3038. Avmarkering i panelen skriver bara `valda` (`onVaxla`, rad 3156–3163). Plockaren `kandidater` filtrerar mot `synligaIds` (rad 782–786), räknaren räknar `alla.length - synliga.length` (rad 973) och tomtexten jämför mot `synliga` (rad 1015). Invarianten `valda ⊆ synligaIds` gör att en avmarkerad person aldrig blir kandidat.

DESIGNVAL, INTE REGRESSION: uppdelningen infördes medvetet i commit `e449f6b8` (S100 varv 4, 2026-08-07) — docblock rad 726–730 'avmarkering lämnar kortet kvar i listan, vitt'. QA-kortet TASK-228 och `tests/e2e/event-bekraftelse.staging.test.ts` rad 677–718 verifierar bara att kortet ligger kvar, aldrig plockaren. Frågan ställdes aldrig till Marcus; TASK-147.9 (QA-vandringen) står i To Do.

MARCUS BESLUT 2026-09-08: alternativ A — avmarkerad person ligger kvar vit i panelen OCH syns i plockaren. Varv 4-grammatiken rörs inte.

FIX: byt exklusionsmängd från `synligaIds` till `valda` på rad ~786 (kandidater), ~973 (räknaren → `alla.length - valda.size`) och ~1015 (tomtexten). Strikt utvidgning av kandidatpoolen; `mottagare`, matarna, 'Registrera inbetalning för N markerade' och utskicken läser `valda`/`mottagare` och är opåverkade.

OBS S124: ett parallellt kort river betalningsblocket i samma fil (rad ~3205–3346). Olika regioner; den som landar sist rebasar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Avmarkeras en person i den expanderade mottagarlistan syns hen omedelbart i plockaren 'Lägg till fler personer från eventet'; kortet ligger kvar vitt i panelen (beslut A)
- [x] #2 Räknaren bredvid plockaren och tomtexten 'Alla anmälda är redan i listan' läser markeringen (valda), inte listmedlemskapet
- [x] #3 En assertion i tests/e2e/event-bekraftelse.staging.test.ts direkt efter avmarkerings-steget (rad ~718) fäller ut plockaren och verifierar att den avmarkerade personen finns där — testet är RÖTT mot main före fixen (bevisat i PR-kroppen) och GRÖNT efter
- [x] #4 tests/visual/atgardssida-promoverings-grind.spec.ts grön; DoD-kommandona (test:api, typecheck, biome, build) gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad via PR #2455 (`d62d94f6`, 2026-09-08 ~02:30Z, S124 Del 2). Fix: plockarens kandidater, räknaren och tomtexten läser markeringen (`valda`) i stället för listmedlemskapet (`synligaIds`) — strikt utvidgning av kandidatpoolen, varv 4-grammatiken orörd. Rött-först-bevis i PR-kroppen (event-bekraftelse.staging rad ~718). Review-agent i färsk kontext: 0 fynd, risk låg, konvergerad runda 1. Prod via Vercel samma morgon; Marcus såg fixen i prod inför Lottas eftermiddag.
<!-- SECTION:FINAL_SUMMARY:END -->
