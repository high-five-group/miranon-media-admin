---
id: TASK-8.2
title: 'Skiva: Skeleton-primitiven + demo-sektion + spec-sektion'
status: To Do
assignee: []
created_date: '2026-07-11 22:54'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-8
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den återanvändbara Skeleton-primitiven (biblioteksribba 11/11/11) som bär Lugnt laddläge-principen (ORDLISTA) för denna och framtida vyer/produkter. Beteende ände-till-ände: primitiven exponerar förenklade block-former (textrad, tal, listrad) som reserverar sina slutdimensioner; färger uteslutande via tokensystemets komponentlager; långsam shimmer vänster→höger som ENDAST körs under prefers-reduced-motion: no-preference (statiska block annars); blocken håller ≥3:1-kontrast (WCAG 1.4.11) och är urskiljbara under prefers-contrast: more samt vid utskrift; a11y-markupen är Roselli-mönstret — aria-busy på innehålls-containern som laddar, aria-hidden på skelettelementen, skärmläsartext för laddbeskedet (aria-busy kompletteras ALLTID med textbeskedet — få skärmläsare honorerar busy ensam). Primitiven får egen sektion på primitiv-demo-sidan med axe-bevis (ADR-045-mönstret), och Lugnt laddläge-principen skrivs in i design-system-specen som laddläges-sektion (samsyn beslut 1 + implementationsbeslut 11). Research-grund käll-verifierad i S63 Del 2 (NN/g, Chung-empirin långsam shimmer, Roselli). Täcker användarberättelser: 12, 13, 14, 15 (grund för 11, 16).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skeleton-primitiv i biblioteket med block-former (textrad, tal, listrad), stylad uteslutande via tokensystemets komponentlager — inga hårdkodade färger
- [ ] #2 Långsam shimmer V→H endast under prefers-reduced-motion: no-preference; statiska block annars — verifierat med emulateMedia
- [ ] #3 Roselli-markupen på plats (aria-busy på container, aria-hidden på block, skärmläsartext) och axe 0 violations på demo-sidans Skeleton-sektion
- [ ] #4 Blocken håller ≥3:1-kontrast computed-style-verifierat + contrast-more- och print-stöd per primitiv-golvet
- [ ] #5 Lugnt laddläge-principen dokumenterad som laddläges-sektion i design-system-specen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [ ] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
