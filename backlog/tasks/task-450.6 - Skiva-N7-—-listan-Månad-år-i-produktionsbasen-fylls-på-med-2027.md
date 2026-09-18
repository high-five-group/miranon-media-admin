---
id: TASK-450.6
title: 'Skiva: N7 — listan Månad/år i produktionsbasen fylls på med 2027'
status: Done
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 12:36'
labels:
  - ready-for-human
dependencies: []
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: high
ordinal: 780000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Appen kan i dag inte skapa ett event med startdatum 2027: fältet Månad/år i produktionsbasen är en fast lista som slutar vid december 2026, och serverfunktionen felar medvetet i stället för att tyst skapa ett val. Efter skivan bär listan tolv val till (januari–december 2027). Skrivningen sker i produktionsbasen — ägarens kanal, subagenter är mekaniskt spärrade. Den riktiga lösningen (formelhärlett fält) är SE14 och ligger utanför. Spec: planens § N7.

Täcker användarberättelser: 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fältets schema läst före och efter: fjorton val blir tjugosex, inga befintliga val ändrade
- [x] #2 Skarpt i staging: ett event med startdatum 2027-01-15 skapas via create-event utan tekniskt fel (staging-basens lista fylld på samma sätt om den saknar valen)
- [x] #3 docs/reference/data-model.md § Kända fällor post 45 bär det nya slutdatumet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: schema-läsning redan mätt av orkestreraren (tasks/sessions/2026-09-17-session-126.md Del 8 § N7) — 14→26 val i BÅDA baserna 2026-09-18, inga befintliga val ändrade. Denna skiva verifierade inte om (repo-sidans agent har ingen Airtable-åtkomst mot prod, mekaniskt spärrad TASK-419).

AC2: skarpt bevisat mot staging 2026-09-18 — nya testet HORISONTVAKT i tests/api/create-event.staging.test.ts (create-event, startdatum 2027-01-15) gav 201 med record.fields['Månad/år'] = 'Januari 2027'. Kommando: PLAYWRIGHT_NO_WEB_SERVER=1 npx playwright test --project=api-pure --project=api-staging -g HORISONTVAKT tests/api/create-event.staging.test.ts -> 2 passed (auth-setup + HORISONTVAKT).

AC3: docs/reference/data-model.md §Kända fällor post 45 uppdaterad ÖPPET (2026-09-18) — nytt slutdatum December 2027 i BÅDA baserna, staging-fältets form BEKRÄFTAD (stod tidigare 'obekräftad' — fel för nuläget), skarpbeviset citerat. Källan till horisont-talet flyttad från hårdkodat intervall till en pekare mot §Kända fällor 45 i event-map.ts (rad ~43-44) och create-event/index.ts (rad ~232-233) — samma peka-på-källan-princip som N8.

DoD2 (rörd fil-klass lokala grindar, mätta): typecheck 0 fel (exit 0), biome check . exit 0 (0 fel, pre-existing infos/warnings oförändrade), npm run build grön, markdownlint-cli2 0 issues/679 filer, vale 0 errors/0 warnings/0 suggestions (data-model.md), npm run check:docs -> 14/14 gröna (exit 0). npm run test:api (full svit, 2316 tester): 2315 passed / 1 failed. Den enda fällningen är send-registration-confirmation.staging.test.ts (GATE-LIVENESS + ATOMICITET AC#1 -- Test timeout of 30000ms exceeded / Request context disposed på ett GET mot get-registrations), en HELT ANNAN Edge Function utan koppling till Månad/år eller create-event. Reproducerad ISOLERAT två gånger (samma fel, samma 30,0s-timeout) -> pre-existing miljö-/timeout-problem, inte orsakat av denna diff. Filklassen jag faktiskt rörde (create-event.staging.test.ts) är 100% grön inklusive det nya testet. Registrerat som oväntat-utanför-scope i slutrapporten (ADR-053) -- ingen fix försökt, ingen fil rörd utanför denna skivas scope.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
N7 klar. Marcus lade 2026-09-18 in tolv listval (Januari–December 2027) i Månad/år i BÅDA baserna; orkestreraren mätte 14 ⇒ 26 val, gamla val orörda. Repo-sidan landad via #2527 (6aaba68e): testfallet HORISONTVAKT i tests/api/create-event.staging.test.ts (skarpt grönt: create-event 2027-01-15 ⇒ 201, Månad/år = Januari 2027), fälla 45 i data-model.md öppet kompletterad (horisont December 2027, staging BEKRÄFTAD), två kodkommentarer pekar nu på fälla 45. Review-loopen: risk lag, konvergerad runda 1. Verifierad av efterkontroll 35340750185. Listan tar slut igen januari 2028 tills SE14 (formelhärlett fält) byggts.
<!-- SECTION:FINAL_SUMMARY:END -->
