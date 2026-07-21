---
id: TASK-18.1
title: 'Skiva: Sidstrukturen + Om eventet + uppdatera-event-vertikalen'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-21 09:12'
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
- [ ] #1 Om eventet-redigeringen fungerar ände-till-ände mot staging: ändra, spara, omläsning visar nya värden (teardown återställer)
- [ ] #2 api-kontraktstester per write-vertikal-mönstret: deny-by-default, otillåtet fält fälls, lyckad väg
- [ ] #3 Morfen 0 px-diff DOM-mätt; sidformen matchar facit-helsidan renderat
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AFK-abort (S75): CLAIMS-BROTT-KLASS (halt-first, per ordern: "Kräver lösningen en fil utanför tillåten yta: AVBRYT (abort), motivera — aldrig tyst överskridande"). Kortets spec kräver filer utanför TILLÅTEN yta: task-18.1 kräver ordagrant "eventKey in i läs-shapen", och EventKey-pillen i toppraden ingår i AC #3 ("sidformen matchar facit-helsidan renderat" — FACIT-eventsidan-helsida.png bär pillen "Event-21"). Läs-shapen ägs av src/domain-lagret: EventSchema (src/domain/schemas/Event.schema.ts rad 6–25 — saknar eventKey, verifierat) + Event-modellen (src/domain/models/Event.ts), och schema↔modell-pariteten är typecheck-bunden via src/domain/__tests__/schemas.assignable.ts (AssertEqual<z.infer<EventSchema>, Event>) — schemat kan inte ändras utan modellen. src/domain/** finns varken i TILLÅTEN eller FÖRBJUDEN yta i claims-listan. In-claims-omvägar prövades och förkastades ÖPPET: (a) enbart EF-ändring räcker inte — zod-objektets parse STRIPPER okända nycklar, så eventKey från get-event når aldrig komponenten; (b) skugg-shape/intersection-typ i src/data bryter repots etablerade konvention att alla läs-shapes bor i src/domain/schemas (PersonDetail-/EventFormat-/CreatedEvent-precedenten) = lapp i fel lager, inte grundorsak — strider mot "Ingen lathet/inga temporära fixar" och 11/10-golvet; (c) TS-modul-augmentation från src/data vore en hack som kringgår claims-partitionens syfte (kollisionsskydd mot P1 — EventSchema är dessutom DELAD yta med listvyn, se fynd 2). Utan eventKey är kortets Description och AC #3 ouppfyllbara → hela kortet oleverbart inom deklarerad yta. Utöver eventKey pekar även UpdateEventInput-typen mot src/domain/schemas per CreateEventInput-precedenten (CreateEvent.schema.ts + index.ts). ADR-053-triagen: blockerar + utanför scope (partitionsbeslutet är orkestratorns/Marcus) → STOPPA/eskalera, inte omdöme i stunden.
<!-- SECTION:NOTES:END -->

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
