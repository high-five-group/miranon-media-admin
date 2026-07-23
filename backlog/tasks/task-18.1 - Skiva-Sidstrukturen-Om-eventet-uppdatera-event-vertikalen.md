---
id: TASK-18.1
title: 'Skiva: Sidstrukturen + Om eventet + uppdatera-event-vertikalen'
status: In Progress
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-23 10:21'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-18
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eventsidan får facitets grundform ände-till-ände: topprad (stor chevron ensam, h1 = eventnamnet, EventKey-pill, tid kvar-rad), grupper med rubrik utanför tonala kort, Om eventet som etikett-värde-rader med Ändra-läget i sömlös morf (0 px-diff DOM-mätt, likbredda fält, ändrar-från-mönstret) — och Spara skriver på riktigt via NY operation uppdatera-event (typ, ort, start- och slutdatum, status, max antal platser; server-side shape + allowlist, deny-by-default; skrivbarheten live-verifieras mot basen INNAN allowlist-posten låses, L294). eventKey in i läs-shapen. Täcker användarberättelser: 1-5 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Om eventet-redigeringen fungerar ände-till-ände mot staging: ändra, spara, omläsning visar nya värden (teardown återställer)
- [x] #2 api-kontraktstester per write-vertikal-mönstret: deny-by-default, otillåtet fält fälls, lyckad väg
- [x] #3 Morfen 0 px-diff DOM-mätt; sidformen matchar facit-helsidan renderat
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AFK-abort (S75): CLAIMS-BROTT-KLASS (halt-first, per ordern: "Kräver lösningen en fil utanför tillåten yta: AVBRYT (abort), motivera — aldrig tyst överskridande"). Kortets spec kräver filer utanför TILLÅTEN yta: task-18.1 kräver ordagrant "eventKey in i läs-shapen", och EventKey-pillen i toppraden ingår i AC #3 ("sidformen matchar facit-helsidan renderat" — FACIT-eventsidan-helsida.png bär pillen "Event-21"). Läs-shapen ägs av src/domain-lagret: EventSchema (src/domain/schemas/Event.schema.ts rad 6–25 — saknar eventKey, verifierat) + Event-modellen (src/domain/models/Event.ts), och schema↔modell-pariteten är typecheck-bunden via src/domain/__tests__/schemas.assignable.ts (AssertEqual<z.infer<EventSchema>, Event>) — schemat kan inte ändras utan modellen. src/domain/** finns varken i TILLÅTEN eller FÖRBJUDEN yta i claims-listan. In-claims-omvägar prövades och förkastades ÖPPET: (a) enbart EF-ändring räcker inte — zod-objektets parse STRIPPER okända nycklar, så eventKey från get-event når aldrig komponenten; (b) skugg-shape/intersection-typ i src/data bryter repots etablerade konvention att alla läs-shapes bor i src/domain/schemas (PersonDetail-/EventFormat-/CreatedEvent-precedenten) = lapp i fel lager, inte grundorsak — strider mot "Ingen lathet/inga temporära fixar" och 11/10-golvet; (c) TS-modul-augmentation från src/data vore en hack som kringgår claims-partitionens syfte (kollisionsskydd mot P1 — EventSchema är dessutom DELAD yta med listvyn, se fynd 2). Utan eventKey är kortets Description och AC #3 ouppfyllbara → hela kortet oleverbart inom deklarerad yta. Utöver eventKey pekar även UpdateEventInput-typen mot src/domain/schemas per CreateEventInput-precedenten (CreateEvent.schema.ts + index.ts). ADR-053-triagen: blockerar + utanför scope (partitionsbeslutet är orkestratorns/Marcus) → STOPPA/eskalera, inte omdöme i stunden.

väntar design-review (S75-batchen v2). LEVERANS (task/18.1): sidstrukturen (topprad: chevron ensam 44px + h1 + EventKey-pill + tid kvar-rad; grupper med rubrik utanför tonala kort i facit-ordning) + Om eventet-morfen (Δ=0 px DOM-mätt: kort-box + etikett-y identiska; likbredda fält 4×240px; ändrar-från-mönstret) + NY EF update-event (server-side shape, allowlist-SSOT 'update-event', deny-by-default, PATCH naturligt idempotent — ingen nyckel; Månad/år OMHÄRLEDS ur nya Startdatum per ADR-066 b6-arvet, öppet utökat utöver kortets fältlista för att inte drifta basen) + eventKey OPTIONAL (utelämnas-vid-saknas, aldrig null — undvek prototypens ProtoEvent-typkollision) i EventSchema/Event + BÅDA läs-EF:erna i samma leverans (fasningen). L294 live-verifierad staging-skrivbarhet INNAN allowlist låstes (describe_table tblVE3UKWl1CKrphV 2026-07-21). AC#1-beviset per mark-paid-precedentens split: api-staging ände-till-ände (sentinel-event: ändra→spara→get-event-omläsning visar nya värden→teardown återställer; ADR-060-klass) + e2e deterministisk UI-morf/Spara-payload/felväg/fokus-retur. INTERIM öppet bokfört: Beläggning/Anmälda/Betalningar/Närvaro står i grupp-grammatiken med befintlig data + länkar till dagens undervyer — facit-innehållet ägs av 18.2/18.4/18.8/18.9; Åtgärder+check-in 18.3; Gruppdynamik/Anteckningar 18.10/18.11. Grindar: biome 0, typecheck 0, test:api 303/303, build grön, e2e event-detail 15/15 + angränsande (anmalda/narvaro/add-registration/mark-paid/shell) 31/31. EF:er deployade ENDAST staging (pqtshyierkdgwdnxuirz); prod orörd; update-event EJ i .prod-functions-allowlist.conf (fail-closed; prod-tillägg = separat Marcus-handling). AVVIKELSE (TDD): api-skarven rött→grönt bevisad (9 röda före EF-deploy → 13 gröna); e2e-skarven skrevs test-först men rött utfall observerades inte före UI-bygget (kostnadsavvägning dev-server-cykel). Skärmdumpar (390×844, facit-lik mockdata) tagna mot facit-bilagan — helsida + Ändra-läget.

CI grönt per jobb: PR-run 29865299294 + main-run 29865719700 (S75-batch v2)
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-22 09:10
---
Review-våg 1 (Marcus 2026-07-22): countdown-raden under eventnamnet godkänd som tillägg ('klar förbättring') MEN texten ska lyda t.ex. '7 veckor och 6 dagar kvar till eventet'. OBS källan: tidKvarTillEvent är pass-through från get-event-EF:n (EventDetail.tsx rad ~157 renderar strängen rått; ingen klient-formatter finns) — fixen verifierar EF-/formel-källans hela utfallsrymd FÖRST (blint klient-suffix bryter om fältet ibland bär icke-nedräknings-text, t.ex. pågående/avslutat läge). Åtgärd i review-fix-vågen på denna yta.
---

created: 2026-07-22 10:41
---
Review-fix-vågen LEVERERAD (PR #78): countdown-raden bär 'X ... kvar till eventet' villkorat på nedräkningsformerna — basens formel fldcwlblR3JQxXVbe MCP-verifierad till exakt tre utfall (Avslutat | N dagar | N vecka/veckor [och M dagar]); Avslutat renderas rå, e2e-pinnat i båda grenarna. BIFYND (T16-klass, till data-model-synken i end-passet): formelns IS_AFTER-gren klassar även själva EVENTDAGEN som Avslutat. DoD #5 STÅR ÖPPEN — omgranskning.
---

created: 2026-07-23 10:21
---
Review-våg 4 (2026-07-23, PR #93): datumSpannText (K10) fick samma-månad-kollapsen — '15–16 augusti 2026' i stället för '15 augusti – 16 augusti 2026' (Marcus punkt 12; svenska skrivregler, tätt tankstreck). Cross-månad-/årsformerna orörda. DoD #5 fortsatt öppen tills omgranskning.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
