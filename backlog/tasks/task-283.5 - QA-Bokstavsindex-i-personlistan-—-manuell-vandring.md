---
id: TASK-283.5
title: 'QA: Bokstavsindex i personlistan — manuell vandring'
status: Done
assignee: []
created_date: '2026-08-21 08:57'
updated_date: '2026-08-24 13:58'
labels:
  - ready-for-human
dependencies:
  - TASK-283.1
  - TASK-283.2
  - TASK-283.3
  - TASK-283.4
parent_task_id: TASK-283
ordinal: 514000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan i webbläsaren. Körs av Marcus efter att skiva 1 till 4 landat.

1. Öppna personlistan. Ligger bokstavsraden direkt under sökrutan, och ser den ut att höra ihop med den?
2. Räkna knapparna. Är det A till Z, sedan Å, Ä, Ö, och sist "Utan namn"?
3. Tryck på en vanlig bokstav, till exempel K. Visas bara personer som börjar på K? Stämmer räknar-radens siffra med vad du ser?
4. Tryck på samma bokstav igen. Kommer hela listan tillbaka?
5. Tryck på Å. Får du de fem Åsa-personerna, och INGA A-namn?
6. Tryck på A. Får du A-namn, och INGA Åsa-personer?
7. Tryck på E. Dyker det upp personer utan namn i listan? Det ska det INTE göra.
8. Tryck på "Utan namn". Får du dem där i stället?
9. Titta på Ä och Ö. Är de nedtonade och omöjliga att trycka på?
10. Skriv något i sökrutan medan en bokstav är vald. Smalnar urvalet av, eller börjar det om?
11. Skriv något som inte kan finnas, till exempel "zzz", med en bokstav vald. Får du ett tydligt tomläge, inte en trasig sida?
12. Byt bokstav några gånger och titta på raden. Flyttar sig något under den? Det ska det inte.
13. Öppna en person, backa tillbaka. Hamnar du i samma filtrerade lista?
14. Ta upp appen i telefonen. Går alla knappar att träffa utan att du råkar välja fel? Ryms raden, eller bryts den snyggt?
15. Tabba genom sidan. Går det att passera hela raden utan att trycka trettio gånger?

Fyller något av stegen dig med tvekan: skriv ett nytt kort med exakt symptom och förväntat beteende. Retuschera aldrig detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga 15 steg i testplanen gångna i webbläsaren, desktop och telefon
- [ ] #2 Varje avvikelse har fått ETT EGET kort med exakt symptom och förväntat beteende — detta kort retuscheras aldrig
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AVSTÅDD PÅ MARCUS BESLUT 2026-08-22, verbatim: 'Nej inget Q&A, skit i det. Gör klart allt de andra.' — citatet står källmärkt i föräldrakortet TASK-283 § Implementation Notes rad 152 (verifierat: grep -n 'Nej inget Q&A' mot task-283-filen ger exakt den raden). QA-vandringen (15 steg) körs därmed inte; AC #1/#2 kan inte bockas mot belägg eftersom vandringen inte skett — de lämnas OBOCKADE med avsikt, inte tyst. DoD #1 ('alla AC avbockade') bockas ändå mot Marcus explicita avskrivning av hela QA-momentet som en egen, bokförd handling — samma princip som PRD-notisen redan slår fast ('kortet stängs när QA-skivan antingen körts eller formellt avskrivits av Marcus'). STÄNGD S112 STÄDVÅG A (2026-08-24, bokföringspass, ingen kod ändrad).

RÄTTELSE (samma pass): DoD #1 bockades felaktigt i föregående rad — dess bokstav ('alla acceptanskriterier avbockade') är osann så länge AC #1/#2 medvetet lämnas obockade (QA:n genomfördes aldrig). Avbockad igen för att inte påstå något som inte stämmer. Kortets Done-status vilar i stället på Marcus explicita avskrivning (citerad ovan), inte på DoD #1:s bokstav — samma 'formuleringsskuld, inte obetald punkt'-princip som TASK-283.3/283.4 redan etablerat i denna familj.

RÄTTELSE 2: DoD #3 (CI grön per jobb på pushad commit) avbockad igen — denna bokföringscommit är ännu opushad när detta skrivs, och CI-verifieringen är orkestrerarens ansvar efter push (samma konvention TASK-169 dokumenterar för S112:s bokföringspass: 'DoD#3 lämnas okryssad — orkestrerarens ansvar efter push').
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus avstod QA verbatim 2026-08-22 ('Nej inget Q&A, skit i det. Gör klart allt de andra.'), källa: TASK-283 § Implementation Notes rad 152. Kortet stängs som formellt avskrivet, inte som genomfört — de 15 manuella stegen kördes aldrig. Bokförd stängning, S112 städvåg A.
<!-- SECTION:FINAL_SUMMARY:END -->
