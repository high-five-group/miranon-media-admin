---
id: TASK-201.2
title: 'Skiva: Grunden 2 — activity_log född i staging med RLS-bevis'
status: To Do
assignee: []
created_date: '2026-08-11 20:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.1
parent_task_id: TASK-201
ordinal: 367000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: migrationsfilen från 201.1 appliceras mot staging-projektet och tabellens existens + RLS-skydd BEVISAS mot den levande miljön. KÄND RISK, öppet bokförd: agentens db-access till staging är OMÄTT (EF-deploy-access finns belagd, db push kan kräva mer). Saknas access: STOPPA per stopp-grinden, minta fynd-kort med exakt felutskrift, föreslå ingen kringgående väg — appliceringen blir då ett Marcus-moment och denna skiva HITL-omklassas.

Täcker användarberättelser: 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migrationen applicerad mot staging-Supabase — tabellen verifierad via query mot miljön, inte antagen ur exit 0
- [ ] #2 RLS-bevis: läsning som anon och authenticated direkt mot tabellen NEKAS; write via service-role går igenom (deny-triple-andan)
- [ ] #3 Appliceringsvägen dokumenterad (kommandon + förutsättningar) i migrationskatalogens README-not — task-199-klassen: en odokumenterad deploy-väg är en känd fälla
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
<!-- DOD:END -->
