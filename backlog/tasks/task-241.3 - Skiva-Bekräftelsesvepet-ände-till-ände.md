---
id: TASK-241.3
title: 'Skiva: Bekräftelsesvepet ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-16 23:03'
updated_date: '2026-08-17 00:58'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.2
parent_task_id: TASK-241
ordinal: 457000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bekräftelsesvepet från armering till skickat: sändanrop per event-grupp under huven (useConfirmAll-mönstret återuppstår som ny konsument), resultatläge, hemmarkörer, aktivitetslogg. Täcker användarberättelser: 1, 5, 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 STOPP-VILLKOR FÖRST: Åtgärds-sidans befintliga sändkontrakt prövat för ett-anrop-per-event-grupp INNAN någon ny serverfunktions-yta designas — räcker ytan inte: STOPPA sändvägsbygget och minta EF-designkort som fynd, bokför utfallet i notes
- [x] #2 Armerat bekräftelsesvep utför ETT sändanrop per event-grupp; resultatläget per grupp (sent/partial/failed) — identisk med facit tasks/sessions/bilagor/s102-svep-konvergens/facit.json lägena skickar, resultat och fel-resultat
- [x] #3 Skickat-markörer syns på Morgonkollens rader efter svepet — KOORDINATION: hemmets filer delas med 243-kedjan, sekvensera mot pågående 243-arbete före push
- [x] #4 Svepet lämnar spår i aktivitetshistoriken per event-grupp via delade verb-copy-modulen
- [x] #5 Avbryt när som helst före armering ger noll sidoeffekter — inga anrop, inga markörer
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STOPP-VILLKOR (AC #1) — UTFALL: Åtgärds-sidans befintliga sändkontrakt RÄCKER, sändvägsbygget fortsatte. dataSource.sendActionEmail (AirtableAdapter.ts rad 493-506, SupabaseAdapter.ts) tar {eventId, registrationIds[]} och gör ETT postEdgeFunction-anrop per invocation OAVSETT registrationIds.length — redan bulk PER EVENT (verifierat i källkod, inte antaget). Kallas en gång per event-grupp ger därmed exakt ADR-114 beslut 3 (ett sändanrop per event-grupp) utan någon ny EF-yta. Inget EF-designkort myntat.

Nya filer: src/components/events/atgarder/atgardsutfall.ts (Utfall/skalForSkip/verkligtUtfallTillUtfall ren flytt ur AtgardsSida.tsx, samma mönster som atgardsmallar.ts) · src/data/mutations/svepSend.ts (useSendSvep, hemvist-vakts-kompatibel) · src/components/svep/ResultatVy.tsx (promoverad ur dev/svep-prototyp/SvepOverlay.tsx § ResultatVy) · tests/acceptance/svep-bekraftelse-send.acceptance.test.ts. Ändrade: AtgardsSida.tsx (importerar från atgardsutfall.ts i stället för lokala defs, beteende oförändrat — bevisat via atgarder-bekraftelsemail-send.acceptance.test.ts 3/3 gröna), SvepOverlay.tsx (skicka() skarp, lage-maskin, ResultatVy), Hem.tsx + NyaAnmalningar.tsx (AC #3 skickat-markörer, session-lokalt minne — se komponentens docblock för öppet bokförd begränsning: rensas ej automatiskt). KOORDINATION 243.3: fix/task-243-3-hem-acceptance-omskrivning var vid push fortfarande opushad lokal gren (git fetch verifierat) — sekvenserades genom att bygga AC #3 sist och rebasa mot origin/main (som fick in 241.2, PR #1464, commit 87cf5119) före push; ingen konflikt att lösa eftersom 243.3 aldrig nådde origin under bygget.

Observerat, ej mitt fel men bokfört öppet: hem-laddlage.acceptance.test.ts (opåverkad kodväg, laddläget rörs inte av denna skiva) fällde EN gång per körning i två 1-3-workers-körningar (olika test bägge gångerna: 'axe 0 violations i laddläge' resp. 'reduced-motion'), men gick 5/5 grönt i en tredje isolerad 1-worker-körning med bekräftat ledig port. Sammanfaller med att fix/task-243-3-hem-acceptance-omskrivning körde EGEN vite --port 5399 konkurrerande om samma HÅRDKODADE acceptance-port (playwright.config.ts ACCEPTANCE_DEV_PORT=5399, ingen per-worktree-parametrisering) — bekräftat via ps: lsof -ti:5399 pekade på .claude/worktrees/agent-a0643f4d216a525fa/node_modules/.bin/vite. Klassat som pre-existing miljö-flake/resurskonkurrens, inte en regression av denna skiva — inga kodändringar i laddläges-grenen (NyaAnmalningar.tsx anmalDataPending-branch orörd).

SENASTE KOORDINATIONSLÄGE VID PUSH (git fetch precis före denna rad): fix/task-243-3-hem-acceptance-omskrivning landade som PR #1470 EFTER att jag byggde AC #3 mot en oberoende bas — PR #1470 är TEST-ONLY (tests/acceptance/hem-laddlage.acceptance.test.ts, hem.acceptance.test.ts, hem-senaste-aktivitet*.test.ts, tre e2e-filer; gh pr diff 1470 --name-only verifierat), rör INGA src/components/hem/*-filer. Ingen merge-konflikt att vänta. Kvarstående, ej av mig löst risk: PR #1470:s omskrivna hem.acceptance.test.ts/hem-laddlage.acceptance.test.ts är skriven oberoende av mina skickat-markörer (AC #3) — när båda PR:erna landat bör någon verifiera att 243.3:s nya assertions inte antar NOLL extra rader i NyaAnmalningar-listan. Flaggat till orkestreraren, inte löst här (243.3:s diff är inte min att ändra).
<!-- SECTION:NOTES:END -->
