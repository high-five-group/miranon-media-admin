---
id: TASK-416.18
title: >-
  Skiva: Hem — Nya anmälningar och Förfallna betalningar: skeletonradens anatomi
  lika den laddade raden (listRow 568×72 mot riktig rad 545×66), och
  test.fail-markörerna i hem-laddlage vänds
status: Done
assignee: []
created_date: '2026-09-06 15:44'
updated_date: '2026-09-17 09:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 745000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: TASK-416.13:s mätning (PR #2412, S123, 2026-09-06): Nya anmälningars och Förfallna betalningars listradsskelett (Skeleton variant=listRow) matchar inte den riktiga radens boundingBox — skelett {width:568,height:72} mot riktig rad {width:545,height:66}. Bokfört som rött-först i två test.fail()-test i tests/acceptance/hem-laddlage.acceptance.test.ts. Samma felklass som TASK-416.17 (Maillogg/Väntelista): den generiska listRow-varianten (h-[3lh]) används där den laddade raden har en egen anatomi. Åtgärd: ge skeletonraden i src/components/hem/NyaAnmalningar.tsx och src/components/hem/ForfallnaBetalningar.tsx exakt den laddade radens anatomi och bredd (raden är 545 px inuti kortet — skelettet ligger utanför radens padding), ta bort test.fail() så mätningen blir en vanlig grön assertion (tvåsidigt: med gammal listRow rött). Tomläget (0 rader → en rad med bock, PRD § Öppna frågor) rörs INTE av denna skiva. Beroende: TASK-416.13 landad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skeletonradens boundingBox i Nya anmälningar och Förfallna betalningar är identisk med den laddade radens (toEqual, ±0 px)
- [x] #2 De två test.fail()-testen i hem-laddlage är vanliga assertions och gröna; tvåsidigt bevis bifogat
- [x] #3 Hem-acceptance grön, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review runda 1 (PR #2419, utlåtande) — ask-user-fynd, KÄND BOKFÖRD KANT, ej åtgärdad i denna skiva: ForfallenSkeletonRad (ForfallnaBetalningar.tsx) speglar "Att påminna"/"Väntar"-radens anatomi (ForfallenRadInnehall, items-center, två textrader) — den vanliga vägen, tvåsidigt bevisad. Ett morgonscenario där "Att påminna"/"Väntar" är tomma men "Dags att ringa" är fylld (alla obetalda redan påminda, RINGTROSKEL_DAGAR passerat) ger en riktig FÖRSTA rad som är RingRadInnehall (items-start, 3-4 rader) — skeletonens boundingBox matchar då inte, och layout-hoppet denna skiva finns för att undvika återkommer i just det scenariot. Obevisat och otestat (medMatningsdata()-fixturen ger uteslutande "Att påminna"-rader). Klassat som samma sorts kant som Hem-kortens tomläge (PRD TASK-416 § Öppna frågor, Marcus designval) — ett medvetet icke-täckt scenario, inte ett fel denna skiva åtgärdar. Docblocket i ForfallnaBetalningar.tsx skrevs om (var självmotsägande: påstod "GEMENSAM bas-anatomi för alla tre grupper" i samma mening som RingRadInnehall-undantaget) för att bokföra samma sak ärligt i koden.

REVIEW-RUNDA 3 (PR #2419, Opus, 2026-09-06, på mandat): konvergerad, 4 info. Omslagsformen (span shrink-0 pl-2 + Skeleton w-14) browser-mätt av granskaren: målad rektangel 56 px förskjuten exakt 8 px, yttre 64 px, radhöjd 66 px i båda formerna — runda 2:s härledning bekräftad. Två prosa-rester ej rättade i kod (bokförs här): docblockets radhänvisning 'rad ~168/179' till relTid-spannen är stale (faktiskt 189/200 vid ce22eff6; skriv symbolisk hänvisning nästa gång filen rörs), och testkommentaren 'vid övriga tre viewports är förskjutningen ett annat tal' är obevisad per bredd (ska lyda 'kan vara ett annat tal, ej mätt per bredd'). Landad eb58c07b.

Bockad i efterhand av S125 mot belägg: PR #2419 mergad eb58c07b (2026-09-06), samtliga 3 AC redan bockade, review-runda 3 konvergerad (4 info, 0 blockerande). Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
