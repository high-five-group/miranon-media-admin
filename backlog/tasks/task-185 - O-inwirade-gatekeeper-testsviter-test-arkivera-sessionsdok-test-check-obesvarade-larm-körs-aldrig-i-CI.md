---
id: TASK-185
title: >-
  O-inwirade gatekeeper-testsviter: test-arkivera-sessionsdok +
  test-check-obesvarade-larm körs aldrig i CI
status: To Do
assignee: []
created_date: '2026-08-10 11:43'
updated_date: '2026-08-26 04:10'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 351000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur S102-batchen (kort ⑧ + ⑨, oberoende av varandra): två testsviter finns på disk och passerar lokalt men är ALDRIG inwirade i ci.yml:s 'Test gatekeeper script suites'-block — (1) scripts/test-arkivera-sessionsdok.sh (byggd i TASK-158.2), (2) scripts/test-check-obesvarade-larm.sh (systersvit till nattvakts-familjen). Samma felklass som TASK-90:s facit-policy-fynd: en grind vars tester inte körs kan drifta tyst. Inwira båda + höj shellcheck-scope-räkningen om nya conf-filer berörs; verifiera mot blockets aktuella form (17 sviter efter #1100/#1106).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Båda sviterna inwirade i gatekeeper-blocket och gröna i CI-körning
- [x] #2 Svep: inga YTTERLIGARE test-*.sh i scripts/ som saknar inwirning (lista utfallet)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE INSTANSEN (2026-08-11, task-197-passet): scripts/test-check-pausade-sessioner.sh (nu 19 fall efter SIDA 5-utbyggnaden) körs inte heller av ci.yml:s 'Test gatekeeper script suites'-steg — samma klass som de två ursprungliga. Vid fix: svep HELA scripts/test-*-beståndet mot ci.yml-steget i stället för att lägga till en i taget.

SVEP-UTFALL (2026-08-26, premiss-pass): fullstandig inventering av scripts/test-*.sh|.mjs (62 filer pa origin/main) mot samtliga .github/workflows/*.yml (grep pa "(bash|node) scripts/test-"): 23 stod o-wirade, inte kortets 3 - kortet ar gammalt (2026-08-10/-11) och flera sviter tillkom senare (TASK-148.2/-149.3/-152/-160.2/-167/-173.1/-203/-312 m.fl.). 17 wirade i detta kort (samtliga korda lokalt gront FORE wiring): test-arkivera-sessionsdok.sh, test-check-obesvarade-larm.sh, test-check-pausade-sessioner.sh (kortets egna tre fynd), test-deny-arbetsform-push.sh, test-deny-facit-godkand-skrivning.sh, test-deny-frammande-huvudkatalog.sh, test-deny-grind-genom-pipe.sh, test-deny-hemlighet-utskrift.sh, test-deny-precompact.sh, test-deny-prod-ref.sh, test-deny-resend-send.sh, test-deny-subagent-vantan.sh, test-heartbeat-svep.sh, test-post-compact-igenkanning.sh, test-stada-grenar.sh, test-validera-review-utlatande.mjs, test-verify-ci-parity.mjs. 6 EJ rorda, deliberat exkluderade av tidigare kort (egen INTE-WIRAD/AVGRANSAD-BORT-medvetet-kommentar i filhuvudet, TASK-82/TASK-139-precedent): test-check-claims-tackning.sh, test-check-merge-tree.sh (grinden sjalv kors bara av ORKESTRATORN, aldrig CI), test-backfill-bilagor-dokumentklass.mjs, test-create-bilagor-table.mjs, test-create-eventinnehall-modell.mjs, test-create-kvitton-table.mjs (engangs-Airtable-skript, TASK-82-precedent). PR-lank: se Final Summary.
<!-- SECTION:NOTES:END -->
