---
id: TASK-9.1
title: 'Skiva: NavCard-primitiven + demo + spec'
status: In Progress
assignee: []
created_date: '2026-07-12 10:16'
updated_date: '2026-07-12 13:11'
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
- [x] #1 NavCard finns i primitiv-biblioteket med API { to, icon, label } — to typad mot routerns routes (obefintlig route = typfel); ingen chevron; ingen hover-bakgrundsändring
- [x] #2 Raden renderas som hel klickbar kortyta (≥44 px) med dekorativ ikon (aria-hidden, 20 px, sekundärfärgen) och etikett 16/600 som ensam bär länknamnet
- [x] #3 Tangentbordsfokus ger synlig fokusring; hög-kontrast-läge ger synlig kantlinje; reduced-motion/print per kvalitetsribban
- [x] #4 Demo-sektion på primitiv-routen renderar NavCard-exempel och primitiv-axe-runnern är grön med 0 violations
- [x] #5 Design-system-specen har NavCard-sektion inkl. app-breda regeln 'navigationsrader bär inte chevron'
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Leverans-commit (pipeline B1, T76-piloten): NavCard på createLink(RAC Link)-mönstret (TanStack custom-link-guide; RAC >=1.11-kompat verifierad mot docs). TDD: 9 beteende-tester + sektions-axe skrivna först, observerade RÖDA (10 failed/8 passed), sedan gröna (23/23 a11y). Negativt typ-bevis AC1: to='/finns-inte' gav TS2322 mot route-unionen. Lokala grindar gröna: biome 0 fel, typecheck, typecheck:tests, build, test:a11y 23/23, api-pure 185/185, markdownlint 0, vale 0. DoD 3/5/6 lämnas åt orkestratorn (CI + design-review + facit-paritet i prod-vyn).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-12 13:11
---
Granskningsfärdig (ADR-071 granskningsfärdigt läge): levererad 698fb90 → PR #49 → merge 38ab3aa; CI grön per jobb first-pass (PR-run 29193277922 + main-run 29193431921). DoD 5 väntar din design-review mot M6-facitet i browsern (/dev/primitives, NavCard-sektionen); DoD 6 (facit-paritet i prod-vyn) hör till task-9.2:s renderade vy. AFK-proveniens: T76-piloten S65 fas 2, pipeline B agent B1, orkestrerad bokföring.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
