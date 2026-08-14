---
id: TASK-214.6
title: 'Skiva: Marcus QA + godkännandet av den promoverade ytan'
status: To Do
assignee: []
created_date: '2026-08-14 19:19'
labels:
  - ready-for-human
dependencies:
  - TASK-214.5
parent_task_id: TASK-214
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
B2 steg 2–3: Marcus granskar den promoverade ytan — facit-bilderna är regressionsstöd, inte spec (rollbytet per ADR-103). Kvittensfönstret syns inte i stillbild och upplevs live. Granskningen sker mot dev-servern med staging-fixturens event. Först efter godkännandet får rivningsskivan köra. Täcker användarberättelser: 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har granskat den promoverade dörrlistan mot facit-bilderna (mobil 390x844 + desktop 1280x800) och upplevt kvittensfönstret live mot dev-servern
- [ ] #2 Marcus godkännande bokfört i klartext (ADR-103 B2 steg 3) — ändringsönskemål hanteras som ny iteration, aldrig tyst justering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->
