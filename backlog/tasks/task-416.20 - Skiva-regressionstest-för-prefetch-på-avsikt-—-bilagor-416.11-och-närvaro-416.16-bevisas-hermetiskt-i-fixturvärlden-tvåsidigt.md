---
id: TASK-416.20
title: >-
  Skiva: regressionstest för prefetch på avsikt — bilagor (416.11) och närvaro
  (416.16) bevisas hermetiskt i fixturvärlden, tvåsidigt
status: Done
assignee: []
created_date: '2026-09-06 17:12'
updated_date: '2026-09-07 17:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 749000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: review-info på PR #2399 (TASK-416.11) och PR #2403 (TASK-416.16), S123. Prefetchen på hover/fokus/sidmount saknar ett test som blir rött om någon tar bort den — regeln (ADR-078 beslut 3) skyddas i dag bara av prosa. Åtgärd: acceptance-test i fixturvärlden (tests/support/fixturvarld) som (1) monterar eventdetaljen, hovrar/fokuserar Gå till åtgärder resp. Check-in-ingången, och asserterar via MSW-räknare att get-event-attachments resp. get-attendance anropats FÖRE klick; (2) navigerar och asserterar att bilagor/närvaro renderas utan laddläge (ingen aria-busy, ingen skeleton) eftersom cachen är varm; (3) sidmount-prefetchen: räknaren ≥ 1 efter mount utan interaktion. Tvåsidigt bevis: en temporär bortkoppling av prefetchen (t.ex. via test-only env eller genom att köra testet mot en commit före 416.11) ska ge rött; bokför körningen. Hermetik-självtestet ska falla med OmockadRequestError för varje test (aldrig test.fail, se lessons-fragmentet om test.fail). Beroende: TASK-416.16 landad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Test bevisar prefetch på hover/fokus för bilagor och närvaro (EF-anrop före klick, MSW-räknare) och sidmount-prefetchen för bilagor
- [x] #2 Test bevisar att målvyn renderas utan laddläge efter prefetch (ingen aria-busy/skeleton)
- [x] #3 Tvåsidigt bevis bokfört: utan prefetch är testet rött
- [x] #4 npm run test:acceptance:sjalvtest grönt för filen; Acceptance-klassen grön i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ny fil: tests/acceptance/prefetch-avsikt-regression.acceptance.test.ts — tre test (A/B/C), alla gröna lokalt (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance <filen>, 3 passed).

AVVIKELSE MOT KORTETS ORDALYDELSE (bokförd, ADR-086): kortet ber om en MSW-räknare. acceptance-bas.ts § VAD KLASSEN BEVISAR säger uttryckligen att klassen aldrig testar att en handler anropades eller hur många gånger — det vore att testa fixturen. Använde i stället hallbarMock (laddning-cls.acceptance.test.ts-mönstret) + page.waitForResponse (samma teknik som tabbar-personer-prefetch.acceptance.test.ts) — bevisar EF-anrop före klick via ett observerbart nätverkssvar i stället för en intern räknare.

UPPTÄCKT UNDER BYGGET, bokförd i filens docblock: för NÄRVARO finns TVÅ prefetch-vägar på EventDetail.tsx (CheckInKort.onIntent OCH ett eget sidmonterings-useEffect från TASK-416.16 AC 2). React Querys dedup gör att mount-effekten alltid hinner före en Playwright-hover — ett svart-låda-test kan därför inte isolera bara onIntent för närvaro. Verifierat empiriskt: att ta bort ENBART onIntent-propet på CheckInKort i EventDetail.tsx lämnar Test A GRÖNT (mount-effekten bär hela vägen ändå); att DESSUTOM stänga av mount-useEffect:en gör Test A RÖTT. Bilagors två mekanismer (AtgarderKort på eventdetaljen kontra AtgardsSida.tsx egen sidmontering) ligger på olika sidor och ÄR oberoende testbara — Test B/C river dem var för sig.

TVÅSIDIGT BEVIS (AC 3), alla körningar manuella, filspecifik git checkout -- efter varje (aldrig stash):
Test B (bilagor, hover): tog bort onIntent-propet i AtgarderKort (Atgarder.tsx rad 233) -> RÖTT (page.waitForResponse timeout 60000ms, väntan på get-event-attachments FÖRE klick löste aldrig ut). Återställd, grönt igen.
Test C (bilagor, sidmount): kommenterade ut useEffect:en i AtgardsSida.tsx (rad 3016-3022) -> RÖTT (samma waitForResponse-timeout, 20000ms). Återställd, grönt igen.
Test A (närvaro): a) tog bort ENBART onIntent på CheckInKort i EventDetail.tsx -> förblev GRÖNT (se upptäckten ovan). b) stängde DESSUTOM av mount-useEffect:en (rad 169-171) -> RÖTT (samma waitForResponse-timeout, 20000ms). Återställd, grönt igen. git status --porcelain bekräftar rent träd efter återställning.

GRINDAR, MÄTTA: biome (filen + hela repot) exit=0, typecheck exit=0, build exit=0, check-langa-streck OK (diffen rör inte src/, ej formellt krävd), test:acceptance:sjalvtest för filen -> 3 fällda / 3 med OmockadRequestError, exit=0. Negativ kontroll -> 0 fällda, exit=0. test:api -> 1757 passed, 1 failed (auth.setup.ts), 523 did not run: fällningen är staging-preflighten (TASK-77) som vägrade köra eftersom post-merge.yml (run 34140945601) höll staging-mutexen — miljöblockad, ej regression (diffen rör bara den nya testfilen). Körd två gånger, samma resultat.

AC 4:s CI-led (Acceptance-klassen grön i CI) kan inte observeras härifrån — bockad utifrån den lokala motsvarigheten (samma projektform CI kör); CI:s eget utfall äger den slutliga signalen.

STÄNGNING (S123 resume 1, 2026-09-07): PR #2444 → 59d8d336; post-merge 59d8d336 GRÖN. Review runda 1 (Sonnet): 1 info ask-user (Check-in-ingångens onIntent går inte att isolera i test — sidmount-effekten hinner alltid först), risk låg; Marcus 'OK 2444' 2026-09-07 → fynd-kort TASK-429 för frågan. AC #1 bedömd felställd för närvaro-delen (bokfört i testfilens docblock). Done-flipp av orkestreraren.
<!-- SECTION:NOTES:END -->
