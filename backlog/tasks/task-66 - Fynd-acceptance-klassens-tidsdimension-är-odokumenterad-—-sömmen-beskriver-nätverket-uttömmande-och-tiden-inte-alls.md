---
id: TASK-66
title: >-
  Fynd: acceptance-klassens tidsdimension är odokumenterad — sömmen beskriver
  nätverket uttömmande och tiden inte alls
status: Done
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-29 11:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-62
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 4, byggagentens slutsats efter att ha skrivit ett test från noll): tests/acceptance/support/acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN beskriver nätverksmekaniken uttömmande — normalläget, network.use(), EF()/json(), den tysta fällan, precedensen mellan page.route och MSW. Den säger ingenting om TID.

Att felytor i denna app kostar ~8-10 s att nå på grund av två lager retry (fetchWithRetry 4 försök + QueryClient retry: 3) finns bara som per-fil-kommentarer — event-anteckningar:243 och mer-vantelista:147 — och de säger olika saker.

KONKRET FELVÄG SOM REDAN FINNS: mer-vantelista rad 148-149 skriver '5xx vore fel testval — då retryar react-query korrekt och alerten dröjer förbi timeouten'. Det gäller den filens komponent, inte generellt, men läses lätt som en allmän regel. En nykomling med ett 5xx-uppdrag ser en rad som verkar förbjuda uppdraget.

FÖRVÄNTAT BETEENDE: en rad i acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN om att felytor bakom retrykedjan kräver räknad timeout, med pekare till var kedjan bor (src/data/utils.ts + src/router.ts). Det är den enda fil en nykomling garanterat läser.

VARFÖR DET ÄR VÄRT EN RAD: klassen är annars ovanligt väldokumenterad, och den dokumentationen betalade sig — samma agent gick inte i någon av de tre nätverksfällor som stod utskrivna. Tidsfällan var den enda som inte stod någonstans centralt, och den var också den enda agenten faktiskt var på väg in i.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN bär en rad om retrykedjans tidskostnad med pekare till källan
- [x] #2 mer-vantelista rad 148-149 är omformulerad så den inte läses som en allmän regel om 5xx
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BOKFÖRINGS-RÄTTNING 2026-07-29 (S91 femtonde resumen). Kortet stod `Done` med obockad DoD — arbetet var gjort men rutorna aldrig satta.

VERIFIERAT: arbetet är landat på `main`; 6 commits refererar kortet, senast `33ff261`. Landningen gick genom merge-grinden, vilket förutsätter grön required check.

INTE OMVERIFIERAT: DoD-posterna om lokala grindar och diff-omfång bockas som BOKFÖRING, inte som ny mätning. De var uppfyllda i sak när kortet stängdes; det som saknades var kvittensen. Att påstå en färsk verifiering hade varit oärligt.

VARFÖR NU: `scripts/check-backlog-closure.sh` grindar från i dag invarianten `Done ⟹ allt avbockat`. Obockad DoD på ett stängt kort är därefter en fällning, inte en tyst avvikelse.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererat i PR #364 (commit 867b30c, merge 1114bc2), CI grön per jobb på nio jobb i körning 30388329951.

AC 1: acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN bär nu retrykedjans tidskostnad med källpekare till båda lagren — fetchWithRetry (src/data/utils.ts:35-65, maxRetries 3 => 4 försök) och QueryClient (src/router.ts:18-19, retry 3 som kör om hela lager 1 per försök). Sömmen äger uträkningen, så per-fil-tal blir redundanta.

AC 2: mer-vantelista rad 148-149 omformulerad — '5xx vore fel testval' är borta som absolut och bunden till Waitlist.tsx:s retry-predikat, med 5xx uttryckligen tillåtet i klassen mot en räknad timeout.

FYNDET SOM BAR VIDARE: agenten vägrade skriva av kortets '~8-10 s' och härledde talet ur källan i stället. Det avtäckte att TASK-65:s kort räknade fel — jittret i src/data/utils.ts:60 är Math.random() * (baseDelay / 2), alltså konstant 0-100 ms per sleep, inte skalat med den exponentiella delayen. Konstruerat värsta fall är 4 x 1700 + 1400 = 8200 ms, inte kortets 9800. TASK-65-kortets egna fem mätningar (7901/7904/7916/7941/8401 ms) ligger i 8200-modellens spann och bekräftar den. Rättelsen skickades till TASK-65:s agent mitt i körningen, med instruktion att rätta vid källan.

Playwrights expect()-default på 5 s är den timeout som biter, inte test-timeouten på 30 s — verifierat i playwright/lib/matchers/expect.js och att playwright.config.ts inte överskriver någondera.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
