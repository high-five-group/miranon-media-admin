---
id: TASK-229.3
title: 'A2 Gren 1-fixen: prod-utrullning (efter staging-bevis)'
status: To Do
assignee: []
created_date: '2026-08-24 13:36'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-229
ordinal: 577000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Samma ändring som 229.1, utförd i PROD-basens A2 (app8uGPrVCVOm6LfD, wflRPMp5QNGEa7wH1) EFTER att staging-beviset (229.1 AC #4) står. Väg beror på 229.1 AC #2-mätningen: MCP-skrivbar → agent med Marcus GO per steg; annars Marcus i Airtable-UI enligt 229.1:s färdiga instruktion (T167 väg 1-formen). Verifiering efteråt: nästa namnlösa lead-anmälan (eller kontrollerad testpost) får Person-länk + touchpoint; de 61 laddade fällorna desarmerade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 229.1 AC #4 (ände-till-ände i staging) verifierad grön FÖRE varje prod-steg
- [ ] #2 Ändringen live i prod-A2, läst tillbaka ur deployad config
- [ ] #3 Skarpt bevis: namnlös person + anmälan ger länk + touchpoint i prod
- [ ] #4 data-model.md fälla 21 amenderad till STÄNGD med datum + bevis
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
