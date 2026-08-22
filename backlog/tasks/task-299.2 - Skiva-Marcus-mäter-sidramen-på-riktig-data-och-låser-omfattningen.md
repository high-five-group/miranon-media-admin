---
id: TASK-299.2
title: 'Skiva: Marcus mäter sidramen på riktig data och låser omfattningen'
status: To Do
assignee: []
created_date: '2026-08-22 19:14'
updated_date: '2026-08-22 21:49'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 542000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus öppnar persondetaljen, check-in, aktivitetshistoriken och dokumentytan i appen med riktig data, slår om dev-parametern och ser den nya sidramen under händerna. Han väljer sedan hur brett den delade vy-grunden ska dras: bara sidkromet, sidkrom plus rubrikblock, eller full omfattning inklusive de två ytor som i dag bär den andra dialekten. Beslutet är det som låser skiva 6:s arbete. Täcker användarberättelser: 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra ytorna granskade med och utan dev-parametern, på både desktop och mobil
- [x] #2 Marcus har valt omfattning i klartext; valet citeras daterat på detta kort
- [x] #3 Valet skrivs in i TASK-299 som en daterad not, så efterföljande skivor läser EN källa
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS BESLUT 2026-08-22 — omfattningen låst, i två halvor.

Ytaxeln, verbatim: "jag tycker vi ska köra full omfattning". FULL OMFATTNING — den delade sidramen bärs av alla ytor, inklusive de två som i dag bär den andra dialekten. Skälet han ställde sig bakom: smalare omfattning gör anmälningssidan till en tredje konsument av den ena dialekten, varpå defekten (två oförenliga sidram-dialekter, båda facit-stämplade) står kvar med sällskap i stället för att lösas. Priset är kvitterat i samma andetag: de två avvikande ytornas facit måste amenderas med hans citat och deras visuella baslinjer göras om — TASK-299.6 växer därmed.

Ägandeskapsaxeln, verbatim: "Jag står vid dina rekommendationer på alla punkter" som svar på frågan "Bara sidkromet eller rubrik-blocket också?". BARA SIDKROMET — sidramen äger chevron och kortyta, rubriken lever kvar i varje sida. Grunden är mätt, inte tyckt: den rubrik-ägande grenen har NOLL konsumenter i dag; TASK-299.1-agenten fick bygga en demosida på /dev/primitives enbart för att kunna testa den. Att införa den nu vore abstraktion utan användare, och asymmetriskt dyr att ångra — att bredda senare är lätt, att smalna av betyder att plocka isär varje konsument.

ATT AXELN VAR TVÅ upptäcktes först vid beslutstillfället: kortets tre alternativ blandar ihop VILKA ytor som bär sidramen med HUR MYCKET sidramen äger. Noten i TASK-299 skriver ut båda halvorna, eftersom AC #3:s hela syfte är att efterföljande skivor ska läsa EN källa utan att gissa.

AC #1 EJ AVBOCKAD — OCH DET ÄR AVSIKTLIGT. Kriteriet kräver att alla fyra ytorna granskats med och utan dev-parametern på BÅDE desktop och mobil. Marcus fattade beslutet utan att den genomgången bekräftats för mig; jag har belägg för valet, inte för granskningen. Att bocka det hade gjort registret osant. Bocka det när genomgången faktiskt är gjord — eller stryk kriteriet medvetet om beslutet bedöms bära utan det.
<!-- SECTION:NOTES:END -->
