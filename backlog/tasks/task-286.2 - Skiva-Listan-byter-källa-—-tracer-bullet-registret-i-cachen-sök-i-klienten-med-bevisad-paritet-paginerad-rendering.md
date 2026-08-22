---
id: TASK-286.2
title: >-
  Skiva: Listan byter källa — tracer bullet: registret i cachen, sök i klienten
  med bevisad paritet, paginerad rendering
status: Done
assignee: []
created_date: '2026-08-21 11:46'
updated_date: '2026-08-22 09:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-286.1
parent_task_id: TASK-286
ordinal: 517000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: Lotta öppnar Personer. Första gången visas skelettet i slutgeometri medan registret laddas (en gång); pekar hon på Personer-fliken innan hon klickar har laddningen redan börjat. Sedan skriver hon i sökrutan och listan smalnar av vid varje tecken — inget skelett, ingen väntan, inget nätverksanrop. Raderar hon ett tecken breddas urvalet omedelbart. Träffarna är exakt desamma som förut: namn, e-post, telefon och ort, skiftlägesokänsligt, diakritik-känsligt (ADR-123 beslut 2). Räknarraden visar antalet träffar. Är träffarna fler än 50 visas de första 50 och 'Ladda fler' hämtar nästa 50 ur arrayen med samma knapp och samma annonsering som i dag. Sökningen står i adressfältet så den kan delas. Skärmläsaren får träffantalet artigt när hon slutat skriva.

HUR: ny query-nyckel för registret (queryKeys.persons.register eller motsvarande), staleTime = globala 5 min (höjs i invaliderings-skivan, inte här), prefetch på avsikt vid hover/fokus på Personer-fliken i TabBar (ADR-078 beslut 3; React Query dedupar), lat laddning annars. PersonsList läser registret via adaptern, filtrerar med ren toLowerCase().includes() per fält (arrayfält: något element), useDeferredValue på söktermen, URL-parametern q skrivs debounced (nuqs som i dag) men FILTRERINGEN är odebouncad. PAGE_SIZE 50 behålls som render-fönster; 'Ladda fler' utökar fönstret. Dagens sök-/cursor-query och total-walken LÄMNAS KVAR i kodbasen denna skiva (rivs i nästa) men har ingen konsument i listan längre.

PARITETSTESTET (DoD, nytt): samma termlista — minst: 'anna', 'ANNA', 'åsa', 'asa', 'ås', 'ej till', '070', '070-', '070 1', en ort, en e-postdel, tom sträng — körs mot EF:ens filterbyggare (formeln mot staging-fixturen) och mot klientfiltret på samma fixtur; träffmängderna ska vara identiska. Avviker de: STOPPA och rapportera vilken term — bygg aldrig vidare på en gissad semantik.

Formen: listans rad- och listform är låst i tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan och rörs inte — bara datakällan bakom raderna byter. Acceptance-sviten för personlistan uppdateras i samma commit (fixturen bär nu hela registret, inte sidor).

Täcker användarberättelser: 1, 2, 3, 7, 8, 9, 10, 11, 12, 15, 16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Efter första laddningen sker noll nätverksanrop vid skrivning i sökrutan — mätt i acceptance-testet (räknade EF-anrop), inte antaget
- [x] #2 Skelett visas bara vid första laddningen av registret och i slutgeometri; därefter aldrig vid sökning
- [x] #3 Klientfiltret matchar skiftlägesokänsligt och diakritik-känsligt över namn, e-post, telefon och ort; paritetstestet mot EF:ens filter är grönt för hela termlistan
- [x] #4 Prefetch startar vid hover/fokus på Personer-fliken; första besöket efter prefetch visar inget skelett
- [x] #5 50 rader renderas initialt; Ladda fler utökar ur den filtrerade arrayen med oförändrad knapp och aria-live-annonsering; räknarraden speglar arrayens träffantal
- [x] #6 Sökningen står i URL:en (debounced) och återställs vid omladdning; träffantalet annonseras artigt efter skrivpaus, inte per tecken
- [x] #7 Personlistans rad- och listform är identisk med facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — referenserna gröna
- [x] #8 Acceptance-sviten för personlistan täcker: sök utan nätverk, paritet, Ladda fler ur array, URL-tillstånd, axe noll violations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [x] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [x] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Stängningsverifiering 2026-08-22 (TASK-286.3-agenten, egen mätning)

Kortet stod `To Do` fastän koden landat — stängnings-committen gjordes aldrig
(samma lucka som TASK-281). Varje DoD-punkt nedan är belagd med kommandot som
producerade talet; ingen punkt bockad på ett andrahandspåstående.

**Landning:** PR #1715, merge-SHA `570986f83216f3d6b22131d43f27e4057fd6dab7`,
mergedAt 2026-08-22T08:54:14Z, gren `feat/task-286-2-personlistan-forladdat-register`
(källa: `gh pr view 1715 --json state,mergeCommit,mergedAt`).

- **DoD #1** — AC #1–#8 samtliga `[x]` i kortet (källa: `npm run bl -- task 286.2 --plain`).
- **DoD #2** — lokala grindar körda av mig 2026-08-22 mot main-trädet som bär
  merge-SHA:t: `npm run typecheck` exit 0 · `npx @biomejs/biome check .` exit 0 ·
  `node scripts/check-langa-streck.mjs` exit 0 · `npm run build` exit 0 ·
  `npm run test:api` → **api-pure 574/574 grönt**, 943 passed totalt.
  De 13 röda ligger ALLA i `api-staging` och ALLA i `get-registration(s)` med
  `ZodError` på `eventmatchning` — TASK-284-spårets kända, främmande fällning
  (`_shared/registration-read.ts`, commits `0667ec8c`/`3a355a49`), noll träffar
  i personer-ytan. Verifierat att ingen röd rad ligger utanför den klassen.
- **DoD #3** — `gh pr checks 1715`, radvis: 11 `pass` (Analyze ×2, CI Passed or
  Skipped, CodeQL, Detect changed files, Docs link check, Lint + Audit + TypeCheck,
  Acceptance (hermetisk), Acceptance — tvåsidigt bevis, Pure + Build, Webblasarbeteende,
  Vercel), 3 `skipping` (A11y, Staging (API + E2E), Staging sentinel purge),
  **0 fail**.
- **DoD #4** — 14 filer i diffen (`gh pr view 1715 --json files`), samtliga i
  skivans yta: kortet, `PersonsList.tsx`, `TabBar.tsx`, `startvarmningen.ts`,
  `person-sok.ts`, `queries/keys.ts`, amenderings-sidofilen, fyra testfiler,
  fixturvärlden och de två aria-referenserna. Noll orelaterade.
- **DoD #5** — paritetstestet mätt av mig 2026-08-22:
  `tests/api/get-persons-sok-paritet.staging.test.ts` 12 termfall gröna skarpt mot
  staging ('anna', 'ANNA', 'åsa', 'asa', 'ås', 'ej till', '070', '070-', '070 1',
  'falköping', 'example.com', tom sträng) + `tests/api/person-sok.test.ts` alla
  pure-fall gröna.
- **DoD #6** — `npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts`
  → **16 passed, exit 0** (mätt av mig 2026-08-22). `facit.json` är ORÖRD av PR
  #1715 (inte i fillistan; `deny-facit-godkand-skrivning.sh` hade nekat den).
  Två av sex aria-referenser (`personer-listlage-visual-{desktop,mobile}.aria.yml`)
  återfångades som FIXTUR-artefakt (17 < render-fönstret 50 ⇒ 'Ladda fler' visas
  aldrig i testmiljön) på Marcus väg B-beslut, öppet bokfört i
  `tasks/sessions/bilagor/s90-personlistan-konvergens/AMENDERING-2026-08-22-task-286-2-referenser.md`.
  Formbesluten manifestets `not`-fält låser är oberörda.
- **DoD #7** — AC #1 mätt i `tests/acceptance/persons-list.acceptance.test.ts`
  (räknade EF-anrop), och CI-jobbet `Test suite / Acceptance (hermetisk)` är
  `pass` på PR-commiten.

**Öppen post, ärvd och EJ åtgärdad här:** den incheckade pixel-baselinen
`personer.png` (`-linux.png`) är orörd — dess grind är byggd men medvetet
INAKTIV i CI, och baselines föds i CI via `visual-baselines.yml`, aldrig lokalt
(`CONTRIBUTING.md` § Visuell regression). Flaggad av 286.2-agenten, står kvar.
<!-- SECTION:NOTES:END -->
