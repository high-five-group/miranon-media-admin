---
id: TASK-22
title: >-
  Fynd: Tailwind v4 skannar docs/**.md — klass-formade literaler i markdown
  emitteras i produktions-CSS
status: To Do
assignee: []
created_date: '2026-07-21 23:25'
labels: []
dependencies: []
priority: medium
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batch v2.1, bygg-agenten task-17.3.

Symptom: spec-kodexempel i klass-form (t.ex. bg-(--mm-kurs-…)) i docs/ emitterades som skräp-utility i dist/assets/*.css; 17.3 läkte sin instans via omformulering men klassen är latent repo-bred (alla docs med klass-exempel).

Förväntat: dokumentation påverkar aldrig produktions-bundeln — kandidat: explicit @source-styrning i src/styles/tailwind.css så skanningen begränsas till src/.
<!-- SECTION:DESCRIPTION:END -->
