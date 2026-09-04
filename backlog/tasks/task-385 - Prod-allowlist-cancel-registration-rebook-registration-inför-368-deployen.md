---
id: TASK-385
title: 'Prod-allowlist: cancel-registration + rebook-registration inför 368-deployen'
status: Done
assignee: []
created_date: '2026-09-04 07:54'
updated_date: '2026-09-04 08:02'
labels:
  - ready-for-agent
dependencies: []
ordinal: 686000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 båda EF:erna står i .prod-functions-allowlist.conf, testsviten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Lade till cancel-registration + rebook-registration i .prod-functions-allowlist.conf (kommentarblock i filens etablerade konvention, källmärkt TASK-368.2/PR #2236 + TASK-368.4/PR #2247 + S115-raden om medveten avsikt + orkestrerar-mandatet 2026-09-04). scripts/test-deploy-prod-functions.sh: 10/10 PASS, exit 0 — oförändrad, ingen ny fixtur behövdes. bash scripts/deploy-prod-functions.sh --list bekräftar båda som [prod] i deploy-setet. DoD: typecheck exit 0, biome check exit 0 (0 fel, 14 varningar/82 infos orört av denna diff), build exit 0. test:api: 2187 passed / 5 failed — samtliga 5 fallerande tester rör send-registration-confirmation/update-record/generate-event-attachment/save-event-content, INGET rör de två EF:erna eller allowlist-filen; login/preflight gick igenom (JWT satt), inte TASK-77-klassen. Prod OPÅVERKAD: raden gör funktionerna deploybara, inte deployade — faktisk deploy sker separat av Marcus (fas4-prod-deploy.sh --deploya) efter hans QA (TASK-368.6, To Do). PR: #2285 (draft, https://github.com/high-five-group/miranon-media-admin/pull/2285).
<!-- SECTION:FINAL_SUMMARY:END -->
