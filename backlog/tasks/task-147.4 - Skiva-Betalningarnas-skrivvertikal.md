---
id: TASK-147.4
title: 'Skiva: Betalningarnas skrivvertikal'
status: To Do
assignee: []
created_date: '2026-08-10 07:00'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-147
priority: high
ordinal: 341000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Betalningsblocket på åtgärdssidan görs verkligt: avprickning av anmälningsavgift (befintlig operation mark-registration-fee-paid), NY operation för slutbetalning, ångra felaktig avprickning, och betalningsnotering. Två vakter ur PRD:t: basens takt tål inte obegränsad parallellitet vid batch-avprickning, och statusvärdet 'Ej relevant' får aldrig skrivas över av ett urval (föreläsnings-semantiken). Varje ny operation registreras i field-allowlists.ts + deny/allow-test per byggplanens per-sub-fas-krav. Ärver E2E-skulden från TASK-145.3: avprickningens E2E-täckning återupprättas på åtgärdssidan — skarven flyttar hit, skrivs inte om från noll.

Täcker användarberättelser: 15, 16, 17, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Avprickning av båda betalningstyperna + ångra + notering skriver verkligt via adapter-vägen; operationerna i field-allowlists.ts med deny/allow-test grönt
- [ ] #2 Taktvakten: batch-avprickning begränsad parallellitet; Ej relevant-vakten: värdet skrivs aldrig över av urval
- [ ] #3 Avprickningens E2E-täckning återupprättad på åtgärdssidan (ärvd staging-skarv)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Avprickningens E2E-täckning återupprättad (PRD DoD 11-arv)
<!-- DOD:END -->
