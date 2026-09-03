---
id: TASK-370.3
title: >-
  Skiva: Staging-skarpbevis och mätning — tre sidor ut ur två kvitton, latens
  vid trettio, taket justerat
status: To Do
assignee: []
created_date: '2026-09-03 08:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-370.1
  - TASK-370.2
references:
  - tasks/sessions/2026-09-03-session-116.md
parent_task_id: TASK-370
ordinal: 669000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: mot staging (riktig DocRaptor, riktig Storage) anropas förhandsgransknings-EF:en med två fixtur-inbetalningar och svarar med en signerad länk till en PDF med exakt tre sidor (försättsblad + två kvitton), Carlito inbäddat på alla sidor, rätt namn och belopp på rätt sida, ingen överlappning vid sidbrytningarna, platshållaren FÖRHANDSVISNING på båda kvittosidorna, försättsbladets summa lika med summan av de två. Testet lever som permanent staging-test i samma skarv som dagens preview-receipt-staging-test (testskarv 2). Mätning: 30 fixtur-kvitton renderas och DocRaptor-latensen läses ur svaret; jämförs mot vårt eget klienttak (30 s) och DocRaptors 60 s; ligger latensen nära taket höjs VÅRT tak (under 60 s), annars bekräftas 30 kvitton som tak. Utfallet (verbatim tal) bokförs i kortet och taket i 370.1 justeras i samma PR om mätningen kräver det. Täcker användarberättelser: 15, 19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging-test: två inbetalningar → PDF med exakt tre sidor (pdfinfo), Carlito emb=yes på alla sidor (pdffonts), rätt namn/belopp per sida utan överlappning (pdftotext -bbox), summan på försättsbladet stämmer
- [ ] #2 Mätning vid 30 kvitton: DocRaptor-latens och total svarstid bokförda verbatim i kortet, jämförda mot 30 s-klienttaket och 60 s-gränsen
- [ ] #3 Taket (30) bekräftat eller justerat med motivering ur mätningen; en justering landar i samma PR
- [ ] #4 Testet är wirat i den staging-klass CI redan kör och skyddat av samma bas-guard som befintliga staging-tester
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Minimaltestet (två kvitton, en sidbrytning) verifierat med pdfinfo/pdftotext/pdffonts FÖRE EF-bygget, och renderingstiden vid N ≈ 30 mätt mot klienttaket (ärvd PRD-grind; markera N/A med motivering om skivan inte rör den)
- [ ] #5 ADR-124 § Updates amenderad med det kombinerade utkastets nyckelform; mallkatalogens README § Förlagorna bokför försättsbladet som mall utan förlaga (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
- [ ] #6 Mallparitets-grinden och mall-synken körda om försättsbladets mall läggs i mallkatalogen (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
<!-- DOD:END -->
