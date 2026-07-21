---
id: TASK-18.4
title: >-
  Skiva: Arbetskö-skelettet (deltagar-shapen + summeringsrader + flikar +
  accordions)
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
  - TASK-17.1
parent_task_id: TASK-18
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Anmälda deltagare-kortet får arbetsköns skelett ände-till-ände: deltagar-shapen utökas (Inskickad med klockslag, de tre skickad-tidsstämplarna, antal genomförda event, medföljande-kopplingen), fyra klickbara summeringsrader i Lottas utskicksordning med filter + Rensa filtret, kategori-flikar i kapsel-primitiven, Obekräftade-gruppen äldst först öppen och Bekräftade senast först stängd som accordions, och eventinfo-signalens slot (dags-att-skicka-badgen härledd ur tvåveckorsgränsen) alltid reserverad och placerad UTANFÖR den interaktiva raden (L303). Språket Obekräftad/Bekräftad exakt per basens Status-ord. Täcker användarberättelser: 12, 13 samt 18-visningen (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Deltagar-shape-utökningen kontraktstestad i api-sviten
- [ ] #2 Summeringsradernas klickfilter och accordion-grupperingen bevisade i e2e; ordningen äldst-först respektive senast-först verifierad
- [ ] #3 Signal-slotten renderar per facit i båda lägena (badge respektive tom reserv) utan geometri-hopp
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
