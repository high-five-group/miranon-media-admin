---
id: TASK-257
title: 'Fynd: PersonsList-höjdlåset brutet — latent U+00A0-klass i skarp yta'
status: To Do
assignee: []
created_date: '2026-08-17 09:08'
updated_date: '2026-08-28 05:10'
labels:
  - fynd
dependencies: []
ordinal: 475000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S104:s handoff (Paushistorik 4-eran, bokförd som fynd-kort-kandidat vid skörden): PersonsList-höjdlåsbuggen — skarp yta, latent U+00A0-klass. Radhöjden i personlistan kan hoppa när innehåll bär non-breaking space. Jfr den låsta korthöjds-regeln DESIGN-SYSTEM-SPEC §20 (249.7). Detaljer i S104:s sessionsdok; reproduktion + fix specas vid plock.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Platshållar-fallbacken i src/components/persons/PersonsList.tsx (raden med bar-space "' '" när person.senasteInteraktion saknas, ca rad 1139) byts till U+00A0 (non-breaking space) — samma fix som redan verifierad i prototypytan (S104: 'höjdlåset ' ' FALSIFIERAT — 0 px; U+00A0 krävs')
- [ ] #2 Radhöjden är pixel-identisk mellan en rad MED senasteInteraktion-data och en rad UTAN, verifierat via getBoundingClientRect eller Playwright screenshot-mätning
- [ ] #3 En regressionsvakt (test) fäller om platshållaren återgår till en vanlig space eller tom sträng
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
