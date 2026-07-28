---
id: TASK-64
title: >-
  Fynd: acceptance-sviten är flaky under full workerlast och retries: 2 maskerar
  det som grönt
status: To Do
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-28 19:14'
labels:
  - ready-for-agent
dependencies:
  - TASK-62
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 4, mätt 2026-07-28 av byggagenten under arbetet med personlistans felläge): tre fulla lokala svitkörningar på samma träd gav olika utfall.

  körning 1 (med ny testfil):        153 passed
  körning 2 (med ny testfil):        1 failed — event-anteckningar:142
  körning 3 (BASELINE, ändringen stashad): 2 failed — mer-intresserade:95, person-detail:137

Olika tester föll varje gång, och BASELINE UTAN ändringen fällde MEST. Flakigheten är alltså inte orsakad av den nya filen — den fanns redan.

TROLIG BIDRAGANDE ORSAK (agentens observation, ej fullt utredd): tests/acceptance/event-anteckningar.acceptance.test.ts:155 använder allTextContents(), som till skillnad från expect-matchers INTE auto-väntar.

VARFÖR DET INTE SYNS I CI: playwright.config.ts sätter retries: 2. Ett test som faller och lyckas på omkörning rapporteras som 'flaky', inte 'failed', och jobbet blir grönt. Sviten SER stabil ut.

FÖRVÄNTAT BETEENDE: acceptance-klassen är hermetisk — den har varken nätverk eller delad databas att skylla på. En hermetisk svit som är last-känslig har en äkta kapplöpning i testkoden, och den ska lagas, inte maskeras av omkörningar.

RELATION TILL T106: T106 gäller SJÄLVTESTETS race (onUnhandledRequest vs toBeFocused-timeout). Detta är huvudsviten under workerlast — närliggande klass, annan yta. Slå inte ihop dem utan att först pröva om orsaken är gemensam.

VÄRT ATT MÄTA FÖRST: hur många körningar i CI-historiken som rapporterat flaky > 0 på acceptance-jobbet. Talet avgör om detta är en spets eller ett bärande problem.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flakigheten är reproducerad under kontrollerad workerlast och orsaken lokaliserad till testkod, inte gissad
- [ ] #2 allTextContents()-användningen på event-anteckningar:155 är prövad som orsak — bekräftad eller avfärdad med belägg
- [ ] #3 Åtgärden bevisas genom upprepade fulla svitkörningar utan retries, inte genom en grön CI-körning med retries på
- [ ] #4 Om retries: 2 behålls är skälet nedskrivet; annars är det borttaget för klassen
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
EXEKVERINGSFORM — LÄS FÖRE PLOCK: detta kort tas som DIAGNOS under orkestrerarens egen hand, INTE som delegerad bygg-skiva. Skälet är att orsaken inte är lokaliserad; en bygg-agent på ett odiagnostiserat race bygger fel sak. Etiketten ready-for-agent säger att kortet inte kräver Marcus omdöme — den säger inte att det ska spawnas som skiva.

STEG 0 — MÄT FÖRE ALLT ANNAT. Räkna hur många körningar i CI-historiken som rapporterat flaky > 0 på acceptance-jobbet. Talet avgör om detta är en spets eller ett bärande problem, och därmed kortets storlek. Gör inte steg 1 innan talet finns.

STEG 1 — reproducera under kontrollerad workerlast, med retries av. Grönt med retries på är inte data.

STEG 2 — pröva allTextContents() på event-anteckningar:155 som orsak (den auto-väntar inte, till skillnad från expect-matchers). Bekräfta eller avfärda MED BELÄGG; avfärda inte genom att den inte föll den gången.

BEROENDE PÅ TASK-62 (kodat som dep): vaktens per-fil-aggregering är sannolikt mätinstrument här — en överskuggning som aldrig matchar ger grönt på fel data, vilket är samma symptomklass som ett last-känsligt race. Kör 62 först och se vad instrumentet visar.

AVGRÄNSNING MOT T106: T106 gäller självtestets race (onUnhandledRequest vs toBeFocused-timeout). Detta är huvudsviten under workerlast. Närliggande klass, annan yta — slå inte ihop utan att först pröva om orsaken är gemensam.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STEG 0 UTFÖRT 2026-07-28 (orkestreraren, egen hand). Talet finns: flakigheten är BÄRANDE, inte en spets.

MÄTNINGEN. ci-metrics.mjs kan inte svara på frågan — den räknar jobb-omkörningar (rött som blev grönt vid rerun av samma kod), medan retries: 2 döljer flaken INUTI ett grönt jobb. Mätt i stället genom att läsa Playwrights egen "N flaky"-rad ur acceptance-jobbets logg för de 120 senaste CI-körningarna.

  acceptance-jobb med läsbar logg : 22
  MED flaky > 0                   : 14
  utan flaky                      : 8
  ANDEL                           : 63 %

Alltid exakt "1 flaky" per körning. De 81 körningar utan acceptance-jobb är docs-klassade PR:er — klassningen fungerar, det är inte ett mätfel. Kommandot bor i sessionens scratchpad; formen är gh api repos/.../actions/jobs/<id>/logs + grep -oE "[0-9]+ flaky".

VILKA TESTER. Sex körningar samplade på testidentitet. Exakt TVÅ tester återkommer:
  tests/acceptance/event-anteckningar.acceptance.test.ts:142  (felrad :154-155)
  tests/acceptance/event-ny-anmalan.acceptance.test.ts:641    (felrad :661-668)

ORSAKEN ÄR LOKALISERAD TILL KOD — EN ENDA KLASS. Icke-auto-väntande query följd av icke-retrying assertion. Tre rader i hela sviten bär mönstret, och de sitter i exakt de två flaky-testerna:

  1. event-anteckningar:154  allTextContents() + expect(array).toEqual([...])
     allTextContents är en ögonblicksbild. Raden före väntar bara på rubriken "Anteckningar",
     som kan vara synlig innan alla tre article-element renderats.
  2. event-ny-anmalan:661    getAttribute('aria-activedescendant') direkt efter keyboard.press
  3. event-ny-anmalan:666    samma mönster, andra ArrowDown

KANONISK FIX (Playwright web-first assertions, auto-retryande):
  rad 154 -> await expect(grupp.locator('article span.font-semibold')).toHaveText(['Roger','Lotta','Roger'])
  rad 661/666 -> await expect(sok).toHaveAttribute('aria-activedescendant', /.+/) FÖRE getAttribute-hämtningen;
                 värdet behövs för att bygga nästa locator, så hämtningen står kvar — men efter en väntan som retryar.

FYND UTÖVER KORTET — ETT TEST SOM INTE KAN FÄLLA. event-anteckningar:163 skriver
expect(await grupp.getByText('2026-06-01T10:00:00.000Z').count()).toBe(0). Samma klass, men
den failar åt "säkert" håll: hinner elementet inte renderas blir count 0 och assertionen GRÖN
på fel grund. Det är inte flakighet utan ett test som strukturellt inte kan fälla — allvarligare
i tysthet. Bör lagas i samma svep (t.ex. toHaveCount(0) efter att strömmen bevisats renderad).

TVÅ KLASSER, INTE EN. Ovanstående är klass A: CI-synlig, 63 %, tre rader. Klass B syns bara
lokalt under full workerlast och har INTE detta mönster: hem:423, mer-intresserade:95,
person-detail:137 (de två sista är kortets egen baseline; alla tre bekräftade av TASK-65:s
agent 2026-07-28 i tre fulla lokala körningar, samtliga gröna isolerat). Gemensamt för dem är
att de är fokus-tester (fokus -> <h1>). Klass B är INTE åtgärdad av klass A:s fix och ska
mätas om efter den — annars tillskrivs fixen en effekt den inte haft.

AVGRÄNSNING MOT T106 BESVARAD. T106:s mekanism kräver självtestläget (onUnhandledRequest-kastet
mot toBeFocused-timeouten) och finns inte i normalläge. Orsaken är alltså INTE gemensam med
klass A. Klass B delar dock symptomklass med T106 (fokus-assertion med fast timeout under last)
och bör läsas ihop med den tråden, inte slås ihop.

DELEGERINGSSPÄRREN HAR FALLIT. Kortets plan förbjöd delegering med skälet "orsaken är inte
lokaliserad; en bygg-agent på ett odiagnostiserat race bygger fel sak". Orsaken ÄR nu lokaliserad
till rad och mekanism, så spärren gäller inte längre för klass A. Klass B förblir diagnos.

AC 3 KRÄVER FORTFARANDE EGEN MÄTNING: upprepade fulla svitkörningar UTAN retries, före och efter.
Grönt med retries på är inte data. AC 4 (behålla eller ta bort retries: 2) avgörs av den mätningen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
