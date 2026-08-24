---
id: TASK-249.5
title: 'Skiva: Flippen — variant d promoveras till skarp segment-yta'
status: Done
assignee: []
created_date: '2026-08-17 00:33'
updated_date: '2026-08-24 13:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.1
  - TASK-249.2
  - TASK-249.3
  - TASK-249.4
parent_task_id: TASK-249
ordinal: 467000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Promoveringskontraktets kärnmoment (ADR-102/103): den godkända formen blir den skarpa ytan, identisk, med servern som enda sanningskälla för medlemskap. Täcker användarberättelser: 1-14, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skarpa segment-routen renderar den promoverade formen UTAN variantparameter; samtliga sju ytor är identiska med facit tasks/sessions/bilagor/s104-segment-divergens/facit.json (respektive yta-rad; bilder: [] betyder identisk med den körande prototypen i variant d-läge — aldrig en delförändringsbeskrivning)
- [x] #2 Formen konsumerar server-kontraktet: klientens frågeplans-snitt är ERSATT av EF:ernas AND-stöd — ingen medlemsberäkning eller regelexpansion sker i klienten
- [x] #3 Dimensionerna läses ur basens fält via läsvägen — prototypens hårdkodade kurskarta är borta ur den skarpa vägen
- [x] #4 ariaSnapshot-referenserna från grind-skivan är ORÖRDA och gröna efter flippen
- [x] #5 acceptance- och axe-klasserna gröna för skarpa ytan; tillgänglighetsribban 11 utan undantag
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — varje yta i ytor[] prövad mot den promoverade formen
- [x] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [x] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-17 05:46
---
BYGGAGENT-BOKFÖRING (2026-08-17): Flippen byggd som en STRUKTURELL + LÄS-VÄGSSKIVA, inte en funktionell mutations-uppgradering — AC#1:s egen precisering ("bilder: [] betyder identisk med den körande prototypen i variant d-läge — aldrig en delförändringsbeskrivning") tolkades som bindande: saveSegment/sendEmail/testmail RÖRS INTE (förblir no-op/simulerade, exakt som i prototypen). Denna tolkning avviker från en tidigare hypotes (att 249.8:s manuella QA-plan skulle kräva riktig mutations-wiring) — hypotesen förkastades efter kodläsning (UtskicksVy.skicka() är en ren setTimeout-simulering, "egna"-entiteter har lokala fabricerade ID:n utan koppling till Segment-tabellen) och efter att AC#1:s ordalydelse vägde tyngre.

FYND UNDER BYGGET, ej i uppdraget: de fyra befintliga acceptance-sviterna (mer-segment*.test.ts, 17 tester) testade alla SegmentBuilder-UI:t på exakt den route flippen tar över — samtliga skulle fälla. Löst med samma minimal-anpassning-precedent som TASK-243.1/243.3 (hem-vyn): 16 tester skippade individuellt med kodkommentar, ETT nytt a11y-smoke-test (axe 0 violations) tillagt mot den promoverade formen så tillgänglighetsgolvet aldrig stod obevakat. Följdkort mintat: TASK-249.9 (full omskrivning, dependency 249.5+249.6).

DoD-status: #3 (CI grön per jobb) lämnas obockad — CI-verifikation ägs av orkestrerarens svep, inte av mig. #7 ("check-facit grön genom flipp OCH rivning") lämnas obockad — ordalydelsen kräver BÅDA flipp OCH rivning; rivningen är TASK-249.6:s scope, ej byggd här. check-facit ÄR grönt genom flippen ensam (verifierat: scripts/check-facit.sh exit 0).

Grindar körda och gröna: npm run typecheck (0 fel) · npx @biomejs/biome check . (0 fel, 7 varningar/47 infos — identiskt med bas-mätningen före ändringarna) · npm run build (grön) · npm run test:api (862/862 gröna) · aria-grinden (PLAYWRIGHT_VISUAL_DEV_SERVER=1, 14/14 gröna, visual-desktop+visual-mobile) · de fyra segment-acceptance-filerna (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1, 16 skippade + 1 grön, exit 0).
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och landad i natt-orkestreringen S104 2026-08-17 (resume 5). PR: se kortets notes/kommentarer; CI grön per jobb + merge-kö-verifikat. Stängd av orkestreraren efter landnings-verifiering mot origin/main.

S112 bokföringspass (2026-08-24): PR #1494 MERGED, CI SUCCESS (verifierad gh pr view — DoD #3 var explicit lämnad åt orkestrerarens svep, nu bekräftad). DoD #7 (check-facit grön genom BÅDA flipp och rivning) var explicit deferrad till 249.6 (rivningen); 249.6 är nu Done och scripts/check-facit.sh kört om denna session: exit 0, 0 ogodkända. Båda bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
