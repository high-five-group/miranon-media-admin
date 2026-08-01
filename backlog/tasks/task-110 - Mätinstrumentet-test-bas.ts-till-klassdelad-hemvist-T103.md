---
id: TASK-110
title: Mätinstrumentet test-bas.ts till klassdelad hemvist (T103)
status: Done
assignee: []
created_date: '2026-07-31 10:40'
updated_date: '2026-08-01 22:26'
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
- [x] #1 `test-bas.ts` bor i klassdelad hemvist under `tests/support/` (exakt placering motiveras i implementation notes; precedent `tests/support/fixturvarld/`, TASK-59.1)
- [x] #2 `grep -rn "e2e/support/test-bas" tests/ scripts/ playwright.config.ts` ger 0 träffar — inga importer eller kommentarer i levande kod pekar på gamla sökvägen (historiska docs/research och Done-kort undantagna och orörda)
- [x] #3 Ställning tagen till `hermetik-rapport-fil.ts` (flytta med eller ligga kvar) med skäl i implementation notes; importvägarna i `tests/global-setup.ts` och `tests/global-teardown.ts` korrekta oavsett beslut
- [x] #4 Mätläget bevisat levande efter flytten: en körning med `PLAYWRIGHT_HERMETIK_RAPPORT=1` skriver rapport precis som före flytten — faktiskt utfall bokfört i implementation notes, inte antaget
- [x] #5 Grindarna gröna med mätta exitkoder: `npm run typecheck` · `npx @biomejs/biome check .` · `npm run build` · `npm run test:api`
- [x] #6 Trådregistrets T103-rad uppdaterad i samma landning: `closed` + pekare till detta kort
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
REN FLYTT — git mv, historik bevarad.

VALD HEMVIST: tests/support/test-bas.ts (flat fil, syskon till tests/support/staging-preflight.ts och tests/support/fixturvarld/). Precedent TASK-59.1: POSITIONEN säger delad — tests/support/ är syskon till testklasserna (e2e/, acceptance/, visual/, a11y/, api/), inget klass-segment kvar i sökvägen. NAMNET namnger saken (mätinstrumentet för S91-mätningen), inte konsumenten. Ingen undermapp behövdes eftersom filen (till skillnad från fixturvärlden) inte är ett modul-kluster — samma flata form som staging-preflight.ts redan använder i tests/support/.

HERMETIK-RAPPORT-FIL.TS FLYTTADE MED (AC #3): beslut = flytta. Skäl: filen är en delad sökvägskonstant mellan skrivaren (test-bas.ts) och läsarna (global-setup.ts + global-teardown.ts, båda klassneutrala rot-filer) — exakt samma klassneutrala egenskap kortet identifierar hos test-bas.ts självt. Att lämna den kvar i tests/e2e/support/ hade strandat en ensam fil i en katalog vars enda andra invånare just lämnat, och läst som ägarskap av precis det skäl kortet argumenterar mot. Precedenten (TASK-59.1) flyttade HELA fixturvärldens modulkluster tillsammans, inte bara huvudfilen — samma princip tillämpad här. tests/global-setup.ts och tests/global-teardown.ts importvägar uppdaterade till './support/hermetik-rapport-fil'.

MÄTNING (AC #4) — PLAYWRIGHT_HERMETIK_RAPPORT=1 mot tests/e2e/shell.staging.test.ts EFTER flytten: 9/9 passed (36.7s), rapport skriven med 40 restanrop över 1 fil (11× fonts.googleapis.com, 11× get-events, 9× get-registrations, 9× fonts.gstatic.com) — strukturellt identisk mekanik som före flytten (samma catch-all-route, samma JSONL-skrivare, samma teardown-läsare). Bevisar mätläget lever, inte antar det.

DIVERGENS MOT KORTETS EGET TAL (bokförd, ej tyst — ADR-086): kortet påstår '16 importrader: 15 filer tests/e2e/*.staging.test.ts + acceptance-bas.ts'. Grep mot faktiskt tillstånd (git fetch verifierad, HEAD = origin/main vid start) gav 14 filer i tests/e2e/*.staging.test.ts som importerar ./support/test-bas — inte 15. Totalt alltså 15 importrader (14+1), inte 16. AC #2 kräver 0 träffar oavsett exakt tal före flytten, så divergensen blockerar inte arbetet, men den är felmärkt i kortets källunderlag och rättad i tråd-registrets T103-rad. Ingen fil missades: samtliga 14 + acceptance-bas.ts + de två klassneutrala rot-filerna är uppdaterade, verifierat med grep -rn 'e2e/support/test-bas' tests/ scripts/ playwright.config.ts (0 träffar) och grep -rln e2e/support hela repot (endast docs/research + backlog/tasks kvar, korrekt historiska och orörda).

KOMMENTARER I LEVANDE KOD UPPDATERADE (AC #3 delvis, dokumentationskrav): tests/global-teardown.ts:52 (sökväg) · tests/acceptance/support/acceptance-bas.ts:53 (sökväg) samt raderna 71-74 (den gamla 'hör inte till denna skiva'-motiveringen var obsolet eftersom denna skiva NU gör exakt det — ersatt med en bakåtpekare till task-110, mönster hämtat från hermetic.ts:24 (TASK-59.1:s egen bakåtpekare)). test-bas.ts fick en ny docblock-öppning i samma stil ('HEMVISTEN ÄR KLASSDELAD, INTE E2E-ÄGD') som hermetic.ts:24 använder för fixturvärlden.

BIOME-SIDOEFFEKT UPPTÄCKT OCH ÅTGÄRDAD: path-bytet ändrade sorteringsordningen för assist/source/organizeImports i 8 filer (acceptance-bas.ts + 7 e2e-filer vars importrad nu sorterar annorlunda relativt en './helpers/...'-import). Bekräftat orsakssamband genom att köra biome mot git-stash:ad baseline (main, exit 0, 0 fel) kontra mitt träd (exit 1, 8 fel) — samtliga 8 fel var just dessa organizeImports-fynd. Åtgärdat med biome --write scopat till exakt de 8 filerna; slutresultat matchar baseline exakt (6 warnings, 27 infos, exit 0). En separat pre-existing warning (noConfusingVoidType i test-bas.ts:63, fanns i filen redan före flytten) lämnad orörd — utanför skivans scope.

GRINDAR (mätta exitkoder, samtliga från denna workingtree):
  npm run typecheck                 → exit 0
  npx @biomejs/biome check .        → exit 0 (6 warnings, 27 infos — identiskt med main-baseline)
  npm run build                     → exit 0
  npm run test:api                  → exit 0, 443 passed (52.0s)
  PLAYWRIGHT_HERMETIK_RAPPORT=1 (shell.staging.test.ts) → exit 0, 9 passed, rapport skriven (AC #4-beviset)

TRÅDREGISTRET (AC #6): tasks/threads/README.md T103-raden satt till closed, pekar till TASK-110, bär det uppmätta 15-talet och länken till mätbeviset.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PR #564 (merge 57238a19bdf71d706f3d71a97732bc18a30745ce, merge queue): merge_group-run 30720679764 grön per jobb — Lint+Audit+TypeCheck: success, Detect changed files: success, Docs link check: success, Test suite/Pure+Build: success, Test suite/Acceptance (hermetisk): success, Test suite/Staging sentinel purge: skipped, Test suite/A11y (axe-runner): skipped, Test suite/Staging (API+E2E): skipped, CI Passed or Skipped: success. DoD#4 diff-scope verifierad: gh pr diff 564 --name-only gav 21 filer — task-110-kortet, tasks/threads/README.md, tests/acceptance/support/acceptance-bas.ts, 14 tests/e2e/*.staging.test.ts, tests/global-setup.ts, tests/global-teardown.ts, tests/support/hermetik-rapport-fil.ts, tests/support/test-bas.ts — matchar exakt agentens rapporterade fillista i implementation notes (inklusive det där bokförda 14-mot-kortets-15-talet-divergensen). Inga orelaterade filer. Lokala grindar redan mätta av byggagenten (typecheck/biome/build/test:api samtliga exit 0, PLAYWRIGHT_HERMETIK_RAPPORT-bevis 9/9) och avbockade DoD#1-2 i tidigare landning. DoD 3-4 avbockade här av stängningsbatchen.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
