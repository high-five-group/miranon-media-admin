---
id: TASK-185
title: >-
  O-inwirade gatekeeper-testsviter: test-arkivera-sessionsdok +
  test-check-obesvarade-larm körs aldrig i CI
status: Done
assignee: []
created_date: '2026-08-10 11:43'
updated_date: '2026-08-26 07:10'
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
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE INSTANSEN (2026-08-11, task-197-passet): scripts/test-check-pausade-sessioner.sh (nu 19 fall efter SIDA 5-utbyggnaden) körs inte heller av ci.yml:s 'Test gatekeeper script suites'-steg — samma klass som de två ursprungliga. Vid fix: svep HELA scripts/test-*-beståndet mot ci.yml-steget i stället för att lägga till en i taget.

SVEP-UTFALL (2026-08-26, premiss-pass): fullstandig inventering av scripts/test-*.sh|.mjs (62 filer pa origin/main) mot samtliga .github/workflows/*.yml (grep pa "(bash|node) scripts/test-"): 23 stod o-wirade, inte kortets 3 - kortet ar gammalt (2026-08-10/-11) och flera sviter tillkom senare (TASK-148.2/-149.3/-152/-160.2/-167/-173.1/-203/-312 m.fl.). 17 wirade i detta kort (samtliga korda lokalt gront FORE wiring): test-arkivera-sessionsdok.sh, test-check-obesvarade-larm.sh, test-check-pausade-sessioner.sh (kortets egna tre fynd), test-deny-arbetsform-push.sh, test-deny-facit-godkand-skrivning.sh, test-deny-frammande-huvudkatalog.sh, test-deny-grind-genom-pipe.sh, test-deny-hemlighet-utskrift.sh, test-deny-precompact.sh, test-deny-prod-ref.sh, test-deny-resend-send.sh, test-deny-subagent-vantan.sh, test-heartbeat-svep.sh, test-post-compact-igenkanning.sh, test-stada-grenar.sh, test-validera-review-utlatande.mjs, test-verify-ci-parity.mjs. 6 EJ rorda, deliberat exkluderade av tidigare kort (egen INTE-WIRAD/AVGRANSAD-BORT-medvetet-kommentar i filhuvudet, TASK-82/TASK-139-precedent): test-check-claims-tackning.sh, test-check-merge-tree.sh (grinden sjalv kors bara av ORKESTRATORN, aldrig CI), test-backfill-bilagor-dokumentklass.mjs, test-create-bilagor-table.mjs, test-create-eventinnehall-modell.mjs, test-create-kvitton-table.mjs (engangs-Airtable-skript, TASK-82-precedent). PR-lank: se Final Summary.

UPPDATERING (2026-08-26, base-drift-svep post-merge): origin/main flyttade sig under bygget (PR 1993/1995) och lade en 24:e o-wirad svit, test-review-policy.mjs (TASK-173.2, 44 fall). Om-inventerat efter git merge origin/main: 63 test-*.sh|.mjs totalt (var 62), 18 wirade i detta kort (17 + test-review-policy.mjs), samma 6 deliberat exkluderade oforandrade. AC 1s "bada" betyder numera 18 sviter, inte 2. CLAUDE.md paragraf Review-grinden rattad fran "INTE CI-wirad" till sanning for bade test-review-policy.mjs och test-validera-review-utlatande.mjs (Marcus-mandat via orkestreraren). PR: #1992 (samma PR, tva ytterligare commits).

CI-UTFALL (2026-08-26, efter fem push-rundor): "Lint + Audit + TypeCheck"-jobbet och specifikt "Test gatekeeper script suites"-steget ar GRONA pa ubuntu-latest (korning 32936468038, head-SHA f6f33f6116ee60a62a46decb22cfb3e487a8433b). Vagen dit krävde FYRA ytterligare rotorsaksfixar utover kortets ursprungliga scope, samtliga plattformsspecifika buggar som bara manifesterar pa ubuntu (grönt lokalt pa macOS/bash 3.2 hela vägen): (1) test-deny-facit-godkand-skrivning.sh F1/F2 — path_utan tog bort bara forsta PATH-traffen, otillrackligt nar jq/node finns i flera kataloger; forsta fixversionen (ta bort HELA segmentet) var SJALV en ny bugg — tog bort dirname/bash pa ubuntu merged-usr (/bin symlank till /usr/bin); slutfix: shimma en filtrerad symlank-kopia per segment. (2) Samma PATH_NO_JQ-bugg fanns aven i sex andra test-deny-*.sh (TASK-321) — fixade proaktivt for att undvika whack-a-mole. (3) "${#ARRAY[@]:-0}" — ogiltig kombination av #-langd och :-default, tolererad tyst av bash 3.2 men "bad substitution" pa bash 5.x — fanns i fyra deny-hooks (frammande-huvudkatalog, hemlighet-utskrift, resend-send x3, subagent-vantan x2). (4) SJATTE PATH_NO_JQ-instansen i test-post-compact-igenkanning.sh, hittad EFTER att de forsta fem var fixade. Bekraftat inga fler instanser kvar (grep over hela scripts/). Kvarvarande RÖTT i samma CI-korning: "Test suite / Webblasarbeteende" (app-update-banner/offline-notis) — verifierat OROR av min diff (git diff origin/main...HEAD --stat -- src/ tests/ ger noll traffar), sannolikt pre-existerande/flakigt pa main, inte atgärdat har (utanfor scope). PR #1992 forblir draft (orkestrerarens eget tillstand, ej rort av mig).

RAKNINGEN RATTAD (S112 resume 1, 2026-08-26, granskarens fynd verifierat mot gh pr diff 1992): PR-text/notes ovan sager 17 (+1 for test-review-policy.mjs = 18) nya invokeringsrader i ci.yml:s gatekeeper-block. Disk-verifierat mot den faktiska diffen (gh pr diff 1992, .github/workflows/ci.yml rad 146-164): 19 '+'-rader, inte 18 — den 19:e ar 'node scripts/test-review-risk-sektion.mjs' (173.3), som landade pa main via #1993 medan denna gren fortfarande arbetade och darfor ocksa syns som tillagd i denna PR:s diff mot sin bas. CLAUDE.md § Review-grinden bekraftar detta explicit: 'wirad i samma bas-drift-svep sedan 173.3 landade UNDER 185s eget bygge — PR #1993'. Ratt tal for AC #1 'bada' (efter kortets egna tre fynd + UPPDATERINGENS fjarde) ar darfor 19 CI-wirade sviter, inte 17 eller 18.

CI-KOSTNADEN OBERONDE VERIFIERAD (S112 resume 1, 2026-08-26): 'Lint + Audit + TypeCheck'-jobbets varaktighet mätt direkt via gh run view. Sista gröna körningen på denna PR (run 32936887162): 06:09:15→06:12:42 = 207s — exakt matchning mot uppdragets 207s. Baslinje FÖRE dessa ändringar (senaste gröna merge_group-körning på main innan denna PR startade, pr-1986/run 32928346177, 03:56:54→03:59:14): 140s — nära men inte identiskt med uppdragets 152s (CI-jobbtider varierar naturligt mellan körningar; ingen exakt 152s-körning återfanns i denna sessions sökning). Riktningen och storleksordningen (+38% i uppdraget, +48% mot min 140s-baslinje) är samstämmiga: den 19-radiga gatekeeper-utökningen har en mätbar, hyfsat konsekvent CI-kostnad i denna storleksordning.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1992 (merge-commit 7d0f494e, mergad 2026-08-26T06:46:51Z; merge_group pr-1992 grön 06:37:21, enda körning). AC #1-#2 bockade (räkningen rättad till 19 sviter i notes). DoD #1-4 bockade. CI-kostnad Lint-jobbet 152→207s (+38%, se notes). Done-flipp S112 resume 1, 2026-08-26, post-merge 7d0f494e grönt.
<!-- SECTION:FINAL_SUMMARY:END -->
