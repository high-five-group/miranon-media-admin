---
id: TASK-64
title: >-
  Fynd: acceptance-sviten är flaky under full workerlast och retries: 2 maskerar
  det som grönt
status: To Do
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-28 15:19'
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
FJÄRDE DATAPUNKT, 2026-07-28 (biprodukt av TASK-62:s mätning, ej egen utredning): hela acceptance-sviten kördes med --retries=0 på grenen feat/task-62-overskuggnings-vakt. Utfall 152 passed / 1 failed. Det fallerande testet var event-ny-anmalan.acceptance.test.ts:641 ('AT-kontraktet: virtuell fokus — DOM-fokus i fältet, aria-activedescendant pekar på det aktiva alternativet').

Det är en FJÄRDE fil utöver de tre kortet redan listar (event-anteckningar:142, mer-intresserade:95, person-detail:137). Fyra körningar har nu gett fyra olika uppsättningar fallerande tester, i fyra olika filer. Det talar för bred last-känslighet snarare än en lokaliserad rad — men OBS att denna körning inte var kontrollerad för workerlast och alltså inte ersätter kortets AC #1. Den räknas som ytterligare en observation, inte som diagnos.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
