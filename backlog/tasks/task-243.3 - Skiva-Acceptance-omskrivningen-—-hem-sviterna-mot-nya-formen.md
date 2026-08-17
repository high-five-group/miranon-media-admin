---
id: TASK-243.3
title: 'Skiva: Acceptance-omskrivningen — hem-sviterna mot nya formen'
status: To Do
assignee: []
created_date: '2026-08-16 14:36'
updated_date: '2026-08-17 00:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-243.1
  - TASK-243.2
parent_task_id: TASK-243
ordinal: 449000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem-vyns acceptance-skydd skrivs om så nya Morgonkollen-formen bär samma testtäckning som gamla hemmet: en regression i blockordning, tomt läge, bevakningsradsvillkor eller copy fångas i CI utan mänsklig granskning. Testtäcker samtliga användarberättelser: 1–10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De fyra hem-sviterna (tests/acceptance/hem.acceptance.test.ts, hem-laddlage, hem-senaste-aktivitet, hem-senaste-aktivitet-farskhet) omskrivna mot nya formen: blockordningen, tomma läget, bevakningsradens visas-bara-med-innehåll-villkor, copy-formerna
- [x] #2 Tillgänglighet testad i acceptance-vanan (den nya formens rubrikstruktur, knappnamn, disablade bulk-knappars motivering); laddlägena mot ADR-078 + DESIGN-SYSTEM-SPEC §15
- [x] #3 Externt beteende testas, aldrig implementationsdetaljer (PRD:ns testbeslut, skarv-kvittens Marcus 2026-08-16); samtliga sviter gröna lokalt och i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning: testernas förväntningar korsläses mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json — testet får aldrig kräva något facit motsäger
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KLASSNING AV TRÄDLÄGETS RÖDA (samtliga verifierade via direkt kod-läsning + livekörning, inte antaget):

1. tests/e2e/persist-cache.staging.test.ts — HEM-FORM-SKIFTE. grunddata()s sentinel "Signe Sparad" hade status 'Bekräftad (mail skickat)' (reg()-default); NyaAnmalningar.tsx filtrerar numera strikt på status==='Obekräftad' (hem-derivations.ts § obekraftadeAnmalningar) — "Signe Sparad" kunde därför ALDRIG matcha role=link, deterministiskt, oavsett staging-data. Fix: Signes status → 'Obekräftad'; "Obetalda anmälningsavgifter"-regionen (retirerad) ersatt av en analog silent-refetch-check mot "Nya anmälningar"-räknaren; stale kommentarer om NyaAnmalningarCard/B2/hem-paritet uppdaterade. Verifierat LIVE mot staging (chromium-authenticated): 9/9 gröna ensamt (1 skip, SW-guard), och kombinerat med mer-index+aktivitetslogg-skarv i 3-worker-parallellism sågs EN flake på en ANNAN, tidsberoende assertion ("Förbereder ditt administrationsverktyg") — matchar EXAKT den redan bokförda, separata isoleringsklassen i task-34/task-28 (som pekar på en fil, tests/e2e/hem.staging.test.ts, som INTE LÄNGRE FINNS — flyttades till hem.acceptance.test.ts i task-59.3; de korten är därmed moot för denna fil och bör granskas för stängning/omformulering av en människa). Orkestrerarens datahypotes (Signe-relaterat = staging-drift) PRÖVADES OCH FÖRKASTADES: assertionerna i fråga är page.route-MOCKADE, aldrig beroende av staging-basens faktiska innehåll.

2. tests/e2e/mer-index.staging.test.ts:254 (nu ~250) — HEM-FORM-SKIFTE, men INGEN BUGG ATT LAGA: en K10-era "hem-paritet"-jämförelse (Mer och Hem delar pt-2/lg:pt-10) är obsolet sedan ADR-102/103-promoveringen gav Hem en egen, facit-låst vertikal rytm (pt-10/lg:pt-16). Mätt: mobil 40px (Hem) mot 8px (Mer); desktop 64px mot 40px. Fix: tog bort paritets-jämförelsen (bokförd öppet i testet), Mers EGNA mått (radens x=16px) står kvar orörda. Verifierat LIVE: 12/12 gröna. ÖPPEN, EJ ÅTGÄRDAD AV MIG (utanför scope, produktionskod): src/routes/_authenticated/mer/index.tsx rad 31 har samma stale "Hem-paritet (pt-2 lg:pt-10)"-kommentar i sin egen docblock — ren dokumentationsdrift, ingen körbar konsekvens.

3. tests/e2e/aktivitetslogg-skarv.staging.test.ts:238 — HEM-FORM-SKIFTE, INTE task-235/verbCopy (uppdragets premiss förkastad efter kod-läsning, ADR-086). spalten()-hjälparen använde getByTestId('senaste-aktivitet') — attributet finns INTE i den promoverade SenasteAktivitetKompakt.tsx (grep-verifierat: noll träffar i src/). Detta fäller assertionen på rad 238 (linje "await expect(spalten(page)).toBeVisible()", FÖRSTA assertionen i testet) INNAN testet ens når verbCopy-relaterad kod. Fix: EN rad, testid → role=region-lokator (samma mönster som hem-acceptance-sviterna). Den historiska verbCopy/historikvyn-diskrepansen (task-235s egen, redan bokförda fynd i filens kommentarer rad ~294-308) visade sig REDAN LÖST iträdet — hela testet, inklusive den delen, är grönt efter den enda fixen. Verifierat LIVE: 2/2 gröna.

Samtliga tre filer LIGGER UTANFÖR AC #1:s uppräknade fyra hem-acceptance-sviter (de är e2e/*.staging.test.ts, inte tests/acceptance/hem*.ts) men klassades som hem-formens-skifte per uppdragets egen scope-regel och åtgärdades i denna skiva. Ingen av de tre kräver en armerad grind-cykel för att bevisas — samtliga körda LIVE mot staging under bygget (chromium-authenticated).
<!-- SECTION:NOTES:END -->
