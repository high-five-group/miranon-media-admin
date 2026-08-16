---
id: TASK-209
title: 'Prototyp: check-in variant D - dorrlistan i appens designsprak'
status: Done
assignee: []
created_date: '2026-08-13 18:40'
updated_date: '2026-08-16 12:08'
labels: []
dependencies: []
ordinal: 383000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S105-omtag av check-in-prototypen efter att Marcus underkant A/B/C rakt av. Variant D bygger dorren i appens EGNA stamplade designsprak (personlistans tonala kortyta, Hem-facitets primar-tintade kort, riktiga knappar) och driver listan ur ANMALNINGARNA med deltagandet som statuslager. DEV-grindad, read-only, kastbar per throwaway-kontraktet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Variant D nabar pa /event/$eventId/narvaro?variant=d och ar DEV-grindad
- [x] #2 A/B/C fungerar oforandrade
- [x] #3 Listan ar sessions-scopad: 32 deltaganden for 16 personer ger 16 rader, och incheckning pa Dag 1 lacker inte till Dag 2
- [x] #4 Sessionens harledning visas alltid explicit och ar overstyrbar
- [x] #5 Ingen mutation kopplas in - inga operationKey mot Deltaganden
- [x] #6 Grindarna grona: typecheck, biome, test:api, build
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
## Itereringspass S105 (2026-08-13, efter Marcus dom "inte tillräckligt bra")

Analys mot stämplat facit (personlistans slutlage-tonal-*, Hem k10-facit) plus egna
skott av D mot granskningsfixturen reckgn7arcyW367qT. Sex avvikelser mätta, fyra
åtgärdade i koden, två bokförda öppet.

**Veck-defekten, mätt (390x844, första ÅTGÄRDBARA raden):**
- före, 0 incheckade: 427 px | efter 5 incheckningar: 752 px, underkant 817 px,
  tabbaren börjar 768 px -> raden var KLIPPT, 16 av 65 px synliga
- efter, 0 incheckade: 367 px | efter 5 incheckningar: 419 px (konstant, drivs
  inte längre av hur långt kvällen gått)

**Orsaken var inte den antagna.** Uppdraget bokförde "incheckade sorteras överst";
sorteringen är alfabetisk (byggRaderD, namn.localeCompare) och ingenting flyttar
sig alls. Just därför uppstod defekten: klara rader låg kvar och nästa åtgärdbara
rad vandrade 65 px nedåt per incheckning.

**Åtgärdat:** (1) arbetslistan bär bara det som återstår, klara i kollapsad grupp
längst ned; (2) guld-inverteringen borttagen (bg-primary-muted-bocken markerade
FÄRDIGT arbete med husets uppmärksamhetsfärg); (3) båda "Senast incheckade"-
panelerna ersatta av en kvitto-rad i framstegskortet; (4) topp-materialet
komprimerat från sju likformiga block till differentierad luft.

**Premiss-divergens:** uppdragets påstående att ingen stämplad yta lägger innehåll
utanför AppShells 600 px-spalt är FALSKT - Hem k10-facit gör det (Hem.tsx:68-71 +
SenasteAktivitet.tsx:109, absolute bottom-0 left-full). Panelen togs ändå bort, på
annan grund: den duplicerade sin granne och dess knappar vägde tyngre än radens.

**Öppet för Marcus:** knappkolumnen (outline-kanten löses till neutral-800) är
fortfarande sidans tyngsta grafik. subtle prövades i varv 3 och blev sämre (död grå
platta). Att skala ned till ikonknapp utan etikett river den synliga etiketten och
går emot domen som fällde A/B/C - den växlingen är Marcus, inte agentens.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat och CI-verifierat över flera PR:er (#1259, #1266, #1277, #1284 — S105-iterering + S103-konvergens). Samtliga AC + DoD 1/2/4 var bockade sedan 2026-08-13; endast DoD #3 (CI grön) saknade bock trots landad, CI-grön kod. Stängt av backlog-stängningsgrinden (TASK-238, invariant 1).
<!-- SECTION:FINAL_SUMMARY:END -->
