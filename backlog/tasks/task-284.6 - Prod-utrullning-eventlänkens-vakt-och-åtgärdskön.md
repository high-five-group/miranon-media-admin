---
id: TASK-284.6
title: 'Prod-utrullning: eventlänkens vakt och åtgärdskön'
status: To Do
assignee: []
created_date: '2026-08-21 11:36'
labels:
  - ready-for-human
dependencies:
  - TASK-284.5
parent_task_id: TASK-284
ordinal: 528000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MARCUS-MOMENT. Skivorna 284.1-284.4 byggs och verifieras mot staging; detta kort är utrullningen till prod, och den kräver GO per operation.

VARFÖR ETT EGET KORT: prod-write kan inte hämta godkännande mitt i en agentkörning. Att låta skivorna bära prod-momentet gjorde hela kedjan blockerad på Marcus närvaro — inklusive de två skivor som är ren appkod. Utbrytningen speglar hur repot redan hanterar Edge Functions: bygget är agentens, utrullningen kör Marcus.

ORDNINGEN ÄR INTE FÖRHANDLINGSBAR: fälten först (de är passiva och kan inte skada något), kontrollsvep sedan, och A1-ändringen SIST. Vakten är det enda steget som ändrar beteende för inkommande anmälningar, och den ska slås på när fältet redan visat att bilden av basen stämmer.

FÖRUTSÄTTNING: rotfixen på miranon.se (ADR-122 beslut 1) bör vara gjord före aktivering. Görs den inte, kommer vakten att fälla verkliga anmälningar från felskrivna kalenderlänkar — vilket är korrekt beteende, men innebär att åtgärdskön fylls med rader Lotta måste hantera för hand tills länkarna är rättade.

Täcker användarberättelser: samtliga, i sin skarpa form.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De två jämförelsefälten skapade i prod-basen med samma form som i staging — uppslaget läst tillbaka och formelfältets tre värden verifierade mot kända rader
- [ ] #2 Kontrollsvep FÖRE aktivering: antalet rader som får värdet Avviker är känt och förklarat innan vakten slås på — en oväntad mängd är ett STOPP, inte något att bocka av
- [ ] #3 A1 ändrad i prod till ersättningsformen, med skriptet identiskt med det som verifierats i staging
- [ ] #4 Skarpt prov i prod efter aktivering: en testanmälan med avvikande uppgifter får INGEN eventlänk, och en korrekt anmälan länkas som förut
- [ ] #5 Testanmälningarna städade ur prod efter provet, med spårbarhetsrad i Notering
- [ ] #6 De tre historiska raderna (ID 21, 22, 23) och de 11 tvetydiga på Event-55 är INTE rörda av utrullningen — de väntar på Lottas besked och hör till ett annat spår
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
