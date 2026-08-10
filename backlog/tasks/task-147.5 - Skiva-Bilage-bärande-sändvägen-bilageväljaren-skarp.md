---
id: TASK-147.5
title: 'Skiva: Bilage-bärande sändvägen + bilageväljaren skarp'
status: To Do
assignee: []
created_date: '2026-08-10 07:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.1
  - TASK-146.4
  - TASK-146.5
parent_task_id: TASK-147
priority: high
ordinal: 342000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den andra sändgrenen: loopad singelsändning med deterministisk idempotensnyckel per mottagare — omkörning av en delvis fallen körning dubblerar aldrig. Bilageväljaren kopplas från stubb till verkligt fundament (146.4 adapter/uppladdning + 146.5 event-mallad generering): klass A (uppladdad) och klass B (event-mallad) sändbara. Ingen förvals-logik — beteendet lever redan i koden och bevaras. Kortets viktigaste testbeslut: bilagan bevisas FRAMME hos mottagaren ände-till-ände, inte via kontraktstest — det var så den tysta batch-bristen kunde vara tyst (PRD § Implementationsbeslut + AtgardsSida.tsx BILAGOR-docblocken: klass C ger grenen samma svar).

Täcker användarberättelser: 7, 8, 25.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utskick med vald bilaga går via singelloop-grenen; utskick utan bilaga fortsatt via batchgrenen — grenvalet automatiskt
- [ ] #2 Bilagan bevisad FRAMME i mottaget mail ände-till-ände (staging/testmottagare)
- [ ] #3 Idempotensnyckeln deterministisk per mottagare: omkörning dubblerar ingen
- [ ] #4 Ingen bilaga förvald (grillad samsyn beslut 5 — bevarat beteende, verifierat)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Bilagan bevisad ände-till-ände FRAMME hos mottagaren (PRD DoD 5-arv)
<!-- DOD:END -->
