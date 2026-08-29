---
id: TASK-342
title: >-
  Fynd: DocRaptors prince_options[http_timeout] defaultar till 10 s, inte 60 —
  typsnitt/bilder från publik URL kan tysta fallera under last
status: To Do
assignee: []
created_date: '2026-08-29 14:33'
labels:
  - ready-for-agent
dependencies: []
ordinal: 628000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur research-passet docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md § Oväntade fynd (S113): DocRaptors http_timeout för resurser Prince hämtar (typsnitt, bilder via URL) defaultar till 10 s — inte 60 som antagits. Mallarna är i dag självbärande (inlinade typsnitt/bilder, ADR-125 § 4 + docraptor-sjalvbarande-porteringen), så exponeringen bör vara noll — men det är inte mätt. Uppdrag: (1) verifiera mot mall-render.ts att INGEN extern resurs-URL återstår i den HTML som skickas (grep i den självbärande utdatan för http(s)://); (2) om någon återstår: sätt http_timeout explicit och bokför, eller inlina resursen; (3) bokför utfallet i mall-render.ts filhuvud och i docs/mallar/bilagor/README.md § Fontstrategin. Ingen ändring om (1) ger noll träffar — då är kortet en bokförd frånvaro.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mätt: antal externa resurs-URL:er i den självbärande HTML:en per mall (bekräftelse, deltagarinfo, kvitto) — bokfört; vid > 0: åtgärdat eller http_timeout satt med skäl
- [ ] #2 Filhuvudet i mall-render.ts och README § Fontstrategin nämner 10 s-defaulten och mätresultatet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
