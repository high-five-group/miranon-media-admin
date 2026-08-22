---
id: TASK-243.6
title: >-
  Fynd: hem-vyns visuella promoverings-grind vaktar den rivna K10-formen —
  blockerar baslinje-födseln
status: In Progress
assignee: []
created_date: '2026-08-22 18:00'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-243
ordinal: 540000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den visuella promoverings-grinden för hem-spalten "Senaste aktivitet" (tests/visual/hem-aktivitetsspalt-promoverings-grind.spec.ts, född i d72e9c90/TASK-201.7) låser den RETIRERADE K10-formen. TASK-243.1 (d794669f) ersatte src/components/hem/SenasteAktivitet.tsx (203 rader, raderade) med SenasteAktivitetKompakt.tsx (87 rader) utan att röra någon fil under tests/visual/ — disk-verifierat: git show --stat d794669f ger noll träffar på visual/__aria__. TASK-243.3 lagade SAMMA felklass i tre e2e-filer (dess Implementation Notes punkt 3: testid → role=region-lokator i aktivitetslogg-skarv.staging.test.ts) men uppräkningen i dess AC #1 omfattade bara tests/acceptance/hem*.ts — tests/visual/ föll utanför.

Utfall: baslinje-dispatchen 2026-08-22 (gh run view 32587783890) gav 238 passed / 8 failed, samtliga åtta i hem-vyn. Lokalt reproducerat mot main 9be5172d: 8 failed, samma åtta.

TRE oberoende staleness-axlar i grinden, var och en mätt:
(1) lokatorn page.getByTestId('senaste-aktivitet') — attributet finns inte i src/ (grep: noll träffar);
(2) ankaret getByRole('region', { name: 'Nya anmälningar att hantera' }) — regionens faktiska namn är dynamiskt, "N nya anmälningar att bekräfta" (NyaAnmalningar.tsx rad 62);
(3) aria-referenserna bär complementary "Senaste aktivitet" (rollen finns inte i src/ — grep på complementary/<aside> i src/components/hem/ ger noll) och den OMAPPADE verb-copyn "Roger bekräftade anmälan" (mappad form sedan TASK-225.3: "bekräftade en anmälan").

Dessutom: fallet "under xl — ingen spalt" beskriver ett rivet beteende. PRD task-243 kräver explicit alla bredder (Hem.tsx rad 396: "6. SENASTE AKTIVITET — kompakt, alla bredder."), och fallet skulle bli FALSKT GRÖNT om bara ankaret lagades: toBeHidden() och toHaveCount(0) passerar båda trivialt mot element som inte finns.

KORTET LAGAR GRINDEN, INTE FORMEN. Formen är stämplad (s102-hem-konvergens/facit.json, godkand av marcus 2026-08-17) och rörs inte — noll filer under src/ i diffen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grindens lokator träffar den faktiska formen via getByRole('region', { name: 'Senaste aktivitet' }) — samma mönster TASK-243.3 valde för aktivitetslogg-skarven; INGEN data-testid tillförd i src/ (den frånvaron är ett öppet bokfört designbeslut i hem-senaste-aktivitet.acceptance.test.ts)
- [ ] #2 Ankaret i under-xl-fallet träffar NyaAnmalningar-regionens faktiska, dynamiska namn
- [ ] #3 Fallet 'under xl — ingen spalt' omskrivet mot PRD task-243:s 'alla bredder'; ingen frånvaro-assertion mot en riven form kvar (ingen falsk grönhet)
- [ ] #4 hem.spec.ts:18 scopad till hälsningens h1 så display_name-avsikten bevaras utan strict-mode-krock
- [ ] #5 ariaSnapshot-referenserna regenererade med --update-snapshots=all (inte preset changed)
- [ ] #6 npm run test:visual exit 0 för de åtta tidigare röda fallen, mätt
- [ ] #7 Amenderings-sidofil enligt ADR-102 § A3 skriven bredvid s102-hem-konvergens/facit.json med föreslagen klass och mätt motivering; godkand aldrig rörd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
