---
id: TASK-479.1
title: >-
  Skiva: SE13 + SE21 — en aktuell karta över CI-besluten, och CI-avsnittet ut ur
  den alltid-laddade filen (PR som UTKAST, Marcus läser före armering)
status: To Do
assignee: []
created_date: '2026-09-19 10:52'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-479
priority: high
ordinal: 831000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bygg kartan (SE13: den underhållna kontraktsfilen för hela CI-flödet — utgå från docs/research/ci-djupgranskning-2026-09-17/00-huvudrapport.md och 02-teknisk-arkitekturkarta.md, men som LEVANDE referens under docs/reference/, inte som frusen research) och en ADR-karta över CI-besluten med en rad per ADR: vad den låser, vilken yta den rör, vad som supersederat vad. Flytta sedan CI-avsnittet ur CLAUDE.md till kartan/CONTRIBUTING — REGEL FÖR REGEL: varje stycke med en 'Varför raden står här'-motivering som säger att regeln gäller i ett ögonblick där ingen annan fil är laddad (armering, task create, prod-deploy, hook-skarpbevis, worktree-gränsen) STANNAR, i kortad form med pekare; mätserier, historik och instansdata flyttar. Redovisa i PR-kroppen en tabell: stycke → stannar/flyttar → skäl, samt filens radantal före/efter. Uppdatera ALLA pekare som träffas (grep). PR:en skapas som DRAFT och armeras INTE — Marcus läser först (konstitutionen). Källa: tasks/sessions/2026-09-17-session-126.md Del 17 beslut 10 (Marcus kvittens 2026-09-19) och docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md (åtgärdens egen rad). Varje faktapåstående är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En levande karta finns under docs/reference/ med en rad per CI-ADR (pekare, aldrig kopia) och hela flödet förslag → kö → main → efterkontroll → natt på en sida
- [ ] #2 PR-kroppen bär tabellen stycke → stannar/flyttar → skäl, och radantal före/efter för CLAUDE.md
- [ ] #3 Varje regel som gäller i ett ögonblick utan annan laddad fil står KVAR i CLAUDE.md (kortad, med pekare)
- [ ] #4 Inga brutna pekare: npm run check:docs grön, länkkontrollen grön
- [ ] #5 PR:en är draft och oarmerad när agenten rapporterar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
