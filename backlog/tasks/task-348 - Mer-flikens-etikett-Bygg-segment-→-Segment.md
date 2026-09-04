---
id: TASK-348
title: 'Mer-flikens etikett: Bygg segment → Segment'
status: Done
assignee: []
created_date: '2026-08-31 08:50'
updated_date: '2026-08-31 10:58'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 652000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus S114-scope punkt 1 (kvitterad 2026-08-31, sessionsdok S114 Del 1). Mer-menyns segment-post bär etiketten 'Bygg segment' (src/routes/_authenticated/mer/index.tsx:116, NavCard, ikon Filter) — döps till 'Segment'. Sträng-förekomster i tester/ariaSnapshot-referenser som bär etiketten uppdateras i samma PR; rörs en facit-stämplad referens klassas ändringen per ADR-102 § amenderings-mekaniken (klassning utskriven, sidofil — aldrig tyst).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mer-fliken visar etiketten Segment; route /mer/segment oförändrad
- [x] #2 Inga kvarvarande 'Bygg segment'-förekomster i src/ eller tests/ (historiska dok undantagna)
- [x] #3 Ev. berörda facit-referenser amenderade per ADR-102 med utskriven klassning
- [x] #4 DoD-grindarna gröna (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC #4 — test:api-utredning (2026-08-31, PR #2170)

**Ursprunglig körning** (före PR-öppning, ~09:20Z): exit 1, 1682/1683 passed.
1 fail: `generate-event-attachment.staging.test.ts:520` (AC #1, TASK-340.1) —
`expect(skarp.promoverad).toBe(true)` → `false`.

**Granskningsfynd, runda 1:** felet är en verklig reproducerad assertion-miss,
inte bara preflight-blockering — kräver en efterföljande grön lokal körning
eller auktoritativt motbevis.

**Tre omkörningar, kontention-kontroll (`gh run list --workflow post-merge.yml`)
ren (ingen `in_progress`) vid varje kontrolltillfälle:**

| # | Tid (UTC) | Exit | Passed | Fail(s) |
|---|---|---|---|---|
| 1 | 09:38:42Z | 1 | 1682 | `generate-event-attachment.staging.test.ts:564` (AC #2) — `expect(utkastFinns.status()).toBe(200)` → `400` ("bekräftelse-utkastet skulle ha funnits kvar") |
| 2 | 09:41:45Z | 1 | 1682 | `generate-event-attachment.staging.test.ts:520` (AC #1) — samma fel som ursprungskörningen |
| 3 | 09:44:39Z | 1 | 1681 | **TVÅ** fel: `generate-event-attachment.staging.test.ts:564` (AC #2, igen) **+** `send-registration-confirmation.staging.test.ts:192` (GATE-LIVENESS) — `apiRequestContext.get: Request context disposed` (30s timeout) |

**Fyra distinkta felinstanser över tre körningar, i TVÅ olika filer, tre olika
specifika testfall, två olika felklasser** (assertion-mismatch samt en rå
nätverks-timeout) — ingen instans upprepas identiskt två gånger i rad. Detta
är INTE mönstret en deterministisk kodregression ger (samma rad, samma fel,
varje gång); det är signaturen för delad, muterande resurs-kontention.

**Auktoritativt motbevis — main:s egna post-merge-körningar:**

- Run `33376774347` (PR #2163 `feat/task-346-9-kreditkvitto`, EJ docs-only):
  startade 09:15:38Z, 12m22s. Jobbet **"Staging (API + E2E)"** —
  `completed/success`. Detta är den substantiella, verkliga
  omkörningen av samma testsvit mot main-trädet, och den är GRÖN.
- Run `33379010952` (PR #2171 `docs/s114-designbedomning`): **korrigering
  av orkestrerarens ursprungliga premiss** — detta är en docs-only-PR, och
  dess jobb **"Verifierande svit på det mergade trädet"** stod
  `completed/SKIPPED` (D0-klassningen hoppar staging-jobbet för
  dokumentationsändringar). Denna körning bevisar alltså INGET om
  staging-svitens hälsa — den exekverade den aldrig. Den enda substantiella
  auktoritativa gröna datapunkten är `33376774347` ovan.
- Fleet-kontexten vid mättillfället: `git worktree list` visade ~20 samtidiga
  aktiva worktree-agenter (task-346-*, task-309-*, swish-import m.fl.), vilka
  var och en rimligen kör samma `test:api`-svit lokalt mot samma delade
  Airtable-bas (P26/P27) — en källa `post-merge.yml`-kontrollen inte kan se.

**Bedömning: FLEET-KONTENTION, inte en regression i denna diff.**
Motivering: (1) diffen (PR #2170) rör uteslutande
`src/routes/_authenticated/mer/index.tsx` (en NavCard-etikettsträng) plus
tre sträng-/kommentar-uppdateringar i testfiler för Mer-fliken/segment-ytan
— noll kodväg till `generate-event-attachment`- eller
`send-registration-confirmation`-EF:erna. (2) Felmönstret varierar mellan
körningar (fyra instanser, två filer, tre testfall, inklusive en ren
nätverks-timeout) — oförenligt med en deterministisk kodregression, förenligt
med samtidig skrivkontention på delad staging-data. (3) Main:s egen
auktoritativa post-merge-körning (`33376774347`) exekverade samma svit mot
samma träd och gick grön.

**AC #4-status:** `typecheck`, `npx @biomejs/biome check .`, `npm run build`
— samtliga gröna, mätta lokalt (exit 0). `test:api` — den auktoritativa
gröna är main:s post-merge-körning (`33376774347`, "Staging (API + E2E)"
completed/success); en lokal serie körd under pågående fleet-drift mäter
delad-stagings kontention, inte diffens korrekthet. Bockad på denna grund.

Landning: PR #2170, merge a230ebe2. Post-merge: egen körning 33383464746 cancelled (avbruten av efterföljande main-push, concurrency) — täckt av konsoliderad post-merge run 33384414579 på 59072bee (success), samma konsoliderings-mönster som #2172 (bokfört i #2178).
<!-- SECTION:NOTES:END -->
