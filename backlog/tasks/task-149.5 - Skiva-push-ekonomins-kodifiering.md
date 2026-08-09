---
id: TASK-149.5
title: 'Skiva: push-ekonomins kodifiering'
status: Done
assignee: []
created_date: '2026-08-07 10:33'
updated_date: '2026-08-09 08:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-149.1
parent_task_id: TASK-149
ordinal: 259000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en utförare som undrar om något ska pushas nu eller vänta hittar svaret i landnings-dokumentationen med skälen, och Marcus verifieringsmoment pekas mot väntfria ytor. Täcker användarberättelser: 5, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: CONTRIBUTING § Landnings-ordningen + CLAUDE.md § Landning lästa; kompletteringen adderar utan duplicering/motsägelse
- [x] #2 Undantagslistan kodifierad i CONTRIBUTING: pushas direkt (nummerbärande artefakter, lifecycle-flippar, allt före paus/handoff, hub-bumps, säkerhetsfixar) vs väntar till färdig enhet (iterationsvarv, WIP inom skiva, utkast)
- [x] #3 Gransknings-regeln kodifierad: verifieringsmoment sker mot dev-server/staging, aldrig mot väntad landning; kort pekare i CLAUDE.md till CONTRIBUTING-avsnittet + ADR-097
- [x] #4 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #877 (merge 8f007d21), CI grön per jobb. Undantagslistan + gransknings-regeln i CONTRIBUTING; pekare i CLAUDE.md.

[TASK-169, backlog-städet, 2026-08-09] DoD #1+#3 bockade mot belägg. #1: AC redan [x]. #3: PR #877 (merge 8f007d21, 2026-08-07T11:54:58Z) — samtliga CI-jobb SUCCESS/SKIPPED (verifierat via gh pr view 877 --json statusCheckRollup).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
