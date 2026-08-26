---
id: TASK-20
title: >-
  Fynd: primitives.spec.ts doc-kommentar '6 primitiver' är stale — a11y-runnern
  täcker 9 komponenter
status: To Do
assignee: []
created_date: '2026-07-21 09:30'
updated_date: '2026-08-26 03:29'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batchen (run wf_dd115d9e-aca), bygg-agenten för task-17.1; registrerat av orkestratorn per fynd-regeln (K61.4, ADR-053: blockerar ej + värdefullt → defer).

Symptom: tests/a11y/primitives.spec.ts rad 4 säger 'A11y-runner mot samtliga 6 primitiver' — antalet är stale. Faktisk täckning vid fyndet: Button, Input, Select, TextArea, MessageBox, Modal/Dialog, NavCard, Skeleton + ToggleButtonGroup (9 st; driften fanns redan före NavCard/Skeleton-tilläggen).

Förväntat beteende: doc-kommentaren speglar aktuell täckning eller uttrycks antal-löst (t.ex. 'samtliga primitiver i sektionslistan'). Icke-blockerande, kosmetiskt — ingen kodbeteende-påverkan.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Uppdatering (S75-batch v2.1, 19.1-bygget): täckningen är nu 11 sektioner (NavCard, Skeleton, ToggleButtonGroup, SlideToConfirm tillkomna) — docblocken bör bli räknings-neutral.

FIXAT (TASK-20). Docblocken i tests/a11y/primitives.spec.ts skriven om till räknings-neutral form ('samtliga primitiver i sektionslistan nedan' + motivering) i stället för ett nytt hårdkodat tal — per notera-fältets egen rekommendation ('docblocken bör bli räknings-neutral'). 17 test()-block i filen idag (grep -c '^  test(' tests/a11y/primitives.spec.ts, 2026-08-26); antalet uttrycks medvetet INTE i kommentaren eftersom listan redan drivit stale två gånger (6 → 11 → 17).
<!-- SECTION:NOTES:END -->
