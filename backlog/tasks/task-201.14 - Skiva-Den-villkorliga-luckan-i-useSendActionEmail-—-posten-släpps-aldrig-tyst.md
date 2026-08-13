---
id: TASK-201.14
title: 'Skiva: Den villkorliga luckan i useSendActionEmail — posten släpps aldrig tyst'
status: To Do
assignee: []
created_date: '2026-08-13 19:26'
updated_date: '2026-08-13 19:28'
labels: []
dependencies: []
parent_task_id: TASK-201
ordinal: 384000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
useSendActionEmail (src/data/mutations/actionEmail.ts) gjorde 'if (!reg) continue' när uppslaget mot mottagare-listan missade, och SLÄPPTE då aktivitetsposten tyst — ett mail som faktiskt lämnade systemet fick inget spår i historiken. Till skillnad från useConfirmAll/useLogPaymentReminder (död kod) är detta LEVANDE kod på Åtgärds-sidan, dagens bulk-bekräftelseväg. Marcus order 2026-08-13: inte en enda lucka. Fallbacken följer TASK-201.13s precedent i useConfirmAll ordagrant.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Luckan stängd: aktivitetsposten skrivs för VARJE id i result.completed, även när uppslaget mot mottagare-listan missar
- [ ] #2 Fallbacken följer TASK-201.13s useConfirmAll-precedent ordagrant (namn 'Okänd anmälan'), ingen andra form i samma fil-familj
- [ ] #3 Person-ID-kopplingens öde öppet redovisat i kod: går förlorad när raden saknas, nyckeln utelämnas hellre än gissas
- [ ] #4 continue-frågan prövad mot EF-kontraktet och besvarad i kod: inget läge i completed saknar handling
- [ ] #5 Tvåsidigt bevis genom den RIKTIGA hooken: post skapas vid cache-miss, INGEN post när mutationen faller — plus fällningsbevis att testet fäller om luckan återinförs
- [ ] #6 Fire-and-forget-kontraktet orört: ingen loggning kan fälla mutationen; ingen fritext i statementet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
