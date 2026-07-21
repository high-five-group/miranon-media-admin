---
id: TASK-18.3
title: 'Skiva: Åtgärds-gruppen + check-in-ingången + chevron-koherensen'
status: In Progress
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-21 21:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Åtgärds-gruppen överst (vänsterställda rader i frekvensordning med Lägg till manuell anmälan först, kuvert-grammatiken, hover-plattan) och check-in-kortet i NavCard-form som ingång (själva sidan byggs i eget framtida pass). Chevron-beslutet verkställs här: den tidigare ingen-chevron-regeln rivs ÖPPET i spec-trailen, chevron betyder att raden leder vidare, och Mer-menyns rader får chevroner för app-koherens. Skriv ut är skarp; utskicks-raderna kopplas till sina flöden när de finns. Täcker användarberättelser: 9, 10 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Åtgärdsrader + check-in-ingång renderar per facit med hover-plattans grammatik (renderad verifiering)
- [x] #2 Regelrivningen bokförd öppet i spec-texten; Mer-menyn bär chevroner; berörda shell-/mer-e2e uppdaterade i samma skiva
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen v2 (parallell form, ADR-073 Am. 3) — väntar design-review (S75-batchen v2). ÖPPET BOKFÖRDA SKIV-BESLUT: (1) Check-in-ingångens länkmål är BELAGT-INTERIM per PRD beslut 18-mönstret: /event/$eventId/narvaro (befintliga närvaro-ytan, dagens närmaste yta för dörr-arbetet) tills check-in-SIDAN byggs i eget pass — chevron-semantiken (raden leder vidare) hålls därmed sann; målet pekas om när sidan föds. (2) Okopplade åtgärdsrader (bekräftelsemail/betalningspåminnelse/markera betalda/eventinfo) renderar per facit med hover-plattan men bär aria-disabled tills sina flöden kopplas (18.6/18.8 resp. utskicks-styrningen) — ärligt AT-tillstånd utan visuell facit-avvikelse; e2e pinnar interimet. Skriv ut är SKARP (window.print, e2e-stubbad). REGELRIVNINGEN: spec §14-rubriken ersatt öppet (chevron betyder att raden leder vidare) + ändringslogg-rad; NavCard bär chevron 18 px (API oförändrat — interna formen); Mer-e2e + NavCard-a11y-spec uppdaterade. TDD: rött-först bevisat (7 e2e + 2 a11y röda före implementation; grönt efter). DoD #7: inga bas-ändringar i skivan (ren UI/spec-skiva). Facit-avprickningen: skärmdumpar 390×844 (toppen/hover/Mer) + computed-DOM-mätningar i e2e (hover-plattans bg/radie/-mx-2-geometri, måttparitet check-in↔åtgärdsrad, kuvert-grammatiken).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
