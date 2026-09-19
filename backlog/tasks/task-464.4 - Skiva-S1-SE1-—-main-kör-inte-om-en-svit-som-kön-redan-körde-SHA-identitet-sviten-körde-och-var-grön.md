---
id: TASK-464.4
title: >-
  Skiva: S1/SE1 — main kör inte om en svit som kön redan körde (SHA-identitet,
  'sviten körde och var grön')
status: To Do
assignee: []
created_date: '2026-09-19 10:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.3
parent_task_id: TASK-464
priority: high
ordinal: 820000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter en landning kör CI i dag hela sviten en gång till på main — på exakt det träd kön just testade (mätt: push-ytan 42 fakturerade min på #2556, körning 35432195228). Byt dedupens fråga i ci.yml från trädjämförelse till identitet på det landade SHA:t: har github.sha en grön merge_group-körning av ci.yml DÄR 'Test suite' FAKTISKT KÖRDE? FÄLLAN som måste hållas: villkoret får ALDRIG vara 'körningen är grön' — 68 % av kö-körningarna är gröna MED sviten hoppad; signalen är 'sviten körde och var grön', samma binära signal scripts/classify-post-merge.sh redan läser. Osäkerhet (API-fel, ingen körning hittad, flera körningar) ⇒ sviten KÖR (fail-closed). Ta INTE bort push-utlösaren. Förutsättningen N3 är landad (e6308887). Åker med i samma PR (TASK-471 notes): den falska kommentaren i ci.yml ~rad 1061 om CodeQL-stegets region, och det stale talet '9 av lint-jobbets steg' i scripts/verify-ci-parity.mjs ~rad 833. Full problembeskrivning: docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md § SE1. Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kontrastpar med run-ID: en kodlandning vars kö-körning KÖRDE sviten hoppar sviten på main; en landning vars kö-körning var grön MED sviten hoppad kör den på main
- [ ] #2 Fail-closed bevisat i gatekeeper-svit: API-fel, noll träffar och tvetydiga träffar ger 'sviten kör'
- [ ] #3 Aggregatorn ci-passed förblir fail-closed; check-aggregator-needs, check-listparitet och verify:ci-parity:fast gröna
- [ ] #4 De två textfynden ur TASK-471 notes är rättade och bockade där
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 PR-kroppen bär sektionen 'Kostnad i två mått': VÄNTETID och FAKTURERADE MINUTER sida vid sida, mätta körningar med run-ID, enheter utskrivna, månadseffekt vid 1 279 landningar
- [ ] #5 Inget nytt JOBB där ett steg i ett befintligt jobb räcker (varje jobb avrundas upp till hel minut, gånger ytorna)
<!-- DOD:END -->
