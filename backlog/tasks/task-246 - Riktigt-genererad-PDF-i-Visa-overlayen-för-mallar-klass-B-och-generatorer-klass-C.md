---
id: TASK-246
title: >-
  Riktigt genererad PDF i Visa-overlayen för mallar (klass B) och generatorer
  (klass C)
status: To Do
assignee: []
created_date: '2026-08-16 15:26'
labels:
  - ready-for-agent
dependencies:
  - TASK-245
ordinal: 454000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-order 2026-08-16, nära-verbatim: 'det proffsigaste och mest branschledande är väl att man ser en riktigt genererad PDF på alla mallar ... och även generatorn'. Ersätter varv 3:s producerat-exempel (statiskt) med äkta generering vid Visa-klick. Dokumentklasserna per ORDLISTA (grillad samsyn S93): B event-mallad = systemmall där eventfälten fylls i (t.ex. deltagarinformations-brevet) · C person-genererad = skapas ur person- + betalningsdata (t.ex. betalningskvittot). Beroende: task-245 bygger overlay-mekaniken för PDF-visning (signerad URL + dialog) — denna skiva återanvänder den för genererat innehåll. Förhandsvisningens sidoeffektsfrihet är hård gräns (kvitto-vägen angränsar mail-sändning — får inte triggas).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Visa på en event-mallad rad (klass B) öppnar overlayen med en RIKTIGT genererad PDF ur eventets verkliga data — befintlig generator-yta (generate-event-attachment, 146.5) återanvänds; ny EF byggs endast om befintlig yta bevisat inte räcker
- [ ] #2 Visa på en person-genererad rad (klass C) visar riktigt genererad PDF; formvalet för persondata (verklig person ur eventet vs typexempel) verifieras mot befintlig generator-yta och bokförs i kortets notes
- [ ] #3 En förhandsvisning får ALDRIG ha sidoeffekter: ingen mail-sändning, ingen bas-skrivning, ingen kvarliggande Storage-artefakt — genereringen är transient eller städas bevisat
- [ ] #4 Varv 3:s producerat-exempel-dialog ersätts för klass B/C; ladda ner-fallback kvarstår; prod-klicklistan uppdaterad om EF-ytan ändras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
