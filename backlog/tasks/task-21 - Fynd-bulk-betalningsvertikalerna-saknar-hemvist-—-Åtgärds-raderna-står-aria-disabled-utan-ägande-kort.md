---
id: TASK-21
title: >-
  Fynd: bulk-betalningsvertikalerna saknar hemvist — Åtgärds-raderna står
  aria-disabled utan ägande kort
status: To Do
assignee: []
created_date: '2026-07-21 23:25'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batch v2.1, bygg-agenten task-18.8 (run wf_7a56889c-9eb); registrerat av orkestratorn per fynd-regeln.

Symptom: Åtgärds-gruppens rader 'Skicka betalningspåminnelse till obetalda' och 'Markera alla obetalda som betalda' (Atgarder.tsx) står aria-disabled sedan 18.3; 18.3-noten pekade dem mot 18.8 men 18.8:s spec/AC täcker dem inte (bulk kräver kontrollfråga + pessimistisk form per TASK-18 PRD beslut 20).

Förväntat: eget kort/skiva för bulk-betalningsvertikalerna eller explicit Marcus-hemvist-beslut. Jämför: bekräftelse-bulken har instruktion mot 18.6-utföraren.
<!-- SECTION:DESCRIPTION:END -->
