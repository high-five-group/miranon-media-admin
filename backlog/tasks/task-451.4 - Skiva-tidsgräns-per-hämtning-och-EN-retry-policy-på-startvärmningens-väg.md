---
id: TASK-451.4
title: 'Skiva: tidsgräns per hämtning och EN retry-policy på startvärmningens väg'
status: Done
assignee: []
created_date: '2026-09-18 10:39'
updated_date: '2026-09-19 12:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-451.3
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 788000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ingen `AbortController`/fetch-timeout finns någonstans (`src/data/utils.ts:35–65`) — en hängande EF hänger tills webbläsarens socket-timeout. Två retry-lager staplas: `fetchWithRetry` (4 försök) x query-lagrets globala `retry: 3` (`src/router.ts:21–22`) = upp till 16 anrop per warmup-item. TASK-420 rättade ett nyckel-specifikt symptom, inte staplingen.

Underlag § 1.7, § 6 punkt 5–6. Research före design: hur TanStack Query-dokumentationen och branschen placerar retry (ETT lager) och timeout (AbortSignal.timeout, signal från queryFn-kontexten).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rött-först: en EF som aldrig svarar — i dag hänger anropet obegränsat; efter fix avbryts det vid en config-satt gräns och räknas som misslyckat
- [x] #2 Varje adapter-hämtning bär en avbrytbar tidsgräns kopplad till TanStack Querys signal; värdet bor på ETT ställe
- [x] #3 Retry sker i ETT lager på warmup-vägen; värsta fallet per item är dokumenterat i koden och högst 4 anrop
- [x] #4 4xx retryas aldrig på warmup-vägen (samma regel som useDashboardData.noRetryOn4xx)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC-textavvikelser — bokförda i runda 4, AC-texten ORÖRD (kort-beslut vid stängning)

Granskningens runda 3 på PR #2551 noterade två fel i AC-formuleringarna. Båda
är TEXT-fel i kortet, inte bygg-fel: koden och PR-kroppen säger sanningen.
Bokförda här i stället för rättade, eftersom AC-text ägs av Marcus vid
stängning (runda 4-ordern: "Rör INTE AC-texterna").

1. **AC #4:s parentes pekar på en raderad symbol.** Texten säger "(samma regel
   som useDashboardData.noRetryOn4xx)". `noRetryOn4xx` finns inte längre —
   TASK-451.4 runda 3 raderade den ur `src/components/hem/useDashboardData.ts`
   och ersatte den med den delade `husetsRetryPolicy`
   (`src/queries/retry-policy.ts`). Referensen är död; KRAVET är oförändrat och
   uppfyllt (warmup-setets sju nycklar bär `retry: false`, och transportens
   enda retry-gren är `res.status >= 500`).

2. **AC #3:s "högst 4 anrop" är felställd för `intresserade`-itemet.** Sex av
   de sju warmup-itemen gör exakt ETT EF-anrop, och för dem är taket 4
   nätverksanrop. Det sjunde, `intresserade`, går via en KLIENT-SIDIG
   cursor-walk (`AirtableAdapter.fetchIntresserade` → `samlaCursorSidor`,
   `src/data/adapters/cursorWalk.ts`) där varje sida är ett eget
   `callEdgeFunction` — taket är `4 x antal sidor`. Skivans vinst är oförändrad
   (query-lagrets faktor 4 är borta i båda fallen); det som inte håller är den
   ABSOLUTA siffran för det ena itemet. Rättat i koden sedan runda 2
   (`warmup-retry-policy.ts`) och i docblocken sedan runda 4
   (`retry-policy.ts` § RESERVATION, `useDashboardData.ts`).

Mätt i runda 4: `samlaCursorSidor` har ETT anropsställe i `src/`, så
`fetchIntresserade` är den enda klient-sidiga walken. `fetchPersonsRegister`s
fullwalk är SERVER-sidig (`supabase/functions/get-persons/index.ts`,
`register=true`-grenen) och kostar klienten ETT anrop, alltså EN tidsbudget.

## Stangningsbeslut om AC-texterna (S127 stangningsbatch, 2026-09-19)

Undersokt: npx backlog task edit --help ger ingen indexerad in-place-redigering av en enskild AC-texts strang. De tva tillgangliga vagarna misslyckas bada det uppdragna kravet (bevara bock-status OCH ordning): (1) --remove-ac <index> + --ac <text> tar bort posten och lagger den NYA sist i listan (ordning forlorad, ny post startar avbockad) och (2) --acceptance-criteria <...> ersatter HELA AC-listan (samtliga fyra poster maste skrivas om och ateravbockas, risk for tyst omordning). Ingendera bevarar bock-status och ordning samtidigt.

Beslut: AC-texterna lamnas ORORDA (samma linje som runda 4-ordern Ror INTE AC-texterna). De tva sakfelen ar redan bokforda verbatim ovan (## AC-textavvikelser - bokforda i runda 4) och i PR #2551 runda 4:s granskningsutlatande (AC-provning for AC3/AC4). Koden och dokblocken bar sanningen (husetsRetryPolicy, warmup-retry-policy.ts SS RESERVATION); enbart de tva textfragmenten (parentesen i AC4, den absoluta siffran i AC3) ar felstallda. Ingen ytterligare atgard mojlig utan att bryta uppdragets bade-och-krav.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat: PR #2551, merge c5d3882d (2026-09-19T11:07:09Z, main), fyra granskningsrundor. HAMTNINGENS_TIDSGRANS_MS=160000 (harledd ur EF:ens 150s-tak) pa ETT stalle, AbortSignal.timeout via TanStack Querys signal pa samtliga sju hamtmetoder. EN retry-policy (warmup-retry-policy.ts) ersatte 18 tecken-identiska retry-kopior; TidsgransFel slutgiltigt (aldrig retryas) i varje lager; kalltextvakt (tests/api/retry-vakt.test.ts, namn-niva, 7 negativa fixturer) mot nya retry:-stallen. Runda 3 (Marcus-mandat, vag A): global retry:3 i router.ts + ~17 inline-retryfunktioner konsoliderade, 4 till 1 korningar matt. Runda 4: tva warnings stangda (vaktens kringgaende via citerad property-nyckel patchat pa namn-niva; STATE-STRATEGY.md synkad). AC-textkorrigeringar: se append-notes stangningsbeslut ovan - texterna lamnas ORORDA per Marcus runda 4-order, sakfelen bokforda i notes + i PR-granskningens AC-provning. Grindar runda 4 (matt, exitkod separat): typecheck exit 0; typecheck:tests exit 0; biome (872 filer) exit 0; check-langa-streck exit 0 (331 filer); check:docs 14/14 (var vid PR-tidpunkten - se CLAUDE.md-rattelsen i denna batch for aktuellt tal); test:api:pure exit 0, 1869 passed; rott-forst-injektion (tillfallig, raderad) exit 1 (5 failed/2 passed pa manipulerad kod, som forvantat). Granskning: risk LAG, runda 4, 1 info-fynd (biome-formatgrinden stanger det i praktiken).
<!-- SECTION:FINAL_SUMMARY:END -->
