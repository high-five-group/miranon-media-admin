---
id: TASK-285.4
title: >-
  Skiva: Spec- och ORDLISTA-skörden — § 21 får yttrappan och kryss-regeln,
  Notistrappan ordlisteförs, ADR-121 § 8 stängs
status: To Do
assignee: []
created_date: '2026-08-21 11:02'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-285
ordinal: 519000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: nästa person som ska bygga ett meddelande slår upp DESIGN-SYSTEM-SPEC § 21 och hittar där den låsta formen per klass (överlagrad notis, banner i flödet, ruta i flödet, appfel) med kryss-regeln, knappradens placering och kontrastlägets undantag — på samma sätt som laddtrappan (ADR-113) fick sin yttrappa. ORDLISTA bär 'Notistrappan' och familjens klassnamn, med avrådda ord. ADR-121 får en Update som stänger § 8: databesked-varningen bor i chunk-bannern, bekräftelsedialog med osparad-detektion är registrerad som tråd, beslutet Marcus 2026-08-21 verbatim.

Docs-only. Formen hämtas ur facit-manifesten, inte ur minnet. DoD-posterna om ariaSnapshot och test-konsument-svep är ej tillämpliga för en docs-skiva och bockas med den motiveringen.

Täcker användarberättelser: 19
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 DESIGN-SYSTEM-SPEC § 21 beskriver formen per klass såsom låst i tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (ingen kontur, vänsterkant, knapprad, kryss-regel, kontrastläge) — inga nya regler utöver facit
- [ ] #2 ORDLISTA har posten Notistrappan med klassnamnen och avrådda ord (toast för fel, Uppdatera för Ladda om)
- [ ] #3 ADR-121 har en Update daterad 2026-08-21 som stänger § 8 med Marcus beslut verbatim och pekar på tråden för osparad-detektion
- [ ] #4 npm run check:docs grönt (14 grindar) och markdownlint 0
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
