---
id: TASK-62
title: >-
  Fynd: en överskuggning som aldrig matchar är omekaniserad — testet blir rött
  av fel skäl eller grönt på fel data
status: To Do
assignee: []
created_date: '2026-07-28 12:47'
labels: []
dependencies: []
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (framkallat i TASK-59.8 steg 5, 2026-07-28): i tests/acceptance/persons-list.acceptance.test.ts ändrades överskuggningens mönster EF('get-persons') -> EF('get-persosn') — ett stavfel av exakt den klass hermetic.ts rad 162-168 varnar för. Normalläget lämnades intakt.

UTFALL: 3 av 4 tester föll, 1 PASSERADE. Inget av de tre felmeddelandena nämner överskuggningen. Verbatim: 'expect(locator).toHaveCount(expected) failed — Expected: 2, Received: 10' och 'expect(locator).toBeVisible() failed — element(s) not found: "2 personer laddade (fler finns)."'. De pekar utvecklaren mot testdata, paginering eller respondPage — aldrig mot mönstersträngen. Testet som passerade (tom sökning ger 'Inga träffar') var nöjt med normallägets svar.

FÖRVÄNTAT BETEENDE: en network.use()-överskuggning vars mönster aldrig matchar något anrop ska fälla med eget meddelande som namnger det oanvända mönstret — spegelbilden av hermetik-vakten. Vakten fångar i dag 'request utan handler'; 'handler utan request' är oskyddad.

MEKANISMEN FINNS OCH ÄR KÄLLVERIFIERAD, EJ GISSAD (msw i node_modules): RequestHandler.isUsed: boolean — 'Indicates whether this request handler has been used (its resolver has successfully executed)' (lib/core/HttpResponse-DL-P1EeG.d.ts rad 218). listHandlers(): ReadonlyArray<AnyHandler> (lib/browser/index.d.ts rad 80).

VARFÖR NU: TASK-58 (Done) dokumenterade mönstret och fällan i klartext — hermetic.ts rad 166 säger rakt ut 'Hermetik-vakten kan inte se detta'. Detta kort gör inte om det jobbet; det gör den dokumenterade fällan mekanisk. Jfr lesson-fragmentet lardom-utan-grind-tillampas-inkonsekvent.md.

ATT DESIGNA IN: en överskuggning kan legitimt vara oanvänd (registrerad för en gren testet inte når). Vakten behöver explicit opt-out, och den ska vara svår att sätta av slentrian.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En överskuggning vars mönster aldrig matchar fäller testet med ett meddelande som namnger det oanvända mönstret
- [ ] #2 Tvåsidigt bevis: vakten fäller på ett medvetet felstavat mönster OCH är tyst när mönstret matchar
- [ ] #3 Legitim oanvänd överskuggning kan undantas explicit; undantaget syns i koden
- [ ] #4 Samtliga 18 befintliga acceptance-filer passerar med vakten på
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
