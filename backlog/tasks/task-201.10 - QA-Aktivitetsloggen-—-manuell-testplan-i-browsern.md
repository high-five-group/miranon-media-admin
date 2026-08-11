---
id: TASK-201.10
title: 'QA: Aktivitetsloggen — manuell testplan i browsern'
status: To Do
assignee: []
created_date: '2026-08-11 20:28'
labels:
  - ready-for-human
dependencies:
  - TASK-201.1
  - TASK-201.2
  - TASK-201.3
  - TASK-201.4
  - TASK-201.5
  - TASK-201.6
  - TASK-201.7
  - TASK-201.8
  - TASK-201.9
parent_task_id: TASK-201
ordinal: 375000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, i browsern — staging först, prod efter 201.9):

1. FACIT-JÄMFÖRELSEN: hem-vyn ≥xl sida vid sida med k10-facit-desktop.png — spalten identisk (position, bottenlinjering mot anmälningskortet, postform, länken). Vid godkänt: stämpla via npm run facit:godkann (ADR-104; ev. undantag per yta) — det bockar 201.7:s facit-DoD.
2. HÄNDELSETÄCKNINGEN: utför en åtgärd av varje typ (betalning, bekräftelse, ny anmälan, boende, varje mail-typ, kvitto, event-ändring, flagga, event- och personanteckning) — varje ger en post med rätt aktör, svensk sammanfattning och tid; antecknings-poster visar ALDRIG innehållet.
3. HISTORIKVYN: tidsgrupperingen (Idag/Igår/datum), post-klick till person respektive event, tomläget (töm filtren mot ett event utan poster).
4. FILTERRADEN: kategori + event + tidsperiod var för sig och i kombination; "inga träffar"-tomläget; tangentbordsväg genom alla kontroller.
5. MOBILVÄGEN: mobil/platta — ingen spalt på hem-vyn; Mer bär posten Aktivitetshistorik; vyn fungerar i 390 px.
6. FLERANVÄNDARE: gör en åtgärd som Roger-kontot — posten syns med Roger som aktör hos Lotta.
7. A11Y-STICKPROV: VoiceOver över spalten (aria-label-namnet läses) och filterraden.
8. DEVTOOLS: en post korrelerar mot EF-loggen via requestId (byggplanens DoD 3–4).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
