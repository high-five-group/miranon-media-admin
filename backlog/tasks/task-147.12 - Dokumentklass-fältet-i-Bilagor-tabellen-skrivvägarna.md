---
id: TASK-147.12
title: Dokumentklass-fältet i Bilagor-tabellen + skrivvägarna
status: To Do
assignee: []
created_date: '2026-08-16 08:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-147
ordinal: 441000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur task-147.6:s fynd 1 (2026-08-16, Marcus-GO 'byggas idag', ADR-063: resolution I BASEN): Bilagor-tabellen bär inget dokumentklass-fält — klass A (uppladdad) och B (event-mallat genererad) kan inte särskiljas. Bygg: single-select-fält i STAGING-basen först (namn/optioner designas mot PRD 147:s klassdefinitioner + data-model.md-konventioner), skrivvägarna sätter klassen (upload-vägen → A; generate-event-attachment-EF:n → B), backfill av befintliga rader där klassen är härledbar, Dokument-ytans filter/grupper läser fältet. data-model.md uppdateras (fält-ID, skrivbarhet). Prod-fältet skapas EFTER staging-bevis, bokförs för dagens prod-moment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fältet finns i staging-basen med designade optioner; data-model.md uppdaterad med fält-ID + skrivbarhet
- [ ] #2 Båda skrivvägarna sätter klassen; staging-bevisat (ny uppladdning → A, ny generering → B)
- [ ] #3 Backfill av befintliga staging-rader där klassen är härledbar; icke-härledbara lämnas tomma och bokförs
- [ ] #4 Dokument-ytan läser fältet (filter/grupper mot verklig klass, inte gissning)
- [ ] #5 Prod-steget (fält + backfill) bokfört som klicklista/MCP-steg för dagens prod-moment
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
