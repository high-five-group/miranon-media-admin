---
id: TASK-201.8
title: 'Skiva: Filterraden (B-målet)'
status: Done
assignee: []
created_date: '2026-08-11 20:27'
updated_date: '2026-08-12 22:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.6
parent_task_id: TASK-201
ordinal: 373000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta hittar en specifik händelse med max ett klick — kategori, event eller tidsperiod. Återbruk av färdiga primitiver; EF-kontraktet från 201.5 bär redan parametrarna så ingen serverändring ingår. Detta fullbordar B-målet (S105 Del 2 beslut 1).

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Filterrad ovanför kärnvyns lista: kategori-dropdown + event-dropdown (Select-primitiven) + tidsperiod (ToggleButtonGroup: Idag / 7 dagar / 30 dagar / Allt); klientfiltrering över hämtad lista
- [x] #2 Tomläge för "inga träffar med detta filter" — skilt från första-gången-tomläget
- [x] #3 A11y: labels på alla kontroller, full tangentbordsväg, axe grönt
- [x] #4 Filtervalens URL-state-hantering prövas mot URL-STATE-SPEC:s mönster vid bygget (mät mot specen, anta inte) och utfallet bokförs i notes
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
AC #1 – ÖPPET BOKFÖRD AVVIKELSE mot AC-ordalydelsen 'klientfiltrering över hämtad lista': faktisk kod (TASK-201.5) säger raka motsatsen på TVÅ ställen — ActivityLogFilters filhuvud (src/domain/types/Filters.ts): 'Server-side (get-activity-log-EF), inte klient-side', och queryKeys.activityLog.history filhuvud (src/queries/keys.ts): 'Nyckeln bär FILTERPARAMETRARNA ... de ändrar VILKEN datamängd get-activity-log-EF:en hämtar server-side'. get-activity-log-EF:en har redan fullt category/eventId/from/to-stöd (dess eget filhuvud). Byggt därför som SERVER-SIDE filtrering via de redan existerande EF-parametrarna, inte som ett array-filter över den delvis laddade sidan — ett äkta klientfilter hade varit trasigt mot en keyset-paginerad, ännu-inte-fullt-laddad lista (exakt den pagineringsbugg uppdraget varnade för). Kortets egen beskrivningstext ('EF-kontraktet från 201.5 bär redan parametrarna så ingen serverändring ingår') stämmer och pekar mot samma slutsats. Full källmärkning i AktivitetsHistorik.tsx:s filhuvud.

AC #4 – URL-STATE-SPEC-avstämning (mätt, inte antaget): specens /event-avsnitt är den exakta precedenten (nuqs, parseAsString för fria dropdown-värden, parseAsStringEnum för begränsade, history:'push' för filter/flikar). Denna vy speglar formen 1:1 — ?kategori (parseAsStringEnum, nollbar), ?event (parseAsString, nollbar — eventId-mängden är datadriven precis som ?typ/?ort), ?tidsperiod (parseAsStringEnum().withDefault('allt') — clearOnDefault ger ren URL vid 'Allt'). Verifierat i acceptance-test (AC #4-testet): URL uppdateras vid filterval, Back-knappen återställer föregående filterläge. Utfall: specens etablerade mönster bar filtret rakt av, inget nytt URL-idiom behövdes.

Filterbyte mitt i paginering: useActivityLogHistory(filters) inkluderar redan filters i queryKey (TASK-201.5-design) — ett filterbyte är därför en NY React Query-cache-post, och useInfiniteQuery startar automatiskt om vid pageParam=null för den nya nyckeln (ingen manuell cursor-reset skriven). Bevisat i acceptance-test 'filterbyte mitt i paginering': efter Ladda fler (sida 2 hämtad) och ett filterbyte bär det NYA anropet ingen cursor, och de gamla sidorna försvinner ur listan. placeholderData: keepPreviousData lades till i useActivityLogHistory (src/data/queries/useActivityLog.ts) så filterraden aldrig unmountas under ett filterbyte (annars hade isPending blivit sant och slagit om till den bara laddningsgrenen utan filterrad — fokus-tapp, AC #3). Negativ-kontroll körd: med placeholderData borttaget fäller testet exakt på assertionen 'filterraden är kvar mitt i flödet' (400ms-fördröjd mock-respons); återställt och grönt igen.

MERGE-KONFLIKT + FAKTAGRUNDS-DRIFT (post-armering, egen byggsession): PR:ens ursprungliga bas (430a8156) hann bli 8 commits bakom main innan armering — mergeStateStatus=CONFLICTING vid första gh pr merge --auto. TASK-201.12 (personId-navigering, landad PR #1233) ändrade AktivitetsHistorik.tsx i samma sektion (Navigeringsmålet/AktivitetsRad) som denna skiva rör indirekt (importblocket) — löst med git merge origin/main, en enda konfliktrad (importblocket), verifierad manuellt. STÖRRE FYND: TASK-201.4 (resterande mutationer, landad samtidigt) VÄXTE ACTIVITY_OBJECT_TYPES från de TRE piloterna (betalning/bekraftelse/mail — vad som fanns vid denna skivas branch-punkt och vad förstudien verifierade) till NIO kategorier (+ anmalan/boende/kvitto/event/flagga/anteckning, PRD användarberättelse 9 ordagrant). Fångades MEKANISKT av typecheck (Record<KategoriKey,string> är komplett, inte KATEGORI_VALUES-arrayen ensam) omedelbart efter merget — inte av manuell granskning. KATEGORI_VALUES/KATEGORI_LABEL uppdaterade till alla nio, PRD-ordningen. Samtliga grindar omkörda GRÖNA efter fixen (typecheck/biome/build/test:api 711 passed/acceptance 17 passed). Detta är ett konkret exempel på ADR-086: 'din worktree skapas ur ett ögonblicks-main och kan vara bakom' — verifierat rätt VID DESIGNTILLFÄLLET, förlegat vid ARMERINGSTILLFÄLLET, upptäckt av en grind byggd just för att fånga den klassen fel.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd som ren bokföring (kod redan landad, kortet stod kvar på To Do). Landat via PR #1237, merge-SHA 417537f5 (main, 2026-08-12T21:49:00Z). AC #1-4 och DoD #1-2/4 var redan avbockade av byggaren, inkl. öppet bokförda avvikelser (AC #1 server-side i stället för klient-side filtrering, källmärkt mot faktisk EF-kontrakt-kod) och en merge-konflikt-lösning mot main under armering. DoD #3 (CI grön per jobb) verifierad här: gh pr checks 1237 — samtliga required-jobb pass (Docs link check, Test suite/Acceptance (hermetisk), Test suite/Pure+Build, Test suite/Webblasarbeteende, Analyze x2, CodeQL, Detect changed files, Lint+Audit+TypeCheck, CI Passed or Skipped, Vercel); Staging/A11y/Staging sentinel purge skipping (diff-gated, ingen fällning). Post-merge-sviten (post-merge.yml, run 31644238298, väntades ut i förgrunden till completed/failure) föll på SAMMA test som TASK-201.4: tests/e2e/event-bekraftelse.staging.test.ts:409 (markera-läget förskjuter inte sidans innehåll vertikalt) — verifierat via gh pr diff 1237 --name-only att filen INTE ingår i PR:ens diff (diffen bär kortfil, AktivitetsHistorik.tsx, useActivityLog.ts, mer-aktivitetshistorik-filter.acceptance.test.ts). Strukturellt icke-blockerande; bokförs öppet som transient/orelaterat och refereras till TASK-205, ingen åtgärd tagen. Inga orelaterade filer i PR-diffen. Inga divergenser mot uppdragets premisser vid denna stängning.
<!-- SECTION:FINAL_SUMMARY:END -->
