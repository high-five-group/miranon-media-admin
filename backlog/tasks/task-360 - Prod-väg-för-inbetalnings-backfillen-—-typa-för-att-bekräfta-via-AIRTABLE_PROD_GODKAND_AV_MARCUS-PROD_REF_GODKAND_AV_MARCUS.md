---
id: TASK-360
title: >-
  Prod-väg för inbetalnings-backfillen — typa-för-att-bekräfta via
  AIRTABLE_PROD_GODKAND_AV_MARCUS / PROD_REF_GODKAND_AV_MARCUS
status: To Do
assignee: []
created_date: '2026-09-02 08:34'
updated_date: '2026-09-02 08:35'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/backfill-inbetalningar.mjs fick en prod-väg av samma typa-för-att-bekräfta-klass som scripts/create-betalningsfalt.mjs (PR #2192, TASK-309.9). Marcus mandat 2026-09-02 (S113 resume 8): "Kör backfill. Gör det ordentligt." — svar på STOPPA-frågan i docs/reference/prod-driftsattning-betalningsflodet-runbook.md § Steg 13 punkt 2 om upplåsningsformen.

--bas <baseId> mot en bas i forbiddenBaseIds släpps ENDAST när AIRTABLE_PROD_GODKAND_AV_MARCUS === den exakta bas-ID:n. --projekt-ref <ref> mot prod släpps ENDAST när miljövariabeln .prod-ref-policy.conf sin PROD_REF_BYPASS_VAR namnger (PROD_REF_GODKAND_AV_MARCUS) === den exakta refen — läst ur policyn, inte hårdkodat. provaLanktillstands hårda "länk=PROD"-vägran (gäller annars oavsett malRef) släpper nu bara den exakta länk=PROD+mål=PROD-kombinationen, och bara när BÅDA overrides ovan redan godkänt bypass (prodGodkand). Ny konsistensvakt validateMiljoKonsistens vägrar en körning där --bas och --projekt-ref pekar åt olika håll, eftersom backfillen skriver till Airtable-spegeln OCH Postgres i samma körning. Varje släppt override loggas synligt till stderr, aldrig tyst.

De fyra oberoende låsen (validateBaseGuard, validateProjectRef, provaLanktillstand, scripts/deny-prod-ref.sh) består oförändrade. .backfill-inbetalningar-policy.json bär fortfarande INTE prod-refens värde (§ A11 i testsviten låser detta, oförändrat).

Dokumentation uppdaterad: docs/reference/backfill-inbetalningar.md § Prod (tabellens 'Kan en flagga kringgå det?'-kolumn + formbeslutet), docs/reference/prod-driftsattning-betalningsflodet-runbook.md § Steg 13 (det körbara kommandot med <prod-ref>/<prod-bas-id>-platshållare + miljövariabel-listan), CHANGELOG.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skriptet accepterar --bas <baseId> mot en forbiddenBaseIds-bas ENDAST när AIRTABLE_PROD_GODKAND_AV_MARCUS är satt till EXAKT samma bas-ID; fel eller saknat värde fäller oförändrat
- [x] #2 Skriptet accepterar --projekt-ref <ref> mot prod ENDAST när miljövariabeln namngiven av .prod-ref-policy.conf sin PROD_REF_BYPASS_VAR är satt till EXAKT samma ref; fel eller saknat värde fäller oförändrat
- [x] #3 provaLanktillstands hårda länk=PROD-vägran släpper igenom ENDAST kombinationen länk=PROD + mål=PROD, och ENDAST när båda ovanstående overrides redan godkänt bypass — varje annan kombination (inkl. länk=PROD+mål=staging) fäller som innan
- [x] #4 Ny guard validateMiljoKonsistens fäller en körning där --bas och --projekt-ref inte pekar åt SAMMA håll (båda prod, eller båda staging)
- [x] #5 Varje släppt override skriver en synlig BYPASS ANVÄND-rad till stderr, i samma stil som scripts/deny-prod-ref.sh
- [x] #6 .backfill-inbetalningar-policy.json bär fortfarande INTE prod-refens värde (§ A11 i testsviten oförändrat grön)
- [x] #7 Dry-run mot staging utan flaggor är bit-för-bit oförändrat (regressionsbevis kört och grönt)
- [x] #8 Tvåsidiga tester för varje override (saknas → fäller, fel värde → fäller, exakt värde → släpper + loggar) tillagda i scripts/test-backfill-inbetalningar.mjs
- [x] #9 docs/reference/backfill-inbetalningar.md § Prod och docs/reference/prod-driftsattning-betalningsflodet-runbook.md § Steg 13 uppdaterade med det körbara kommandot (platshållare för prod-ref/bas-ID, aldrig utskrivna) och miljövariabel-listan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
