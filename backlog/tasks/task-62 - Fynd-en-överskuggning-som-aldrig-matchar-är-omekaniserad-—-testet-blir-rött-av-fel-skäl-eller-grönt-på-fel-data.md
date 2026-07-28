---
id: TASK-62
title: >-
  Fynd: en överskuggning som aldrig matchar är omekaniserad — testet blir rött
  av fel skäl eller grönt på fel data
status: To Do
assignee: []
created_date: '2026-07-28 12:47'
updated_date: '2026-07-28 13:45'
labels:
  - ready-for-agent
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
- [x] #1 En överskuggning vars mönster aldrig matchar fäller testet med ett meddelande som namnger det oanvända mönstret
- [x] #2 Tvåsidigt bevis: vakten fäller på ett medvetet felstavat mönster OCH är tyst när mönstret matchar
- [x] #3 Legitim oanvänd överskuggning kan undantas explicit; undantaget syns i koden
- [ ] #4 Samtliga 18 befintliga acceptance-filer passerar med vakten på
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MEKANISMEN, VERIFIERAD MOT INSTALLERAD VERSION (msw 2.15.0 / @msw/playwright 0.6.7).
RequestHandler.isUsed finns (lib/core/HttpResponse-DL-P1EeG.d.ts rad 218) och sätts i
implementationen på rad 149 i RequestHandler.js, direkt efter att predikatet gett träff.
Kortets hänvisning till listHandlers i lib/browser/index.d.ts rad 80 är setupWorker-ytan;
den metod NetworkFixture faktiskt ärver ligger på SetupApi
(lib/core/experimental/setup-api.d.ts rad 30) via Omit av dispose ur SetupApi
(@msw/playwright build/index.d.mts rad 18). Samma metod, annan härkomst — verifierat, ej antaget.

AC 1 UPPFYLLT. Vakten fäller och namnger mönstret. Bevis i båda riktningar: self-testet går
14/14 expected med vakten på och 1 unexpected med den avstängd (det medvetet felstavade
test.fail-testet rapporterar då "expected to fail but passed").

AC 2 UPPFYLLT. Fäller på EF(get-persosn), tyst på EF(get-persons) — både som beslut
(direkt anrop) och som verkan i den skarpa fixturen.

AC 3 UPPFYLLT. medvetetOanvand(handler, skäl): per handler och inte per test, obligatoriskt
skäl på minst 20 tecken prövat vid anropet, och en INAKTUELL märkning fäller
(ts-expect-error-kontraktet) så undantaget inte kan ruttna tyst.

AC 4 EJ UPPFYLLT — OCH DET ÄR FYNDET. 36 av 153 acceptance-tester i 8 av 18 filer fäller,
samtliga på vakten (noll övriga fel). Identisk fällningsmängd i tre fulla körningar
(36 / 36 / 36, 117 passed) — deterministiskt på darwin, 8 workers. Fyra klasser:

1. BATCH-REGISTRERAD SKRIV-EF som bara en delmängd av testerna utlöser —
   create-registration 18 tester (event-ny-anmalan 15, event-add-registration 3),
   create-event-note 7 (event-anteckningar), send-registration-confirmation 5
   (anmalan-detalj). Idiom, inte bugg.
2. BATCH-REGISTRERAD LÄS-EF för en vy testet aldrig laddar — anmalan-detalj
   get-event / get-registrations / get-event-notes i 5 tester.
3. UTEBLIVEN MUTATION ÄR SJÄLVA BEVISET — person-note-edit "avbryt (Esc): ingen mutation"
   (update-record) och mer-segment-send "0-mottagar-segment" (send-email +
   compute-segment). Läroboksfall för medvetetOanvand.
4. AVSIKTLIGT ÖVERSKUGGAD ÖVERSKUGGNING — mer-segment registrerar get-segments i
   beforeEach och igen i testet; den första är död by design, och kommentaren säger det.

TVÅ FALL DÄR KOMMENTAREN LOVAR MER ÄN TESTET KÖPER: hem.acceptance rad 205 + 226 överskuggar
get-event med motiveringen "Detaljsidan hämtar get-event vid landning, överskugga för
deterministisk render", men testet slutar vid toHaveURL — destinationens hämtning hinner
aldrig ske. Determinismen kommentaren åberopar köps alltså aldrig.

VARIANS: en fjärde körning (via sjalvtest --negativ-kontroll) gav 38 fällda i stället för 36.
De två extra kunde inte attribueras i efterhand — skriptet raderar sin rapport. Konsistent med
TASK-64:s kända flakighet, cirka 1,3 procent.

INGET ÄR TYSTAT. Ingen opt-out lagd på de 18 filerna, ingen fil undantagen, vakten inte
uppmjukad — per uppdragets instruktion. Vägvalet är Marcus.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
