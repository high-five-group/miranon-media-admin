---
id: TASK-445
title: >-
  Fynd: react-aria-components 1.21.1 (dependabot #2481) — exakt-pinnad
  @internationalized/date duplicerar paketet, krockar med TS
  #private-fältstypning i tre komponenter
status: Done
assignee: []
created_date: '2026-09-17 09:22'
updated_date: '2026-09-17 11:58'
labels: []
dependencies: []
priority: high
ordinal: 771000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ROTORSAK (verifierad mot primärkälla, inte release-notes-prosa): dependabot-PR
#2481 bumpar `react-aria-components` 1.20.0→1.21.1, som internt kräver
`@internationalized/date@^3.12.4` (`npm view react-aria-components@1.21.1
dependencies`). Vårt `package.json` pinnar `@internationalized/date` EXAKT
till 3.12.3 (utan caret, satt så sedan första commit `5612a45f` — ingen ADR
eller CHANGELOG-rad hittad som motiverar exakt pin, till skillnad från
`@tanstack/react-router`-pinningen som har ADR-028 bakom sig). Den exakta
pinningen gör att npm INTE kan hoista en gemensam kopia: tre dubbletter av
`@internationalized/date@3.12.4` installeras nästlade under
`react-aria-components`, `react-aria` och `react-stately`, medan toppnivån
stannar på 3.12.3.

`@internationalized/date`s `CalendarDate`/`CalendarDateTime`/`Time`/
`ZonedDateTime` är klasser med `#private`-fält (ECMAScript private fields) —
TypeScript typar dessa NOMINELLT, inte strukturellt. Två separat installerade
kopior av SAMMA klass (byte-identiskt innehåll) blir därför INKOMPATIBLA
typer, verbatim diagnostik: "Property '#private' in type 'CalendarDate'
refers to a different member that cannot be accessed from within type
'CalendarDate'." Detta — inte en genuin API-kontraktsändring i
react-aria-components — är den faktiska orsaken till #2481:s nio typfel i
`DatumFalt.tsx`, `EventsCalendar.tsx` och `BlockDialog.tsx`.

Release-notes för 1.21.0 (react-aria.adobe.com/releases/v1-21-0, hämtat
2026-09-17) nämner INGEN breaking ändring i DateValue/RangeValue-generics
eller Calendar/DateField-typer — enda Calendar-ändringen är "Allow selecting
dates outside the visible range when isDateUnavailable is set", vilket vi
inte använder (grep: noll träffar på `isDateUnavailable` i `src/`).
react-spectrum saknar dessutom egen GitHub-release-tagg för 1.21.1 (patch
publicerad utan release notes).

FIXEN: bump `@internationalized/date` i lockstep till 3.12.4 (samma
målversion som väntande dependabot-PR #2482 föreslår för samma paket, i en
bredare "production-dependencies"-grupp med fem ANDRA obesläktade paket
(@sentry/react, @supabase/supabase-js, lucide-react, web-vitals, zod) som
INTE dras in här — den gruppen är #2482:s eget scope). Lockstep-bumpen låter
npm deduplicera till EN kopia — noll kodändringar krävdes i något av de tre
påverkade filerna. Bevisat med två separata npm install + typecheck-körningar:
endast react-aria-components bumpad → 9 fel, identiska med CI:s felbild;
+ lockstep-bump av @internationalized/date → 0 fel.

ÖPPEN FRÅGA (ej exekverad i denna skiva, flaggas för separat beslut):
`@internationalized/date` är den enda react-aria-relaterade dependency som
saknar caret (`^`) — alla `@react-aria/*`/`@react-stately/*`-paket i
package.json använder caret-ranges. En framtida patch-bump av
react-aria-components som återigen höjer sitt interna
@internationalized/date-krav kan återupprepa EXAKT detta fel om vi
fortsätter exakt-pinna. Ingen ADR eller dokumenterad rationale hittades för
varför just detta paket pinnas exakt (forensiskt sökt: CHANGELOG.md,
docs/decisions/*.md, git log -p). Rekommendation: överväg `^3.12.4` vid
nästa medvetna beslut om dependency-policy — inte exekverat här eftersom det
är en policyfråga utanför denna fix-skivas scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 typecheck grön på react-aria-components 1.21.1 utan as-casts/any/@ts-expect-error
- [x] #2 DatumFalts publika props-kontrakt oförändrat (bibliotekskod, 11/11/11)
- [x] #3 axe 0 violations + berörda e2e/acceptance-tester gröna för kalendern, datumfältet, skapa-event-formuläret och aktivitetshistorikens datumfilter
- [x] #4 DoD (typecheck/biome/build/test:api) gröna, avvikelser källmärkta
- [x] #5 inga nya audit-ci-paths jämfört med huvudgrenens kända två (sharp/smol-toml)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done av S125-orkestreraren 2026-09-17: landad via #2495 (main 4670928c), review-grinden konvergerad (+ omstämpling efter update-branch), DoD mot PR-kroppens grind-tabell.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Löst via lockstep-bump: `react-aria-components` ^1.20.0→^1.21.1 +
`@internationalized/date` 3.12.3→3.12.4 (exakt, matchar #2482:s målversion
för samma paket). Rotorsak: exakt pin på @internationalized/date krockade
med react-aria-components 1.21.1:s interna `^3.12.4`-krav, npm installerade
tre nästlade dubbletter, och TypeScript typar CalendarDate/DateValue-klassers
`#private`-fält NOMINELLT — två installationer av samma klass räknas som
olika typer. Lockstep-bumpen deduplicerar till en kopia; NOLL kodändringar
i DatumFalt.tsx/EventsCalendar.tsx/BlockDialog.tsx krävdes.

Mätt: rött-först (endast react-aria-components bumpad) gav exakt CI:s 9
typfel; grönt-efter (+ lockstep-bump) gav 0 fel, npm ls bekräftar EN
deduplicerad @internationalized/date-kopia. DoD: typecheck exit 0, biome
exit 0 (0 fel, 18 pre-existing warnings orörda), build exit 0. test:api:
2313 passed / 2 failed — båda KÄNDA pre-existing staging-timeouts
(GATE-LIVENESS send-registration-confirmation + generate-event-attachment
AC#2, `apiRequestContext.get: Request context disposed`), källmärkta mot
backlog/tasks/task-431 och task-348, obesläktade med react-aria/datum (grep
bekräftar noll referenser till CalendarDate/DateValue/react-aria i de två
testfilerna). a11y (axe-runner): 118 passed, 0 violations. Riktad acceptance
(9 filer som berör kalendern/datumfältet/skapa-event/aktivitetshistorik):
63 passed, 0 failed, inkl. axe 0-checks och tangentbordsflöden i webbläsare
via Playwright. audit-ci: samma två kända advisories som huvudgrenen
(sharp→@vite-pwa/assets-generator, smol-toml→markdownlint-cli2) — inga nya
paths från denna bump. Visuell baseline: grinden är byggd men PR-gaten
medvetet INAKTIV (Marcus A, S81, tråd T87); endast -linux-baselines finns
incheckade och jämförs i CI, ingen sådan CI-visual-check kördes ens på
#2481. Lokal körning på macOS genererar personliga -darwin-baselines
(gitignorerade, ej en regressionssignal) — ingen befintlig baseline att
diffa mot lokalt.
<!-- SECTION:FINAL_SUMMARY:END -->
