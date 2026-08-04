---
id: TASK-140
title: >-
  Formalisera besläktad — existens-grind mot trådregistrets ID:n (ADR-095 beslut
  3)
status: To Do
assignee: []
created_date: '2026-08-04 22:54'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 225000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR-095 beslut 3 (steg 1 av 2 i relationsmodellens mekanisering). Detta kort finns eftersom ADR:ns Uppföljning pekar på "egna arbets-kort" som aldrig skapades vid mintningen — luckan upptäcktes av Marcus fråga "är allt UTFÖRT eller bara förberett?" (S97, 2026-08-05).

BAKGRUND, källmärkt:
`besläktad` finns idag som FRI TEXT i trådregistret — aldrig validerad mot att målet existerar. Researchen (`docs/research/relationsarkitektur-dokumentationssystem-2026-08-04.md`, nio granskade system) visade att i samtliga är svaret på "vem garanterar konsistensen" VERKTYGET, aldrig disciplinen. Vårt nuläge har ingen sådan garant.

`besläktad` är en SYMMETRISK relation: deklareras EN gång per par, inte per riktning. A besläktad B ÄR B besläktad A — det finns ingen riktning att invertera. Grinden ska därför validera REFERENTIELL INTEGRITET (målet finns), och uttryckligen INTE kräva en spegelpost i målets rad. Det är skillnaden mot `barn` (ADR-095 beslut 4, task-141) och den får inte suddas.

FORM:
Utöka `scripts/check-thread-index.sh` — återanvänd dess BEFINTLIGA backtick-ID-regex-idiom, uppfinn inget nytt mönster. Rör ingen av de befintliga trådraderna strukturellt.

VARNING (mätt kostnad): grinden tar ~165 s att köra eftersom `backlog/config.yml` har `check_active_branches: true`. Det är väntat, inte en hängning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grinden validerar att varje besläktad-omnämnt tråd-ID existerar i registret
- [ ] #2 Grinden kräver INTE spegelpost i målets rad — symmetrisk relation, en deklaration per par
- [ ] #3 Befintligt backtick-ID-idiom i check-thread-index.sh återanvänt, inget nytt mönster infört
- [ ] #4 Ingen befintlig trådrad ändrad strukturellt; pipe-antals-invarianten orörd
- [ ] #5 Tvåsidigt bevis: grinden SLÄPPER ett giltigt besläktad-ID och FÄLLER ett ID som inte finns
- [ ] #6 shellcheck 0 på ändringen
- [ ] #7 check-thread-index.sh grön mot nuvarande register efter ändringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
