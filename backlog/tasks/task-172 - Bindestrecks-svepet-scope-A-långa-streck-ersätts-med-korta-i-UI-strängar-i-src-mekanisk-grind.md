---
id: TASK-172
title: >-
  Bindestrecks-svepet scope A: långa streck ersätts med korta i UI-strängar i
  src/ + mekanisk grind
status: To Do
assignee: []
created_date: '2026-08-09 08:08'
updated_date: '2026-08-09 15:22'
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

CI-FYND #2 (2026-08-09, run 31317280866, samma commit 462113a7): Acceptance fallde pa FEM specs (inte de tva jag forst antog) - fullstandig logg last (881 rader, gh run view --log-failed):

1. mer-intresserade.acceptance.test.ts:177 - getByText(Namnlos person EM-DASH namnlos@example.se) - klass (b)
2. mer-segment.acceptance.test.ts:174 - getByRole(radiogroup, name: Resor i medvetandet EM-DASH fristaende forelasning...) - klass (b), FALLA-35-etiketten, samma sträng som tests/api/segment-taxonomy.test.ts (redan fixad i forsta passet, men acceptance-tvillingen missad)
3. mer-segment.acceptance.test.ts:215 (assertion rad 225-226) - getByText(0 personer matchar EM-DASH inga med genomford narvaro annu.) - klass (b)
4. mer-segment.acceptance.test.ts:308 (assertion rad 320-321) - SAMMA strang som #3, annan test - klass (b)
5. person-detail.acceptance.test.ts:173 (assertion rad 178-179) - getByRole(heading, name: Namnlos person EM-DASH anna@example.test) - klass (b)

Ingen av de fem ar datumspann (klass a) - alla ar separator-/etikett-UI-text som Marcus scope A-beslut tacker. Kod-andringen (kort bindestreck) BEHALLEN, alla fem assertions uppdaterade till kort bindestreck. Testens EGNA test()-namnstrangar (dokumentation, ej assertions) lamnades ORORDA med avsikt - de citerar bara den gamla texten som beskrivning, paverkar inget mekaniskt.

SYSTEMATISKT SVEP (direktiv): AST-skannade tests/acceptance/ (samma check-langa-streck.mjs-motor, tom policy) - 97 rentat traffar. Genomgangna en och en: cirka 75 ar test-namn/describe-strangar (dokumentation, aldrig assertion - lamnas), ~15 ar FIXTUR-data (mockade personnamn/kursnamn som RIM 1 EM-DASH Skovde, ORORD - representerar verklig data, inte nagon strang jag svepte i src/), och de fem ovan var de enda FAKTISKA assertion-traffarna som matchar en strang jag konverterat.

TREDJE TACKNINGSLUCKAN (samma leverans): forsta passet svepte tests/api + tests/visual (via ac lokala korningar) men INTE tests/acceptance/ - en hel testyta missad tills CI sjalv fallde den. Detta ar samma rotorsak som datumspann-missen (CI-fynd #1): mitt eget verify:ci-parity:fast-rationale tackte CI-STEGENS struktur men aldrig KONSEKVENSERNA av sjalva strang-andringarna over alla konsument-ytor. Larr for framtida strang-svep: identifiera ALLA testkonsument-ytor (api, acceptance, visual, e2e) INNAN sista push, inte iterativt efter varje CI-rod.

Lokalt verifierat: HELA acceptance-sviten (npx playwright test --project=acceptance) - forsta korningen 176/177 (1 fallande, ISOLERAT verifierad som OBESLAKTAD pre-existing lokal flake: hem.acceptance.test.ts dagar-kvar-pillen, passerade i isolerad korning, ror ingen fil i min diff, sannolikt 8-worker-resurskonkurrens); ANDRA fulla korningen 177/177 rent. Plus typecheck 0, biome check 0 (aven efter en självorsakad regression av import-ordningen i check-langa-streck.mjs - rattad, biome stabil), build gront, test:api 465 passed, check-langa-streck.mjs 0 ofangade, self-test 16/16.

MARCUS-BESLUT 2026-08-09 (S93, vid paus 10): 'Nej det funkar inte. ALLA 15 långa bindestreck i användarsynlig text MÅSTE bort.' — REST-undantagen kvitteras INTE som permanenta; datumspann-frågan är därmed också AVGJORD (korta streck vinner även i datumspann; det äldre tätt-tankstreck-direktivet i datumSpann.ts rivs öppet). SCHEMALAGT SOM NÄSTA RESUMES HUVUDSPÅR: (1) ändra alla 15 REST-strängar till korta streck, (2) synka ALLA test-konsumenter i samma pass (api/acceptance/visual — inkl. anmalan-detalj.acceptance rad 371 som asserterar en-dash-spannet), (3) referens-/baseline-omtagning för berörda facit-låsta ytor + Marcus omgodkännande-stämpling via !-kanalen (ny iteration per ADR-104 beslut 4, --ersatt-flaggan), (4) töm fil-undantagen ur .langa-streck-policy.json så endast tom-markörens 9 KEEP återstår, (5) därefter bockas AC #1 och kortet Done-flippas. Tom-markören '—' (9 st) FÖRBLIR undantagen — Marcus namngivna symbol för inget värde.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
