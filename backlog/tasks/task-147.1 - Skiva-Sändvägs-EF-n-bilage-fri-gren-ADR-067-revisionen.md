---
id: TASK-147.1
title: 'Skiva: Sändvägs-EF:n bilage-fri gren + ADR-067-revisionen'
status: To Do
assignee: []
created_date: '2026-08-10 06:58'
updated_date: '2026-08-10 07:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-147
priority: high
ordinal: 338000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Server-fundamentet för åtgärdssidans utskick: EF-operation för åtgärdsutskick (bekräftelse/påminnelse/eventinfo/fritt) via den befintliga batch-mekanikens kontrakt — idempotens-, samtyckes- och spärrlist-mönstren ärvda ur segment-sändvertikalen (verifiera mot supabase/functions/send-email, ADR-086). Svaret redovisar ärligt delutfall per mottagare — partiellt fel rapporteras aldrig som helt lyckat. Stämpeln 'skickad' sätts server-side av den som vet att sändningen skedde. ADR-067 revideras i samma skiva: sändvägen grenas i två (bilage-fri batch + bilage-bärande loopad singelsändning), den tysta bilage-bristen som skäl, båda avvisade alternativen bokförda (task-147 § Implementationsbeslut).

Täcker användarberättelser: 10, 13, 27 (serversidan).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 EF-operationen tar åtgärdstyp + mottagarurval + redigerad ämnesrad/brödtext och sänder via bilage-fria batchgrenen; per-mottagare-utfall i svaret
- [ ] #2 Idempotens bevisad genom omkörning: samma körning två gånger ger ett mail, inte två
- [ ] #3 Delutfall testat som delutfall: scenario där några mottagare faller ger svar som säger just det
- [ ] #4 ADR-067-revisionen mintad med gren-arkitekturen + tyst-bilage-brist-skälet + avvisade alternativ
- [ ] #5 ADR-067-revisionen rymmer uttryckligen test-sändvägen (enkel-mottagare till inloggad användare, T53 väg C) som del av det nya kontraktet
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Delutfallet prövat som delutfall: partiellt fel rapporteras aldrig som helt lyckat (PRD DoD 7-arv)
<!-- DOD:END -->
