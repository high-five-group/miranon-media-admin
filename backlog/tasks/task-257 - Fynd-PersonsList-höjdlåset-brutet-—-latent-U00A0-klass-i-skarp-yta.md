---
id: TASK-257
title: 'Fynd: PersonsList-höjdlåset brutet — latent U+00A0-klass i skarp yta'
status: To Do
assignee: []
created_date: '2026-08-17 09:08'
labels:
  - fynd
dependencies: []
ordinal: 475000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S104:s handoff (Paushistorik 4-eran, bokförd som fynd-kort-kandidat vid skörden): PersonsList-höjdlåsbuggen — skarp yta, latent U+00A0-klass. Radhöjden i personlistan kan hoppa när innehåll bär non-breaking space. Jfr den låsta korthöjds-regeln DESIGN-SYSTEM-SPEC §20 (249.7). Detaljer i S104:s sessionsdok; reproduktion + fix specas vid plock.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
