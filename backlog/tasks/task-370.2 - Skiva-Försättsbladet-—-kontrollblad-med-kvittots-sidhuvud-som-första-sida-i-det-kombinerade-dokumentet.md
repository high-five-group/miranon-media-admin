---
id: TASK-370.2
title: >-
  Skiva: Försättsbladet — kontrollblad med kvittots sidhuvud som första sida i
  det kombinerade dokumentet
status: To Do
assignee: []
created_date: '2026-09-03 08:31'
updated_date: '2026-09-03 10:41'
labels:
  - ready-for-agent
dependencies:
  - TASK-370.1
references:
  - tasks/sessions/2026-09-03-session-116.md
parent_task_id: TASK-370
ordinal: 668000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: det kombinerade förhandsgranskningsdokumentet börjar med ett försättsblad i kvittots formspråk (Carlito, monokrom, de gråa rundade rutorna) som återanvänder kvittots sidhuvud (logga + rubrikblock) och den delade bilage-CSS:en. Innehåll (S116 beslut 2–3): rubrik Förhandsgranskning; antal kvitton och tidpunkt; en tabell med en rad per kvitto i visningsordning: namn · mottagarens e-post · event · belopp · betalsätt; en summarad; notraden 'Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.' Bladet finns bara i förhandsgranskningen, aldrig i ett skickat kvitto. Mallen är husets första utan förlaga hos Lotta — Marcus är facit mot renderad PDF (döms i QA-skivan); beslutet bokförs i mallkatalogens README § Förlagorna. Mallen läggs i mallkatalogen enligt samma mönster som kvittomallen (källa + genererad spegel), och mallparitets-grinden + mall-synken körs. Tabellen ska klara 30 rader på en sida i 9 pt; blir det fler bryts tabellen läsbart över två sidor (Prince-primitiv: table, inte grid/flex-gap — se kvitto.css:s TASK-304-anteckningar). Testskarv 1 (enhetsnivå): försättsbladets HTML bär rätt antal rader, rätt summa och notraden; kompositionen sätter det först. Täcker användarberättelser: 2, 3, 4, 6, 20.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Försättsbladet renderas som första sida i det kombinerade dokumentet; kvittosidorna följer oförändrade efter
- [x] #2 Innehållet exakt: rubrik, antal + tidpunkt, tabell namn/e-post/event/belopp/betalsätt per kvitto i visningsordning, summarad, notraden ordagrant
- [x] #3 Sidhuvudet (logga + rubrikblock) återanvänder kvittomallens byggstenar och delade CSS; kvittomallen och kvitto.css är orörda (diff-bevis)
- [x] #4 Mallen ligger i mallkatalogen med genererad spegel; mallparitets-grinden och mall-synken gröna; README § Förlagorna bokför mallen som utan förlaga med Marcus som facit
- [x] #5 npm run mall:pdf kan rendera försättsbladet ensamt ur en fixtur (för Marcus granskning); en rendering med 30 rader bifogas kortet som mätpunkt
- [x] #6 Enhetstest: rätt radantal, rätt summa, notraden närvarande, försättsbladet först i kompositionen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Minimaltestet (två kvitton, en sidbrytning) verifierat med pdfinfo/pdftotext/pdffonts FÖRE EF-bygget, och renderingstiden vid N ≈ 30 mätt mot klienttaket (ärvd PRD-grind; markera N/A med motivering om skivan inte rör den)
- [x] #5 ADR-124 § Updates amenderad med det kombinerade utkastets nyckelform; mallkatalogens README § Förlagorna bokför försättsbladet som mall utan förlaga (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
- [x] #6 Mallparitets-grinden och mall-synken körda om försättsbladets mall läggs i mallkatalogen (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Matpunkter AC 5: mall-pdf-skriptet (npm-skriptet mall:pdf) korde forsattsblad-mallen tva ganger. N=2 (den committade fixturen forsattsblad.exempel.json): 1 sida, text 20.42-93.35 mm, 203.65 mm kvar under, Carlito inbaddat (pdffonts). N=30 (scratch-fixtur, inte committad): 1 sida, text 20.42-256.03 mm, 40.97 mm kvar under, samma tre Carlito-varianter inbaddade. Ingen sidbrytning kravs upp till taket pa 30. PDF-filerna ligger i bygg-agentens worktree under test-results/mall-pdf/task-370-2-matpunkter/ (forsattsblad-N2.pdf, forsattsblad-N30.pdf) - gitignorerat, darfor inte i git; sokvagarna star har och i slutrapporten i stallet.

DoD 4 ar N/A for denna skiva: det arvda PRD-minimaltestet (tva KOMBINERADE kvitton, tre sidor totalt, en sidbrytning, plus N cirka 30-latensmatning mot klienttaket) agers av TASK-370.3 (staging-skarpbevis) - det kraver ett skarpt DocRaptor-anrop genom preview-receipts inbetalningIds-gren, inte en enskild mall-rendering. 370.2 matte i stallet FORSATTSBLADETS EGEN rendering (mall-pdf, ensam mall, N=2 och N=30 rader) som AC 5 uttryckligen kraver - en annan matpunkt, samma verktyg.

Review runda 1 (PR 2253, risk lag) - tre fynd atgardade i en fix-commit pa samma gren: (1) WARNING byggForsattsbladData anvande ra flyttalsaddition, bytt till summeraKronor (_shared/betalningsbelopp.ts); negativt bevis: 1000.10 + 2000.20 + 0.30 med ra addition ger 3000.6000000000004, inte exakt 3000.6 (Node, mott mot den GAMLA raden innan bytet) - trots att den formaterade strangen SEK 3 000,60 rakar bli likadan i bada fallen (Intl avrundar bort felet); nytt testfall i mall-data.test.ts asserterar bada halvorna. (2) INFO tva kommentarer i kvitto-kombination.ts (rad 6 och kombineraFylldaKvittoSidor-docstringen) beskrev anropet som gorMallSjalvbarande(kvitto, ...) - ratade till att beskriva den faktiska formen (forsattsblad i den kombinerade grenen); 0 icke-kommentarrader andrade i den filen. (3) INFO PR-kroppens testrakning var fel (16 pastods for mall-data.test.ts) - raknat om mot origin/main: forsattsblad.test.ts +18 (ny fil), mall-data.test.ts +14 (13 ursprungligen + 1 ny), kvitto-forhandsgranskning.test.ts +4, mall-render-sjalvbarande-resurser.test.ts +0 kallrader men +2 runtime-fall (MALLAR-loopen vaxte 3 till 4 mallar, playwright --list bekraftade 9 till 11), mall-render.test.ts +0. PR-kroppen uppdaterad (gh pr edit), Riskbedomnings-sektionen mellan markorerna rord EJ.
<!-- SECTION:NOTES:END -->
