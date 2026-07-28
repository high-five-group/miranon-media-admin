---
id: TASK-65
title: >-
  Fynd: event-anteckningar rad 248 bär 2,2 s marginal mot retry-kedjans värsta
  fall
status: To Do
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-28 18:57'
labels:
  - ready-for-agent
dependencies: []
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 4, räknat ur källan 2026-07-28): tests/acceptance/event-anteckningar.acceptance.test.ts rad 248 sätter timeout 12 s för att invänta en felyta bakom en 4x4-retrykedja.

RÄKNINGEN, UR KÄLLAN — EJ GISSAD: fetchWithRetry gör 4 HTTP-försök per anrop (sleep 200/400/800 ms + jitter, src/data/utils.ts) och komponenten ärver QueryClientens retry: 3 + retryDelay 200/400/800 (src/router.ts:18). Konstruerat värsta fall enbart i sömnerna: 4 x 1700 + 1400 = 8200 ms. Marginalen mot 12 s är 3,8 s — före CI:s långsammare runner och parallell workerlast.

Jittret är Math.random() * (baseDelay / 2) med baseDelay = 200, alltså KONSTANT 0-100 ms per sömn — det skalar INTE med den exponentiella delayen. Därav 1400 + 3 x 100 = 1700 ms per anrop.

TAKET ÄR EN SVANS, INTE ETT NORMALUTFALL (rättat 2026-07-28): kortet påstod först att det övre talet inte kräver otur. Det gör det — kedjan drar TOLV oberoende jitter, och taket kräver att alla tolv landar högt. Sex mätningar av samma kedja ligger inom 200 ms av varandra (sd ~100 ms). Det ändrar inte slutsatsen: en timeout är ett skyddsnät och ska dimensioneras mot taket, eftersom ett för högt tal kostar noll på grönt medan ett för lågt ger en falsk röd.

RÄTTAT VID KÄLLAN (2026-07-28, TASK-65:s bygge): kortet bar först 4 x 2100 + 1400 = 9800 ms och marginalen 2,2 s. Den räkningen antog att jittret följer delayen (100+200+400 = 700 per anrop) och stämmer inte mot src/data/utils.ts rad 60. Mätningen av samma kedja falsifierade den empiriskt: kedjans 16 anrop mättes med mellanrummen 284/403/801 | 206 | 250/500/846 | 406 | 218/475/883 | 806 | 230/436/860 ms — största mellanrum på 800-sömnen var 883 ms, inte de ~1200 som 9800-modellen kräver. Fyndet står kvar. Härledningen i sin helhet bor sedan TASK-66 i tests/acceptance/support/acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN.

FÖRVÄNTAT BETEENDE: en timeout som vaktar en räknebar retrykedja har marginal mot det KONSTRUERADE värsta fallet plus CI-långsamhet, inte mot det lokalt observerade.

VARFÖR DET INTE SYNS: raden är grön i dag. Ett grönt utfall avslöjar inte hur nära taket det låg — samma klass av dold marginal som TASK-59.7 fann på acceptance-jobbets tak (28 s kvar av 480).

UPPTÄCKT SÅ HÄR: en byggagent härmade raden som precedens, fick grönt på första försöket, men mätte i stället för att lita på grönt (5 isolerade körningar: 7901/7904/7916/7941/8401 ms) och satte 20 s i sitt eget test med räkningen utskriven. Precedens-raden lämnades orörd — den var inte agentens att ändra.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Timeouten på rad 248 är satt mot konstruerat värsta fall + CI-marginal, med räkningen utskriven i kommentaren
- [x] #2 Övriga acceptance-timeouts som vaktar samma retrykedja är genomgångna med samma räkning
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
