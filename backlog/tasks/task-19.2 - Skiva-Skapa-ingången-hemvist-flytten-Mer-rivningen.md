---
id: TASK-19.2
title: 'Skiva: Skapa-ingången + hemvist-flytten + Mer-rivningen'
status: In Progress
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-21 23:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
parent_task_id: TASK-19
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skapa nytt event-kapseln läggs vänster på listans vy-väljarrad i väljarnas stil och leder till skapa-sidan; skarpa sidans hemvist flyttar till event-familjens skapa-route (Marcus-kvitterat 2026-07-21) och Mer-ingången rivs öppet — berörda Mer-/list-e2e uppdateras i samma skiva. Täcker användarberättelser: 1 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ingången renderar per facit-lista-skapa-ingången och leder till skapa-sidan
- [x] #2 Mer-ingången borta och gamla routen hanterad öppet; berörda e2e uppdaterade i samma skiva
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen v2 (parallell form, ADR-073): Skapa-ingången på event-listans vy-rad (kapsel VÄNSTER i väljarnas stil per FACIT-lista-skapa-ingangen.png/K74: CalendarPlus 18 + rounded-full bg-bg-muted, jämförande computed-assertion mot vy-väljarens track) + HEMVIST-FLYTTEN (/event/skapa renderar skarpa CreateEventForm; back-länken → event-listan; prototyp-grinden ?variant kvar per klausul v tills 19.3) + MER-RIVNINGEN (NavCard-raden riven öppet i mer/index; gamla /mer/skapa-event = ren beforeLoad-redirect till /event/skapa så PWA-historik/bokmärken aldrig dör). Berörda e2e uppdaterade i samma skiva: skapa-event (hemvist-URL består + back-länk + redirect-bevis), mer-index (fem rader, rivningen bokförd i filhuvud + eget rivnings-test), events-list (nytt describe: facit-computed + klick→/event/skapa + kalenderläges-närvaro). TDD rött-först: 8/8 nya beteenden RÖDA före implementation (23 befintliga gröna), 31/31 gröna efter. Facit-avprickning: computed-verifiering i e2e (bg/radie == väljarens track, vänster-om + samma-rad-geometri, dekorativ ikon) + skärmdump 390×844 mot bilagan. Grindar: Biome 0 fel, typecheck 0 fel (tsr generate — routeTree.gen.ts oförändrad, samma route-uppsättning), test:api 307 gröna, build grön, events-list-kalender 9/9 (kapseln i kalenderläget). Inga bas-ändringar i skivan (DoD 7 uppfylld utan write). Formens INNEHÅLL mot facit ägs av task-19.3. Väntar design-review (S75-batchen v2).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
