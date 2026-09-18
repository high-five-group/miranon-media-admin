---
id: TASK-450.3
title: 'Skiva: N4 — vakt för paraplyets needs-lista'
status: Done
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 12:36'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 777000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repots enda obligatoriska kontroll är paraplyjobbet, och dess needs-lista räknar upp de toppnivåjobb det bryr sig om. Ett nytt toppnivåjobb som glöms i listan kan bli hur rött som helst utan att stoppa något, och ingen mekanism kontrollerar listan i dag. Efter skivan fäller ett CI-wirat invariant-skript, i samma form som repots befintliga fetch-depth-invariant, med jobbets namn när ett toppnivåjobb saknas i listan. Medvetna undantag bor i en uttrycklig lista med skrivet skäl (config-driven, per konventionen för grindvakter), och ett onödigt undantag fäller också. Spec: planens § N4.

Täcker användarberättelser: 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tvåsidig testsvit: en sandlådekopia av ci.yml med ett jobb borttaget ur needs FÄLLER med jobbets namn; den riktiga filen PASSERAR
- [x] #2 Ett onödigt undantag i undantagslistan fäller
- [x] #3 Skriptet och dess testsvit är wirade i ci.yml (invariant-blocket respektive gatekeeper-steget) och steget är grönt i PR:ens lint-jobb
- [x] #4 Värden (undantag) bor i en policy-fil, inte hårdkodade i skriptet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
N4 landad via #2528 (73ede87b, 2026-09-18T11:09:18Z). CI-wirad invariant-vakt scripts/check-aggregator-needs.mjs + testsvit (16 fall/20 kontroller, mutationsbevisad) fäller med jobbets namn när ett toppnivåjobb saknas i ci-passed.needs; undantag i .aggregator-needs-policy.json (tom). Review-loopen: risk lag, konvergerad runda 1; granskaren bekräftade att paraplyet läser GitHubs egen needs-kontext (ingen andra handhållen lista) och att YAML-alias inte lurar vakten. Efterkontrollen: N4 landade under en texttopp (N3-hålet), verifierad i stället av körning 35340750185 (kodtopp b6872fb9) — hela sviten grön inkl. Staging och A11y.
<!-- SECTION:FINAL_SUMMARY:END -->
