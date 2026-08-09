---
id: TASK-172
title: >-
  Bindestrecks-svepet scope A: långa streck ersätts med korta i UI-strängar i
  src/ + mekanisk grind
status: To Do
assignee: []
created_date: '2026-08-09 08:08'
updated_date: '2026-08-09 13:59'
labels:
  - ready-for-agent
dependencies: []
ordinal: 315000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-beslut 2026-08-09 (S93-resumen, ur S100:s blockerande fråga; S100 sessionsdok § PAUSLÄGE fjärde pausen + § Del 7): scope A — UI-strängar i hela src/, det Lotta och Marcus ser i appen. Marcus ord: 'Ta bort alla långa bindestreck överallt, jag gillar de korta bindestrecken (-)'. Långa streck (tankstreck — och en-dash –) i användar-synlig text ersätts med kort bindestreck (-) eller omformuleras. Kodkommentarer (scope B) och dokumentation (scope C) ingår INTE — C avråddes som svep (docs-typografin är etablerad stil; ev. rivning är ett redaktionellt beslut av BYGGPLAN-LÄTTLÄST-klassen). Följdbeslut samma dag: commit-meddelanden/sessionsdok behåller etablerad form; tom-markören '—' (symbol för inget värde, t.ex. 'Ämne: —' i AtgardsSida) BEHÅLLS och undantas explicit. Grinden: mekanisk vakt som fäller NYA långa streck i UI-strängar — att skilja strängliteral/JSX-text från kommentarer kräver AST-läsning, implementationsvalet är utförarens (research först: finns etablerad lint-regel/plugin innan egen byggs); värden (undantagslistan: tom-markören m.fl.) bor i config-fil per CLAUDE.md-regeln om config-drivna grindvakter. SEKVENS-VILLKOR mot task-171: åtgärds-/granskningsytans filer (AtgardsSida.tsx + dess routes) är redan kortstreckade i synlig text (S100 varv 23); ändrar svepet ändå dem måste det ske FÖRE promoverings-PRD:ns referenstagning eller EFTER rivningen — aldrig mitt i kedjan, ariaSnapshot-referenserna fäller på varje textskillnad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Inga långa streck (— eller –) i användar-synliga strängar i src/, utom config-listade undantag (tom-markören)
- [x] #2 Mekanisk grind fäller nya förekomster — tvåsidigt bevis: seedat fel fälls, ren kod passerar
- [x] #3 Undantagen bor i config-fil, inte hårdkodade i skriptet
- [x] #4 Sekvens-villkoret mot task-171:s referenser efterlevt och bokfört i notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sekvens-villkor (AC #4): task-171-kedjan Done + riven (PR #1046, 54e3ff36) FORE detta svep - verifierat, ingen mitt-i-kedjan-risk.

AC #1 DELVIS, ej avbockad. Traffyta (AST, @babel/parser): 93 rentat forekomster. 73 ersatta. 9 KEEP (tom-markoren, namngiven exception). 12 REST (NYA fil-scopade exceptions utover tom-markoren) - eventsida-/event-lista-las: Atgarder.tsx, Betalningar.tsx, DatumFalt.tsx, Deltagare.tsx(4), DetaljGrupp.tsx, Gruppdynamik.tsx, Narvaro.tsx, datumSpann.ts(3), EventCard.tsx. Se .langa-streck-policy.json for rationale per post. AC #1 kan inte bockas arligt eftersom fler an tom-markoren undantas - REST kraver ny iteration + Marcus-godkannande (ADR-104 beslut 4).

UPPTACKT: datumSpann.ts rad 4-8 dokumenterar ett aldre Marcus-direktiv (tatt tankstreck for datumspann, svensk skrivregel) som KAN sta i konflikt mot task-172s blankettinstruktion. Filen ligger i REST och rordes ej - konflikten olost, flaggad for nasta iteration.

Obesläktat, ej fixat (scope creep): verify:ci-parity:fast visade tva pre-existing roda poster - biome.json $schema 2.5.4 vs CLI 2.5.5, och markdownlint MD004 i tasks/sessions/2026-08-02-session-93.md:2259. Ingen fil rord av detta kort.

CI-FYND (2026-08-09, samma dag, PR #1055 run 31316595089): Acceptance-hermetisk fallde tests/acceptance/anmalan-detalj.acceptance.test.ts rad 371 - testet asserterar datumspannet med en-dash (10 augusti 2026 EN-DASH 12 augusti 2026) i AnmalanDetail.tsx-s Avser-block (Datum-raden). Forsta passets sweep konverterade den raden till kort bindestreck utan att kanna igen den som en datumspann-yta (klassad bara som eventsida-lokal narrativ, inte som samma typografiklass som datumSpann.ts). Detta ar EXAKT den datumspann-konflikt jag sjalv flaggade som olost i forsta rapporten - nu SKARPT bekraftad av CI, inte bara en teoretisk risk.

Atgard: AnmalanDetail.tsx rad 423 ATERSTALLD till en-dash. EventsCalendar.tsx rad 74-75 (samma semantiska monster - kalenderns datumspann-header) ATERSTALLD i SAMMA svep, konservativt, aven om CI inte fallde pa den (inget lokalt korbart test tacker den). Bada tillagda som REST-undantag i .langa-streck-policy.json, samma klass som datumSpann.ts - vantar ett explicit Marcus-beslut om datumspann-typografin innan NAGON av de tre filerna ändras at nagot hall.

Lardom for min egen verify:ci-parity:fast-rationale: den taeckte CI-STEGENS struktur (mina tva nya steg), men INTE sjalva strang-andringarnas Acceptance-yta - Acceptance skippades medvetet i --fast-laget. En strang-sweep av detta slag borde ha kort mot Acceptance innan push, inte bara mot test:api+test:visual. Bokfort har for framtida liknande svep.

Lokalt verifierat efter fix: tests/acceptance/anmalan-detalj.acceptance.test.ts direkt (6/6 passed), typecheck 0, biome check 0, build gront, test:api 465 passed, test:visual 160 passed, check-langa-streck.mjs 0 ofangade (174 filer, 14 fil-undantag nu), test-check-langa-streck.mjs 16/16.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
