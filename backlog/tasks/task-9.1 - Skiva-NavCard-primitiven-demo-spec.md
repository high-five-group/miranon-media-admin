---
id: TASK-9.1
title: 'Skiva: NavCard-primitiven + demo + spec'
status: To Do
assignee: []
created_date: '2026-07-12 10:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-9
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bibliotekskod 11/11/11: den återanvändbara navigationsrads-primitiven som bär Mer-vyns kort-rader (och framtida produkters). Byggs på react-aria-components-basen (ADR-044) med medvetet minimalt API — beteendet ände-till-ände: en konsument ger { to, icon, label } och får en fullt tillgänglig, router-typad kort-rad i M6-facitets form. Demo + axe via primitiv-routen (skarv 1). INTE i API:t (över-engineering-vakten): badge, beskrivningsrad, disabled, knapp-variant. Kollisionsyta mot task-8.2 (design-system-specen) bokförd för T76-partitionen. Täcker användarberättelser: 4, 5, 6, 8, 9, 11, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 NavCard finns i primitiv-biblioteket med API { to, icon, label } — to typad mot routerns routes (obefintlig route = typfel); ingen chevron; ingen hover-bakgrundsändring
- [ ] #2 Raden renderas som hel klickbar kortyta (≥44 px) med dekorativ ikon (aria-hidden, 20 px, sekundärfärgen) och etikett 16/600 som ensam bär länknamnet
- [ ] #3 Tangentbordsfokus ger synlig fokusring; hög-kontrast-läge ger synlig kantlinje; reduced-motion/print per kvalitetsribban
- [ ] #4 Demo-sektion på primitiv-routen renderar NavCard-exempel och primitiv-axe-runnern är grön med 0 violations
- [ ] #5 Design-system-specen har NavCard-sektion inkl. app-breda regeln 'navigationsrader bär inte chevron'
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
