---
id: TASK-15
title: >-
  Fynd: backlog-kortfiler i docs-commits triggar full Test+Build — UTF-8-filnamn
  faller trolig ur changed-files-globben
status: To Do
assignee: []
created_date: '2026-07-18 19:27'
updated_date: '2026-07-18 19:40'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S68 kontrastpar samma kväll): run 29657524469 (commit ebc422c: sessionsdok + todo + backlog-kortfil [å/ä/—/~ i namnet] — noll kod) körde Test+Build FULLT (success, ~7 min inkl. staging-stegen) medan run 29657760975 (commit 6d8c71b: ren docs BUILD-LOG + sessionsdok) skippade Test+Build by design. HYPOTES (OVERIFIERAD, K1.17-klassen tj-actions UTF-8-glob; jfr .githooks/pre-commit-kommentaren om core.quotepath): backlog-filnamnets specialtecken matchas inte av **/*.md-globben i changed-jobbet → only_changed=false → Test+Build kör. KOSTNAD: en onödig full Test+Build (runner-minuter + staging-slitage, TASK-6-grannklassen) per commit som rör kortfiler utan kodändring — träffar VARJE tvåstegs-stängnings-commit. UTFÖRARE: (1) verifiera hypotesen mot changed-jobbets logg i run 29657524469 (only_changed-värdet + vilken fil som föll ur); (2) bekräftad → fixen ligger i ci.yml-changed-steget (glob-/quotepath-hantering) — ALDRIG i backlog-filnamnen (verktyget äger dem, L226); falsifierad → omklassa mot faktisk fillista; (3) fixen verifieras med samma kontrastpar-metod (backlog-rörande docs-commit ska skippa Test+Build). Blockerar EJ: extra-runnen är grön, bara spilld.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hypotesen verifierad eller falsifierad mot changed-jobbets faktiska logg — käll-belagd klassning
- [ ] #2 Vid bekräftelse: ci.yml-fix landad + kontrastpar-bevisad (backlog-rörande docs-commit skippar Test+Build); vid falsifiering: dokumenterad omklassning
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S68-stängningen: klassad ready-for-agent på Marcus villkorade order ('Sätt ready for agent om den är det') + Code-bedömning mot substrat-kontraktet: mekanisk verifiering med käll-recept (changed-jobbets logg run 29657524469), tydlig fix-gräns (ci.yml-changed-steget, aldrig backlog-filnamnen [L226]), kontrastpar-bevismetod given, inga design-/produktval, ingen mänsklig grind. Tas lämpligen som andra kort efter TASK-14 (high) i nästa session.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
