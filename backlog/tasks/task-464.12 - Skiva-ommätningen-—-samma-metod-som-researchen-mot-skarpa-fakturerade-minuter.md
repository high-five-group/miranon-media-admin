---
id: TASK-464.12
title: >-
  Skiva: ommätningen — samma metod som researchen, mot skarpa fakturerade
  minuter
status: To Do
assignee: []
created_date: '2026-09-19 10:50'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.4
  - TASK-464.5
  - TASK-464.6
  - TASK-464.7
  - TASK-464.8
  - TASK-464.9
  - TASK-464.10
parent_task_id: TASK-464
priority: medium
ordinal: 828000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
När S1, S2, S3, buntningsregeln och mätningen är inne och repot är privat: mät om med EXAKT researchens metod (docs/research/actions-minutbudget-2026-09-18.md § metod) och mot GitHubs skarpa fakturering (gh api /orgs/high-five-group/settings/billing/usage). Redovisa per yta och per klass, i BÅDA måtten, mot målen i ADR-133: under 50 000 min/mån vid augustis takt med utrymme till ca 1,3 x; dokument <= 5 min, kod <= 12/15 min. Skriv utfallet som ny research-fil och uppdatera ADR-133 § Updates med mätta tal i stället för härledda. Löser snubbeltråden ut (månadstakt över 40 000) eller är kö-fällningarna över ca 5 %: säg det rakt och peka på respektive parkerad fråga (byggmaskin / kodbuntning / etikett-utlöst full svit). Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 3, 5, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tabell per yta och klass: fakturerade min och väntan, härlett (Del 17) mot mätt, med n och fönster utskrivet
- [ ] #2 Skarpa faktureringstal ur GitHubs API citerade, med datum
- [ ] #3 ADR-133 § Updates bär de mätta talen; snubbeltrådarnas läge sagt i klartext
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
