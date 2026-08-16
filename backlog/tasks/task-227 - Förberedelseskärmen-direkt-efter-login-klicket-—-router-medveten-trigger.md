---
id: TASK-227
title: Förberedelseskärmen direkt efter login-klicket — router-medveten trigger
status: Done
assignee: []
created_date: '2026-08-15 13:18'
updated_date: '2026-08-16 00:33'
labels:
  - ready-for-agent
dependencies: []
ordinal: 429000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljningskort ur TASK-218.3:s öppet bokförda avgränsning (varv 3-fixen, 2026-08-15): warmup-gaten i auth-resolutionens render-gate täcker KALL APPSTART med befintlig session (Lottas PWA-vardag, bevisad i 218.4:s e2e-kallstartsfall) — men skärmen direkt EFTER ett aktivt login-klick på en kall enhet uteblir, eftersom gaten öppnar fritt för auth-ytorna (login/glomt-losenord/nytt-losenord/passkey/valkommen — CI-fångsterna varv 1–2) och inte re-triggar när navigeringen lämnar dem. Rätt ingreppspunkt per research-passet (app-startup-warmup-splash-2026-08-15.md): inloggningens routningsflöde (routaEfterLyckadInloggning) — en router-medveten trigger som startar värmningen när målet är app-ytan och cachen är kall. Respektera gate-lärdomarna i src/main.tsx:s varv 4-kommentar (invalidate-samspelet) och tyst-vid-varmt-regeln (ADR-112 beslut 2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aktiv inloggning på kall enhet visar Förberedelseskärmen innan Hem (samma form som appstartsfallet); varm enhet förblir tyst
- [x] #2 Auth-ytorna skyms aldrig (webbläsarsvitens varv 1–2-fall gröna oförändrade) och invalidate-invarianten består (acceptance-sviten grön)
- [x] #3 E2E-fall för login-vägen i persist-/auth-sviten enligt befintligt idiom
- [x] #4 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DESIGN-AVVIKELSE MOT UPPDRAGET (ADR-086, bokförd öppet): uppdragets ingreppspunkt
(routaEfterLyckadInloggning, login.tsx) prövades mot källan (research-passet
app-startup-warmup-splash-2026-08-15.md) och HÅLLER INTE bokstavligt -
dokumentet nämner varken den funktionen eller login.tsx. Formuleringen är
ÄRVD ur main.tsx:s egen kommentar, inte från research-passet.

Vald lösning i stället: en HELT FRISTÅENDE gate i src/routes/_authenticated.tsx
(layout-routen), delat varm/kall-predikat (arCacheVarm, exporterat från
startvarmningen.ts) med InnerApps befintliga gate. Teknisk grund: login.tsx:s
handleSubmit->routaEfterLyckadInloggning racear mot InnerApps EGEN
router.invalidate()-effekt (VARV-4-fångsten, #1343/de262db4) - att lägga en
ny async gate-övergång där hade byggt ÄN en gissning ovanpå exakt den
mekanism en verklig produktionsregression redan kom ur. _authenticated.tsx
monteras strukturellt ALDRIG för auth-ytor (guard) och ALDRIG medan en
startvärmning redan pågår (InnerApps render-gate blockerar RouterProvider tills
'redo') - noll kapplöpning att samordna, ingen ny async-risk. Fullt
resonemang i _authenticated.tsx:s eget docblock.

VERIFIERAT LIVE MOT STAGING (npx playwright test --project=chromium-authenticated):
- Nya AC#3-testerna (tests/e2e/persist-cache.staging.test.ts, describe
  "TASK-227"): 2/2 gröna MED fixen.
- RÖDA-FÖRST-BEVIS: samma "kall enhet"-test kördes mot _authenticated.tsx
  ÅTERSTÄLLD till pre-fix-innehåll (git stash) -> fallerar exakt som väntat
  (ingen progressbar). Återställd -> gröna igen.
- Full persist-cache.staging.test.ts (10 tester): 5 rött BÅDE med och UTAN
  mina ändringar (differential-testat via git stash på baseline) - identisk
  fellista båda gångerna. Slutsats: förkonsumerad staging-rate-limit från
  upprepade live-körningar i samma session, INTE en regression. CI:s
  Staging-jobb är avgörande grinden (samma precedent som TASK-218.3).

HERMETISKA SVITER (oberörda av staging-rate-limits):
- test:webblasarbeteende: 58/58 (matchar 218.3s historiska tal).
- test:acceptance: 229/231. De två röda är BÅDA pre-existerande, BEVISADE
  via differential mot baseline: "dagar-kvar-pillen" (hem.acceptance.test.ts)
  flakar 4/5 ISOLERAT ÄVEN på OMODIFIERAD kod (persist-throttle-timing-race
  mellan snabba på-varandra-följande page.goto() inom samma test - samma
  flake TASK-218.3s eget final summary redan dokumenterade som "inte
  reproducerbar, bedöms orelaterad"); "filterbyte mitt i paginering"
  (mer-aktivitetshistorik-filter.acceptance.test.ts) passerade rent när
  isolerat om. Ingen av de två rör _authenticated.tsx/warmup-gaten - och den
  nya gaten övas ALDRIG av hermetiska sviter (fixturvärlden seedar auth via
  localStorage FÖRE boot, går alltid InnerApps appstarts-väg - se
  _authenticated.tsx:s docblock).

DoD-kvartetten: typecheck 0 fel, biome 0 fel (endast förbefintliga
warnings/infos i orelaterade filer), build grön, test:api 758/758.

LANDNINGSVERIFIKAT (orkestreraren 2026-08-16 natt): PR #1365 MERGED till main (17716a24) efter en failed_checks-utsparkning med tyst konsumerad armering som heartbeat-svepet fångade och om-armerade (CLEAN-vägen, isInMergeQueue-verifierad). Done-flipp efter verifikat.
<!-- SECTION:NOTES:END -->
