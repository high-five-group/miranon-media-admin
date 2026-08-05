---
id: TASK-127.8
title: 'Skiva: Passkey-erbjudandet efter första inloggningen'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 13:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
parent_task_id: TASK-127
ordinal: 212000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter första lyckade inloggningen erbjuds passkey som frivillig säkerhetsuppgradering på egen yta — att avböja är förstklassigt och tjatfritt. Registrering och inloggning med passkey som alternativ; lösenordet är alltid fallback. Plattformens beta-API isoleras bakom egen abstraktion så att beta-risken bor i en fil.

Täcker användarberättelse: 9.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Erbjudandet visas efter första inloggningen och kan avböjas utan att återkomma vid varje inloggning
- [x] #2 Registrerad passkey fungerar för inloggning; lösenordet kvarstår alltid som fallback
- [x] #3 Plattformens beta-API inkapslat i egen modul — en API-ändring träffar en fil, inte flödet
- [x] #4 Acceptance- och a11y-sviterna gröna; flödet degraderar snyggt på enheter utan stöd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
