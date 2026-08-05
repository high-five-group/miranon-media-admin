---
id: TASK-140
title: >-
  Formalisera besläktad — existens-grind mot trådregistrets ID:n (ADR-095 beslut
  3)
status: Done
assignee: []
created_date: '2026-08-04 22:54'
updated_date: '2026-08-05 01:19'
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
- [x] #1 Grinden validerar att varje besläktad-omnämnt tråd-ID existerar i registret
- [x] #2 Grinden kräver INTE spegelpost i målets rad — symmetrisk relation, en deklaration per par
- [x] #3 Befintligt backtick-ID-idiom i check-thread-index.sh återanvänt, inget nytt mönster infört
- [x] #4 Ingen befintlig trådrad ändrad strukturellt; pipe-antals-invarianten orörd
- [x] #5 Tvåsidigt bevis: grinden SLÄPPER ett giltigt besläktad-ID och FÄLLER ett ID som inte finns
- [x] #6 shellcheck 0 på ändringen
- [x] #7 check-thread-index.sh grön mot nuvarande register efter ändringen
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat i PR #747 (main 1446e779). besläktad formaliserad som existens-grind i scripts/check-thread-index.sh (Inv 5), config-driven via THREAD_RELATED_KEYWORD med negationsmönster som filtrerar bort 'obesläktad'. SYMMETRISK relation: validerar att målet finns, kräver uttryckligen INGEN spegelpost — bevisat både genom kodinspektion och testdesign (målets rad lämnad orörd, grinden läste den aldrig). Korsläsning av hela registret: 67 besläktad-mål, noll trasiga. Fällde först på CI:s shellcheck-flaggor (SC2250 + SC2310) som lokalt anrop utan flaggor missade; fixat med brace-form + riktad disable med skriven motivering, formen hämtad ur check-permissions-claims.sh rad 115.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
