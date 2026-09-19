---
id: TASK-476
title: >-
  Fynd: bilageväljaren säger '1 valda' och klipper filnamn på mobil utan väg
  till hela namnet — ärvt ur Åtgärds-sidans stämplade väljare
status: To Do
assignee: []
created_date: '2026-09-19 09:45'
labels:
  - fynd
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/2547'
priority: low
type: bug
ordinal: 816000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningens runda 1 och 2 på PR #2547 (TASK-455), info-fynd: (1) räknaren böjs inte i singular — `${valda.size} valda` i `src/components/attachments/BilageValjare.tsx` rad ~99 ger "1 valda"; (2) ett trunkerat bilagenamn på mobil saknar väg till det fullständiga namnet. Båda är ärvda byte-identiskt ur Åtgärds-sidans redan stämplade väljare och alltså inte införda av TASK-455, men de syns nu även i svepet (390 px).

Ändringen rör TVÅ stämplade facit-ytor samtidigt (åtgärdssidans väljare och `s102-svep-konvergens`), så ADR-102 A3 gäller: agenten rör inte facit men SKRIVER amenderings-sidofilerna.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först: test som visar '1 valda' i dag och '1 vald' efter fix; 0 och flertal oförändrade
- [ ] #2 Ett avklippt bilagenamn går att läsa i sin helhet utan hover (pekskärm och tangentbord), tillgänglighet 11
- [ ] #3 Amenderings-sidofil skriven för varje berörd stämplad facit-yta (ADR-102 A3); facit.json orört
- [ ] #4 Marcus stämplar formen innan landning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
