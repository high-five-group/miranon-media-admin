---
id: TASK-61
title: >-
  Fynd: kontraktsvakten för get-event-notes mäter mot data som purge raderar —
  race ger slumpmässigt röd natt
status: To Do
assignee: []
created_date: '2026-07-28 08:45'
updated_date: '2026-07-28 10:14'
labels:
  - ready-for-agent
dependencies: []
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kontraktsvaktens get-event-notes-kontroll fällde nattkörning 30328246805 med [TOMT-UNDERLAG]: staging gav noll poster, så jämförelsen kunde inte göras. Vakten gör RÄTT som fail-closar — frånvaro av data är inte ett grönt besked. Felet ligger i vad den mäter mot.

TVÅ LAGER, OCH BARA DET ANDRA ÄR ROTORSAKEN.

(1) RACE. Jobbet kontraktsvakt har inget needs: i nightly.yml och startar samtidigt som Staging sentinel purge. Utfallet avgörs av sekunder:
  · dispatch 30309427472 (GRÖN): vakten startade 22:05:22, purge 22:05:24 — vakten läste FÖRE purge.
  · nightly 30328246805 (RÖD): purge 04:15:35→04:16:05, vakten läste 04:16:13 — åtta sekunder EFTER att purge tömt.
Skillnaden mellan grönt och rött är alltså ren timing.

(2) DESIGNLUCKAN, som är den verkliga orsaken. get-event-notes mäter mot sentinel-data som purge är DESIGNAD att radera (mönster ^ZZ-note-test\\+<uuid>@sentinel$, minAgeMinutes 60). Läsning av staging 2026-07-28 bekräftar: Anteckningar-tabellen bär fyra poster, samtliga sentineler, samtliga skapade av API-sviten 04:16-04:24 — alltså EFTER att vakten läst. Cykeln är purge tömmer → vakten läser tomt → API-sviten fyller på igen.

Jämför med de andra två endpointsen: get-events och get-registrations mäter mot PERMANENTA fixturer i staging (ZZ-belaggning-fixtur, märkt STÄDA INTE i tests/api/fixtures.ts). Anteckningar har ingen sådan.

ATT BARA LÄGGA ETT needs: FLYTTAR RACET — det stänger inte luckan. En permanent fixtur som purge-mönstret per konstruktion inte kan träffa gör vakten oberoende av körordningen.

KONTEXT SOM FÖRKLARAR VARFÖR DET INTE UPPTÄCKTES: detta var vaktens FÖRSTA schemalagda nattkörning. Den gröna nightly 2026-07-27 hade ingen kontraktsvakt alls — den byggdes i TASK-59.2 senare samma dag. Dispatchen som bokfördes som larmkedjan bevisad hade grön vakt av två sekunders timing-tur, inte för att konstruktionen höll.

VARFÖR DET BRÅDSKAR: vakten flippar slumpmässigt varje natt. En vakt som fäller utan orsak är den snabbaste vägen till att den slutar tas på allvar — samma resonemang som parkerade T87. Ärende #312 är öppet och får per CONTRIBUTING § Nattnätet inte stängas tyst.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En permanent anteckning-fixtur finns i staging som purge-mönstret PER KONSTRUKTION inte kan träffa — verifierat mot regexen i .purge-staging-policy.json, inte antaget
- [x] #2 Kontraktsvaktens get-event-notes-kontroll mäter mot den permanenta fixturen, aldrig mot sentinel-data
- [x] #3 Vakten ger samma utfall oavsett om den kör före, under eller efter purge — race-fönstret är stängt genom oberoende data, inte enbart genom körordning
- [x] #4 TVÅSIDIGT BEVIS: vakten grön mot den permanenta fixturen OCH fäller fortfarande vid äkta drift (prövat, inte antaget)
- [x] #5 Fixturens permanens är dokumenterad där den seedas, i samma form som ZZ-belaggning-fixturens STÄDA INTE
- [x] #6 Ärende #312 stängt med åtgärd och hänvisning till denna skiva — aldrig tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
