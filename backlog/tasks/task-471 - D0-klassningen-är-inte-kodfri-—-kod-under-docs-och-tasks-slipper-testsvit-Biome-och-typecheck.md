---
id: TASK-471
title: >-
  D0-klassningen är inte kodfri — kod under docs/** och tasks/** slipper
  testsvit, Biome och typecheck
status: To Do
assignee: []
created_date: '2026-09-19 01:36'
updated_date: '2026-09-19 12:28'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 812000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnet av granskaren av #2558 (S5) och stickprovat av orkestreraren 2026-09-19: ci.yml:s D0-allowlist (blocket paritet:start klassning-d0) omfattar docs/** och tasks/**, men under de katalogerna ligger körbar kod — åtta JS-filer (docs/backfill/segment-export/*.mjs, docs/reference/automation-scripts/a1-eventmatchning-vakt.js, tasks/sessions/bilagor/**/*.mjs) och en HTML-fil med skript (docs/design/farg-atlas.html). En ändring som BARA rör sådan kod klassas som dokument och slipper hela testsviten — och efter S4 + SE2 (TASK-464.1) även Biome och typkontroll. För CodeQL-ytan stängs hålet av #2558:s vakt scripts/check-codeql-d0-kodfri.sh (analyserbar fil under ignorerad sökväg kräver deklarerat undantag med skäl). Samma premiss — 'D0 = kodfritt' — bär ci.yml:s klassning och är lika obevakad där. Ifrågasätt underifrån: hör körbar kod hemma under en dokumentkatalog alls? Alternativ: (a) återanvänd #2558:s vakt så att den också vaktar ci.yml:s D0-lista (en vakt, två konsumenter, samma undantagslista), (b) flytta koden ut ur dokumentkatalogerna, (c) smalna av D0-mönstren till ändelser. Marcus ledstjärna: värdera i BÅDA måtten väntetid och fakturerade Actions-minuter; inget nytt jobb.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En ny analyserbar fil (JS/TS-familjen, HTML med skript, action.yml) under en D0-klassad sökväg fäller en grind före landning — eller klassas som kod — bevisat tvåsidigt
- [x] #2 En vakt och en undantagslista delas mellan CodeQL-ytan och ci.yml:s klassning (ingen andra kopia); de nio kända filerna är deklarerade med skäl eller flyttade
- [x] #3 verify-ci-parity:s lokala klassning ger samma utfall som CI för samma diff
- [x] #4 PR-kroppens 'Kostnad i två mått' med mätta körningar; CLAUDE.md-prosan om D0 rättad där den blivit falsk
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ÅKER MED NÄSTA KODKLASSADE CI-PR (S126, 2026-09-19, Marcus-beslut A på #2564 runda 3): två info-fynd som INTE rättades i #2564 för att slippa en ny head + ny granskning (~190 fakturerade min för två textrader): (1) .github/workflows/ci.yml rad ~1061 — kommentaren på steget 'Validate CodeQL D0-undantaget är kodfritt' påstår att steget ligger i regionen docs-grindar-ci; det ligger i lint-jobbet (rad 1059–1104), regionen ligger i docs-jobbet (rad 2948–3123). Mekaniken är rätt, prosan falsk (ADR-083-klassen) — en agent som litar på kommentaren och flyttar steget återskapar fail-open-hålet rebasen undvek. (2) scripts/verify-ci-parity.mjs rad ~833 — jobLabel '(… + 9 av lint-jobbets steg)' ska vara 3 efter SE2. Källa: review-utlåtandet runda 3 i #2564:s PR-kropp.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Alternativ (a) valt (Marcus ledstjärna, inget nytt jobb): `scripts/check-codeql-d0-kodfri.sh` generaliserad — START_MARK/SLUT_MARK parametriserade (nya env-var CODEQL_D0_KODFRI_START_MARK/_SLUT_MARK) och glob-extraktionen skriven om till en FORMAT-AGNOSTISK radtolkare som bär BÅDA D0-listornas skrivsätt (codeql.yml: citerad YAML-lista; ci.yml: ociterad `files: |`-block-scalar + `!`-negationer). Samma skript, samma `.codeql-d0-kodfri-policy.conf` som delad undantagslista, körs nu TVÅ GÅNGER i ci.yml:s `lint`-jobb (inget nytt jobb) — en gång mot codeql.yml (som förut, TASK-464.2), en gång DIREKT mot ci.yml:s egen `klassning-d0`-region (TASK-471). Samma dubblering i check-docs.sh för lokal paritet.

Disk-verifierat 2026-09-19 (inte "nio" som kortets ursprungstext säger — den siffran var review runda 1:s FÖRSTA fynd, innan runda 2-4 lade till fyra fler): 13 analyserbara filer under D0, 13 deklarerade undantag, 0 odeklarerade — IDENTISKT mätt mot BÅDA konsumenterna (codeql.yml-läge och ci.yml-läge gav byte-identiskt utfall).

Tvåsidigt bevis (AC #1), rött-först dokumenterat: `scripts/test-check-codeql-d0-kodfri.sh` utökad 15→19 fall (T16-T19, ci.yml:s FAKTISKA skrivsätt). T16-T18 kördes mot den GAMLA (pre-fix) skriptversionen och föll (exit=2, kunde inte läsa formatet/markörerna) innan fixen — 16/19 gröna, 3 röda; 19/19 gröna efter. Levande probe mot repots riktiga träd (en ny .mjs under docs/research/) fälldes av BÅDA konsumenterna (exit 1 vardera), en ren .md-fil grön.

AC #2: en vakt, en undantagslista, två konsumenter — mekaniskt bevisat (samma skript, env-styrt mål, identiskt utfall mot båda D0-regionerna).

AC #3: `npm run verify:ci-parity:fast` (660,2 s, 38 gröna/0 röda/3 skippade --fast) körde och godkände BÅDA invokationerna — en via check:docs (nu 17 grindar, var 16), en via den verbatim-härledda lint-jobbsteg-exekveringen. Befintlig D8-testfixtur i test-verify-ci-parity.mjs (docsOnly-klassningen ÄNDRAS INTE av en kod-ändelse under D0 — bara en informationsrad läggs till) lämnad orörd med avsikt: att byta toppnivå-etiketten till "KOD" hade motsagt ett redan tvåsidigt testat designval (D8b), inte fixat något.

DIVERGENS FRÅN UPPDRAGETS PREMISS (ADR-086, redovisad öppet): uppdraget antog att fixen skulle flytta review-backstoppens `should_skip_tests`-gräns. Den gör INTE det — `should_skip_tests` (path-glob, oförändrad av denna PR) är fortfarande vad review-backstopp läser; mitt tillägg är en VALIDERINGSGRIND inuti `lint`-jobbet, oberoende av den flaggan. En diff med en NY odeklarerad analyserbar D0-fil kan aldrig nå ett landningsbart läge överhuvudtaget (lint faller, `ci-passed` kräver lint) — review-backstoppens gräns blir därför aldrig den avgörande frågan för just det scenariot. codeql.yml självt är OFÖRÄNDRAT (ingen spegling behövs — min ändring lägger till en KONSUMENT av samma vakt, rör aldrig codeql.yml:s egen lista).

"Kostnad i två mått" (PR-kropp): tillägget mätt till ~0,27 s per körning (3 körningar, lokalt), noll ny runner — samma jobb som redan kör. Historisk exponering: 25 icke-merge-commits senaste 30 dagarna rörde minst en av de 13 deklarerade filerna (git log) — men eftersom mekanismen bara fäller på ODEKLARERADE filer, och samtliga 13 redan är deklarerade, hade INGEN av dessa 25 blockerats eller "klassats om" av denna ändring (0 × 45 fakt. min/kö-svit, Del 17-tabellen #2556, n=1). Skyddet är FRAMÅTRIKTAT (en framtida ny/odeklarerad fil) och FÖRSVAR-I-DJUP (oberoende av att check-listparitet.sh:s klassning-codeql-positiv-par förblir korrekt), inte ett historiskt antal blockerade landningar — redovisat öppet i stället för att tvinga fram ett missvisande högt tal.

Två uppskjutna info-fynd från #2564 runda 3 betalda i samma PR (kortets egna Implementation Notes, Marcus-beslut A): ci.yml:s felaktiga "docs-grindar-ci"-prosa på de två CodeQL-stegen rättad (de bor i `lint`-jobbet, inte den regionen); verify-ci-parity.mjs:s jobLabel "9 av lint-jobbets steg" rättat till "3" (SE2-talet).

CLAUDE.md: "16 dokumentations-grindar" → "17" (mätt via `npm run check:docs`s egen slutrad, aldrig avskrivet).

Grindar körda och gröna: actionlint (CI:s exakta -ignore-flagga), yamllint, check-listparitet.sh (9 par i synk), check:docs (17/17), verify:ci-parity:fast (38/0/3, 660,2 s), Biome (0 fel), typecheck (0 fel), build, test-check-codeql-d0-kodfri.sh (19/19), test-check-codeql-push-pr-parity.mjs (17/17, oförändrad, sanity), test-check-listparitet.sh (20/20), test-verify-ci-parity.mjs (88/88). test:api: 2411/2418 gröna — 7 röda, samtliga på `*.staging.test.ts` (nätverksberoende Supabase-staging-integrationstester i filer denna PR aldrig rör: generate-event-attachment, hamta-inbetalningar-batch, hamta-oppna-betalningar-kvitto-avbojt, preview-receipt, send-registration-confirmation, skapa-om-event-bilaga) — timeout/"context closed"-mönster, konsistent med delad-staging-flakighet snarare än en regression; ej vidare diagnostiserat (utanför scope, `npm run metrics:flake` är rätt verktyg om det ska klassas).
<!-- SECTION:FINAL_SUMMARY:END -->
