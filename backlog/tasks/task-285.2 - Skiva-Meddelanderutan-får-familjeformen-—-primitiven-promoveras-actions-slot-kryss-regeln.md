---
id: TASK-285.2
title: >-
  Skiva: Meddelanderutan får familjeformen — primitiven promoveras,
  actions-slot, kryss-regeln
status: To Do
assignee: []
created_date: '2026-08-21 10:55'
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
- [ ] #1 MessageBox i alla fyra intents är identisk med facit tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json ytan meddelanderutan (ingen kontur, vänsterkant, tonad bakgrund, rubrik i intent-färg, neutral brödtext)
- [ ] #2 actions-slotten renderar knappraden högerställd under texten; sektionsfelet konsumerar den och placerar ingen egen knapp
- [ ] #3 onDismiss på intent error eller warning är omöjligt eller fäller tydligt; info och success visar krysset på rubrikens linje i liv med högerkanten
- [ ] #4 prefers-contrast: more ger kontur i full intent-färg — verifierat med emulering i testmiljön
- [ ] #5 Rollmappningen är oförändrad: error/warning är alert, info/success är status; befintliga acceptance-tester som läser den är gröna
- [ ] #6 ariaSnapshot-paret prototyp före == primitiv efter är grönt för alla fyra intents
- [ ] #7 axe-sviten för primitiv-sidan täcker de nya exemplen med noll violations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [ ] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->
