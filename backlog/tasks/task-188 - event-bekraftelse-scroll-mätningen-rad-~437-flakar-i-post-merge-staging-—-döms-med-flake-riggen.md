---
id: TASK-188
title: >-
  event-bekraftelse scroll-mätningen (rad ~437): deterministisk 57
  px-förskjutning i post-merge-staging — INTE flake
status: Done
assignee: []
created_date: '2026-08-10 14:12'
updated_date: '2026-08-24 13:56'
labels: []
dependencies: []
ordinal: 354000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (mätt, 3 instanser 2026-08-10): toBeLessThanOrEqual-mätningen i tests/e2e/event-bekraftelse.staging.test.ts ~rad 436-438 (aktivt/vilande topp/dok/bar-positioner, tolerans 1px). Hard fail 3/3 retries i post-merge-runs 31384821726 (10430913) + b31e0046-runnen (#1123); retry-pass i 31387516343 (ecfc3596). Ärenden #1111/#1123 stängda mot detta kort. REGEL: flakighet döms med npm run metrics:flake (interfolierad A/B, loadavg, retries=0) — ALDRIG okulärt eller med egen mätserie; läs alltid ut n innan noll-resultat tolkas. FÖRVÄNTAT: mätserie som klassar testet, därefter fix av mätformen eller villkoren — inte en tyst retry-maskering.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE instansen 2026-08-10: post-merge-run för 0debb7cb (#1129, stängd mot detta kort) föll 3/3 på rad ~437 + ~445 (nu TVÅ mätpunkter i samma test). Instanser i dag totalt: 10430913 (hard 3/3), ecfc3596 (retry-pass), 0debb7cb (hard 3/3). Prioriteten stiger — varje kodlandnings post-merge riskerar rödmålning.

PREMISS-KORRIGERING 2026-08-11 (rödklassningen, S102): kortet föddes som flake-hypotes med flake-riggen som metod. Loggarna falsifierar det: Received: 57 — SAMMA tal i fyra körningar (runs 31424324711, 31429376628, 31433516144, 31454392944), hard fail 3/3 retries varje gång. Det är en deterministisk 57 px-förskjutning i markera-läget, inte flake. metrics:flake är därmed fel instrument — felsök som layoutförskjutning (vad tar 57 px i aktivt läge?). Stängde issues #1144 + #1159 (+ #1154 delvis) mot detta kort.

KORSREFERENS (S105 D3-C, 2026-08-13): TASK-205 (öppet fynd-kort, 2026-08-12) utreder samma test/rad (event-bekraftelse.staging.test.ts, dokumenthöjd-invarianten) utan att ha känt till detta kort vid sin tillkomst — ingen av korten refererade den andra före denna rad (grep-verifierat). TASK-205 har nu, i sin egen mätserie (17 körningar, 2026-08-10 till 2026-08-12), bekräftat samma sak detta kort redan slog fast: verbatim Received-värdet är ALLTID exakt 57, oavsett merge-SHA eller dag. TASK-205s kvarstående datatillstånds-hypotes (förklaring b) är därmed under tryck av samma belägg som redan finns här. Beslut om sammanslagning/vilken förklaring som gäller tas INTE här — flaggat för Marcus/orkestrerarens ställningstagande i TASK-205s tillägg.

KÄLLHÄNVISNING (2026-08-14, TASK-205-agenten, ren notis — ingen statusändring, cross-card-beslut ligger hos Marcus/orkestreraren):

TASK-205 har nu mekaniskt bevisat mekanismen bakom det "deterministiska 57px" båda korten mätt. Slutsatsen om VÄRDET var korrekt (alltid exakt 57, ingen flake i klassisk mening) — men mekanismen är INTE en layoutförskjutning orsakad av markera-lägets egen CSS/batch-bar, som denna korts rubrik och tidigare notes antyder. Batch-barens egen höjd mättes identisk (42px) i vilande och aktivt läge i samtliga instrumenterade repro-körningar.

Den faktiska orsaken: Anteckningar-gruppen (src/components/events/detail/Anteckningar.tsx) fetchar get-event-notes UNMOCKAT i tests/e2e/event-bekraftelse.staging.test.ts, träffar RIKTIG skarp staging med en fixtur-EVENT_ID som aldrig är seedad där, får ett äkta 404, och komponentens felboxs-render (jämfört med laddläget) adderar exakt +57px till dokumenthöjden — oberoende av markera-läget. Timingen (riktig nätverks-roundtrip) race:ar mot testets synkrona mätsekvens, vilket förklarar varför träffpunkten varierade men värdet aldrig gjorde det.

Fix landad i TASK-205: get-event-notes-mock tillagd i testfilens mocka(), samma konvention som mockNotes() i event-detail.staging.test.ts. 12/12 + hela filens 16/16 gröna efter fix, mot 2/8 röda (samma Received: 57-mönster) på pristina filen före fix.

Full diagnos, källor och verifieringsdata: TASK-205:s implementation notes.

STÄNGD S112 STÄDVÅG A (2026-08-24, bokföringspass, ingen kod ändrad). Belägg verifierat mot disk: TASK-205 (Done) korsreferererar detta kort i tests/e2e/event-bekraftelse.staging.test.ts rad 34-47 (docblock, grep-bekräftat) och bekräftar samma mekanism — get-event-notes ofullständigt mockad, +57px felboxs-render, race mot testets synkrona mätsekvens. Fixen (get-event-notes-mock) landade i PR #1273 (merge a4ef52c7, 2026-08-14T16:31:25Z), verifierad ancestor av origin/main, checks SUCCESS/SKIPPED. 12/12 + hela filens 16/16 gröna efter fix per TASK-205:s egna notes. Kortet saknar egna AC — inget att bocka där. Genuin duplikat, inte samma kort som borde förbli separat.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Duplikat av Done TASK-205 — samma test/rad, samma mekanism (Anteckningar-gruppens unmocked get-event-notes-fetch mot skarp staging, +57px felboxs-render), fixad i PR #1273. Cross-referens verifierad i tests/e2e/event-bekraftelse.staging.test.ts:34-47. Kortet flippades aldrig till Done i backlog-CLI:t. Bokförd stängning, S112 städvåg A.
<!-- SECTION:FINAL_SUMMARY:END -->
