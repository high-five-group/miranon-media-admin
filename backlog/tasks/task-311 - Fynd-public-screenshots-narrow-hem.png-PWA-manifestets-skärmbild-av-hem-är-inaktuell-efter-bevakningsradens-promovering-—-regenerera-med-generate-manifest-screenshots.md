---
id: TASK-311
title: >-
  Fynd: public/screenshots/narrow-hem.png (PWA-manifestets skärmbild av /hem) är
  inaktuell efter bevakningsradens promovering — regenerera med
  generate:manifest-screenshots
status: Done
assignee: []
created_date: '2026-08-23 16:47'
updated_date: '2026-08-24 16:43'
labels:
  - fynd
dependencies: []
ordinal: 574000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bifynd ur TASK-291 AC #3-promoveringen (S111 resume 2, 2026-08-23, agentens slutrapport på kortet): public/screenshots/narrow-hem.png genereras av tests/manifest-screenshots/narrow/hem.spec.ts (npm run generate:manifest-screenshots) mot /hem i fixturvärlden, och visar nu en bevakningsrad i den GAMLA anatomin (kolumn-grid, siffer-pill, 'saknar eventinfo'). Skarpa Hem bär sedan 836c23a3 rubrikrad + undertext, 70 px-lås, 'N nya saknar deltagarinfo' / 'N kräver åtgärd' med Link2Off i fylld cirkel. Agenten regenererade INTE bilden (en darwin-genererad committad PNG — CI-renderingen är linux; se CONTRIBUTING § Visuell regression om var bilder föds). Triage ADR-053: blockerar ej + värdefullt → defer. Förväntat beteende: bilden visar den promoverade formen, genererad i samma miljö som övriga committade skärmbilder (avgör: CI-jobb eller dokumenterad lokal rutin — läs hur de befintliga föddes: git log -- public/screenshots/). Samma klass: de fyra visuella baslinjerna hem.spec/offline-visual/chunk-banner-visual/notis-visual + mer-anmalningar.spec + aktivitetshistorik-visual/dokument-visual ska födas via visual-baselines.yml efter #1864:s landning (orkestreraren dispatchar).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 narrow-hem.png visar den promoverade bevakningsradsformen, genererad enligt den rutin git-historiken för public/screenshots/ visar
- [x] #2 Ingen darwin-genererad PNG committad om de befintliga föddes i linux — miljön matchar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done-flipp S112: PR #1940 landad, post-merge grön; skärmbilden regenererad + manifest-verifierad. Landning: PR #1940
<!-- SECTION:NOTES:END -->
