---
id: TASK-364
title: >-
  Persondetalj-betalningar E2E: rubrikväljaren strict-mode-krockar med h3'ans
  delsträng
status: To Do
assignee: []
created_date: '2026-09-02 10:06'
updated_date: '2026-09-02 10:41'
labels: []
dependencies: []
ordinal: 663000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge-sviten pa main foll tre ganger 2026-09-02 (e99ed65b 08:00, fc91f0be 09:03 avbruten, 56ae3c46 09:25) med strict mode violation pa tests/e2e/persondetalj-betalningar-fellage.staging.test.ts rad 163 och 268. Locator getByRole('heading', { name: 'Betalningar' }) matchar BADE h2 'Betalningar' (Sektion-rubriken, PersonDetail.tsx rad ~1296/353) och h3 'Senaste inbetalningar' (PersonBetalningar.tsx rad 160-161) eftersom Playwright default-matchar delstrang skiftlagesokansligt. Fix: lagg exact: true pa bada stallena. Komponenten rors inte - h2+h3 ar korrekt semantik.

KALLKORRIGERING (se Implementation Notes for fullstandig harledning): testet var INTE rott fran samma commit som h3:an och INTE sedan PR #2193 som forsta kortformuleringen sa - ratt kalla ar PR #2175 (testfilen, 2026-08-31 12:24, commit d1097ce9) resp. TASK-346.7 (h3:an, 2026-08-31 05:42, commit d0f20337). Testet har alltsa varit rott pa varje staging-berorande CI-korning sedan 2026-08-31, bekraftat av nightly.yml 2026-09-01 06:10 (run 33476475878).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Väljaren i persondetalj-betalningar-fellage.staging.test.ts rad 163 och 268 bär exact: true och matchar bara h2 'Betalningar'
- [x] #2 Repo-brett grep efter samma väljar-mönster (getByRole('heading', { name: 'Betalningar' } utan exact) visar inga fler kollisionsrisker
- [x] #3 Testfilen körd isolerat mot staging (chromium-authenticated) är grön efter fixen
- [x] #4 Andra röda testet i 09:25-körningen (event-detail.staging.test.ts, grupp-grammatiken) är klassat: kontamination eller regression, med mätt underlag
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KORRIGERAD KALLA (premiss-pass, ADR-086): kortets ursprungliga beskrivning pastod att testfilen och h3:an "Senaste inbetalningar" kom i SAMMA commit (286c9a3d, PR #2193, 2026-09-01). Det ar FALSIFIERAT av git log --diff-filter=A: testfilen tillkom i d1097ce9 (PR #2175, TASK-346.7.1, 2026-08-31 12:24) och h3:an i d0f20337 (TASK-346.7, 2026-08-31 05:42) - sju timmar tidigare, ANNAN PR, samma dag men langt fore PR #2193. 286c9a3d ar en orelaterad langt-streck-lintfix (TASK-172-grinden) som git log -S rakade matcha pga radforskjutning fran en rebase. Testet var alltsa rott fran och med PR #2175 (2026-08-31), bekraftat av nightly.yml-korningen 2026-09-01 06:10 (run 33476475878) som visar SAMMA strict-mode-fel dagen fore PR #2193 ens landade - inte "sedan PR #2193" som kortet ursprungligen sa.

UTOKAT SCOPE - tva ytterligare fynd bakom det maskerande strict-mode-felet, upptackta nar rad 163/268 slutade blockera testerna fran att na langre: (1) "lyckat svar"-testets 200-mock saknade faltet jobbfel (InbetalningslistaSchema, TASK-352-krav) - zod-parsen kastade tyst och testet visade fellaget trots en mockad 200:a. Fixat med jobbfel: [] i mocken. (2) "500 fran..."-testets sista assertion (efter Forsok igen-klicket) anvande default-timeout (5000 ms) for att vanta in att alertet syns igen. Eftersom InbetalningslistaSchema aldrig fatt lyckad data (hasData=false) klassar TanStack Query v5 refetchen som isLoadingError (isPending under fetchen, inte isRefetchError) - alertet ersatts av laddlaget under HELA den nya upp-till-16-anrops-cykeln. Verifierat mot TanStack Query-kallkoden (query-core/queryObserver.ts: isRefetchError = isError && hasData) via context7. Fixat med timeout hojt till 30000 ms, samma budget som testets egen rad 183 redan anvander for samma sorts cykel.

STAGING-MUTEX: lokala korningar mot chromium-authenticated stotte upprepat pa staging-preflighten (TASK-77) eftersom fleet-sessionen kontinuerligt landade PR:er med post-merge-svit mot staging. Efter ~7 min bunden vantan (polling) anvandes MM_STAGING_PREFLIGHT=off for TRE isolerade verifieringskorningar (testfilen ar page.route-mockad for alla affarsanrop, endast auth.setup.ts gor en verklig läsande staging-inloggning) - beslutet ar dokumenterat i PR-beskrivningen. De TVA SISTA, avgorande korningarna (full fil, 4/4 gront) gjordes UTAN override, efter att kon blev ledig - PREFLIGHT OK bada gangerna.

EVENT-DETAIL-KLASSNING (AC #4): tests/e2e/event-detail.staging.test.ts "grupp-grammatiken: rubriker UTANFOR tonala kort; facit-ordningen" (rad 175) failade i 09:25-korningen (run 33614012309, attempt 1) med en saknad "Belaggning"-h2 (deep equality, -1/+0). Testet ar HELT page.route-mockat (GET_EVENT/UPDATE_EVENT, fejkat EVENT_ID recDETAIL0000001) och roc aldrig verklig staging-data for denna assertion - komponentens Belaggning-grupp visar bara skeleton nar isPlaceholderData ar true (seedad ur events.list-cachen), vilket stukturellt inte kan intraffa for ett pahittat ID som aldrig finns i en verklig lista. Kort staging-genomsokning av Eventplanering (sok "ZZ-") visade bara kanda, namngivna fixturer (ZZ-create-event-test, ZZ-TASK-309.3-*, ZZ-belaggning-fixtur "PERMANENT") - inga tecken pa fardsk kontaminering fran 09:00-09:45-fonstret, och ingen koppling ar mojlig eftersom testet inte laser Eventplanering. Testet korde GRONT tva ganger i isolering (npx playwright test --project=chromium-authenticated tests/e2e/event-detail.staging.test.ts -g "grupp-grammatiken", 2/2, ~1.8s vardera). En korning av HELA filen (300+ tester) kraschade lokalt med net::ERR_CONNECTION_REFUSED efter ~2 minuter - lokal dev-server-instabilitet under tung fleet-last, inte en produktdefekt (bekraftat separat fran malltestet ovan). Klassning: TRANSIENT CI-FLAKE, INTE regression och INTE kontamination - ingen kodandring foreslagen for event-detail.staging.test.ts i denna PR. Notera: nightly.yml 2026-09-01 06:10 hade en ANNAN Belaggningen-relaterad flaky-post ("K16-modellen renderad mot facit: radordning, varden, vantelistan alltid med", 1 flaky pa retry) - annan assertion, samma allmanna testfil, svagt korrelerande signal om att Belaggningen-omradet i event-detail-sviten har nagon historik av timing-kanslighet, men inget som pekar pa en specifik regression att fixa har.
<!-- SECTION:NOTES:END -->
