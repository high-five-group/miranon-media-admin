---
id: TASK-249.8
title: 'QA: Segment-promoveringen granskas i browsern'
status: Done
assignee: []
created_date: '2026-08-17 00:38'
updated_date: '2026-08-24 13:07'
labels:
  - ready-for-human
dependencies:
  - TASK-249.1
  - TASK-249.2
  - TASK-249.3
  - TASK-249.4
  - TASK-249.5
  - TASK-249.6
  - TASK-249.7
parent_task_id: TASK-249
ordinal: 470000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MANUELL TESTPLAN (skarpa segment-ytan, utan variantparameter): 1) Mallvyn: skapa segment via var och en av de tre vägarna — människomening + live-antal + förifyllt namn ska följa valen; Skapa öppnar detaljvyn direkt. 2) Verkstaden: bygg en OCH-kombination (gått både RIM 1 och RIM 2) — meningen läser som EN svensk mening, antalet stämmer mot publiklistan. 3) Modalitetsgrinden: ett nytt villkor utan modalitetsval räknas INTE och sändning är låst; blandad modalitet ger synlig fördelningsvarning. 4) Generatorn: Dela upp i grupper — tre synliga stegkort, de fjorton förskapade med verkliga mål, täckningskvittensen visar procent-formen (100 % - Full täckning...). 5) Detaljvyn: publiklistan i personlistans anatomi, inline-scroll, Får inte mailet-märkning för consent-grindade; radhöjden hoppar aldrig. 6) Utskicksvyn: testmail-raden, skriv-för-att-bekräfta mot synligt mottagarantal, grön sändknapp (aldrig röd). 7) Tidsperioden: DatumFalt under Fler avgränsningar — antalet är serverfiltrerat. 8) Rogers ord: utbildning i all UI-text, träff-ordet följer modalitetsvalet (utbildningar/föreläsningar/event). 9) 0-träffsform: ett segment utan avstämd närvaro visar neutral 0 personer ännu-fras, aldrig fel. 10) Skapa ett nytt event i basen med Kursfamilj/Kursnivå satta och se att det omfattas av familjevillkor utan kodändring. 11) Tillgänglighet stickprov: fokusflytt till h1 vid dataanländning, synlig fokusring, prefers-contrast more.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har gått igenom hela testplanen i Description mot skarpa ytan (dev-server eller staging) och kvitterat per punkt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus QA genomförd 2026-08-17 i prod (admin.miranon.dev): hela testplanen gicks igenom; fynden triagerades till task-259 (UI-fixar, PR #1534 MERGED), task-260-utredningen (PR #1522 — 0 leads i publiken, namnlösheten äkta backfill-klass), task-264/K1 (PR #1546 MERGED — mailvägen namntålig) och task-265/B1 (Leads-vyn, ready-for-human). Efter fixarna: Marcus slutkvittens i klartext 'Ser bra ut' (2026-08-17, mot prod-bundle bekräftat bärande K1). DoD #5:s flipp/rivnings-led uppfyllt via 249.1/249.5/249.6-kedjan (aria-grinden 14/14 genom båda).

S112 bokföringspass (2026-08-24): PR #1552 MERGED 2026-08-17T12:31:15Z, CI SUCCESS (gh pr view 1552), filer = enbart task-249/task-249.8-kortfilerna, inga orelaterade. Marcus slutkvittens 'Ser bra ut' i notes; check-facit.sh kört om: exit 0. Samtliga 5 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
