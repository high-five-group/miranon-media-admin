---
id: TASK-60
title: >-
  Fynd: acceptance-klassens tvåsidiga bevis körs för hand och överlever inte
  körningen
status: Done
assignee: []
created_date: '2026-07-28 01:15'
updated_date: '2026-07-28 02:02'
labels:
  - ready-for-agent
dependencies: []
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hermetikens andra led — att fixturens svar faktiskt BÄR testerna — har bevisats för hand i tre skivor i rad (TASK-59.2, 59.3, 59.4): neutralisera testets egna network.use()-överskuggningar, töm normalläget, kör, läs utfallet, återställ ur en scratchpad-kopia.

BEVISET FINNS DÄRMED BARA I AGENTENS RAPPORTTEXT. Inget i repot kan köra om det. Klassen är densamma som flera fynd i S91: något som SER verifierat ut men inte kan verifieras om.

VARFÖR DET BRÅDSKAR MÅTTLIGT MEN VERKLIGT: TASK-59.5 sätter sex filer i spel och 59.6 sju till. Handpåläggning skalar sämst just där — sex manuella patcha-kör-återställ-cykler är sex tillfällen att återställa fel.

PRECEDENTEN FINNS I REPOT: tests/visual/hermetik-vakt.spec.ts gör den röda körningen till leveransen med test.fail(), så en avstängd vakt inte kan se grön ut. Och gate-proof.yml (TASK-36.1) bevisar merge-grindens FAIL-gren med en negativ kontroll som självtest — samma mönster, en nivå upp.

VAD SOM INTE RÄCKER: att bara töma normalläget. En fil som överskuggar allt den behöver (persons-list gör det avsiktligt, för att assertera exakta sidstorlekar) får fortsatt sina svar ur sina egna handlers. Båda leden krävs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 HERMETIK_SJALVTEST=1 tömmer normalläget OCH gör testens egna network.use() verkningslösa — båda leden i en regim, eftersom vartdera ensamt lämnar en klass av tester obevisade
- [x] #2 Grinden kräver att ALLA tester fälls OCH att OmockadRequestError är orsaken i vart och ett — utfallet ensamt räcker inte, då en trasig assertion också gör en svit röd
- [x] #3 En tom svit ger RÖTT (fail-closed) — noll körda tester uppfyller annars villkoret vakuöst
- [x] #4 Negativ kontroll finns och bevisar att grinden kan fälla: utan regimen ska bedömningen falla
- [x] #5 Steget kör i CI:s acceptance-jobb och kostnaden är MÄTT mot jobbets timeout-tak, inte antagen
- [x] #6 Handrutinen är uttryckligen avskriven i acceptance-sömmens dokumentation, så TASK-59.5/59.6 inte upprepar den
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (2026-07-28, S91 åttonde resumen)

`HERMETIK_SJALVTEST=1` i fixturvärlden + `scripts/hermetik-sjalvtest.mjs`, kopplat som steg i CI:s acceptance-jobb.

### Trådens föreslagna form räckte inte

T104 föreslog en flagga som tömmer normalläget. Läsning av testfilerna visade att den lämnar en hel klass obevisad: `persons-list` överskuggar allt den behöver — avsiktligt, för att assertera exakta sidstorlekar — och hade passerat oberörd. Regimen bär därför BÅDA leden. Vakten matas fortfarande med den riktiga handlers-listan, annars hade felmeddelandets 'Mockat här (7)' krympt till noll och TASK-57:s stavfelsförslag tystnat.

Neutraliseringen är en Proxy, inte spread eller Object.create: NetworkFixture är en klassinstans vars metoder bor på prototypen och läser privata fält.

### test.fail() förkastades aktivt

(1) Annotationen kontrollerar ATT ett test fälls, aldrig VARFÖR — en trasig assertion eller timeout hade räknats som hermetik-bevis. (2) Lagd i den delade sömmen hade den körts en enda gång: ESM-cachen kör modulkroppen för den först importerande spec-filen.

### Tre bevis, inte två

| bevis | utfall | exit |
|---|---|---|
| positivt (HERMETIK_SJALVTEST=1) | 51 tester · 51 fällda · 51 av vakten | 0 |
| negativ kontroll (utan regimen) | 51 · 0 fällda ⇒ bedömningen föll | 0 |
| målfallet (tillfällig överlevar-fil) | 52 · 51 fällda, överlevaren namngiven | 1 |

Det tredje beviset var inte planerat. De två första prövar bara grindens ändlägen; ingen av dem visar dess faktiska uppgift — att fånga en fil som ser grön ut men inte hänger på fixturen. Provfilen skapades, kördes och raderades i samma kommando med trap EXIT; arbetsträdet verifierat rent efteråt.

### Kostnadsprognosen var fel, och lagades i samma pass

Prognosen ~50 s var en LOKAL mätning projicerad till CI, utskriven som 'mätt, inte antagen'. Skarpt utfall: 289 s, jobbet 6,5 min mot tak 8.

Rotorsak: `retries: process.env.CI ? 2 : 0`. I självtestläget är rött det förväntade utfallet, så varje test kördes tre gånger med video — 153 körningar för noll extra information. Orsaken BANDS via CI=1 lokalt (297 s mot CI:s 289 s), inte gissad.

Åtgärd: `--retries=0` i skriptet + failure-artefakter avstängda i regimen. Mätt i samma uppställning: 297 s → 73 s. Jobbet landar ~2,5 min mot tak 8.

Retries vore dessutom FEL, inte bara dyrt: ett test som fäller vid första försöket men passerar vid andra är per definition inget hermetik-bevis.

### CI-verifiering

PR 309 grön per jobb 9/9 (run 30320122732). Steget 'Acceptance-klassens tvåsidiga bevis (hermetik-självtest)' verifierat som success i jobbets steglista, med samma utfall som lokalt (51/51/51) i steggloggen — inte bara jobbet grönt.

### T105 född på vägen

Hermetik-rapporten skrivs ut ur en gammal mätning som om den vore färsk: global-setup.ts rad 23 nollställer ENDAST i mätläge, global-teardown.ts skriver ut UTAN att pröva flaggan. Deferat till TASK-59.7 som äger instrumentet (DoD 4).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hermetikens andra led är en körbar grind i stället för en handrutin. HERMETIK_SJALVTEST=1 tömmer normalläget OCH gör testens egna network.use() verkningslösa — båda leden krävs, eftersom vartdera ensamt lämnar en klass av tester obevisade. scripts/hermetik-sjalvtest.mjs kräver att alla tester fälls MED OmockadRequestError som orsak; utfallet ensamt räcker inte, då en trasig assertion också gör en svit röd.

TRE BEVIS: positivt (51 tester · 51 fällda · 51 av vakten, exit 0) · negativ kontroll (51 · 0 fällda ⇒ bedömningen föll, exit 0) · målfallet (tillfällig överlevar-fil ⇒ 52 · 51 fällda, överlevaren namngiven, exit 1). Fail-closed på tomhet.

test.fail() förkastades aktivt trots att T104 pekade dit: den kontrollerar att ett test fälls, aldrig varför, och hade i den delade sömmen körts en enda gång av ESM-cachen.

KOSTNADSPROGNOSEN VAR FEL OCH LAGADES I SAMMA PASS. ~50 s var en lokal mätning projicerad till CI och utskriven som 'mätt, inte antagen'; skarpt utfall 289 s, jobbet 6,5 min mot tak 8. Rotorsak retries: CI ? 2 : 0 — i självtestläget är rött det förväntade utfallet, så varje test kördes tre gånger med video. Orsaken bands via CI=1 lokalt (297 s mot CI:s 289 s). Åtgärd: --retries=0 + artefakter av i regimen. Verifierat skarpt i CI efter fixen: steget 289 s → 75 s, jobbet 6,5 → 2,8 min, beviset oförändrat 51/51/51.

CI grön per jobb i båda landningarna: PR 309 (run 30320122732, 9/9) och PR 310 (run 30321515947, 9/9). Självtest-steget verifierat som success i jobbets steglista med rätt utfall i steggloggen — inte bara jobbet grönt.

TASK-59.5 och 59.6 har därmed ett permanent bevis för sina tretton filer i stället för tretton manuella patcha-kör-återställ-cykler.

T105 född på vägen och deferad till TASK-59.7: hermetik-rapporten skrivs ut ur en gammal mätning som om den vore färsk (global-setup flagg-vaktad, global-teardown inte).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
