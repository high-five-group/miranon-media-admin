---
id: TASK-284.6
title: 'Prod-utrullning: eventlänkens vakt och åtgärdskön'
status: To Do
assignee: []
created_date: '2026-08-21 11:36'
updated_date: '2026-08-22 11:53'
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
- [x] #1 De två jämförelsefälten skapade i prod-basen med samma form som i staging — uppslaget läst tillbaka och formelfältets tre värden verifierade mot kända rader
- [x] #2 Kontrollsvep FÖRE aktivering: antalet rader som får värdet Avviker är känt och förklarat innan vakten slås på — en oväntad mängd är ett STOPP, inte något att bocka av
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STEG 1 GENOMFÖRT 2026-08-22 (S110 Del 10, Marcus GO 'Kör Claude!'). AC #1: Datum (from Event) skapat i prod som multipleLookupValues (fldho1zlmKxT4gZ0o, recordLinkFieldId fldi3enUaMdbuGSlm → Eventplanering.Datum (visas i länk) fldc3aWz7CxO4rDdl — samma käll-ID som staging, live-verifierat). Eventmatchning skapat som formula (fld40RI3Jf7RaHpTa), T168-rättad form; staging-formeln verbatim med tre ID:n ommappade: Ort (from Event) fldUhHceqBud4BHvf→fld5560T3pQZSUBaJ, Kurs (from Event) fldcTDSzGBG0bHjl3→fldfqU6MfBQdaeLUk, Datum (from Event)→fldho1zlmKxT4gZ0o; strukturen maskinellt jämförd mot staging med ID:n normaliserade: identisk. Båda isValid. Tre värden verifierade: OK på Event-59-raderna (alla tre formateringsklasserna), Avviker på kända rader, Utan event = 0 rader (orphan 0 sedan Del 2; grenen strukturellt identisk med staging). AC #2 KONTROLLSVEP: 5 Avviker mot förväntat 4 — STOPP rapporterat, alla fem förklarade: 21/22/23 (Lotta, AC #6, orörda), 960 (Mona Norin, '25-26 oktober' kalenderlänkens mellanform), 197 (Andreas Pettersson, Event-18: Datum '14–15+maj+2026' — URL-kodade mellanslag; Event-18:s falska positiv, öppen sedan 284.1, LOKALISERAD av räkningen). Två konsekvenser lyfta: prod-kön visar raderna, och 960/197 kan INTE lösas via appens resolution (sätter Event+EventKey, inte Datum-texten). Marcus valde väg (c): datat rättat i basen för 197 ('14–15 maj 2026') och 960 ('24–25 oktober 2026') med spårbarhetsrad appendad i Notering — båda OK direkt; prod-kön 5 → 3 (exakt Lottas). Återfallsrisken som nytt kort TASK-293 (+ → mellanslag i formel, vakt-skript och fixtur). Utan event fortsatt 0. A1 ORÖRD — steg 2 (AC #3) väntar Marcus GO.
<!-- SECTION:NOTES:END -->
