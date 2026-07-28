---
id: TASK-65
title: >-
  Fynd: event-anteckningar rad 248 bär 2,2 s marginal mot retry-kedjans värsta
  fall
status: To Do
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-28 15:04'
labels:
  - ready-for-agent
dependencies: []
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 4, räknat ur källan 2026-07-28): tests/acceptance/event-anteckningar.acceptance.test.ts rad 248 sätter timeout 12 s för att invänta en felyta bakom en 4x4-retrykedja.

RÄKNINGEN, UR KÄLLAN — EJ GISSAD: fetchWithRetry gör 4 HTTP-försök per anrop (sleep 200/400/800 ms + jitter 0-baseDelay/2, src/data/utils.ts) och komponenten ärver QueryClientens retry: 3 + retryDelay 200/400/800 (src/router.ts:18). Konstruerat värsta fall enbart i sömnerna: 4 x 2100 + 1400 = 9800 ms. Marginalen mot 12 s är 2,2 s — före CI:s långsammare runner och parallell workerlast.

Jittret är Math.random(), så det övre talet kräver ingen otur utöver tre höga drag per försök. Det är ett normalutfall, inte en svans.

FÖRVÄNTAT BETEENDE: en timeout som vaktar en räknebar retrykedja har marginal mot det KONSTRUERADE värsta fallet plus CI-långsamhet, inte mot det lokalt observerade.

VARFÖR DET INTE SYNS: raden är grön i dag. Ett grönt utfall avslöjar inte hur nära taket det låg — samma klass av dold marginal som TASK-59.7 fann på acceptance-jobbets tak (28 s kvar av 480).

UPPTÄCKT SÅ HÄR: en byggagent härmade raden som precedens, fick grönt på första försöket, men mätte i stället för att lita på grönt (5 isolerade körningar: 7901/7904/7916/7941/8401 ms) och satte 20 s i sitt eget test med räkningen utskriven. Precedens-raden lämnades orörd — den var inte agentens att ändra.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Timeouten på rad 248 är satt mot konstruerat värsta fall + CI-marginal, med räkningen utskriven i kommentaren
- [ ] #2 Övriga acceptance-timeouts som vaktar samma retrykedja är genomgångna med samma räkning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
