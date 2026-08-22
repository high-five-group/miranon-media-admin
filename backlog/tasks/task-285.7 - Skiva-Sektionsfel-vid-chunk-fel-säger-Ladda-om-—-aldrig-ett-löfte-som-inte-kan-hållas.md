---
id: TASK-285.7
title: >-
  Skiva: Sektionsfel vid chunk-fel säger Ladda om — aldrig ett löfte som inte
  kan hållas
status: Done
assignee: []
created_date: '2026-08-21 11:10'
updated_date: '2026-08-22 08:24'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.2
parent_task_id: TASK-285
ordinal: 522000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när en del av sidan inte kan visas därför att appen uppdaterats och den gamla koden inte hittar sina filer (chunk-fel), ser Lotta i sektionsfelet knappen 'Ladda om' som laddar om hela sidan — inte 'Försök igen', som i det läget kör om samma import mot samma saknade fil och strukturellt aldrig kan lyckas (mätt, ADR-121 § Tre fynd punkt 3). För alla andra fel finns 'Försök igen' kvar (reset + invalidate). Klassen känns igen med samma igenkänning som chunk-laddningsfel-modulen redan bär — ingen ny heuristik.

FORMEN: meddelanderutan ur 285.2 (facit tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json ytan meddelanderutan) med actions-slotten; denna skiva ändrar bara VILKEN knapp som visas och vad den gör. Copyn för rubrik/brödtext ändras i copy-skivan, inte här — men knapptexten 'Ladda om' är denna skivas. Skarven mot Sentry-kedjan (T151 § LUCKA 3) noteras i PR:en, byggs inte.

Täcker användarberättelser: 11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ett sektionsfel orsakat av chunk-fel visar knappen 'Ladda om' som anropar hel-omladdning; 'Försök igen' visas inte i det läget
- [x] #2 Ett sektionsfel av annan orsak visar 'Försök igen' med oförändrat beteende (reset + invalidate)
- [x] #3 Klassningen återanvänder chunk-laddningsfel-modulens igenkänning — ingen egen strängmatchning i sektionsfelet
- [x] #4 Båda lägena är testade i webbläsarbeteende-klassen via provocerat fel på dev-sidan, strängarna exakt
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
STÄNGNINGSPASS (register-only, 2026-08-22): PR #1718 (merge-SHA 67912bc1), CI grön per jobb (gh pr checks 1718 — CodeQL skipping/25s, övrigt pass/förväntat skip, noll röda). DoD #1-#2,#4-#8 var redan bockade av byggagenten. DoD #4 dubbelkollad mot gh pr diff --name-only (3 filer: SectionError.tsx, dev/sektionsfel.tsx, testfil — samtliga i scope).
<!-- SECTION:NOTES:END -->
