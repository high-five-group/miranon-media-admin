---
id: TASK-284.1
title: 'Skiva: Jämförelsefälten och markören — tracer bullet'
status: To Do
assignee: []
created_date: '2026-08-21 10:56'
updated_date: '2026-08-21 11:35'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-284
ordinal: 516000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TRACER BULLET för hela arbetsenheten: en smal men komplett väg genom alla berörda lager — datakällans jämförelsefält, datalagrets svar, och markören i den lista anmälan bor i.

BETEENDE ÄNDE TILL ÄNDE: en anmälan vars egna uppgifter (datum, ort, kurs) inte stämmer med det event den är länkad till får ett beräknat värde som säger att den avviker. Lotta ser markören direkt i anmälningslistan, utan att någon kört ett svep och utan att hon behöver veta att en kontroll finns. En anmälan som stämmer får inget märke, och en anmälan vars uppgifter är ofullständiga behandlas som obedömbar — aldrig som fel.

VARFÖR FÖRST: vakten i nästa skiva behöver samma jämförelsefält som detta fält gör. Denna skiva är därför förutsättningen för de tre andra, trots att vakten är mer brådskande.

PROD-WRITE: fältskapande i prod-basen kräver Marcus GO per operation — därför ready-for-human.

Täcker användarberättelser: 5, 10, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Uppslagsfältet för eventets länk-datum finns på Anmälningar och läser eventets egen visningsdatum-sträng
- [ ] #2 Formelfältet Eventmatchning finns och ger exakt tre värden: OK, Avviker, Utan event
- [ ] #3 Tomt jämförelsefält ger ALDRIG Avviker — trestegs-logiken bevisad mot en backfill-rad som saknar ortsuppgift
- [ ] #4 Normaliseringen hanterar de tre MÄTTA formateringsklasserna — skiftläge, mellanslag runt tankstreck, upprepat årtal vid månadsskifte — bevisad mot Event-59:s rader, som ska ge OK
- [ ] #5 Anmälan ID 21 ger Avviker: formulärtexten säger RIM 1 Rönninge mars, det länkade eventet är RIM 2 Varberg februari — levande fixtur som avviker på både ort och datum
- [ ] #6 Uppslagsfältens listform packas upp korrekt i jämförelsen — fälten returnerar arrayer, inte skalärer (mätt)
- [ ] #7 Fältet ingår i anmälningssvaret från datalagret
- [ ] #8 Markören syns på avvikande rad i anmälningslistan och bär aldrig betydelse enbart genom färg
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
OMKLASSAD 2026-08-21 (Marcus GO): skivan byggs och verifieras mot STAGING-basen apphjj8Q7lkXCMsL4 — inte prod. Prod-utrullningen är utbruten till TASK-284.6.

STAGING ÄR EN STRUKTURELL KOPIA: alla 11 automationer finns där med IDENTISKA ID:n som prod (A1 = wflDCKPAv2P6Yu9U6 i båda), men samtliga står deploymentStatus: undeployed. Marcus GO finns för att deploya A1 i staging när kedjan behöver provas ände-till-ände.

AC 4 och 5 pekar på PROD-instanser (Event-59:s tre formateringsfall, anmälan ID 21 som avviker på både ort och datum). I staging skapas motsvarande fixturer med samma egenskaper — prod-instanserna är FACIT för vad fixturen ska bevisa, inte rader att kopiera.

Fältnamnen som ska skapas: ett uppslagsfält av Eventplanering.'Datum (visas i länk)' via Event-länken (fldi3enUaMdbuGSlm), plus formelfältet Eventmatchning. Tre av fyra jämförelsefält finns redan som uppslag: Ort (from Event) fld5560T3pQZSUBaJ, Kurs (from Event) fldfqU6MfBQdaeLUk, Event (namn) fldK1aYEm3iCg8OOh. Startdatum/Slutdatum är också uppslag (mätt: returneras som arrayer).
<!-- SECTION:NOTES:END -->
