---
id: TASK-27
title: >-
  Fynd: tidszons-klassen i e2e-sviten — Node-new Date() mot browser-renderat
  datum fallerar 22:00–00:00 UTC
status: To Do
assignee: []
created_date: '2026-07-22 07:12'
updated_date: '2026-07-22 07:23'
labels: []
dependencies: []
priority: high
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75, diagnos-agenten för 18.8-studsen. Mekanism bevisad: testets Node-process räknar datum i UTC (CI) medan browser-kontexten är låst till Europe/Stockholm — varje assert som jämför Node-datum med browser-renderat datum är exponerad i fönstret 22:00–00:00 UTC (sommartid), exakt när nattliga runs sker. 18.8:s två instanser fixas i skivan; klassen är SUITE-BRED.

Förväntat: grep-svep över tests/e2e/** + gemensam Stockholm-förankrad datum-hjälpare för testens referensklocka. Snabbsignatur ur diagnosen: TZ-fel är stabila över CI-retries (identiska diffar), race-fel växlar mönster.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Svep-resultatet (fix-agenten, S75): EN exponerad assert utöver 18.8:s två — tests/e2e/hem.staging.test.ts:755 ('igår'-etiketten härleds ur Node-lokal new Date()+setDate(−1), rad 669–675, med öppet bokfört runner-zon-antagande rad 680). Övriga klassade EJ exponerade: epoch-baserade Date.now()-fixturer utan datum-text-asserts · fasta Date.UTC-fixturer (sortordning) · redan TZ-förankrade (events-list-kalender + hem 413–429). Åtgärdsomfånget är alltså: 1 assert + gemensam Stockholm-hjälpare.
<!-- SECTION:NOTES:END -->
