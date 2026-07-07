---
id: TASK-4.2
title: 'Skiva: Hem-strukturen till facit'
status: To Do
assignee: []
created_date: '2026-07-07 08:55'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.1
parent_task_id: TASK-4
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem renderar som facitets skal. Desktop: INGEN topp-header på Hem (skalet får per-vy-avstängning; övriga vyer behåller sin header), EN skärm-centrerad innehållskolumn på 600 px med innehållet nedflyttat, versionsraden "Miranon Media Admin v{version}" fast nere till vänster (endast desktop) med versionen build-injicerad ur paketmanifestet (B-NYTT2 — aldrig hårdkodad). Mobil: dagens form med samma kolumn. Botten-tabbaren ORÖRD på alla breakpoints. Hälsningskortet: h1 "Hej {namn}" UTAN utropstecken vid första renderingen per session, därefter bara "{namn}" (sessions-state, B2); "Mina sidor"-knapp (secondary, visuell platshållare — ytan är klass D) ersätter uppdatera-knappen (B5: poll-lagret bär färskheten; borttagningen bokförs öppet mot ADR-017-erratumets §2-not). Befintliga kort och CTA:n renderar oförändrade i den nya kolumnen — facit-innehållet i korten kommer i nästa skivor (tracer: strukturen först).

Täcker användarberättelser: 1, 2, 3, 17 (18–20 löpande).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hem saknar topp-header medan övriga vyer behåller sin (e2e)
- [ ] #2 Innehållskolumnen mäter 600 px och är skärm-centrerad på desktop (renderad mätning); mobil behåller dagens form
- [ ] #3 Hälsningen: 'Hej {namn}' utan utropstecken första gången per session, bara '{namn}' vid återbesök i sessionen (e2e)
- [ ] #4 'Mina sidor'-knapp (secondary) på plats; uppdatera-knappen borta; borttagningen bokförd mot ADR-017 §2-noten
- [ ] #5 Versionsraden nere till vänster endast desktop och matchar paketmanifestets version (asserterad mot manifestet, ej hårdkodat värde)
- [ ] #6 Botten-tabbaren oförändrad; CTA:n kvar; axe-0 på Hem
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
