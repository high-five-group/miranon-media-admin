---
id: TASK-464.10
title: >-
  Marcus: privat-steget — betalmetod, licensköp, klicket, budgetvarning 40 000,
  verifiering samma dag
status: To Do
assignee: []
created_date: '2026-09-19 10:49'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-464
priority: high
ordinal: 826000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus eget handgrepp (beslut 7–8, S126 Del 17). Checklistan med kommandon står i sessionsdok S126 (paus 4, § Checklista: privat-steget) och bygger på docs/research/repo-privat-konsekvenser-2026-09-18.md § Förberedelselista. FÖRE: (1) kontrollera att organisationen har en registrerad betalmetod; (2) köp GitHub Code Security + GitHub Secret Protection (49 USD/mån, beslut 8) så CodeQL och push-skyddet INTE stängs av tyst; notera faktureringsmånadens startdag och om orgens övriga privata repon delar på de 50 000 minuterna. KLICKET: Settings → General → Danger Zone → Change repository visibility → Private. SAMMA DAG: (3) budgetvarning vid 40 000 min (varning, INTE stopp — ett stopp hade stängt CI mitt i månaden); (4) verifiera visibility PRIVATE, att secret_scanning/code_scanning står enabled, att en vanlig PR går genom kön, att nattens länkkontroll är grön, och läs Vercel-raden på nästa Dependabot-PR. Flaggat, ej utrett av agent: om exponeringen av deltagarnamn ska bedömas som personuppgiftsincident — Miranon Medias och Marcus punkt. Täcker användarberättelser: 1, 2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 gh repo view --json visibility visar PRIVATE
- [ ] #2 gh api repos/high-five-group/miranon-media-admin -q .security_and_analysis visar secret scanning och code scanning aktiva
- [ ] #3 Budgetvarningen vid 40 000 min finns (skärmdump eller API-svar i kortet)
- [ ] #4 En PR har gått genom merge-kön efter omställningen; nattens länkkontroll grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
