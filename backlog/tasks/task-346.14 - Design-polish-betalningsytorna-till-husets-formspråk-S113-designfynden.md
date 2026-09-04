---
id: TASK-346.14
title: 'Design-polish: betalningsytorna till husets formspråk (S113-designfynden)'
status: Done
assignee: []
created_date: '2026-08-31 10:49'
updated_date: '2026-09-04 08:24'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-346
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus dom under S113-slutvandringen: grundformen ok men ytorna är utkast/kladd. Spec: tasks/sessions/bilagor/s113-natt-slutvandring/designfynd-2026-08-31.md (fynd 1a-6 + språkfynden) med jämförelseskärmdumpar i samma katalog. Ribban: nya ytorna precis lika rena och snygga (eller bättre) som appen i övrigt. Endast komposition/hierarki/kongruens — flödeslogik, härledningar, EF-vägar och facit-semantik röres ej. AMENDERING-sidofiler uppdateras för facit-ytor. Ordvalet kvitton-att-skicka/i-kö är öppen Marcus-fråga — inget nytt ordval.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga fynd-punkter 1a-1d, 2a-2d, 3a-3d, 4a-4c, 5, 6 i designfynd-doket åtgärdade eller öppet bokförda med skäl
- [x] #2 Språkfynden fixade (kongruens N=1); ordvals-strängarna orörda utöver kongruens
- [x] #3 Inga hårdkodade färger/avstånd — allt via tokens; a11y-strukturer, prefers-contrast/reduced-motion/print består
- [x] #4 AMENDERING-sidofiler uppdaterade för varje ändrad facit-yta
- [x] #5 Egen sida-vid-sida-bedömning i PR-kroppen per yta mot facit-skärmdumparna
- [x] #6 Orkestrerarens visuella slutdom (1440x900 + 375x812 + prefers-contrast/reduced-motion) godkänd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nattgrind-stangning 2026-09-04: DoD bockad mot belagg - samtliga 6 AC redan bockade (mekanisk DoD1); DoD2 styrks av PR 2183:s grindtabell over tre rundor (biome/typecheck/build/check-langa-streck/check-facit/check:docs alla 0, risk LAG runda 3, enda fyndet info-niva utan blockering); DoD3 verifierat mot git show --stat cc3fb46d (PR 2183): enbart betalningskomponenter, AtgardsSida.tsx, BetalningarKort.tsx och AMENDERING-sidofiler andrade.
<!-- SECTION:NOTES:END -->
