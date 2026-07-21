---
id: TASK-18.6
title: 'Skiva: Hantera-flödet (bekräftelse-vertikalen + Bekräfta alla)'
status: To Do
assignee: []
created_date: '2026-07-21 08:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.5
parent_task_id: TASK-18
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta kan tömma kön: Skicka bekräftelse-knappen i det obekräftade kortets botten (utanför person-länken, L303) driver NY operation där servern skickar bekräftelsemailet och flippar Status till Bekräftad i samma operation (Bekräftad betyder bekräftelsen skickad — basens Status-semantik). Bekräfta alla-pillen på Obekräftade-raden kör bulk med kontrollfråga (confirm-grind på massmutation). Schemalagt-datum och opt-out föds som ADDITIVA bas-fält och auto-utskicks-krysset läser/skriver dem (utskicks-MOTORN utanför). Optimistisk enskild bekräftelse, pessimistisk bulk. Täcker användarberättelser: 14, 15 samt 18-styrningen (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bekräftelse-operationen kontraktstestad: mail + status-flip atomiskt server-side, deny-by-default, teardown
- [ ] #2 Bekräfta alla kräver kontrollfråga och uppdaterar grupper + summeringsrader live i e2e
- [ ] #3 Schemalagt-fälten additiva i staging; krysset styr dem bevisat
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
