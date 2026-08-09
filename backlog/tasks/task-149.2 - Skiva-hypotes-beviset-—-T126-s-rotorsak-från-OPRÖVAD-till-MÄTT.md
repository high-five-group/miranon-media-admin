---
id: TASK-149.2
title: 'Skiva: hypotes-beviset — T126:s rotorsak från OPRÖVAD till MÄTT'
status: Done
assignee: []
created_date: '2026-08-07 10:28'
updated_date: '2026-08-09 08:00'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-149
ordinal: 256000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: T126:s rotorsak är belagd eller falsifierad mot faktiska artefakter — mekanismen i systerskivan vilar därmed på mätt grund, inte rimlig gissning. Täcker användarberättelse: 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Resume-vägens skill-laddning prövad mot artefakter: session-resume-skillens faktiska text + S93-sessionsdokets förlopp + prototype-skillens trigger-description — belägg för VARFÖR laddningen uteblev, inte bara ATT den uteblev
- [x] #2 Generaliseringen prövad: minst två andra arbetsform-regler i skills kontrollerade för samma leveransgap (startdörrs-bundenhet)
- [x] #3 T126-kortet uppdaterat via backlog-CLI: rotorsaken omklassad HYPOTES → MÄTT med belägg, eller öppet falsifierad med vad som faktiskt gäller
- [x] #4 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #865 (merge 98a92eef), CI grön per jobb. T126 rotorsak MÄTT.

[TASK-169, backlog-städet, 2026-08-09] DoD #1-3 bockade mot belägg. #1: AC redan [x]. #2: PR #865 — npm run check:docs 13/13 gröna, exit 0. #3: PR #865 (merge 98a92eef, gh pr view 865), samtliga jobb SUCCESS (Test suite korrekt SKIPPED på docs-only-diff).

[TASK-169, backlog-städet, 2026-08-09] DoD #4 bockad — batch C-agentens research missade denna ruta (rapporterade endast #1-3 obockade); egen verifiering: PR #865 (merge 98a92eef) diff = task-149.2s egen kortfil + tasks/threads/T126-arbetsformens-leveransvag.md (AC #3 kräver explicit uppdatering av T126-kortet) — inga orelaterade filer.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
