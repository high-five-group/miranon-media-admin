---
id: TASK-127.9
title: 'Skiva: Rundturs-e2e — inbjudan till inloggad, mot staging'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
  - TASK-127.5
  - TASK-127.6
parent_task_id: TASK-127
ordinal: 213000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ETT staging-e2e-flöde bevisar hela kedjan ände till ände: inbjudan utlöses via EF:en, mail-länken konsumeras, accept-sidan sätter lösenord, inloggning sker på nya login-vyn och en autentiserad vy nås. En rundtur — inte många. Testanvändaren skapas och rivs av flödet självt.

Täcker användarberättelser: 2, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rundturen grön i den autentiserade staging-e2e-skarven
- [ ] #2 Flödet skapar och river sin egen testanvändare — inga rester i staging
- [ ] #3 Marcus-förkraven (OTP-livslängd 24 h, SMTP kopplad, redirect-mål registrerade) dokumenterade och avbockade före körning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
