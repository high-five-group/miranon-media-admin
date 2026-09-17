---
id: TASK-448
title: >-
  Fynd: hem.acceptance 'falsk klocka' installerar Playwright-klockan på riktig
  tid — fixturtokenen (FROZEN_NOW+24h) gick ut 2026-09-16T08:00Z och fäller
  acceptance-shard 2 på varje PR
status: To Do
assignee: []
created_date: '2026-09-17 10:27'
updated_date: '2026-09-17 10:31'
labels: []
dependencies: []
priority: high
ordinal: 772000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Rotorsakskedja

1. `tests/support/fixturvarld/fixture-data.ts:22`: `FROZEN_NOW = 2026-09-15T10:00:00+02:00` (= `2026-09-15T08:00:00Z`).
2. `tests/support/fixturvarld/hermetic.ts` `buildSession()` (tidigare rad 83): `expiresAt = FROZEN_NOW + 24 h` ⇒ fixturtokenen gick ut **2026-09-16T08:00:00Z**. Docblocken ovanför (tidigare rad 76–81) påstod "utgång långt efter FROZEN_NOW … ingen refresh hinner schemaläggas inom testets livstid" — falskt, eftersom nightlyn kör samma fixtur dagligen långt efter FROZEN_NOW.
3. `hermetic.ts` `page`-fixturen (tidigare rad 428): `page.clock.setFixedTime(FROZEN_NOW)` — klockan är fryst vid start, så tokenen är giltig när testet börjar.
4. `tests/acceptance/hem.acceptance.test.ts:281` (testet "refetchInterval (60s) triggar polling-refetch — falsk klocka", rad 274): anropade `page.clock.install()` UTAN `time`. Playwrights `install()` initierar enligt egen typdeklaration (`node_modules/playwright-core/types/types.d.ts` § `install(options`) på **"current system time by default"** — ersätter alltså den frysta klockan med VERKLIG systemtid.
5. Följd: så snart verklig systemtid passerade 2026-09-16T08:00Z såg supabase-js en utgången token och gjorde `POST https://visual-fixture.supabase.co/auth/v1/token?grant_type=refresh_token`. Hermetik-vakten (`tests/support/fixturvarld/hermetik-vakt.ts:113`) kastar `OmockadRequestError` på varje anrop som lämnar fixturvärlden → appen kom aldrig till h1 "Hej…" → `expect(...).toBeVisible()` (rad 295) föll.

## Bevis

- Nightly 2026-09-16 05:50Z (run `35061163532`): **Acceptance (hermetisk) (1)/(2)/(3)** samtliga gröna (innan utgången).
- Nightly 2026-09-17 05:57Z (run `35187813487`): **Acceptance (hermetisk) (2)** röd på exakt detta test, alla 3 försök, exakt `OmockadRequestError` + refresh_token-URL:en.
- PR #2491 (`fix/audit-ci-sharp-smol-toml-overrides`, run `35202824444`): samma shard röd på samma test — `Audit dependencies (audit-ci)` grön (audit-ci-fixen fungerar), men `Test suite / Acceptance (hermetisk) (2)` blockerar merge queue. `main` (`eeca8c72`, 2026-09-08) oförändrad sedan dess — kod utesluten som orsak.
- Lokalt rött-först (2026-09-17, verklig systemtid redan förbi utgången): `OmockadRequestError` reproducerat exakt, exit 1.
- Gränsbevis (körd lokalt): `install({ time: '2026-09-16T07:55:00Z' })` → **grönt**. `install({ time: '2026-09-16T07:59:00Z' })` → **rött**. `install({ time: '2026-09-16T08:01:00Z' })` → **rött**. Den FAKTISKA gränsen ligger ~90 s FÖRE `exp`, inte vid `exp` självt: supabase-js' `EXPIRY_MARGIN_MS = AUTO_REFRESH_TICK_THRESHOLD(3) * AUTO_REFRESH_TICK_DURATION_MS(30 000) = 90 000 ms` (`node_modules/@supabase/auth-js/dist/module/lib/constants.js`) gör att en proaktiv refresh schemaläggs redan när mindre än 90 s återstår — inte bara efter faktisk utgång.
- Grönt-efter: samma test grönt på verklig systemtid (2026-09-17, långt efter gamla utgången). Hela `hem.acceptance.test.ts` grön (48/48).

## Fix

1. `hem.acceptance.test.ts`: `page.clock.install()` → `page.clock.install({ time: FROZEN_NOW })`, med docblock-rad om kontraktet och Playwright-citatet.
2. `hermetic.ts`: `buildSession()`s `exp` förlängd FROZEN_NOW → FROZEN_NOW + 10 år (inget test läser/visar `exp`/`expires_at` — grep-bekräftat) som SKYDDSRÄCKE 2 mot att samma kod-glömska blir farlig igen; SKYDDSRÄCKE 1 (den enda som gör `Date.now()` deterministisk) förblir att klockan stannar vid FROZEN_NOW. Docblocken (både `buildSession()` och `page`-fixturens `setFixedTime`) skriver om till att säga sanningen och pekar på kontraktet + befintlig precedent (`events-list-kalender.acceptance.test.ts` § DETERMINISM, `event-checkin-dorrlistan.acceptance.test.ts` § DETERMINISMEN — båda dokumenterade EXAKT samma fälla i prosa redan innan detta kort, utan att det hindrade upprepningen i `hem.acceptance.test.ts`).

**Medvetet INTE byggt:** en delad hjälpfunktion (`installFrusenKlocka(page)`). De två befintliga korrekta anropsställena (`event-checkin-dorrlistan.acceptance.test.ts:212`, `event-checkin-laddlage.acceptance.test.ts:419`) gör redan rätt sak för hand och behöver ingen ändring; en hjälpare med bara ETT nytt anropsställe är precis den för-tidiga abstraktion över-engineering-vakten (CLAUDE.md) varnar för, och att samtidigt migrera de två fungerande filerna hade utökat diffen på en HÖGSTA PRIORITET-blockerande PR utan att sänka risken proportionerligt. Kontraktet bärs i stället av ett tydligt, väl synligt docblock i `hermetic.ts` precis vid `setFixedTime`-anropet (den plats en framtida testförfattare rimligen läser) plus den nu ofarliga 10-års-`exp`:n.

## Kvarvarande, EJ fixat i denna skiva (utanför scope)

Två `.staging.test.ts`-filer (`tests/e2e/persist-cache.staging.test.ts:547`, `tests/e2e/bekraftelsesteget-promoverings-grind.staging.test.ts:412`) anropar också `page.clock.install()` utan `time`. Undersökt: dessa kör i `chromium-authenticated`-projektet mot en RIKTIG, färskt inloggad staging-session (`storageState` från `tests/global-setup.ts`, ingen fabricerad FROZEN_NOW-baserad JWT) och har INGEN hermetik-vakt som blockerar ett äkta nätverksanrop — en proaktiv refresh mot verklig staging skulle bara lyckas. De bär alltså INTE samma fälla; ingen ändring gjord där.

En separat, redan existerande olöst lesson (`tasks/lessons.d/lokal-testfailure-med-akta-assertion-och-gron-ci-ar-inte-automatiskt-flake.md`, 2026-09-02) flaggar `hem.acceptance.test.ts:326` ("dagar-kvar-formens tre exakta texter") som lokalt rött/CI-grönt med okänd rotorsak och en öppen hypotes om datum-/klockberoende. Två fulla lokala klasskörningar denna session (521/524 båda gångerna) reproducerade SAMMA 3 röda tester, inklusive detta — men testet rör varken `page.clock.install()` eller någon fil i denna skivas diff, och passerade 4/5 gånger i isolerad körning. Lesson-filen rekommenderar själv ett eget kort om mönstret återkommer, vilket det nu gjort — men det minsta kortet är UTANFÖR denna skivas scope (den stapade audit-ci-PR:n) och mintas inte här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Testet installerar klockan på FROZEN_NOW och är grönt oberoende av systemtid
- [x] #2 hermetic.ts-kontraktet säger sanningen om tokenens utgång och klockans frysning
- [x] #3 Acceptance-klassen grön lokalt (hem.acceptance.test.ts helt grön; övriga filers status bokförd ärligt)
- [x] #4 DoD gröna (typecheck, biome, build, audit-ci)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
