---
id: TASK-457
title: >-
  Fynd: bulkregistreringens Sätt alla belopp stänger Anmälningsavgift utan att
  säga varför
status: To Do
assignee: []
created_date: '2026-09-18 11:07'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - docs/research/betalningsytan-tre-prodobservationer-2026-09-18.md
priority: medium
ordinal: 797000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus i prod 2026-09-18: fyra markerade personer → bulkregistreringen → "kunde inte välja anmälningsavgift under Sätt alla belopp, varför?" Mekanism: `VariantC.tsx:702–704` disablar ett läge när `lagesTraffar.get(lage) === 0` (`371–374`, `bekraftelsesteg-harledningar.ts:313–323`); avgiftskandidaten finns bara när `avgiftKvar > 0` och `avgiftKvar !== kvar` (`inkorg-harledningar.ts:420`). Medvetet och testat (TASK-402.8) — men togglen är avstängd UTAN förklaring.

Prod-belagt (S127, read-only): de markerades event (`recbZBlY4MPnYb57i`, `recrtx0xWAVCEAkWW`, `recEcT7SiszeHbiZd`) har `Pris (kr)` 2 500 men TOMT `Anmälningsavgift (kr)`; Eventinnehållets numeriska standardfält är tomma på alla sju rader (en rad bär bara fritexten "1000:-"). `hamta-oppna-betalningar` ger därför `anmalningsavgift: null` → ingen avgiftskandidat → läget stängs. Endast ett event i prod (`recPSBvKXcjDUpnkF`) bär avgift (1 000). Datat fylls av Marcus/Lotta (eget moment; TASK-346.15 gör det möjligt via appen) — DETTA kort gäller bara att ytan ska säga varför.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett avstängt läge under Sätt alla belopp bär en synlig, kort förklaring i Lottas språk (t.ex. att ingen av de valda har en anmälningsavgift angiven på sitt event) — kopplad med aria-describedby
- [ ] #2 Rött-först: test där alla markerade saknar avgiftskandidat — i dag ingen förklaring i DOM, efter fix finns den; läget med blandat urval oförändrat
- [ ] #3 Bekräftelsestegets facit kontrollerat: är ytan stämplad går ändringen som amendering med Marcus stämpel, annars ögonmätning före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
