---
id: TASK-225.4
title: 'Skiva: Primitiv-lyftet av datumväljaren + base.css-ringsläckaren'
status: To Do
assignee: []
created_date: '2026-08-15 09:22'
labels:
  - ready-for-agent
dependencies:
  - TASK-225.1
parent_task_id: TASK-225
ordinal: 416000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Härdningen av två delade byggstenar S106-passet bevisade delbehov för: datumväljaren (dess eget filhuvud villkorade primitiv-lyft på 'bevisat delbehov' — historiken är andra konsumenten) och h1-ringsläckaren (inline style var prototypets medvetna interim; base.css:s olagrade cascade kräver en riktig släckare, prejudikat: listbox-släckaren med dokumenterat skäl). Täcker användarberättelse: 9.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Datumväljar-komponenten bor i primitiv-biblioteket med oförändrat beteende; eventsidans och historikens konsumtion pekar dit — inga dubbla kopior kvar
- [ ] #2 Rubrikens programfokus-ringsläckning bärs av en base.css-regel i listbox-släckarens etablerade form; inline-stylen borttagen; tangentbords-fokusringar i övrigt opåverkade
- [ ] #3 Biome, typecheck och acceptance-sviterna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [ ] #6 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->
