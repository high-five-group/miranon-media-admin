---
id: TASK-338.1
title: >-
  Skiva: staging-schemat och migreringen — Räckvidd 'Gemensam', Plats-länk,
  Platsnamn-lookup
status: To Do
assignee: []
created_date: '2026-08-29 08:03'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-338
ordinal: 611000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan bär STAGING-basen (apphjj8Q7lkXCMsL4 — prod app8uGPrVCVOm6LfD är FÖRBJUDEN i denna skiva) den nya lagringsformen: Bilagor.Räckvidd har en fjärde option 'Gemensam'; Bilagor har en ny länk 'Plats' → Platser (tbl7ER0wNqAZ9ZhEq) och ett lookup-fält 'Platsnamn' (Platser.Namn); varje befintlig staging-rad med Räckvidd 'Kurstyp' eller 'Alla event' är migrerad till 'Gemensam' med Kursfamilj/Kursnivå bevarade, räkneverifierat före och efter med filterByFormula (samma form som TASK-275:s migrering, data-model.md § Bilagor). De permanenta rollup-fixturerna och .purge-staging-policy.json rörs inte; nya fält behöver ingen purge-target (verifiera och bokför). data-model.md § Bilagor får fält-ID:n för staging med prod-kolumnen markerad 'väntar TASK-338.6'. Airtable-operationer via PAT-MCP:n (mcp__airtable__*) mot staging med bas-guard i varje anrop. Täcker användarberättelser: 13, 14 (staging-halvan).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging: option 'Gemensam' finns på Bilagor.Räckvidd; länkfältet Plats (→ Platser) och lookup Platsnamn finns; fält-ID:n bokförda i data-model.md § Bilagor
- [ ] #2 Staging: 0 rader med Räckvidd 'Kurstyp' eller 'Alla event' kvar; antal 'Gemensam' = summan före migreringen; Kursfamilj/Kursnivå oförändrade på migrerade rader — talen före/efter i Implementation Notes
- [ ] #3 Prod-basen bevisligen orörd (ingen prod-ref i något anrop; bas-ID kontrollerat i varje MCP-anrop och bokfört)
- [ ] #4 Befintliga staging-sviter (get-event-attachments, upload-attachment, delete-attachment) körda efter migreringen — utfall bokfört; gamla EF:en läser fortfarande de migrerade raderna tills TASK-338.2 landar (rött här är väntat och bokförs, inte döljs)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->
