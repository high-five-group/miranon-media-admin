---
id: TASK-25
title: >-
  Fynd: globala *:focus-visible sätter border-radius 2px — klipper kapselradier
  app-brett vid tangentbordsfokus
status: To Do
assignee: []
created_date: '2026-07-21 23:26'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batch v2.1, bygg-agenten task-19.1.

Symptom: vid tangentbordsfokus tappar SlideToConfirm-rännan och alla rounded-full-ytor (t.ex. ToggleButtonGroup-pillerna) sin kapselradie — base.css *:focus-visible-regeln sätter border-radius: 2px hårt.

Förväntat: fokusringen följer elementets egen radie (border-radius: inherit eller radie-neutral ring-teknik). Berör MERGADE granskningsfärdiga ytor — flaggas till design-review-vågen.
<!-- SECTION:DESCRIPTION:END -->
