---
id: TASK-309.5
title: >-
  Skiva 4: Kvittot byter renderare — preview-receipt och send-receipt-email via
  mall-render, receipt-pdf rivs
status: To Do
assignee: []
created_date: '2026-08-23 14:19'
updated_date: '2026-08-23 17:53'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.4
parent_task_id: TASK-309
ordinal: 566000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kvittot kunden får vid betalning är den granskade HTML-mallen — inte längre det gamla pdf-lib-ritade — och förhandsgranskningen visar exakt det som skickas. Täcker användarberättelser: 16, 17, 32.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 preview-receipt och send-receipt-email renderar kvittot via renderaMallPdf('kvitto', …) med samma ifyllnadsdata som i dag (TASK-306:s fält inkl. Bokföringstext (kvitto)); receipt-pdf.ts och pdf-lib-beroendet rivna; receipt-content.ts:s filhuvud beskriver det faktiska kontraktet (Del 7:s ADR-083-fynd rättat)
- [x] #2 Staging-tester: förhandsgranskningen och det skickade kvittot är byte-identiska för samma indata; texten sökbar; typsnitt inbäddat; ingen pdf-lib-signatur i PDF:en
- [x] #3 Bilage-lagervakten och kvittots befintliga tester (innehåll, numrering) gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
