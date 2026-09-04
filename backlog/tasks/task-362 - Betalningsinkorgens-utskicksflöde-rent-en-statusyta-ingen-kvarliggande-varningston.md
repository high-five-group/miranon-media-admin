---
id: TASK-362
title: >-
  Betalningsinkorgens utskicksflöde: rent, en statusyta, ingen kvarliggande
  varningston
status: Done
assignee: []
created_date: '2026-09-02 09:12'
updated_date: '2026-09-02 12:56'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Betalningsinkorgens utskicksflöde ("Skicka N kvitton") ska vara RENT — Marcus prod-röktest 2026-09-02 (S113 resume 8): raden stannar i gult efter ett skickat kvitto utan väg att stänga; en grön bekräftelse ligger kvar hela besöket; rutan hoppade i höjd under utskicket. Fixen: granskningsblockets ton blir villkorad (vila/varning), bekräftelsen får kryss + auto-clear vid nästa handling, en statusyta med reserverad höjd (min-h-10) genom köat->pågår->klart, och 'Öppna betalningsinkorgen'-knappen döps om till 'Öppna betalningar' (Marcus tillägg). Källor: docs/research/utskicksbekraftelse-inkorg-auto-dismiss-vs-persistent-2026-09-02.md, s93/s102/s103-facit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Raden i granskningsblocket ('Registrerat nu') visar vilotonen (neutral, ingen gul/varning-fond) när jobbraden är 'skickat' eller 'inget kvitto'; varningston endast medan något väntar/pågår eller har fallerat
- [x] #2 Utfalls-bekräftelsen (intent success) kan stängas med kryss och nollställs automatiskt vid nästa handling (ny registrering eller ny 'Skicka N kvitton'); warning-utfall förblir ostängbara (kryss-regeln)
- [x] #3 En statusyta med reserverad höjd (min-h-10) visar köat->pågår->klart för Lottas egen sessions jobb utan att förskjuta listan under; mätt med getBoundingClientRect före/efter
- [x] #4 'Öppna betalningsinkorgen' bytt till 'Öppna betalningar' i all användarsynlig text (kodidentifierare orörda)
- [x] #5 Tillgänglighet bevarad: role=status/alert-annonsering en gång per tillståndsbyte, krysset har tillgängligt namn, axe 0 nya fel på inkorgen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 1a453356 · PR #2215 (MERGED 2026-09-02T12:49:13Z, granskad SHA cdb8e993 r3) · Granskningsloop konvergerad: r1 MEDEL (2 warning + 2 info), r2 MEDEL (3 fynd, r1-besluten 1-3 klara), r3 LÅG (3 info, samtliga auto-fix, "alla fem AC håller"). PR-CI på cdb8e993 grön per jobb (Lint+Audit+TypeCheck, Pure+Build, tre Acceptance-shards, hermetik-självtest, Webblasarbeteende, Docs link check, CodeQL, CI Passed or Skipped — Staging/A11y SKIPPED per D0/concurrency-klassning). Bevis att sharding (TASK-239, landad före denna PR:s slutliga merge-in) fungerar skarpt på DENNA PR: samma gren fälldes på 12-min-taket vid huvud 5fd94c35 (run 33622101513, Acceptance cancelled efter 12m02s, ett odelat jobb) och gick grönt på tre shards efter merge av origin/main (run 33629714497, huvud cdb8e993): shard 1 4m40s, shard 2 4m27s, shard 3 3m52s, samtliga långt under taket.

AC-status, prövad mot origin/main HEAD 1a453356 (BetalningsInkorg.tsx, PersonBetalningar.tsx): AC1 håller — kvittolage() bär fältet vila (rad 173) och blockAktivt (rad 941-942) villkorar tonen, ersätter det statiska guldet. AC2 håller — bekraftelseSynlig (rad 380) styr kryssbar success-bekräftelse, nollställs vid nästa registrering/jobb (rad 1651-1892 dokumenterar övergångarna), warning förblir ostängbar (kryss-regeln, S109-facit). AC3 håller — min-h-10-slotten delar knapp och statusrad (köat/pågår/klart), mätt 154px i BÅDA lägena med getBoundingClientRect (PR-kroppens Mätningar-sektion, tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts). AC4 håller — grep-verifierat: "Öppna betalningsinkorgen" finns bara kvar i en kommentar som citerar uppdragstexten (BetalningsInkorg.tsx:544, PersonBetalningar.tsx:172); den enda användarsynliga knapptexten är "Öppna betalningar" (PersonBetalningar.tsx:178). AC5 håller — axe 0 violations i båda tillstånden (PR-kroppens Mätningar-sektion), role=status/alert-mönstret oförändrat.

Notiskartläggning (13 ytor, grep-belagd i PR-kroppen): bekräftar att /mer/betalningar aldrig når ett globalt toast-system — de tre synliga notiserna (blockton, kryssbar bekräftelse, statusrad) är nu samlade inline i EN reserverad slot.

Divergenser mot uppdraget (ADR-086, bokförda i PR-kroppen av bygg-agenten): (1) AMENDERING-facit-ytan pekade mot s102-hem-konvergens i uppdraget men hör hemma under s103-persondetalj-konvergens (mätt mot disk, ingen koppling till Hem-vyn). (2) Testklass blev e2e-staging (chromium-authenticated) i stället för hermetisk acceptance — VITE_FEATURE_BETALNINGAR är av i hela den delade Acceptance-fixturvärlden. (3) Den levande pågår-övergången bevisas strukturellt (statusyta-form-testet) i stället för DOM-mätt live, eftersom useJobbstatus inte pollar (refetchOnMount + Realtime-push, ingen hermetisk mock kan producera en andra fetch utan att fejka websocketen).

POST-MERGE-UTFALL VID STÄNGNING: Post-merge-workflowet för 1a453356 (run 33632078329) stod fortfarande IN_PROGRESS när denna stängning skrevs (startade 12:49:15, cirka 15 min in) — bokfört som pågående, INTE som grönt. PR-nivåns egen CI (cdb8e993) var grön, men post-merge-körningen på main-mergecommiten är en annan, oberoende körning och dess utfall är overifierat av mig vid skrivtillfället.

Landning: PR #2215. Avvikelse: se Divergenser ovan (alla bokförda av bygg-agenten i PR-kroppen, inte nya fynd i denna stängning).
<!-- SECTION:FINAL_SUMMARY:END -->
