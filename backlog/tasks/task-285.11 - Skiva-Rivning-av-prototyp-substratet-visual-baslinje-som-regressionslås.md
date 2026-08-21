---
id: TASK-285.11
title: 'Skiva: Rivning av prototyp-substratet + visual-baslinje som regressionslås'
status: To Do
assignee: []
created_date: '2026-08-21 11:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.10
parent_task_id: TASK-285
ordinal: 526000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när båda manifesten bär godkand rivs allt som bara fanns för prototypen — notisens växlare och dess montering i roten, ?variant- och ?data-grenarna i uppdateringsbannern, prototyp-routen /dev/notis-prototyp, MessageBoxPrototyp och AppErrorPrototyp, märk-kommentarerna [PROTOTYPE] — mekaniskt, utan att formen rörs (det som rivs är villkor och växlar, aldrig formen; ADR-103). check-facit.sh är grinden: rivning med godkand null fäller CI och kan inte landa — kontrollera att båda manifesten är stämplade INNAN första raden rivs. Därefter tas visual-baslinjen för de nya ytorna (notis, offline, chunk-banner, meddelanderutan) på den godkända formen som regressionslås, via CI-artefakt-vägen repot redan använder.

Täcker användarberättelser: 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda manifesten bär godkand före rivningen (läst ur filerna, inte antaget) och check-facit.sh är grön efter
- [ ] #2 Inga [PROTOTYPE]-markörer, ?variant-/?data-grenar, prototyp-routes eller prototyp-komponenter för notisfamiljen finns kvar i källkoden (grep-svep bilagt)
- [ ] #3 Den promoverade formen är byte-identisk före och efter rivningen (ariaSnapshot per yta oförändrad)
- [ ] #4 Visual-baslinjen för notis, offline, chunk-banner och meddelanderutan är tagen på godkänd yta och grön i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [ ] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->
