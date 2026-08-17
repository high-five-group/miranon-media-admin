---
id: TASK-255
title: 'Fynd: kontraktsvaktens fixtur ikapp basdimensionerna (Kursfamilj/Kursnivå)'
status: Done
assignee: []
created_date: '2026-08-17 06:46'
updated_date: '2026-08-17 07:20'
labels: []
dependencies: []
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nattnätet 2026-08-17 (run 31987759931, issue #1483) föll i jobbet Kontraktsvakt (fixtur mot skarp staging): 2 failed / 8 passed.

ROTORSAK (verifierad, ej hypotes): TASK-249.4 (commit 63384db2, 2026-08-17 03:49:40 +0200) lade AVSIKTLIGT till basdimensionerna Kursfamilj/Kursnivå i läsvägen — get-events/index.ts och get-event/index.ts exponerar kursfamilj/kursniva, och Event.schema.ts + Event.ts bär dem typade. Samma commit rörde INTE tests/support/fixturvarld/fixture-data.ts (0 träffar i git show --name-only). Fixturvärlden speglar därmed en äldre svarsform än den skarpa Edge Functionen.

Detta är alltså vaktens fall 2 i sin egen anvisning ('Ändrad med avsikt ⇒ uppdatera fixturen'), INTE en trasig staging-bas och INTE ett kontraktsbrott i koden. Schemat är redan ikapp; endast fixturen släpar.

LOGGENS ORD (run 31987759931, jobb 95265601360):
- get-events: '[FIXTUREN-BAKOM] Staging levererar 2 nyckel/nycklar som fixturen saknar · kursfamilj skarp typ: null | sträng (i 86/86 skarpa poster) · kursniva skarp typ: null | sträng (i 86/86 skarpa poster)'
- get-event (recIFrxHZw165ycXk): samma klass, 'kursfamilj skarp typ: sträng (i 1/1)', 'kursniva skarp typ: null (i 1/1)'

PRECEDENT: samma fixklass som commit 46440419 'fix(tests): [TASK-59.2] fixturen ikapp get-registrations skarpa form'. (Nattens 2026-07-28-instans, issue #312/TASK-61, var en ANNAN rotorsak — purge-race + designlucka — och är inte mallen här.)

FORMVALET: fixturens tre event får dimensionerna med värden som är sanna både om SVARETS FORM och om DOMÄNEN (KURS_KARTA i supabase/functions/_shared/course-dimensions.ts). Listprofilen ska bära null|sträng för båda nycklarna (paritet med stagings 86/86), och EVENT_DETAIL_RESPONSE — som spreadar events[0] — ska bära kursfamilj=sträng + kursniva=null (paritet med get-events 1/1-form). Nivålösa familjer (Fjärrskådning/Psionautics) har kursniva null per design, därför bär events[0] den kombinationen. Inga vyer läser fälten (grep src/: endast Event.ts + Event.schema.ts), så inga visuella baselines rörs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fixturens EVENTS_RESPONSE bär kursfamilj+kursniva på samtliga tre event, med listprofil null|sträng för BÅDA nycklarna (paritet med stagings 86/86-form)
- [x] #2 EVENT_DETAIL_RESPONSE (spreadar events[0]) bär kursfamilj som sträng och kursniva som null — paritet med get-events skarpa 1/1-form
- [x] #3 Värdena är domän-sanna mot KURS_KARTA i course-dimensions.ts (RIM har nivå; Fjärrskådning/Psionautics är nivålösa → null; okänt kursnamn → null, aldrig gissad familj)
- [x] #4 npm run vakt:kontrakt grön lokalt: 10/10 kontraktsfall, get-events och get-event inkluderade
- [x] #5 Tvåsidigt bevis: vakten fälls fortfarande vid äkta drift (en nyckel bortplockad ur fixturen ⇒ FIXTUREN-BAKOM), dvs grinden är ikappställd, inte avtrubbad
- [x] #6 Inga vyer/baselines rörda: grep src/ visar att endast Event.ts och Event.schema.ts nämner fälten
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TVÅSIDIGT BEVIS, mätt lokalt mot skarp staging (ej projicerat):

GRÖN EFTER FIX — npm run vakt:kontrakt, exit 0: '10 passed (15.0s)'. get-events (test 2) och get-event (test 5) båda gröna.

RÖD VID ÄKTA DRIFT — samma kommando med de tre kursfamilj-raderna bortplockade ur fixturen (perl -ni), exit 1: '2 failed / 8 passed (18.8s)', båda med
  '[FIXTUREN-BAKOM] Staging levererar 1 nyckel/nycklar som fixturen saknar
     · kursfamilj   skarp typ: null | sträng   (i 52/52 skarpa poster)'   [get-events]
     · kursfamilj   skarp typ: sträng   (i 1/1 skarpa poster)'            [get-event]
Fixturen återställd med git checkout efteråt; grep bekräftar 3 kursfamilj-rader åter.

Grinden är alltså ikappställd, inte avtrubbad: exakt samma larmklass som fällde natten återkommer när driften är äkta.

OBSERVATION (data, ej form): get-events skarpa postantal var 86/86 i nattens run 31987759931 och 52/52 i den lokala körningen ~06:50Z samma dag. Volymskillnaden är staging-datans egen rörelse (sentinel-purge/API-svit), inte en formskillnad — vakten jämför form, och båda körningarna ger samma nyckeluppsättning.

GRINDAR (exitkoder mätta separat, aldrig via pipe): npm run typecheck = 0 · npx @biomejs/biome check . = 0 (7 warnings, 47 infos, inga fel) · npm run vakt:kontrakt = 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGNING (orkestreraren, 2026-08-17): PR #1497 MERGED 07:13:28Z via merge-kön (main 5ce7666c→#1497-mergen); kö-bygget körde per-jobb-checks gröna mot main + föregående poster — DoD 3 därmed betald. Rotorsaken (fixtur-drift efter TASK-249.4:s avsiktliga EF-utökning) åtgärdad med form-paritet, inte larm-tystnad.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
