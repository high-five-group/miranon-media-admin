---
id: TASK-27
title: >-
  Fynd: tidszons-klassen i e2e-sviten — Node-new Date() mot browser-renderat
  datum fallerar 22:00–00:00 UTC
status: To Do
assignee: []
created_date: '2026-07-22 07:12'
labels: []
dependencies: []
priority: high
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75, diagnos-agenten för 18.8-studsen. Mekanism bevisad: testets Node-process räknar datum i UTC (CI) medan browser-kontexten är låst till Europe/Stockholm — varje assert som jämför Node-datum med browser-renderat datum är exponerad i fönstret 22:00–00:00 UTC (sommartid), exakt när nattliga runs sker. 18.8:s två instanser fixas i skivan; klassen är SUITE-BRED.

Förväntat: grep-svep över tests/e2e/** + gemensam Stockholm-förankrad datum-hjälpare för testens referensklocka. Snabbsignatur ur diagnosen: TZ-fel är stabila över CI-retries (identiska diffar), race-fel växlar mönster.
<!-- SECTION:DESCRIPTION:END -->
