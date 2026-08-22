---
id: TASK-285.2
title: >-
  Skiva: Meddelanderutan får familjeformen — primitiven promoveras,
  actions-slot, kryss-regeln
status: Done
assignee: []
created_date: '2026-08-21 10:55'
updated_date: '2026-08-22 08:25'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-285
ordinal: 517000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: varje fel, varning, kvitto och info-ruta inne på sidorna ser likadan ut: ingen kontur, en 4 px vänsterkant i intent-färgen, tonad bakgrund, rubrik i intent-färg, neutral brödtext, och knappar — när det finns några — högerställda under texten på en rad primitiven äger. Ett fel eller en varning kan aldrig stängas bort med kryss; ett kvitto eller en info kan, och krysset sitter på rubrikens linje i liv med rutans högerkant. I högkontrastläge får rutan en kontur i full intent-färg. Sektionsfelet ('den här delen kunde inte visas') använder samma ruta och samma knapprad.

FORMEN ÄR LÅST: facit tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json ytan meddelanderutan. Den körande prototypen är MessageBoxPrototyp vid /dev/notis-prototyp?variant=1 (varv 4). Promoveringen (ADR-103) flyttar formen IN i primitiven MessageBox: cva-varianterna, actions-propen, kryss-regeln (error/warning nekar onDismiss — typmässigt eller med tydligt fel i dev), contrast-more-konturen. Sektionsfelet byter sin egenplacerade knapp mot actions-slotten (dess TEXT ändras i copy-skivan, dess chunk-beteende i egen skiva). Primitiv-sidan (/dev/primitives) visar alla fyra intents med och utan knapprad och kryss så axe-sviten täcker dem. Prototyp-routen och MessageBoxPrototyp RIVS INTE här.

ORDNING (ADR-103 B4): ariaSnapshot-referens av prototypens fyra intents FÖRE flippen; efter flippen ska primitiven ge identisk snapshot. Komponent-tokens som bara bar den gamla konturen tas bort eller märks oanvända — inga nya tokens. Test-konsument-svepet: alla tester som läser MessageBox-rollmappningen (acceptance, a11y) körs och uppdateras i samma commit om markup ändrats.

Täcker användarberättelser: 8, 9, 10, 17, 21
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MessageBox i alla fyra intents är identisk med facit tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json ytan meddelanderutan (ingen kontur, vänsterkant, tonad bakgrund, rubrik i intent-färg, neutral brödtext)
- [x] #2 actions-slotten renderar knappraden högerställd under texten; sektionsfelet konsumerar den och placerar ingen egen knapp
- [x] #3 onDismiss på intent error eller warning är omöjligt eller fäller tydligt; info och success visar krysset på rubrikens linje i liv med högerkanten
- [x] #4 prefers-contrast: more ger kontur i full intent-färg — verifierat med emulering i testmiljön
- [x] #5 Rollmappningen är oförändrad: error/warning är alert, info/success är status; befintliga acceptance-tester som läser den är gröna
- [x] #6 ariaSnapshot-paret prototyp före == primitiv efter är grönt för alla fyra intents
- [x] #7 axe-sviten för primitiv-sidan täcker de nya exemplen med noll violations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [x] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGNINGSPASS (register-only, 2026-08-22): PR #1707 (merge-SHA 0c4fbfd4), CI grön per jobb (gh pr checks 1707 — samtliga pass/förväntat skip). DoD #2/#5/#6/#7/#8 belagda via PR-beskrivningens detaljerade AC-tabell och grindlista (typecheck/biome/build/test:api 574/574 api-pure gröna, test:a11y 109/109, test:visual 8/8, facit-sökvägar citerade, ariaSnapshot 8/8, test-konsument-svep ~45 grep-träffar uppräknade, DoD #8 explicit 'inga nya design-tokens'). DoD #4 verifierat mot gh pr diff --name-only (16 filer, samtliga komponent-/rutt-/testfiler i scope). AVVIKELSE FRÅN UPPDRAGETS PREMISS (flaggad, se slutrapport): AC-listan i detta kort stod HELT OBOCKAD trots att koden är landad och PR-beskrivningen dokumenterar bevis för samtliga 7 AC med testfilscitat. DoD #1 ('Alla acceptanskriterier avbockade via task edit --check-ac') KAN DÄRFÖR INTE bockas av mig — mitt uppdrag auktoriserar endast --check-dod, inte --check-ac, och AC-rutorna är mekaniskt sett fortfarande tomma i kortet. Kortet lämnas ÖPPET. Rekommendation till orkestreraren: antingen auktorisera en uppföljande --check-ac-passering mot den redan dokumenterade bevisningen, eller granska varför AC aldrig bockades (trolig sessions-avbrott hos byggagenten).

RÄTTELSE till ovanstående stängningsnot: jag skrev felaktigt att AC-listan stod obockad — en läsfel från min sida. Vid direkt kontroll (npm run bl -- task 285.2 --plain) är samtliga 7 AC redan [x] avbockade, precis som uppdragets premiss 2 påstod. DoD #1 ('Alla acceptanskriterier avbockade') är alltså belagd via direkt läsning av kortet och bockas nu. Ingen faktisk avvikelse förelåg — avvikelsen fanns i min egen läsning, inte i kortet. Bokförd för spårbarhet.
<!-- SECTION:NOTES:END -->
