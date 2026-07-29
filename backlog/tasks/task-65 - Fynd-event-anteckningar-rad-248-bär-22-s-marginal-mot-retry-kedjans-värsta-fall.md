---
id: TASK-65
title: >-
  Fynd: event-anteckningar rad 248 bär 2,2 s marginal mot retry-kedjans värsta
  fall
status: Done
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-29 11:37'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BOKFÖRINGS-RÄTTNING 2026-07-29 (S91 femtonde resumen). Kortet stod `Done` med obockad DoD — arbetet var gjort men rutorna aldrig satta.

VERIFIERAT: arbetet är landat på `main`; 9 commits refererar kortet, senast `33ff261`. Landningen gick genom merge-grinden, vilket förutsätter grön required check.

INTE OMVERIFIERAT: DoD-posterna om lokala grindar och diff-omfång bockas som BOKFÖRING, inte som ny mätning. De var uppfyllda i sak när kortet stängdes; det som saknades var kvittensen. Att påstå en färsk verifiering hade varit oärligt.

VARFÖR NU: `scripts/check-backlog-closure.sh` grindar från i dag invarianten `Done ⟹ allt avbockat`. Obockad DoD på ett stängt kort är därefter en fällning, inte en tyst avvikelse.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererat i PR #368 (commit 6d81a15, merge d7b9558), CI grön per jobb på nio jobb i körning 30391032095.

RÄKNINGEN RÄTTAD VID KÄLLAN. Kortets konstruerade värsta fall (4 x 2100 + 1400 = 9800 ms) var fel: jittret i src/data/utils.ts:60 är Math.random() * (baseDelay / 2), alltså konstant 0-100 ms per sleep och inte skalat med den exponentiella delayen. Rätt tak är 4 x 1700 + 1400 = 8200 ms. Felet upptäcktes av TASK-66:s agent, verifierades av orkestreraren i källan, och rättades i kortets beskrivning i samma commit som koden.

AC 1: timeout 12 s -> 20 s på event-anteckningar:248, med termerna utskrivna i kommentaren och pekare till acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN i stället för upprepad härledning. Marginal 2,3x mot taket 8,55 s (8200 ms + 346 ms mätt svarshantering). Assertionens egen tid mätt fem gånger isolerat: 7902/7916/7927/7931/7948 ms, och 7756 ms i full svit med CI=1.

AC 2: klassen har exakt tre 5xx-tester (grep över hela tests/acceptance/). event-anteckningar:248 ändrad; persons-list:199 bar samma falsifierade 9800-term och fick räkningen rättad (20 s oförändrat); person-note-edit:155 är en 1x4-mutationskedja mätt till 1815/1819/1824 ms, där default 5 s ger 2,7x och lämnades orörd. mer-vantelista:152 gicks igenom som räkning utan ändring per orkestrerarens partition mot TASK-66 — den driver 404, som kortsluter båda retry-lagren.

TVÅSIDIGT BEVIS: negativkontroll på den ändrade raden med en text som aldrig dyker upp fäller på assertionen efter 21,8 s, innanför Playwrights 30 s-ram. Kedjans form mättes till 16 anrop med största utslag 883 ms på 800-sömnen, mot de ~1200 ms som 9800-modellen krävde.

TVÅ PÅSTÅENDEN I KORTET FALSIFIERADE: (1) marginalen var 3,8 s, inte 2,2 s; (2) taket är inte ett normalutfall utan kräver att tolv oberoende jitter-drag landar högt (sex mätningar inom 200 ms, sd cirka 100 ms). Båda rättade i kortet. Agentens egen arbetshypotes föll också: testets totaltid steg 9,7 -> 15,1 s under last, men assertionens tid gjorde det inte (7756 ms) — kedjan är wall-clock-sömner. Motsägelsen skrevs in i stället för att jämnas ut.

KVARSTÅENDE (ej denna skiva): kortets titel bär fortfarande '2,2 s'; titeländring renamar kortfilen och är identitetsnivå. Överskuggnings-vaktens hjälptext säger att --grep stänger av vakten helt, men den fällde ändå på en -g-körning — ej utrett, blockerade inte.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
