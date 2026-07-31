---
id: TASK-110
title: Mätinstrumentet test-bas.ts till klassdelad hemvist (T103)
status: To Do
assignee: []
created_date: '2026-07-31 10:40'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 183000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tråd T103: mätinstrumentet `tests/e2e/support/test-bas.ts` är klassneutralt men bor i en klass-segmenterad sökväg som läses som ägarskap. Sedan TASK-59.3 komponeras acceptance-sömmen av BÅDA modulerna via `mergeTests` och importerar tvärs klassgränsen (`tests/acceptance/support/acceptance-bas.ts:2` → `../../e2e/support/test-bas`). Precedenten är TASK-59.1: fixturvärlden flyttades till klassdelad hemvist `tests/support/fixturvarld/` av exakt detta skäl — en klass-segmenterad sökväg läses som ägarskap.

Triggern har löst ut: TASK-59.6 är Done (2026-07-28) — antalet berörda importrader är känt och stabilt. Mätt 2026-07-31 mot origin/main bca5b5c:

- 16 importrader: 15 filer `tests/e2e/*.staging.test.ts` (importerar `./support/test-bas`) + `tests/acceptance/support/acceptance-bas.ts` (tvärsklass-importen som är trådens kärna).
- Kopplad fil: `tests/e2e/support/hermetik-rapport-fil.ts` — delad konstant mellan skrivaren (`test-bas.ts`) och läsarna `tests/global-setup.ts:20` + `tests/global-teardown.ts:18`, båda klassneutrala rot-filer. Den bär samma klassneutrala egenskap; ta ställning till om den flyttar med, med beslut + skäl i implementation notes.
- Sökvägs-kommentarer i levande kod som ska följa med: `tests/global-teardown.ts:52` och `tests/acceptance/support/acceptance-bas.ts:53`.
- Historiska omnämnanden i `docs/research/*` och Done-kort i `backlog/tasks/*` beskriver sitt dåtida tillstånd och ska INTE skrivas om.
- Noll konfig-referenser: grep mot `playwright.config.ts`, `tsconfig*`, `scripts/`, `.github/` gav 0 träffar 2026-07-31.

Underlag: `tasks/threads/README.md` T103-raden · `tasks/threads/S91-tradkarta-2026-07-31.md` § 2 (minta kort-posten).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `test-bas.ts` bor i klassdelad hemvist under `tests/support/` (exakt placering motiveras i implementation notes; precedent `tests/support/fixturvarld/`, TASK-59.1)
- [ ] #2 `grep -rn "e2e/support/test-bas" tests/ scripts/ playwright.config.ts` ger 0 träffar — inga importer eller kommentarer i levande kod pekar på gamla sökvägen (historiska docs/research och Done-kort undantagna och orörda)
- [ ] #3 Ställning tagen till `hermetik-rapport-fil.ts` (flytta med eller ligga kvar) med skäl i implementation notes; importvägarna i `tests/global-setup.ts` och `tests/global-teardown.ts` korrekta oavsett beslut
- [ ] #4 Mätläget bevisat levande efter flytten: en körning med `PLAYWRIGHT_HERMETIK_RAPPORT=1` skriver rapport precis som före flytten — faktiskt utfall bokfört i implementation notes, inte antaget
- [ ] #5 Grindarna gröna med mätta exitkoder: `npm run typecheck` · `npx @biomejs/biome check .` · `npm run build` · `npm run test:api`
- [ ] #6 Trådregistrets T103-rad uppdaterad i samma landning: `closed` + pekare till detta kort
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
