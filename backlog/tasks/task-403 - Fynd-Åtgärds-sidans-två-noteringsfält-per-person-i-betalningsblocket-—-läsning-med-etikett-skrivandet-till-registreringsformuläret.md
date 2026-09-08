---
id: TASK-403
title: >-
  Fynd: Åtgärds-sidans två noteringsfält per person i betalningsblocket —
  läsning med etikett, skrivandet till registreringsformuläret
status: To Do
assignee: []
created_date: '2026-09-05 19:18'
updated_date: '2026-09-08 02:55'
labels:
  - ready-for-human
dependencies: []
ordinal: 704000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-09-05 (S121 Del 5): 'På åtgärdssidan, längst ner på betalnings-blocket så finns två notis rutor på varje person som man inte vet vad dem representerar och man kan skriva i dem men inte spara. Vad var vår tanke där? Var det inte så att det endast skulle visa noteringarna?' Läst ur komponentens docblock: fälten är Lottas ENDA skrivväg till anmälans två noteringsfält i basen (Notering anmälningsavgift / Notering slutbetalning); registreringsformulärets notering går till inbetalningen i Postgres, inte dit, och att nå fälten därifrån kräver en Edge Function-ändring (pass 7 A3 stannade på sin grind; pass 10 bröt ut fälten ur kryss-raden för att inte ta bort en skrivväg utan att bygga en ny). Fälten sparar vid blur utan kvittens och saknar synlig etikett (hideLabel, placeholder 'Notering…') — det är varför de inte går att förstå. Förväntat beteende (orkestrerarens bedömning, Marcus beslutar): fälten på Åtgärds-sidan blir LÄSNING med synlig etikett ('Notering anmälningsavgift' / 'Notering slutbetalning'); skrivandet flyttar till registreringsformuläret (inkorgen och bekräftelsesteget) via en additiv utökning av registrerings-EF:en så noteringen följer inbetalningen in i basens fält. Om texten försvinner vid omladdning i prod är det en bugg utöver detta — verifieras först i staging. Kortet är HITL: formvalet (läsning kontra skrivning, var noteringen bor) är Marcus.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus beslut om formen (läsning på Åtgärds-sidan, skrivning i registreringsformuläret) är bokfört i kortet med kvittens
- [ ] #2 Åtgärds-sidans två fält visar noteringarna med synlig etikett; ingen skrivväg utan kvittens finns kvar
- [ ] #3 Registreringsformulärets notering når anmälans notering i basen via EF-utökningen, verifierat i staging (api-test + staging-e2e)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Superseded 2026-09-08 (TASK-435)

Marcus S124-beslut river hela betalningsblocket från åtgärdssidan ("Jag är helt säker på att jag vill riva betalningsblocket helt från åtgärdssidan"), vilket avgör detta korts öppna fråga på ett tredje sätt — varken "läsning med etikett" eller "skrivning" blev svaret, utan "ingen yta alls" på åtgärdssidan.

Per acceptanskriterium:
- AC #1 (Marcus beslut om formen bokfört med kvittens) — UPPFYLLT av TASK-435-beslutet ovan, om än med ett annat utfall än korets två ursprungliga alternativ.
- AC #2 (Åtgärds-sidans två fält blir läsning med synlig etikett) — OBSOLET: fälten (och hela betalningsblocket de satt i) är rivna, det finns ingen yta kvar att ge en synlig etikett.
- AC #3 (registreringsformulärets notering når anmälans notering i basen via EF-utökning) — KVARSTÅR som eget scope. RegistreraForm.tsx:s notering skriver redan till inbetalningen i Postgres (ADR-128); en EF-utökning som ALSO speglar den till Anmälningars 'Notering anmälningsavgift'/'Notering slutbetalning' är inte byggd och inte del av TASK-435. Ingen kod i denna PR rör den frågan.

Kortet kvarstår ready-for-human tills Marcus tar ställning till om AC #3 fortfarande är önskad, eller om kortet ska stängas som moot.
<!-- SECTION:NOTES:END -->
