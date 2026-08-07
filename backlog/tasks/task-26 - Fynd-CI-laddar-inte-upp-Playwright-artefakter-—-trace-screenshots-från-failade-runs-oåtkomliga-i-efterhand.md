---
id: TASK-26
title: >-
  Fynd: CI laddar inte upp Playwright-artefakter — trace/screenshots från
  failade runs oåtkomliga i efterhand
status: To Do
assignee: []
created_date: '2026-07-22 07:12'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75, diagnos-agenten för 18.8-studsen (gh run download → 'no valid artifacts found'); försvårade diagnosen — assertion-diffar fanns i loggen men trace/screenshots saknades.

Förväntat: e2e-jobben laddar upp playwright-report/trace vid failure (actions/upload-artifact med if: failure(), retention kort). Registrerat per fynd-regeln.
<!-- SECTION:DESCRIPTION:END -->
