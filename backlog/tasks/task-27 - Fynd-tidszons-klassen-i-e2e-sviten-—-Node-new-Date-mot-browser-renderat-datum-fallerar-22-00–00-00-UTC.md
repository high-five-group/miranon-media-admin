---
id: TASK-27
title: >-
  Fynd: tidszons-klassen i e2e-sviten — Node-new Date() mot browser-renderat
  datum fallerar 22:00–00:00 UTC
status: To Do
assignee: []
created_date: '2026-07-22 07:12'
updated_date: '2026-08-28 05:05'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75, diagnos-agenten för 18.8-studsen. Mekanism bevisad: testets Node-process räknar datum i UTC (CI) medan browser-kontexten är låst till Europe/Stockholm — varje assert som jämför Node-datum med browser-renderat datum är exponerad i fönstret 22:00–00:00 UTC (sommartid), exakt när nattliga runs sker. 18.8:s två instanser fixas i skivan; klassen är SUITE-BRED.

Förväntat: grep-svep över tests/e2e/** + gemensam Stockholm-förankrad datum-hjälpare för testens referensklocka. Snabbsignatur ur diagnosen: TZ-fel är stabila över CI-retries (identiska diffar), race-fel växlar mönster.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grep-svep över tests/e2e/** identifierar samtliga asserts som jämför Node-lokalt beräknat datum mot browser-renderat datum, inkl. de två redan kända (hem.staging.test.ts:755, events-list.staging.test.ts:1013)
- [ ] #2 En delad Stockholm-förankrad datum-hjälpare ersätter Node-lokal new Date()/setDate() i samtliga identifierade asserts
- [ ] #3 Berörda testfiler körs grönt (npm run test:e2e eller motsvarande) utan TZ-relaterad diff, verifierat lokalt med TZ satt till UTC för att simulera fönstret 22:00–00:00 UTC
- [ ] #4 CI grön på post-merge/staging-jobbet för de fixade testfilerna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Svep-resultatet (fix-agenten, S75): EN exponerad assert utöver 18.8:s två — tests/e2e/hem.staging.test.ts:755 ('igår'-etiketten härleds ur Node-lokal new Date()+setDate(−1), rad 669–675, med öppet bokfört runner-zon-antagande rad 680). Övriga klassade EJ exponerade: epoch-baserade Date.now()-fixturer utan datum-text-asserts · fasta Date.UTC-fixturer (sortordning) · redan TZ-förankrade (events-list-kalender + hem 413–429). Åtgärdsomfånget är alltså: 1 assert + gemensam Stockholm-hjälpare.

SKARP TRÄFF 2026-07-26 (S90, task-48:s PR #226): CI-run 30178541626 föll på events-list.staging.test.ts:1013 (print-huvudets långdatum) vid 23:07 UTC — alltså mitt i det bokförda fönstret. Node-processen beräknade 'Utskrivet 25 juli 2026', browsern renderade 26 juli (playwright.config.ts:175 låser timezoneId Europe/Stockholm). Testet passerar lokalt och i alla runs utanför fönstret; tre Playwright-retries räddade det INTE, eftersom felet är deterministiskt inom fönstret och inte en flake. Instansen ligger i task-17.7:s svit, alltså UTANFÖR de två 18.8-instanser kortet nämner — vilket bekräftar kortets egen SUITE-BRED-klassning empiriskt. Kostnad denna gång: en blockerad landning + en väntan till efter 00:00 UTC. Nattliga runs träffar fönstret systematiskt.
<!-- SECTION:NOTES:END -->
