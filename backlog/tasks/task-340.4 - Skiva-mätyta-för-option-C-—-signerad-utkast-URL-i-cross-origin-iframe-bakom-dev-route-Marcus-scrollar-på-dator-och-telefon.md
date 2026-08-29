---
id: TASK-340.4
title: >-
  Skiva: mätyta för option C — signerad utkast-URL i cross-origin iframe bakom
  dev-route, Marcus scrollar på dator och telefon
status: To Do
assignee: []
created_date: '2026-08-29 08:19'
labels:
  - ready-for-human
dependencies:
  - TASK-340.1
parent_task_id: TASK-340
ordinal: 623000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två steg. AGENT-STEG: bygg en engångs-mätyta bakom en dev-route (samma DEV-gate-mönster som tidigare prototyper, ADR-103) som visar ett events signerade utkast-URL i en <iframe title='Förhandsgranskning'> med fullhöjd, plus ett litet mätfält som loggar: om Service Workern rör iframe-laddningen (fetch-event i SW-loggen), svarshuvudena på ett 200-svar från Storage (Accept-Ranges, Content-Type, Content-Disposition), och navigator.userAgent. Ingen produktkod rörs; ytan rivs efter mätningen (TASK-340.5 bokför rivningen). MARCUS-STEG: scrolla PDF:en i iframen på dator (Chrome + Safari) och på telefon (bokför iOS-version), jämför mot http-referensen som ADR-124 beslut 5 anger, och döm i klartext. Faller scrollen: C borta för gott, ADR-124 får en andra bekräftelse (§ Updates). Håller den: flödets form öppnas på nytt i egen grillning — ett över-bar-beslut (river ADR-124 beslut 1:s leveransform) som då mintas separat. Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mätytan finns bakom dev-gate, visar iframen och de tre mätvärdena; ingen produktväg påverkad (acceptance-sviterna gröna)
- [ ] #2 Marcus dom i klartext citerad i Implementation Notes (dator Chrome/Safari + telefon med iOS-version), SW-inblandning och 200-headers bokförda
- [ ] #3 Utfallet bokfört i ADR-124 § Updates (andra bekräftelse ELLER 'C öppnad — grillning'); mätytan riven i samma landning som domen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
<!-- DOD:END -->
