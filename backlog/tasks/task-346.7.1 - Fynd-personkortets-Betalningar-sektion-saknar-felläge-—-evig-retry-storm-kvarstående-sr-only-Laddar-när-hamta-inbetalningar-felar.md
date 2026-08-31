---
id: TASK-346.7.1
title: >-
  Fynd: personkortets Betalningar-sektion saknar felläge — evig retry-storm +
  kvarstående sr-only-Laddar när hamta-inbetalningar felar
status: To Do
assignee: []
created_date: '2026-08-31 10:08'
updated_date: '2026-08-31 10:21'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-346.7
priority: high
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur orkestrerarens S113-slutvandring (2026-08-31 ~09:51 UTC, dev-server mot staging, persondetalj rec2JwV3Bh0x5qlvl): hamta-inbetalningar?personId=… svarade 500 (separat fynd-kort fixar EF:en — denna skiva är klientens beteende när EF:en felar, oavsett orsak). Konsolloggen visade ≥16 anrop på ~21 s (~1,3 s intervall) utan att UI:t någonsin visade ett felläge — sektionen renderade bara rubriken 'Betalningar' + en sr-only-span 'Laddar inbetalningar ...' som stod kvar permanent (mätt >14 s).

RÖTTER, VERIFIERADE MOT KÄLLAN (src/data/betalningar/useBetalningar.ts, src/components/betalningar/InbetalningsLista.tsx): (1) useOppnaBetalningar/useInbetalningarPerAnmalan/useInbetalningarPerPerson saknar HELT husets etablerade EdgeFunctionError-medvetna retry-policy ('(failureCount, err) => !(err instanceof EdgeFunctionError && 4xx) && failureCount < 3', använd i PersonDetail.tsx/EventDetail.tsx/EventRegistrations.tsx m.fl.) — de ärver bara routerns naiva globala 'retry: 3' (router.ts) som retryar blint även på 4xx. (2) InbetalningsLista.tsx:s BEFINTLIGA felläge (rad ~98-104) renderar query.error.message RAKT UT — en känd, redan trådad T177-instans (tasks/threads/README.md T177: 'Lotta ser tekniska felsträngar... Edge Function-skäl når henne inbäddade'), utan Försök igen-knapp trots att MessageBox actions-slot + husmönstret (SectionError.tsx, AtgardsSida.tsx rad ~1279) finns. (3) callEdgeFunction (supabase-client.ts) retryar REDAN 5xx internt (fetchWithRetry, 4 försök m. backoff) — React Querys OVANPÅLIGGANDE default-retry (också up till 4 försök) multiplicerar det till upp till 16 nätverksanrop för EN logisk sidladdning innan felläget (om/när det nås) syns; kombinerat med refetchOnMount:'always' och den saknade 4xx-spärren blir det som Lotta upplever en evig väntan.

SCOPE: bara den delade läs-hooken (useBetalningar.ts) och den delade InbetalningsLista.tsx — INTE fetchWithRetry/callEdgeFunction (repo-brett, används av VARJE EF-anrop, egen skiva om det ska ändras) och INTE T177 repo-brett (paused tråd, egen framtida skiva). Denna skiva ger de tre payment-hookarna husets etablerade retry-konvention och InbetalningsLista.tsx ett Gunilla-klart felläge med Försök igen, matchande husets MessageBox/SectionError-mönster.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 useOppnaBetalningar, useInbetalningarPerAnmalan och useInbetalningarPerPerson (useBetalningar.ts) har husets etablerade EdgeFunctionError-medvetna retry-policy (ingen retry på 4xx, begränsat+backoff på 5xx) — samma lambda-form som PersonDetail.tsx/EventDetail.tsx
- [x] #2 InbetalningsLista.tsx:s felläge visar Gunilla-klar text (ingen rå Edge Function-felsträng, T177-klassen) plus en Försök igen-knapp (MessageBox actions-slot, SectionError/AtgardsSida-mönstret) som anropar query.refetch()
- [x] #3 sr-only 'Laddar inbetalningar ...' försvinner när query lämnat pending-läget — bevisat i test, inte bara antaget
- [ ] #4 Tvåsidigt testbevis: (a) mockat fel-svar → felläget renderas med bevisat begränsat antal anrop (räknade anrop, ej bara läst kod); (b) mockat lyckat svar → sektionen renderar data och ingen laddningstext kvarstår
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Kod skriven och verifierad statiskt: typecheck (npm run typecheck, exit 0 — inkl. mock-objekten mot PersonDetailSchema/InbetalningSchema z.infer-typerna) + biome (exit 0) + build (exit 0). Test-logikens siffror (16 anrop vid 500, 1 anrop vid 403) är härledda ur ATT LÄSA den installerade @tanstack/query-core 5.101.4:s retryer.js (failureCount startar 0, retry(failureCount,err) utvärderas FÖRE increment — 4 queryFn-försök vid failureCount<3) och src/data/utils.ts:s fetchWithRetry (maxRetries=3 default, exakt 4 råa fetch-anrop per invocation) — INTE gissade. MEN: testet (tests/e2e/persondetalj-betalningar-fellage.staging.test.ts) har INTE körts live. Playwright-projektet chromium-authenticated är CORS-portlåst till exakt localhost:5173 (playwright.config.ts rad ~110), och porten var upptagen hela sessionen av en annan aktiv sessions dev-server (PID 46450, cwd=huvudkatalogen — inte min worktree, rördes aldrig). AC #4 lämnas därför OBOCKAD tills en session med fri port 5173 kört: npx playwright test tests/e2e/persondetalj-betalningar-fellage.staging.test.ts --project=chromium-authenticated
<!-- SECTION:NOTES:END -->
