---
id: TASK-228
title: >-
  Fynd: Deltagare-blockets Åtgärder-knapp visar interim-platshållaren - koppla
  urvalet till Åtgärds-sidan
status: Done
assignee: []
created_date: '2026-08-15 22:59'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 430000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 6 (Marcus 2026-08-16): Markera personer på eventdetaljen + Åtgärder-klick visar texten 'Åtgärds-sidan är inte byggd ännu' (src/components/events/detail/Deltagare.tsx rad ~579-591, INTERIM-PLATSHÅLLAREN AC #3) - trots att sidan ÄR byggd sedan TASK-147-serien (/atgarder, AtgardsSida.tsx). Interimen byggdes medvetet före 147; ombkopplingen gjordes aldrig när sidan landade. QA-kortet 147.9 steg 1 FÖRVÄNTAR flödet ('Markera 2 deltagare på eventdetaljen - Åtgärder - mottagarna är SAMMA kort'). GÖR: ersätt platshållaren med navigation till /atgarder med urvalet medskickat; verifiera FÖRST hur AtgardsSida faktiskt tar emot mottagare (147-bygget kan ha byggt intag) och följ det - bygg inget nytt intag utan att ha läst det befintliga. 147.9 är blockerad tills detta är gjort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Markera på eventdetalj + Åtgärder navigerar till Åtgärds-sidan med exakt de markerade som mottagare
- [x] #2 Interim-platshållaren och dess villkorskod borttagna
- [x] #3 DoD-kvartetten grön + berörda acceptance-/webbläsarfall gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-228 - Deltagare-blockets Atgarder-knapp kopplad till Atgards-sidan.

RORDA FILER
- src/components/events/detail/Deltagare.tsx - INTERIM-PLATSHALLAREN (visaPlatshallare, aria-expanded/aria-controls, atgarder-platshallare-diven) riven; Atgarder-knappen navigerar nu till /event/$eventId/atgarder och skickar det markerade urvalets registrerings-ID:n i navigeringens history-state (mmAtgardsUrval), samma idiom som ManuellAnmalanForm.tsx paragraf mmAvsloja (declare module HistoryState).
- src/components/events/atgarder/AtgardsSida.tsx - seedningen laser mmAtgardsUrval (fangad EN gang via useLocation+useState, StrictMode-saker) och seedar synligaIds/valda darifran nar urvalet finns; annars oforandrad fallback (obekraftade eller obetalda) for direktlank/tomt-lage-ingang.
- tests/e2e/event-bekraftelse.staging.test.ts - tre test omskrivna bort fran den rivna platshallaren mot den riktiga navigationen (URL + history-state-payload), en ny heltackande test tillagd som speglar QA 147.9 steg 1 (2 markerade -> Atgarder -> Atgards-sidan visar EXAKT samma tva kort -> avmarkera en -> 1 kvar, kortet ligger kvar).

INTAGETS FAKTISKA FORM (premiss-passet, fore design)
AtgardsSida.tsx hade INGET befintligt intag for ett medskickat urval - dess egen docblock sade uttryckligen 'I skarp form levereras den av registret ... i prototypen SEEDAS den ur obekraftade eller obetalda' (den skarpa formen var inte byggd). URL-STATE-SPEC/ADR-074 tacker inte detta fallet (mottagarurvalet ar varken bokmarkbart eller kontinuerligt URL-synkat efter seedning - darefter ager Lotta urvalet lokalt). Byggde historik-state-idiomet (mmAtgardsUrval) i stallet for ett nytt sokvag-baserat intag, efter samma avvagning kodens EGEN precedent (ny-anmalan.tsx paragraf fran vs ManuellAnmalanForm.tsx paragraf mmAvsloja) redan gjort for en strukturellt identisk fraga (engangs-navigationsavsikt vs delbart/omladdningsbart URL-state).

AC-UTFALL, MATT
- AC 1: bevisat BADE automatiserat (ny e2e-test, chromium-authenticated, exit 0) OCH manuellt mot skarp staging-data (dev-server, Playwright MCP): markerade Ingrid Rehn + Johan Dahlgren pa /event/recDUMxyXI8hFHOg3, Atgarder -> landade pa /event/recDUMxyXI8hFHOg3/atgarder med history.state.mmAtgardsUrval = [recYZ4Oy0C4pb0GJa, recA06dGqJrYUI6OB] (exakt deras anmalnings-ID:n), rakningen 2 av 17 deltagare markerade, forhandsvisningen Johan Dahlgren och Ingrid Rehn, avmarkerade Ingrid -> 1 av 17, kortet kvar i listan (grammatiken oforandrad).
- AC 2: platshallarens hela villkorskod (visaPlatshallare, platshallareId, den betingade diven) borttagen - grep efter atgarder-platshallare / Atgards-sidan ar inte byggd annu i src/ ger noll traffar.
- AC 3: DoD-kvartetten gron (typecheck exit 0, biome exit 0 noll nya fynd, build exit 0, test:api 758/758 grona). Berorda webblasarfall: event-bekraftelse.staging.test.ts 16/16 grona (chromium-authenticated); facit-lasta promoveringsgrindar oforandrade och grona - atgardssida-promoverings-grind.spec.ts 40/40 (bevisar fallback-seedningen for direktlank/tomt-lage ar OFORANDRAD) och eventsida-promoverings-grind.spec.ts 26/26 (bevisar vilande-lagets DOM, som inte ror den andrade koden, ar oforandrad).

LANDNINGSVERIFIKAT (orkestreraren 2026-08-16): PR #1368 MERGED till main (215ef73f), lokala main ff-synkad. Done-flipp efter verifikat per konventionen.
<!-- SECTION:NOTES:END -->
