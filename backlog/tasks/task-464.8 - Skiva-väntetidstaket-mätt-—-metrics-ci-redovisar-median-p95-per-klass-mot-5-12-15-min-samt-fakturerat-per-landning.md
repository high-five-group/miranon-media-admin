---
id: TASK-464.8
title: >-
  Skiva: väntetidstaket mätt — metrics:ci redovisar median/p95 per klass mot
  5/12/15 min samt fakturerat per landning
status: To Do
assignee: []
created_date: '2026-09-19 10:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.5
parent_task_id: TASK-464
priority: medium
ordinal: 824000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Väntetidstaket (dokument <= 5 min; kod <= 12 min median, <= 15 min p95) är bara ett mål om det mäts. Utöka npm run metrics:ci (och nattens jobb 'CI-mätning') så att den per klass (dokument/kod) redovisar: väggtid per runda (förslag, kö), tid från armering till main, och FAKTURERADE minuter per landning summerat över ytorna (varje jobb avrundat upp till hel minut, hoppade jobb noll — samma metod som docs/research/actions-minutbudget-2026-09-18.md § metod). Bryts ett tak två veckor i rad ska det synas som ett bokföringsärende (nattens bokföringskanal, TASK-450.1) — ingen ny larmkanal. Värdena (taken, fönstret) bor i en policy-fil, inte i skriptet. Mätmetoden som användes för hand 2026-09-19 står i sessionsdok S126 Del 15 (mätning per PR: pull_request-, merge_group- och push-körningarnas jobb). Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 3, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 metrics:ci skriver ut median och p95 för väntan per klass, och fakturerade minuter per landning per klass, med n utskrivet
- [ ] #2 Taken bor i en policy-fil; ett konstruerat brott i gatekeeper-sviten ger utslag, ett värde under taket ger tyst
- [ ] #3 Ett två-veckors-brott hamnar i bokföringskanalens stående ärende, inte i produktlarmet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Inget nytt JOBB där ett steg i ett befintligt jobb räcker (varje jobb avrundas upp till hel minut, gånger ytorna)
<!-- DOD:END -->
